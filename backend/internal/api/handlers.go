package api

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/ayeshpemal/linkr/backend/internal/auth"
	"github.com/ayeshpemal/linkr/backend/internal/models"
	"github.com/ayeshpemal/linkr/backend/internal/utils"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Handler struct {
	db        *pgxpool.Pool
	clickChan chan<- uuid.UUID
	jwtSecret string
}

func (h *Handler) Signup(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON request body")
		return
	}

	req.Username = strings.TrimSpace(req.Username)
	if req.Username == "" {
		writeError(w, http.StatusBadRequest, "username is required")
		return
	}

	if req.Password == "" {
		writeError(w, http.StatusBadRequest, "password is required")
		return
	}

	hashedPassword, err := auth.HashPassword(req.Password)
	if err != nil {
		slog.Error("failed to hash password", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to hash password")
		return
	}

	var user models.User
	err = h.db.QueryRow(
		r.Context(),
		`
		INSERT INTO users (username, password)
		VALUES ($1, $2)
		RETURNING id, username, created_at, updated_at
		`,
		req.Username,
		hashedPassword,
	).Scan(
		&user.ID,
		&user.Username,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			writeError(w, http.StatusBadRequest, "username already exists")
			return
		}

		slog.Error("failed to create user", "username", req.Username, "error", err)
		writeError(w, http.StatusInternalServerError, "failed to create user")
		return
	}

	writeJSON(w, http.StatusCreated, map[string]any{
		"id":         user.ID,
		"username":   user.Username,
		"created_at": user.CreatedAt,
		"updated_at": user.UpdatedAt,
	})
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON request body")
		return
	}

	req.Username = strings.TrimSpace(req.Username)
	if req.Username == "" {
		writeError(w, http.StatusBadRequest, "username is required")
		return
	}

	if req.Password == "" {
		writeError(w, http.StatusBadRequest, "password is required")
		return
	}

	var userID uuid.UUID
	var passwordHash string

	err := h.db.QueryRow(
		r.Context(),
		`SELECT id, password FROM users WHERE username = $1`,
		req.Username,
	).Scan(&userID, &passwordHash)
	if err != nil {
		if err == pgx.ErrNoRows {
			// Mitigate timing attacks by performing a dummy hash check
            dummyHash := "$2a$12$H4mFhyrftZFwC1Y1yh6FseM1wbUQcqYBx2F7nT267kRh5w6Djb/Oa" 
            auth.CheckPasswordHash(req.Password, dummyHash)

			writeError(w, http.StatusUnauthorized, "invalid username or password")
			return
		}

		slog.Error("failed to fetch user", "username", req.Username, "error", err)
		writeError(w, http.StatusInternalServerError, "failed to fetch user")
		return
	}

	if !auth.CheckPasswordHash(req.Password, passwordHash) {
		writeError(w, http.StatusUnauthorized, "invalid username or password")
		return
	}

	token, err := auth.GenerateJWT(userID, h.jwtSecret)
	if err != nil {
		slog.Error("failed to generate JWT", "user_id", userID, "error", err)
		writeError(w, http.StatusInternalServerError, "failed to generate token")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{
		"token": token,
	})
}

func (h *Handler) CreateLink(w http.ResponseWriter, r *http.Request) {
	var req struct {
		URL string `json:"url"`
	}

	userID, ok := r.Context().Value(userIDContextKey).(uuid.UUID)
	if !ok {
		writeError(w, http.StatusUnauthorized, "missing authenticated user")
		return
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON request body")
		return
	}

	req.URL = strings.TrimSpace(req.URL)
	if req.URL == "" {
		writeError(w, http.StatusBadRequest, "url is required")
		return
	}

	parsedURL, err := url.ParseRequestURI(req.URL)
	if err != nil || parsedURL.Scheme == "" || parsedURL.Host == "" {
		writeError(w, http.StatusBadRequest, "url must be a valid absolute URL")
		return
	}

	shortCode, err := utils.GenerateShortCode(6)
	if err != nil {
		slog.Error("failed to generate short code", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to generate short code")
		return
	}

	link := models.Link{
		UserID:    userID,
		ShortCode: shortCode,
		URL:       req.URL,
		CreatedAt: time.Now(),
	}

	err = h.db.QueryRow(
		r.Context(),
		`
		INSERT INTO links (user_id, short_code, url, created_at)
		VALUES ($1, $2, $3, $4)
		RETURNING id, user_id, short_code, url, click_count, created_at
		`,
		link.UserID,
		link.ShortCode,
		link.URL,
		link.CreatedAt,
	).Scan(
		&link.ID,
		&link.UserID,
		&link.ShortCode,
		&link.URL,
		&link.ClickCount,
		&link.CreatedAt,
	)
	if err != nil {
		slog.Error("failed to create link", "user_id", userID, "error", err)
		writeError(w, http.StatusInternalServerError, "failed to create link" )
		return
	}

	writeJSON(w, http.StatusCreated, link)
}

func (h *Handler) RedirectLink(w http.ResponseWriter, r *http.Request) {
	code := r.PathValue("code")
	if strings.TrimSpace(code) == "" {
		writeError(w, http.StatusNotFound, "link not found")
		return
	}

	var linkID uuid.UUID
	var destinationURL string

	err := h.db.QueryRow(
		r.Context(),
		`SELECT id, url FROM links WHERE short_code = $1`,
		code,
	).Scan(&linkID, &destinationURL)
	if err != nil {
		if err == pgx.ErrNoRows {
			writeError(w, http.StatusNotFound, "link not found")
			return
		}

		slog.Error("failed to fetch link", "short_code", code, "error", err)
		writeError(w, http.StatusInternalServerError, "failed to fetch link")
		return
	}

	if h.clickChan != nil {
		select {
		case h.clickChan <- linkID:
		default:
		}
	}

	http.Redirect(w, r, destinationURL, http.StatusFound)
}

func (h *Handler) ListLinks(w http.ResponseWriter, r *http.Request) {
	writeNotImplemented(w)
}

func (h *Handler) GetLinkStats(w http.ResponseWriter, r *http.Request) {
	writeNotImplemented(w)
}

func writeError(w http.ResponseWriter, statusCode int, message string) {
	writeJSON(w, statusCode, map[string]string{
		"error": message,
	})
}

func writeJSON(w http.ResponseWriter, statusCode int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)

	_ = json.NewEncoder(w).Encode(payload)
}

func writeNotImplemented(w http.ResponseWriter) {
	writeError(w, http.StatusNotImplemented, "Not Implemented")
}
