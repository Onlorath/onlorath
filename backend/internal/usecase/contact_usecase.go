package usecase

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"regexp"
	"strings"
	"time"

	"backend/config"
	"backend/internal/domain"
)

type contactUsecase struct {
	cfg *config.Config
}

func NewContactUsecase(cfg *config.Config) domain.ContactUsecase {
	return &contactUsecase{
		cfg: cfg,
	}
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
		return errors.New("invalid name length")
	}
	if len(req.Message) == 0 || len(req.Message) > 2000 {
		return errors.New("invalid message length (max 2000 chars)")
	}

	// 3. Anti-Spam: Strict Email format validation
	emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)
	if !emailRegex.MatchString(req.Email) {
		return errors.New("invalid email format")
	}

	if u.cfg.DiscordWebhookURL == "" && (u.cfg.TelegramBotToken == "" || u.cfg.TelegramChatID == "") {
		log.Println("Warning: No Discord or Telegram webhooks configured for contact form")
	}

	// 4. Send to Webhooks
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
			"chat_id": u.cfg.TelegramChatID,
			"text": messageContent,
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
