package notify

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestNotifySendsPlainTextToTelegramAndDiscord(t *testing.T) {
	var tgPath string
	var tgBody, dcBody map[string]any
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var body map[string]any
		_ = json.NewDecoder(r.Body).Decode(&body)
		if strings.HasPrefix(r.URL.Path, "/bot") {
			tgPath, tgBody = r.URL.Path, body
		} else {
			dcBody = body
		}
	}))
	defer srv.Close()

	n := New(Config{TelegramBotToken: "TOKEN", TelegramChatID: "42", DiscordWebhookURL: srv.URL + "/hook", TelegramAPI: srv.URL})
	text := "under_score *star* [link](x)"
	if err := n.Notify(context.Background(), text); err != nil {
		t.Fatal(err)
	}

	if tgPath != "/botTOKEN/sendMessage" {
		t.Errorf("telegram path = %q", tgPath)
	}
	if tgBody["text"] != text || tgBody["chat_id"] != "42" {
		t.Errorf("telegram body = %v", tgBody)
	}
	if _, hasParseMode := tgBody["parse_mode"]; hasParseMode {
		t.Error("telegram must be sent as plain text (no parse_mode)")
	}
	if dcBody["content"] != text {
		t.Errorf("discord body = %v", dcBody)
	}
}

func TestNotifyReportsHTTPErrorsAndDisabledState(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusBadRequest)
	}))
	defer srv.Close()

	n := New(Config{TelegramBotToken: "T", TelegramChatID: "1", TelegramAPI: srv.URL})
	if err := n.Notify(context.Background(), "x"); err == nil || !strings.Contains(err.Error(), "telegram") {
		t.Errorf("err = %v, want telegram HTTP error", err)
	}
	if New(Config{TelegramBotToken: "T"}).Enabled() {
		t.Error("telegram without chat id should be disabled")
	}
}

func TestTruncate(t *testing.T) {
	if got := truncate("çğıöşü", 4); got != "çğı…" {
		t.Errorf("truncate = %q", got)
	}
}
