package domain

import "context"

type ContactRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Message  string `json:"message"`
	Honeypot string `json:"honeypot,omitempty"` // Anti-spam
}

type ContactUsecase interface {
	SendContactEmail(ctx context.Context, req *ContactRequest) error
}
