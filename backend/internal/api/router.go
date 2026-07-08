package api

import (
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"
)

func NewRouter(db *pgxpool.Pool) *http.ServeMux {
	handler := &Handler{DB: db}

	mux := http.NewServeMux()
	mux.HandleFunc("POST /api/links", handler.CreateLink)
	mux.HandleFunc("GET /{code}", handler.RedirectLink)
	mux.HandleFunc("GET /api/links", handler.ListLinks)
	mux.HandleFunc("GET /api/links/{code}/stats", handler.GetLinkStats)

	return mux
}
