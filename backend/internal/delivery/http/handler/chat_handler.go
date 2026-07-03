package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"

	"backend/config"
	"backend/internal/domain"
	"backend/internal/pkg/jwt"
)

type ChatHandler struct {
	chatUseCase domain.ChatUseCase
	cfg         *config.Config
}

func NewChatHandler(chatUseCase domain.ChatUseCase, cfg *config.Config) *ChatHandler {
	return &ChatHandler{
		chatUseCase: chatUseCase,
		cfg:         cfg,
	}
}

// getAuthInfo extracts optional userID and guest sessionID from request and returns updated context.
func (h *ChatHandler) getAuthInfo(w http.ResponseWriter, r *http.Request) (context.Context, string, string, bool) {
	sessionID := r.Header.Get("X-Session-ID")
	if sessionID == "" {
		sessionID = r.URL.Query().Get("session_id")
	}

	ctx := r.Context()

	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		// Public guest user, no authorization header
		return ctx, "", sessionID, true
	}

	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || parts[0] != "Bearer" {
		h.respondWithError(w, http.StatusUnauthorized, "Authorization header must be Bearer {token}")
		return nil, "", "", false
	}

	tokenStr := parts[1]
	claims, err := jwt.ValidateAccessToken(tokenStr, []byte(h.cfg.JWTSecret))
	if err != nil {
		if err == jwt.ErrExpiredToken {
			h.respondWithError(w, http.StatusUnauthorized, "Access token has expired")
			return nil, "", "", false
		}
		h.respondWithError(w, http.StatusUnauthorized, "Invalid access token")
		return nil, "", "", false
	}

	// Inject role into context
	ctx = context.WithValue(ctx, domain.ContextKeyUserRole, claims.Role)

	return ctx, claims.UserID, sessionID, true
}

func (h *ChatHandler) setQuotaHeaders(w http.ResponseWriter, ctx context.Context, userID string, sessionID string) {
	globalReached, personalReached, err := h.chatUseCase.CheckQuota(ctx, userID, sessionID)
	if err == nil {
		if globalReached {
			w.Header().Set("X-Chat-System-Busy", "true")
		}
		if personalReached {
			w.Header().Set("X-Chat-Quota-Exceeded", "true")
		}
	}
}

func (h *ChatHandler) SendMessage(w http.ResponseWriter, r *http.Request) {
	var req domain.SendMessageRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.respondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	ctx, userID, sessionID, ok := h.getAuthInfo(w, r)
	if !ok {
		return
	}

	// Fallback to body SessionID if not present in header/query
	if sessionID == "" {
		sessionID = req.SessionID
	}

	if userID == "" && sessionID == "" {
		h.respondWithError(w, http.StatusBadRequest, "session_id is required for guest users")
		return
	}

	resp, err := h.chatUseCase.SendMessage(ctx, userID, sessionID, &req)
	if err != nil {
		if err == domain.ErrGlobalLimitReached {
			h.respondWithError(w, http.StatusTooManyRequests, err.Error())
			return
		}
		if err == domain.ErrChatLimitReached {
			h.respondWithError(w, http.StatusTooManyRequests, err.Error())
			return
		}
		h.respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	h.setQuotaHeaders(w, ctx, userID, sessionID)
	h.respondWithJSON(w, http.StatusOK, resp)
}

func (h *ChatHandler) ListConversations(w http.ResponseWriter, r *http.Request) {
	ctx, userID, sessionID, ok := h.getAuthInfo(w, r)
	if !ok {
		return
	}

	if userID == "" && sessionID == "" {
		h.respondWithError(w, http.StatusBadRequest, "session_id is required for guest users")
		return
	}

	h.setQuotaHeaders(w, ctx, userID, sessionID)
	conversations, err := h.chatUseCase.ListConversations(ctx, userID, sessionID)
	if err != nil {
		h.respondWithError(w, http.StatusInternalServerError, "Internal server error")
		return
	}

	h.respondWithJSON(w, http.StatusOK, conversations)
}

func (h *ChatHandler) GetMessages(w http.ResponseWriter, r *http.Request) {
	ctx, userID, sessionID, ok := h.getAuthInfo(w, r)
	if !ok {
		return
	}

	if userID == "" && sessionID == "" {
		h.respondWithError(w, http.StatusBadRequest, "session_id is required for guest users")
		return
	}

	conversationID := chi.URLParam(r, "id")
	if conversationID == "" {
		h.respondWithError(w, http.StatusBadRequest, "Conversation ID is required")
		return
	}

	h.setQuotaHeaders(w, ctx, userID, sessionID)
	messages, err := h.chatUseCase.GetConversationMessages(ctx, userID, sessionID, conversationID)
	if err != nil {
		if err.Error() == "conversation not found" {
			h.respondWithError(w, http.StatusNotFound, err.Error())
			return
		}
		h.respondWithError(w, http.StatusInternalServerError, "Internal server error")
		return
	}

	h.respondWithJSON(w, http.StatusOK, messages)
}

func (h *ChatHandler) DeleteConversation(w http.ResponseWriter, r *http.Request) {
	ctx, userID, sessionID, ok := h.getAuthInfo(w, r)
	if !ok {
		return
	}

	if userID == "" && sessionID == "" {
		h.respondWithError(w, http.StatusBadRequest, "session_id is required for guest users")
		return
	}

	conversationID := chi.URLParam(r, "id")
	if conversationID == "" {
		h.respondWithError(w, http.StatusBadRequest, "Conversation ID is required")
		return
	}

	h.setQuotaHeaders(w, ctx, userID, sessionID)
	err := h.chatUseCase.DeleteConversation(ctx, userID, sessionID, conversationID)
	if err != nil {
		if err.Error() == "conversation not found" {
			h.respondWithError(w, http.StatusNotFound, err.Error())
			return
		}
		h.respondWithError(w, http.StatusInternalServerError, "Internal server error")
		return
	}

	h.respondWithJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
}

// Helpers for JSON responses
func (h *ChatHandler) respondWithError(w http.ResponseWriter, code int, message string) {
	h.respondWithJSON(w, code, map[string]string{"error": message})
}

func (h *ChatHandler) respondWithJSON(w http.ResponseWriter, code int, payload interface{}) {
	response, err := json.Marshal(payload)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		_, _ = w.Write([]byte(`{"error":"Failed to marshal response"}`))
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_, _ = w.Write(response)
}
