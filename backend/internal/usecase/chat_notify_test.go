package usecase

import (
	"context"
	"strings"
	"testing"
	"time"

	"golang.org/x/time/rate"
	"google.golang.org/genai"
)

type fakeNotifier struct{ sent chan string }

func (f *fakeNotifier) Enabled() bool { return true }
func (f *fakeNotifier) Notify(_ context.Context, text string) error {
	f.sent <- text
	return nil
}

func TestGeminiBackend(t *testing.T) {
	cases := map[string]genai.Backend{
		"":       genai.BackendGeminiAPI, // AI Studio keys, "AIza…" and "AQ.…" alike
		"gemini": genai.BackendGeminiAPI,
		"VERTEX": genai.BackendVertexAI,
	}
	for override, want := range cases {
		if got := geminiBackend(override); got != want {
			t.Errorf("geminiBackend(%q) = %v, want %v", override, got, want)
		}
	}
}

func TestNotifyOwnerForwardsMessageAndFlagsOfflineAssistant(t *testing.T) {
	f := &fakeNotifier{sent: make(chan string, 1)}
	u := &chatUseCase{notifier: f, notifyLimiter: rate.NewLimiter(rate.Inf, 1)}

	u.notifyOwner("session-1234567890", "", "en", "Hello *there*")

	select {
	case got := <-f.sent:
		for _, want := range []string{"(EN, misafir session-", "Hello *there*", "Asistan kapalı"} {
			if !strings.Contains(got, want) {
				t.Errorf("notification %q missing %q", got, want)
			}
		}
	case <-time.After(2 * time.Second):
		t.Fatal("no notification sent")
	}
}

func TestNotifyOwnerIsRateLimited(t *testing.T) {
	f := &fakeNotifier{sent: make(chan string, 5)}
	u := &chatUseCase{notifier: f, notifyLimiter: rate.NewLimiter(rate.Every(time.Hour), 2)}

	for i := 0; i < 5; i++ {
		u.notifyOwner("s", "", "tr", "spam")
	}
	time.Sleep(200 * time.Millisecond)
	if n := len(f.sent); n != 2 {
		t.Errorf("sent %d notifications, want 2 (burst)", n)
	}
}
