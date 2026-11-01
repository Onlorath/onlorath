package usecase

import (
	"context"
	"errors"
	"log"
	"strings"
	"sync"
	"time"

	"backend/internal/domain"

	"google.golang.org/genai"
)

// DefaultGeminiModels are tried in order; each later one is a fallback for when the
// previous model is rate limited, overloaded or not available to the key.
// Override with GEMINI_MODELS (comma separated) as Google's free models change.
var DefaultGeminiModels = []string{"gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash", "gemini-2.0-flash-lite"}

type failureKind int

const (
	failFatal       failureKind = iota // auth, billing, bad request: another model won't help
	failRateLimited                    // 429 RESOURCE_EXHAUSTED
	failOverloaded                     // 5xx, UNAVAILABLE
	failNoModel                        // model unknown or not enabled for this key
)

func classifyGeminiError(err error) failureKind {
	var apiErr genai.APIError
	if !errors.As(err, &apiErr) {
		return failOverloaded // network trouble: worth trying the next model
	}
	switch {
	case apiErr.Code == 429 || apiErr.Status == "RESOURCE_EXHAUSTED":
		return failRateLimited
	case apiErr.Code == 404 || apiErr.Status == "NOT_FOUND":
		return failNoModel
	case apiErr.Code >= 500:
		return failOverloaded
	case apiErr.Code == 400 && strings.Contains(strings.ToLower(apiErr.Message), "model"):
		return failNoModel
	}
	return failFatal
}

// cooldownFor is how long a model is skipped after a failure of this kind.
func cooldownFor(kind failureKind, err error) time.Duration {
	switch kind {
	case failNoModel:
		return 24 * time.Hour
	case failRateLimited:
		// Daily free-tier quotas reset once a day; per-minute ones quickly.
		if strings.Contains(strings.ToLower(err.Error()), "per_day") || strings.Contains(err.Error(), "PerDay") {
			return time.Hour
		}
		return time.Minute
	default:
		return 30 * time.Second
	}
}

// modelPool remembers which models are temporarily exhausted.
type modelPool struct {
	models []string
	now    func() time.Time

	mu      sync.Mutex
	blocked map[string]time.Time
}

func newModelPool(models []string) *modelPool {
	if len(models) == 0 {
		models = DefaultGeminiModels
	}
	return &modelPool{models: models, now: time.Now, blocked: map[string]time.Time{}}
}

// available returns models not cooling down; if all are, it returns them all anyway
// so a visitor still gets a real attempt rather than an instant error.
func (p *modelPool) available() []string {
	p.mu.Lock()
	defer p.mu.Unlock()
	var out []string
	for _, m := range p.models {
		if until, ok := p.blocked[m]; !ok || p.now().After(until) {
			out = append(out, m)
		}
	}
	if len(out) == 0 {
		return append([]string(nil), p.models...)
	}
	return out
}

func (p *modelPool) block(model string, d time.Duration) {
	p.mu.Lock()
	p.blocked[model] = p.now().Add(d)
	p.mu.Unlock()
}

// generate asks each available model in turn and returns the first reply.
func (p *modelPool) generate(ctx context.Context, ask func(ctx context.Context, model string) (string, error)) (string, error) {
	var lastKind failureKind = failOverloaded
	for _, model := range p.available() {
		reply, err := ask(ctx, model)
		if err == nil {
			return reply, nil
		}
		if ctx.Err() != nil {
			return "", ctx.Err()
		}
		kind := classifyGeminiError(err)
		log.Printf("Gemini %s failed: %v", model, err)
		if kind == failFatal {
			return "", domain.ErrChatUnavailable
		}
		p.block(model, cooldownFor(kind, err))
		lastKind = kind
	}
	if lastKind == failNoModel {
		return "", domain.ErrChatUnavailable
	}
	return "", domain.ErrChatUpstreamBusy
}

// parseModelList reads GEMINI_MODELS-style input ("a, b,,c").
func parseModelList(s string) []string {
	var out []string
	for _, m := range strings.Split(s, ",") {
		if m = strings.TrimSpace(m); m != "" {
			out = append(out, m)
		}
	}
	return out
}
