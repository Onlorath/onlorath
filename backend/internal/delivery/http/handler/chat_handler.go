package handler

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"

	"backend/config"
	"backend/internal/domain"
	"backend/internal/pkg/httputil"
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

func (h *ChatHandler) getAuthInfo(w http.ResponseWriter, r *http.Request) (context.Context, string, string, bool) {
	sessionID := r.Header.Get("X-Session-ID")
	if sessionID == "" {
		sessionID = r.URL.Query().Get("session_id")
	}

	ctx := r.Context()
	userID, _ := ctx.Value(domain.ContextKeyUserID).(string)

	return ctx, userID, sessionID, true
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
		httputil.RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
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
		httputil.RespondWithError(w, http.StatusBadRequest, "session_id is required for guest users")
		return
	}

	resp, err := h.chatUseCase.SendMessage(ctx, userID, sessionID, &req)
	if err != nil {
		if err == domain.ErrGlobalLimitReached {
			httputil.RespondWithError(w, http.StatusTooManyRequests, err.Error())
			return
		}
		if err == domain.ErrChatLimitReached {
			httputil.RespondWithError(w, http.StatusTooManyRequests, err.Error())
			return
		}
		httputil.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	h.setQuotaHeaders(w, ctx, userID, sessionID)
	httputil.RespondWithJSON(w, http.StatusOK, resp)
}

func (h *ChatHandler) ListConversations(w http.ResponseWriter, r *http.Request) {
	ctx, userID, sessionID, ok := h.getAuthInfo(w, r)
	if !ok {
		return
	}

	if userID == "" && sessionID == "" {
		httputil.RespondWithError(w, http.StatusBadRequest, "session_id is required for guest users")
		return
	}

	h.setQuotaHeaders(w, ctx, userID, sessionID)
	conversations, err := h.chatUseCase.ListConversations(ctx, userID, sessionID)
	if err != nil {
		httputil.RespondWithError(w, http.StatusInternalServerError, "Internal server error")
		return
	}

	httputil.RespondWithJSON(w, http.StatusOK, conversations)
}

func (h *ChatHandler) GetMessages(w http.ResponseWriter, r *http.Request) {
	ctx, userID, sessionID, ok := h.getAuthInfo(w, r)
	if !ok {
		return
	}

	if userID == "" && sessionID == "" {
		httputil.RespondWithError(w, http.StatusBadRequest, "session_id is required for guest users")
		return
	}

	conversationID := chi.URLParam(r, "id")
	if conversationID == "" {
		httputil.RespondWithError(w, http.StatusBadRequest, "Conversation ID is required")
		return
	}

	h.setQuotaHeaders(w, ctx, userID, sessionID)
	messages, err := h.chatUseCase.GetConversationMessages(ctx, userID, sessionID, conversationID)
	if err != nil {
		if err.Error() == "conversation not found" {
			httputil.RespondWithError(w, http.StatusNotFound, err.Error())
			return
		}
		httputil.RespondWithError(w, http.StatusInternalServerError, "Internal server error")
		return
	}

	httputil.RespondWithJSON(w, http.StatusOK, messages)
}

func (h *ChatHandler) DeleteConversation(w http.ResponseWriter, r *http.Request) {
	ctx, userID, sessionID, ok := h.getAuthInfo(w, r)
	if !ok {
		return
	}

	if userID == "" && sessionID == "" {
		httputil.RespondWithError(w, http.StatusBadRequest, "session_id is required for guest users")
		return
	}

	conversationID := chi.URLParam(r, "id")
	if conversationID == "" {
		httputil.RespondWithError(w, http.StatusBadRequest, "Conversation ID is required")
		return
	}

	h.setQuotaHeaders(w, ctx, userID, sessionID)
	err := h.chatUseCase.DeleteConversation(ctx, userID, sessionID, conversationID)
	if err != nil {
		if err.Error() == "conversation not found" {
			httputil.RespondWithError(w, http.StatusNotFound, err.Error())
			return
		}
		httputil.RespondWithError(w, http.StatusInternalServerError, "Internal server error")
		return
	}

	httputil.RespondWithJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
}
