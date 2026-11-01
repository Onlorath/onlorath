// Package notify sends short plain-text alerts to the site owner (Telegram, Discord).
package notify

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"
)

// Notifier delivers a message to every configured channel.
type Notifier interface {
	Notify(ctx context.Context, text string) error
	Enabled() bool
}

// Config holds the channel credentials; empty values disable that channel.
type Config struct {
	TelegramBotToken  string
	TelegramChatID    string
	DiscordWebhookURL string
	// TelegramAPI is the Bot API base URL; empty means https://api.telegram.org.
	TelegramAPI string
}

type multi struct {
	cfg    Config
	client *http.Client
}

func New(cfg Config) Notifier {
	if cfg.TelegramAPI == "" {
		cfg.TelegramAPI = "https://api.telegram.org"
	}
	return &multi{cfg: cfg, client: &http.Client{Timeout: 10 * time.Second}}
}

func (m *multi) Enabled() bool {
	return (m.cfg.TelegramBotToken != "" && m.cfg.TelegramChatID != "") || m.cfg.DiscordWebhookURL != ""
}

// Notify sends text as plain text (no Markdown), so user-written content can never
// break Telegram's entity parsing. It returns the first delivery error, if any.
func (m *multi) Notify(ctx context.Context, text string) error {
	var firstErr error
	if m.cfg.TelegramBotToken != "" && m.cfg.TelegramChatID != "" {
		url := fmt.Sprintf("%s/bot%s/sendMessage", m.cfg.TelegramAPI, m.cfg.TelegramBotToken)
		if err := m.post(ctx, url, map[string]any{
			"chat_id":                  m.cfg.TelegramChatID,
			"text":                     truncate(text, 4000), // Telegram's limit is 4096 chars
			"disable_web_page_preview": true,
		}); err != nil {
			firstErr = fmt.Errorf("telegram: %w", err)
		}
	}
	if m.cfg.DiscordWebhookURL != "" {
		if err := m.post(ctx, m.cfg.DiscordWebhookURL, map[string]any{"content": truncate(text, 1900)}); err != nil && firstErr == nil {
			firstErr = fmt.Errorf("discord: %w", err)
		}
	}
	return firstErr
}

func (m *multi) post(ctx context.Context, url string, payload map[string]any) error {
	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := m.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		return fmt.Errorf("HTTP %d", resp.StatusCode)
	}
	return nil
}

// Async sends in the background so a slow or failing channel never delays the
// visitor's request; failures are logged.
func Async(n Notifier, text string) {
	if n == nil || !n.Enabled() {
		return
	}
	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
		defer cancel()
		if err := n.Notify(ctx, text); err != nil {
			log.Printf("[notify] %v", err)
		}
	}()
}

func truncate(s string, max int) string {
	r := []rune(s)
	if len(r) <= max {
		return s
	}
	return string(r[:max-1]) + "…"
}
