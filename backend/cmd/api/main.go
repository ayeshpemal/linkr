package main

import (
	"errors"
	"log/slog"
	"net/http"
	"os"

	"github.com/ayeshpemal/linkr/backend/internal/api"
	"github.com/ayeshpemal/linkr/backend/internal/db"
	"github.com/ayeshpemal/linkr/backend/internal/worker"
	"github.com/google/uuid"
	"github.com/joho/godotenv"
)

const defaultConnString = "postgres://postgres:secret@localhost:5432/linkr"
const defaultJWTSecret = "dev-secret"

func main() {
	if err := godotenv.Load(); err != nil {
		if errors.Is(err, os.ErrNotExist) {
			slog.Warn("env file not found", "error", err)
		} else {
			slog.Warn("failed to load env file", "error", err)
		}
	}

	connString := os.Getenv("DATABASE_URL")
	if connString == "" {
		connString = defaultConnString
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = defaultJWTSecret
	}

	pool, err := db.InitDB(connString)
	if err != nil {
		slog.Error("failed to initialize database", "error", err)
		os.Exit(1)
	}
	defer pool.Close()

	clickChan := make(chan uuid.UUID, 100)
	go worker.StartClickProcessor(pool, clickChan)

	router := api.NewRouter(pool, clickChan, jwtSecret)

	slog.Info("starting HTTP server", "addr", ":8080")
	if err := http.ListenAndServe(":8080", router); err != nil {
		slog.Error("failed to start HTTP server", "error", err)
		os.Exit(1)
	}
}
