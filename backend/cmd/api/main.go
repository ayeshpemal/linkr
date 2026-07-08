package main

import (
	"errors"
	"log"
	"net/http"
	"os"

	"github.com/ayeshpemal/linkr/backend/internal/api"
	"github.com/ayeshpemal/linkr/backend/internal/db"
	"github.com/ayeshpemal/linkr/backend/internal/worker"
	"github.com/google/uuid"
	"github.com/joho/godotenv"
)

const defaultConnString = "postgres://postgres:secret@localhost:5432/linkr"

func main() {
	if err := godotenv.Load(); err != nil {
		if errors.Is(err, os.ErrNotExist) {
			log.Printf("warning: .env file not found: %v", err)
		} else {
			log.Printf("warning: failed to load .env: %v", err)
		}
	}

	connString := os.Getenv("DATABASE_URL")
	if connString == "" {
		connString = defaultConnString
	}

	pool, err := db.InitDB(connString)
	if err != nil {
		log.Fatalf("failed to initialize database: %v", err)
	}
	defer pool.Close()

	clickChan := make(chan uuid.UUID, 100)
	go worker.StartClickProcessor(pool, clickChan)

	router := api.NewRouter(pool, clickChan)

	log.Println("starting HTTP server on :8080")
	if err := http.ListenAndServe(":8080", router); err != nil {
		log.Fatalf("failed to start HTTP server: %v", err)
	}
}
