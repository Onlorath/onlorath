package usecase

import (
	"context"
	"fmt"
	"regexp"
	"strings"

	"backend/internal/domain"
	"backend/internal/pkg/notify"
)

var contactEmailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)

type contactUsecase struct {
	contactRepo domain.ContactRepository
	notifier    notify.Notifier
}

func NewContactUsecase(contactRepo domain.ContactRepository, notifier notify.Notifier) domain.ContactUsecase {
	return &contactUsecase{
		contactRepo: contactRepo,
		notifier:    notifier,
	}
}

func (u *contactUsecase) ListMessages(ctx context.Context) ([]domain.ContactMessage, error) {
	return u.contactRepo.List(ctx)
}

func (u *contactUsecase) SetRead(ctx context.Context, id string, read bool) error {
	return u.contactRepo.SetRead(ctx, id, read)
}

func (u *contactUsecase) DeleteMessage(ctx context.Context, id string) error {
	return u.contactRepo.Delete(ctx, id)
}

func (u *contactUsecase) CountUnread(ctx context.Context) (int, error) {
	return u.contactRepo.CountUnread(ctx)
}

func (u *contactUsecase) SendContactEmail(ctx context.Context, req *domain.ContactRequest) error {
	// 1. Anti-Spam: Honeypot check
	if req.Honeypot != "" {
		// If honeypot is filled, it's a bot. We silently return success to trick the bot.
		return nil
	}

	// 2. Anti-Spam: Input length validation
	req.Name = strings.TrimSpace(req.Name)
	req.Email = strings.TrimSpace(req.Email)
	req.Message = strings.TrimSpace(req.Message)

	if len(req.Name) == 0 || len(req.Name) > 100 {
		return &domain.ValidationError{Field: "name", Message: "invalid name length"}
	}
	if len(req.Message) == 0 || len(req.Message) > 2000 {
		return &domain.ValidationError{Field: "message", Message: "invalid message length (max 2000 chars)"}
	}

	// 3. Anti-Spam: Strict Email format validation
	if !contactEmailRegex.MatchString(req.Email) {
		return &domain.ValidationError{Field: "email", Message: "invalid email format"}
	}

	// 4. Store in the admin inbox; webhooks below are best-effort notifications.
	msg := &domain.ContactMessage{
		Name:    req.Name,
		Email:   req.Email,
		Message: req.Message,
		Locale:  domain.NormalizeLocale(req.Locale),
	}
	if err := u.contactRepo.Create(ctx, msg); err != nil {
		return err
	}

	// 5. Notify the owner in the background; the message is already safe in the inbox.
	notify.Async(u.notifier, fmt.Sprintf("Yeni iletişim formu mesajı (%s)\nGönderen: %s <%s>\n\n%s",
		strings.ToUpper(msg.Locale), req.Name, req.Email, req.Message))
	return nil
}
