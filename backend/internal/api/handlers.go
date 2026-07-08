package api

import (
	"encoding/json"
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Handler struct {
	DB *pgxpool.Pool
}

func (h *Handler) CreateLink(w http.ResponseWriter, r *http.Request) {
	writeNotImplemented(w)
}

func (h *Handler) RedirectLink(w http.ResponseWriter, r *http.Request) {
	writeNotImplemented(w)
}

func (h *Handler) ListLinks(w http.ResponseWriter, r *http.Request) {
	writeNotImplemented(w)
}

func (h *Handler) GetLinkStats(w http.ResponseWriter, r *http.Request) {
	writeNotImplemented(w)
}

func writeNotImplemented(w http.ResponseWriter) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusNotImplemented)

	_ = json.NewEncoder(w).Encode(map[string]string{
		"error": "Not Implemented",
	})
}
