package usecase

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"regexp"
	"strings"
	"time"

	"backend/config"
	"backend/internal/domain"
)

var contactEmailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)

type contactUsecase struct {
	contactRepo domain.ContactRepository
	cfg         *config.Config
}

func NewContactUsecase(contactRepo domain.ContactRepository, cfg *config.Config) domain.ContactUsecase {
	return &contactUsecase{
		contactRepo: contactRepo,
		cfg:         cfg,
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

	if u.cfg.DiscordWebhookURL == "" && (u.cfg.TelegramBotToken == "" || u.cfg.TelegramChatID == "") {
		log.Println("Warning: No Discord or Telegram webhooks configured for contact form")
	}

	// 5. Send to Webhooks
	messageContent := fmt.Sprintf("📬 **Yeni İletişim Formu Mesajı**\n**Gönderen:** %s\n**E-posta:** %s\n\n**Mesaj:**\n%s", req.Name, req.Email, req.Message)

	client := &http.Client{Timeout: 5 * time.Second}
	var errs []string

	// Discord
	if u.cfg.DiscordWebhookURL != "" {
		payload := map[string]string{"content": messageContent}
		payloadBytes, _ := json.Marshal(payload)

		reqHTTP, _ := http.NewRequestWithContext(ctx, "POST", u.cfg.DiscordWebhookURL, bytes.NewBuffer(payloadBytes))
		reqHTTP.Header.Set("Content-Type", "application/json")

		resp, err := client.Do(reqHTTP)
		if err != nil {
			errs = append(errs, "discord error: "+err.Error())
		} else {
			resp.Body.Close()
			if resp.StatusCode >= 400 {
				errs = append(errs, fmt.Sprintf("discord returned status %d", resp.StatusCode))
			}
		}
	}

	// Telegram
	if u.cfg.TelegramBotToken != "" && u.cfg.TelegramChatID != "" {
		tgURL := fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", u.cfg.TelegramBotToken)
		payload := map[string]interface{}{
			"chat_id":    u.cfg.TelegramChatID,
			"text":       messageContent,
			"parse_mode": "Markdown", // Basic Markdown
		}
		payloadBytes, _ := json.Marshal(payload)

		reqHTTP, _ := http.NewRequestWithContext(ctx, "POST", tgURL, bytes.NewBuffer(payloadBytes))
		reqHTTP.Header.Set("Content-Type", "application/json")

		resp, err := client.Do(reqHTTP)
		if err != nil {
			errs = append(errs, "telegram error: "+err.Error())
		} else {
			resp.Body.Close()
			if resp.StatusCode >= 400 {
				errs = append(errs, fmt.Sprintf("telegram returned status %d", resp.StatusCode))
			}
		}
	}

	// Log errors if any occurred, but we don't necessarily want to block the user from seeing success
	// unless both failed and we expected at least one to work.
	if len(errs) > 0 {
		log.Printf("[Contact Webhook Warnings/Errors] %v", errs)
	}

	return nil
}
