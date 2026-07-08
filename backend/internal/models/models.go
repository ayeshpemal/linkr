package models

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID        uuid.UUID `json:"id"`
	Username  string    `json:"username"`
	Password  string    `json:"password"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Link struct {
	ID         uuid.UUID `json:"id"`
	UserID     uuid.UUID `json:"user_id"`
	ShortCode  string    `json:"short_code"`
	URL        string    `json:"url"`
	ClickCount int       `json:"click_count"`
	CreatedAt  time.Time `json:"created_at"`
}

type Click struct {
	ID        uuid.UUID `json:"id"`
	LinkID    uuid.UUID `json:"link_id"`
	CreatedAt time.Time `json:"created_at"`
}
