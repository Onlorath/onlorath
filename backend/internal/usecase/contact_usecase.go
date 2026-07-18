package usecase

import (
	"context"
	"errors"
	"fmt"
	"net/smtp"
	"regexp"
	"strings"

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

	// Ensure SMTP config exists
	if u.cfg.SMTPUser == "" || u.cfg.SMTPPass == "" {
		return errors.New("SMTP configuration is missing on server")
	}

	// 4. Send Email via SMTP
	auth := smtp.PlainAuth("", u.cfg.SMTPUser, u.cfg.SMTPPass, u.cfg.SMTPHost)

	subject := "Subject: Onlorath Portfolio - Yeni Iletisim Mesaji\n"
	mime := "MIME-version: 1.0;\nContent-Type: text/html; charset=\"UTF-8\";\n\n"
	
	body := fmt.Sprintf(`
		<h2>Yeni İletişim Formu Mesajı</h2>
		<p><strong>Gönderen:</strong> %s</p>
		<p><strong>E-posta:</strong> %s</p>
		<hr/>
		<p><strong>Mesaj:</strong></p>
		<p>%s</p>
	`, req.Name, req.Email, strings.ReplaceAll(req.Message, "\n", "<br/>"))

	msg := []byte(subject + mime + body)

	addr := fmt.Sprintf("%s:%s", u.cfg.SMTPHost, u.cfg.SMTPPort)

	// SendMail
	err := smtp.SendMail(addr, auth, u.cfg.SMTPUser, []string{u.cfg.SMTPTo}, msg)
	if err != nil {
		return fmt.Errorf("failed to send email: %w", err)
	}

	return nil
}
