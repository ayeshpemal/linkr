package worker

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ClickRecorder interface {
	RecordClick(ctx context.Context, linkID uuid.UUID) error
}

type DBClickRecorder struct {
	db *pgxpool.Pool
}

func NewDBClickRecorder(db *pgxpool.Pool) *DBClickRecorder {
	return &DBClickRecorder{db: db}
}

func (r *DBClickRecorder) RecordClick(ctx context.Context, linkID uuid.UUID) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin click transaction: %w", err)
	}

	createdAt := time.Now()

	if _, err := tx.Exec(
		ctx,
		`INSERT INTO clicks (link_id, created_at) VALUES ($1, $2)`,
		linkID,
		createdAt,
	); err != nil {
		if rollbackErr := tx.Rollback(ctx); rollbackErr != nil {
			slog.Error("failed to rollback click insert", "link_id", linkID, "error", rollbackErr)
		}
		return fmt.Errorf("insert click: %w", err)
	}

	if _, err := tx.Exec(
		ctx,
		`UPDATE links SET click_count = click_count + 1 WHERE id = $1`,
		linkID,
	); err != nil {
		if rollbackErr := tx.Rollback(ctx); rollbackErr != nil {
			slog.Error("failed to rollback click count update", "link_id", linkID, "error", rollbackErr)
		}
		return fmt.Errorf("update click count: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit click transaction: %w", err)
	}

	return nil
}

func StartClickProcessor(recorder ClickRecorder, clickChan <-chan uuid.UUID) {
	for linkID := range clickChan {
		ctx := context.Background()

		if err := recorder.RecordClick(ctx, linkID); err != nil {
			slog.Error("failed to record click", "link_id", linkID, "error", err)
		}
	}
}
