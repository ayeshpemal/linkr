package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/ayeshpemal/linkr/backend/internal/models"
	"github.com/ayeshpemal/linkr/backend/internal/utils"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Handler struct {
	db        *pgxpool.Pool
	clickChan chan<- uuid.UUID
}

func (h *Handler) CreateLink(w http.ResponseWriter, r *http.Request) {
	var req struct {
		URL string `json:"url"`
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
		writeError(w, http.StatusInternalServerError, "failed to generate short code")
		return
	}

	link := models.Link{
		UserID:    uuid.MustParse("6cef4920-5ac3-4900-a5a5-e842d1973780"), // Placeholder user ID for demonstration
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
		writeError(w, http.StatusInternalServerError, fmt.Sprintf("failed to create link: %v", err))
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

		writeError(w, http.StatusInternalServerError, fmt.Sprintf("failed to fetch link: %v", err))
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
