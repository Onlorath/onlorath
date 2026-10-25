package domain

import (
	"context"
	"errors"
	"time"
)

var ErrContactMessageNotFound = errors.New("message not found")

type ContactRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Message  string `json:"message"`
	Locale   string `json:"locale"`
	Honeypot string `json:"honeypot,omitempty"` // Anti-spam
}

// ContactMessage is a stored contact form submission shown in the admin inbox.
type ContactMessage struct {
	ID        string    `db:"id" json:"id"`
	Name      string    `db:"name" json:"name"`
	Email     string    `db:"email" json:"email"`
	Message   string    `db:"message" json:"message"`
	Locale    string    `db:"locale" json:"locale"`
	Read      bool      `db:"read" json:"read"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
}

type ContactRepository interface {
	Create(ctx context.Context, msg *ContactMessage) error
	List(ctx context.Context) ([]ContactMessage, error)
	SetRead(ctx context.Context, id string, read bool) error
	Delete(ctx context.Context, id string) error
	CountUnread(ctx context.Context) (int, error)
}

type ContactUsecase interface {
	SendContactEmail(ctx context.Context, req *ContactRequest) error
	ListMessages(ctx context.Context) ([]ContactMessage, error)
	SetRead(ctx context.Context, id string, read bool) error
	DeleteMessage(ctx context.Context, id string) error
	CountUnread(ctx context.Context) (int, error)
}
