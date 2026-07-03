package handler

import (
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

// getAuthInfo extracts optional userID and guest sessionID from request.
func (h *ChatHandler) getAuthInfo(w http.ResponseWriter, r *http.Request) (string, string, bool) {
	sessionID := r.Header.Get("X-Session-ID")
	if sessionID == "" {
		sessionID = r.URL.Query().Get("session_id")
	}

	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		// Public guest user, no authorization header
		return "", sessionID, true
	}

	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || parts[0] != "Bearer" {
		h.respondWithError(w, http.StatusUnauthorized, "Authorization header must be Bearer {token}")
		return "", "", false
	}

	tokenStr := parts[1]
	claims, err := jwt.ValidateAccessToken(tokenStr, []byte(h.cfg.JWTSecret))
	if err != nil {
		if err == jwt.ErrExpiredToken {
			h.respondWithError(w, http.StatusUnauthorized, "Access token has expired")
			return "", "", false
		}
		h.respondWithError(w, http.StatusUnauthorized, "Invalid access token")
		return "", "", false
	}

	return claims.UserID, sessionID, true
}

func (h *ChatHandler) SendMessage(w http.ResponseWriter, r *http.Request) {
	var req domain.SendMessageRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.respondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	userID, sessionID, ok := h.getAuthInfo(w, r)
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

	resp, err := h.chatUseCase.SendMessage(r.Context(), userID, sessionID, &req)
	if err != nil {
		h.respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	h.respondWithJSON(w, http.StatusOK, resp)
}

func (h *ChatHandler) ListConversations(w http.ResponseWriter, r *http.Request) {
	userID, sessionID, ok := h.getAuthInfo(w, r)
	if !ok {
		return
	}

	if userID == "" && sessionID == "" {
		h.respondWithError(w, http.StatusBadRequest, "session_id is required for guest users")
		return
	}

	conversations, err := h.chatUseCase.ListConversations(r.Context(), userID, sessionID)
	if err != nil {
		h.respondWithError(w, http.StatusInternalServerError, "Internal server error")
		return
	}

	h.respondWithJSON(w, http.StatusOK, conversations)
}

func (h *ChatHandler) GetMessages(w http.ResponseWriter, r *http.Request) {
	userID, sessionID, ok := h.getAuthInfo(w, r)
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

	messages, err := h.chatUseCase.GetConversationMessages(r.Context(), userID, sessionID, conversationID)
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
	userID, sessionID, ok := h.getAuthInfo(w, r)
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

	err := h.chatUseCase.DeleteConversation(r.Context(), userID, sessionID, conversationID)
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
