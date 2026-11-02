package usecase

import (
	"context"
	"errors"
	"reflect"
	"testing"
	"time"

	"backend/internal/domain"

	"google.golang.org/genai"
)

func TestModelPoolFallsBackOnRateLimitAndRemembers(t *testing.T) {
	p := newModelPool([]string{"a", "b", "c"})
	var asked []string
	reply, err := p.generate(context.Background(), func(_ context.Context, m string) (string, error) {
		asked = append(asked, m)
		if m == "a" {
			return "", genai.APIError{Code: 429, Status: "RESOURCE_EXHAUSTED"}
		}
		return "hi from " + m, nil
	})
	if err != nil || reply != "hi from b" {
		t.Fatalf("generate = %q, %v", reply, err)
	}
	if !reflect.DeepEqual(asked, []string{"a", "b"}) {
		t.Errorf("asked %v", asked)
	}
	// "a" is cooling down, so the next request starts at "b".
	if got := p.available(); !reflect.DeepEqual(got, []string{"b", "c"}) {
		t.Errorf("available = %v", got)
	}
}

func TestThinkingRejected(t *testing.T) {
	cases := []struct {
		err  error
		want bool
	}{
		{genai.APIError{Code: 400, Message: "Thinking level MINIMAL is not supported for this model."}, true},
		{genai.APIError{Code: 400, Message: "Invalid model name"}, false},
		{genai.APIError{Code: 429, Message: "thinking tokens quota exceeded"}, false},
		{errors.New("thinking"), false},
		{nil, false},
	}
	for _, c := range cases {
		if got := thinkingRejected(c.err); got != c.want {
			t.Errorf("thinkingRejected(%v) = %v, want %v", c.err, got, c.want)
		}
	}
}

func TestModelPoolCooldownExpires(t *testing.T) {
	now := time.Now()
	p := newModelPool([]string{"a", "b"})
	p.now = func() time.Time { return now }
	p.block("a", time.Minute)
	now = now.Add(2 * time.Minute)
	if got := p.available(); !reflect.DeepEqual(got, []string{"a", "b"}) {
		t.Errorf("available after cooldown = %v", got)
	}
}

func TestModelPoolStopsOnKeyErrors(t *testing.T) {
	keyErrors := []genai.APIError{
		{Code: 401, Status: "UNAUTHENTICATED"},
		{Code: 400, Status: "INVALID_ARGUMENT", Message: "API key not valid. Please pass a valid API key."},
		{Code: 403, Status: "PERMISSION_DENIED", Message: "Your API key was reported as leaked."},
	}
	for _, keyErr := range keyErrors {
		p := newModelPool([]string{"a", "b"})
		calls := 0
		_, err := p.generate(context.Background(), func(_ context.Context, _ string) (string, error) {
			calls++
			return "", keyErr
		})
		if !errors.Is(err, domain.ErrChatUnavailable) || calls != 1 {
			t.Errorf("%d %s: err = %v after %d calls, want chat_unavailable after 1", keyErr.Code, keyErr.Status, err, calls)
		}
	}
}

func TestModelPoolMovesOnWhenModelIsClosedToProject(t *testing.T) {
	p := newModelPool([]string{"paid-only", "free"})
	reply, err := p.generate(context.Background(), func(_ context.Context, m string) (string, error) {
		if m == "paid-only" {
			return "", genai.APIError{Code: 403, Status: "PERMISSION_DENIED", Message: "This model is not available on the free tier."}
		}
		return "ok", nil
	})
	if err != nil || reply != "ok" {
		t.Errorf("generate = %q, %v; want fallback to the free model", reply, err)
	}
}

func TestModelPoolAllBusy(t *testing.T) {
	p := newModelPool([]string{"a", "b"})
	_, err := p.generate(context.Background(), func(_ context.Context, _ string) (string, error) {
		return "", genai.APIError{Code: 503, Status: "UNAVAILABLE"}
	})
	if !errors.Is(err, domain.ErrChatUpstreamBusy) {
		t.Errorf("err = %v, want chat_upstream_busy", err)
	}
	// Everything cooling down still yields a real attempt next time.
	if got := p.available(); len(got) != 2 {
		t.Errorf("available when all blocked = %v", got)
	}
}

func TestModelPoolUnknownModels(t *testing.T) {
	p := newModelPool([]string{"nope"})
	_, err := p.generate(context.Background(), func(_ context.Context, _ string) (string, error) {
		return "", genai.APIError{Code: 404, Status: "NOT_FOUND"}
	})
	if !errors.Is(err, domain.ErrChatUnavailable) {
		t.Errorf("err = %v, want chat_unavailable", err)
	}
}

func TestParseModelList(t *testing.T) {
	if got := parseModelList(" a, b,,c "); !reflect.DeepEqual(got, []string{"a", "b", "c"}) {
		t.Errorf("parseModelList = %v", got)
	}
	if got := newModelPool(nil).models; !reflect.DeepEqual(got, DefaultGeminiModels) {
		t.Errorf("default models = %v", got)
	}
}
