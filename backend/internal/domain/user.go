package domain

import (
	"context"
	"errors"
	"regexp"
	"time"
)

type ContextKey string

const (
	ContextKeyUserID    ContextKey = "user_id"
	ContextKeyUserEmail ContextKey = "user_email"
	ContextKeyUserRole  ContextKey = "user_role"
)

var (
	ErrEmailAlreadyExists = errors.New("email already exists")
	ErrInvalidCredentials = errors.New("invalid email or password")
	ErrInvalidToken       = errors.New("invalid token")
	ErrUserNotFound       = errors.New("user not found")
)

type User struct {
	ID           string    `db:"id" json:"id"`
	Email        string    `db:"email" json:"email"`
	PasswordHash string    `db:"password_hash" json:"-"`
	Role         string    `db:"role" json:"role"`
	CreatedAt    time.Time `db:"created_at" json:"created_at"`
	UpdatedAt    time.Time `db:"updated_at" json:"updated_at"`
}

type RegisterRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type ValidationError struct {
	Field   string
	Message string
}

func (e *ValidationError) Error() string {
	return e.Message
}

func (r *RegisterRequest) Validate() error {
	if r.Email == "" {
		return &ValidationError{Field: "email", Message: "email is required"}
	}
	emailRegex := regexp.MustCompile(`^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,4}$`)
	if !emailRegex.MatchString(r.Email) {
		return &ValidationError{Field: "email", Message: "invalid email format"}
	}
	if len(r.Password) < 6 {
		return &ValidationError{Field: "password", Message: "password must be at least 6 characters"}
	}
	return nil
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (r *LoginRequest) Validate() error {
	if r.Email == "" {
		return &ValidationError{Field: "email", Message: "email is required"}
	}
	if r.Password == "" {
		return &ValidationError{Field: "password", Message: "password is required"}
	}
	return nil
}

type AuthResponse struct {
	AccessToken string `json:"access_token"`
	TokenType   string `json:"token_type"`
	User        *User  `json:"user"`
}

type UserRepository interface {
	Create(ctx context.Context, user *User) error
	GetByEmail(ctx context.Context, email string) (*User, error)
	GetByID(ctx context.Context, id string) (*User, error)
}

type UserUseCase interface {
	Register(ctx context.Context, req *RegisterRequest) (*User, error)
	Login(ctx context.Context, req *LoginRequest) (accessToken string, refreshToken string, user *User, err error)
	Refresh(ctx context.Context, refreshToken string) (string, error)
}
