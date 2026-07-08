package api

import (
	"net/http"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

func NewRouter(db *pgxpool.Pool, clickChan chan<- uuid.UUID) *http.ServeMux {
	handler := &Handler{db: db, clickChan: clickChan}

	mux := http.NewServeMux()
	mux.HandleFunc("POST /api/links", handler.CreateLink)
	mux.HandleFunc("GET /{code}", handler.RedirectLink)
	mux.HandleFunc("GET /api/links", handler.ListLinks)
	mux.HandleFunc("GET /api/links/{code}/stats", handler.GetLinkStats)

	return mux
}
