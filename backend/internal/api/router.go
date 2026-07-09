package api

import (
	"net/http"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

func NewRouter(db *pgxpool.Pool, clickChan chan<- uuid.UUID, jwtSecret string) *http.ServeMux {
	handler := &Handler{db: db, clickChan: clickChan, jwtSecret: jwtSecret}
	authMiddleware := JWTMiddleware(jwtSecret)

	mux := http.NewServeMux()
	mux.HandleFunc("POST /api/signup", handler.Signup)
	mux.HandleFunc("POST /api/login", handler.Login)
	mux.Handle("POST /api/links", authMiddleware(http.HandlerFunc(handler.CreateLink)))
	mux.HandleFunc("GET /{code}", handler.RedirectLink)
	mux.Handle("GET /api/links", authMiddleware(http.HandlerFunc(handler.ListLinks)))
	mux.Handle("GET /api/links/{code}/stats", authMiddleware(http.HandlerFunc(handler.GetLinkStats)))

	return mux
}
