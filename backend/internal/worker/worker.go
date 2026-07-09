package worker

import (
	"context"
	"log/slog"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

func StartClickProcessor(db *pgxpool.Pool, clickChan <-chan uuid.UUID) {
	for linkID := range clickChan {
		ctx := context.Background()

		tx, err := db.Begin(ctx)
		if err != nil {
			slog.Error("failed to begin click transaction", "link_id", linkID, "error", err)
			continue
		}
		
		createdAt := time.Now()

		if _, err := tx.Exec(
			ctx,
			`INSERT INTO clicks (link_id, created_at) VALUES ($1, $2)`,
			linkID,
			createdAt,
		); err != nil {
			slog.Error("failed to insert click", "link_id", linkID, "error", err)
			if rollbackErr := tx.Rollback(ctx); rollbackErr != nil {
				slog.Error("failed to rollback click insert", "link_id", linkID, "error", rollbackErr)
			}
			continue
		}

		if _, err := tx.Exec(
			ctx,
			`UPDATE links SET click_count = click_count + 1 WHERE id = $1`,
			linkID,
		); err != nil {
			slog.Error("failed to update click count", "link_id", linkID, "error", err)
			if rollbackErr := tx.Rollback(ctx); rollbackErr != nil {
				slog.Error("failed to rollback click count update", "link_id", linkID, "error", rollbackErr)
			}
			continue
		}

		if err := tx.Commit(ctx); err != nil {
			slog.Error("failed to commit click transaction", "link_id", linkID, "error", err)
		}
	}
}
