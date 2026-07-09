package api

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"net/url"
	"strconv"
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
	userID, ok := r.Context().Value(userIDContextKey).(uuid.UUID)
	if !ok {
		writeError(w, http.StatusUnauthorized, "missing authenticated user")
		return
	}

	page := 1
	limit := 10

	query := r.URL.Query()
	if pageParam := strings.TrimSpace(query.Get("page")); pageParam != "" {
		parsedPage, err := strconv.Atoi(pageParam)
		if err != nil || parsedPage < 1 {
			writeError(w, http.StatusBadRequest, "page must be a positive integer")
			return
		}
		page = parsedPage
	}

	if limitParam := strings.TrimSpace(query.Get("limit")); limitParam != "" {
		parsedLimit, err := strconv.Atoi(limitParam)
		if err != nil || parsedLimit < 1 {
			writeError(w, http.StatusBadRequest, "limit must be a positive integer")
			return
		}
		limit = parsedLimit
	}

	offset := (page - 1) * limit
	var total int64

	err := h.db.QueryRow(
		r.Context(),
		`SELECT COUNT(*) FROM links WHERE user_id = $1`,
		userID,
	).Scan(&total)
	if err != nil {
		slog.Error("failed to count links", "user_id", userID, "error", err)
		writeError(w, http.StatusInternalServerError, "failed to list links")
		return
	}

	rows, err := h.db.Query(
		r.Context(),
		`
		SELECT id, user_id, short_code, url, click_count, created_at
		FROM links
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
		`,
		userID,
		limit,
		offset,
	)
	if err != nil {
		slog.Error("failed to list links", "user_id", userID, "page", page, "limit", limit, "error", err)
		writeError(w, http.StatusInternalServerError, "failed to list links")
		return
	}
	defer rows.Close()

	links := make([]models.Link, 0, limit)
	for rows.Next() {
		var link models.Link
		if err := rows.Scan(
			&link.ID,
			&link.UserID,
			&link.ShortCode,
			&link.URL,
			&link.ClickCount,
			&link.CreatedAt,
		); err != nil {
			slog.Error("failed to scan link row", "user_id", userID, "error", err)
			writeError(w, http.StatusInternalServerError, "failed to list links")
			return
		}

		links = append(links, link)
	}

	if err := rows.Err(); err != nil {
		slog.Error("failed while iterating link rows", "user_id", userID, "error", err)
		writeError(w, http.StatusInternalServerError, "failed to list links")
		return
	}

	totalPages := 0
	if total > 0 {
		totalPages = int((total + int64(limit) - 1) / int64(limit))
	}

	type listLinksMeta struct {
		Total      int64 `json:"total"`
		Page       int   `json:"page"`
		Limit      int   `json:"limit"`
		TotalPages int   `json:"total_pages"`
	}

	type listLinksResponse struct {
		Data []models.Link  `json:"data"`
		Meta listLinksMeta `json:"meta"`
	}

	writeJSON(w, http.StatusOK, listLinksResponse{
		Data: links,
		Meta: listLinksMeta{
			Total:      total,
			Page:       page,
			Limit:      limit,
			TotalPages: totalPages,
		},
	})
}

func (h *Handler) GetLinkStats(w http.ResponseWriter, r *http.Request) {
	code := strings.TrimSpace(r.PathValue("code"))
	if code == "" {
		writeError(w, http.StatusNotFound, "link not found")
		return
	}

	days := 30
	if daysParam := strings.TrimSpace(r.URL.Query().Get("days")); daysParam != "" {
		parsedDays, err := strconv.Atoi(daysParam)
		if err == nil && parsedDays > 0 {
			days = parsedDays
		}
	}

	userID, ok := r.Context().Value(userIDContextKey).(uuid.UUID)
	if !ok {
		writeError(w, http.StatusUnauthorized, "missing authenticated user")
		return
	}

	var linkID uuid.UUID
	var totalClicks int

	err := h.db.QueryRow(
		r.Context(),
		`
		SELECT id, click_count
		FROM links
		WHERE short_code = $1 AND user_id = $2
		`,
		code,
		userID,
	).Scan(&linkID, &totalClicks)
	if err != nil {
		if err == pgx.ErrNoRows {
			writeError(w, http.StatusNotFound, "link not found")
			return
		}

		slog.Error("failed to fetch link stats target", "short_code", code, "user_id", userID, "error", err)
		writeError(w, http.StatusInternalServerError, "failed to fetch link stats")
		return
	}

	rows, err := h.db.Query(
		r.Context(),
		`
		SELECT DATE(created_at) as date, COUNT(*) as count
		FROM clicks
		WHERE link_id = $1 AND created_at >= NOW() - INTERVAL '1 day' * $2
		GROUP BY DATE(created_at)
		ORDER BY date ASC
		`,
		linkID,
		days,
	)
	if err != nil {
		slog.Error("failed to query click stats", "link_id", linkID, "user_id", userID, "days", days, "error", err)
		writeError(w, http.StatusInternalServerError, "failed to fetch link stats")
		return
	}
	defer rows.Close()

	type dailyStat struct {
		Date  string `json:"date"`
		Count int    `json:"count"`
	}

	dailyStats := make([]dailyStat, 0)
	for rows.Next() {
		var statDate time.Time
		var count int
		if err := rows.Scan(&statDate, &count); err != nil {
			slog.Error("failed to scan click stats row", "link_id", linkID, "error", err)
			writeError(w, http.StatusInternalServerError, "failed to fetch link stats")
			return
		}

		dailyStats = append(dailyStats, dailyStat{
			Date:  statDate.Format("2006-01-02"),
			Count: count,
		})
	}

	if err := rows.Err(); err != nil {
		slog.Error("failed while iterating click stats rows", "link_id", linkID, "error", err)
		writeError(w, http.StatusInternalServerError, "failed to fetch link stats")
		return
	}

	type linkStatsResponse struct {
		TotalClicks int         `json:"total_clicks"`
		DailyStats  []dailyStat `json:"daily_stats"`
	}

	writeJSON(w, http.StatusOK, linkStatsResponse{
		TotalClicks: totalClicks,
		DailyStats:  dailyStats,
	})
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
