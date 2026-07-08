package worker

import (
	"context"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

func StartClickProcessor(db *pgxpool.Pool, clickChan <-chan uuid.UUID) {
	for linkID := range clickChan {
		ctx := context.Background()

		tx, err := db.Begin(ctx)
		if err != nil {
			log.Printf("failed to begin click transaction for link %s: %v", linkID, err)
			continue
		}
		
		createdAt := time.Now()

		if _, err := tx.Exec(
			ctx,
			`INSERT INTO clicks (link_id, created_at) VALUES ($1, $2)`,
			linkID,
			createdAt,
		); err != nil {
			log.Printf("failed to insert click for link %s: %v", linkID, err)
			if rollbackErr := tx.Rollback(ctx); rollbackErr != nil {
				log.Printf("failed to rollback click insert for link %s: %v", linkID, rollbackErr)
			}
			continue
		}

		if _, err := tx.Exec(
			ctx,
			`UPDATE links SET click_count = click_count + 1 WHERE id = $1`,
			linkID,
		); err != nil {
			log.Printf("failed to update click count for link %s: %v", linkID, err)
			if rollbackErr := tx.Rollback(ctx); rollbackErr != nil {
				log.Printf("failed to rollback click count update for link %s: %v", linkID, rollbackErr)
			}
			continue
		}

		if err := tx.Commit(ctx); err != nil {
			log.Printf("failed to commit click transaction for link %s: %v", linkID, err)
		}
	}
}
