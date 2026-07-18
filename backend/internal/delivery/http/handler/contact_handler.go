package handler

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"backend/internal/domain"
	"backend/internal/pkg/httputil"

	"golang.org/x/time/rate"
)

type ContactHandler struct {
	contactUsecase domain.ContactUsecase
	// IP-based Rate Limiter specifically for contact forms
	limiters map[string]*rate.Limiter
	mu       sync.Mutex
}

func NewContactHandler(contactUsecase domain.ContactUsecase) *ContactHandler {
	// Cleanup routine for limiters map to prevent memory leaks
	h := &ContactHandler{
		contactUsecase: contactUsecase,
		limiters:       make(map[string]*rate.Limiter),
	}

	go func() {
		for {
			time.Sleep(1 * time.Hour)
			h.mu.Lock()
			// Simplistic cleanup: reset the map every hour
			// In production, we'd check last access time, but this is fine for now
			h.limiters = make(map[string]*rate.Limiter)
			h.mu.Unlock()
		}
	}()

	return h
}

// getLimiter returns a rate limiter for the IP.
// Limit is 2 requests per minute, with burst of 3.
func (h *ContactHandler) getLimiter(ip string) *rate.Limiter {
	h.mu.Lock()
	defer h.mu.Unlock()

	limiter, exists := h.limiters[ip]
	if !exists {
		// 1 request every 30 seconds (2 per min)
		limiter = rate.NewLimiter(rate.Every(30*time.Second), 3)
		h.limiters[ip] = limiter
	}

	return limiter
}

func (h *ContactHandler) SubmitContact(w http.ResponseWriter, r *http.Request) {
	// 1. Anti-Spam: Rate Limiter per IP
	ip := r.RemoteAddr
	if forwarded := r.Header.Get("X-Forwarded-For"); forwarded != "" {
		ip = forwarded
	}

	limiter := h.getLimiter(ip)
	if !limiter.Allow() {
		httputil.RespondWithError(w, http.StatusTooManyRequests, "Too many requests. Please try again later.")
		return
	}

	// 2. Decode Request
	var req domain.ContactRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	// 3. Process with Usecase
	if err := h.contactUsecase.SendContactEmail(r.Context(), &req); err != nil {
		log.Printf("[Contact Error] %v", err)
		httputil.RespondWithError(w, http.StatusInternalServerError, "Failed to send message")
		return
	}

	httputil.RespondWithJSON(w, http.StatusOK, map[string]string{"message": "Email sent successfully"})
}
