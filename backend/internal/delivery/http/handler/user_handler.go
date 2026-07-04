package handler

import (
	"encoding/json"
	"net/http"
	"time"

	"backend/config"
	"backend/internal/domain"
)

type UserHandler struct {
	userUseCase domain.UserUseCase
	cfg         *config.Config
}

// NewUserHandler creates a new instance of UserHandler.
func NewUserHandler(userUseCase domain.UserUseCase, cfg *config.Config) *UserHandler {
	return &UserHandler{
		userUseCase: userUseCase,
		cfg:         cfg,
	}
}

// Register handles user registration.
func (h *UserHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req domain.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.respondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	user, err := h.userUseCase.Register(r.Context(), &req)
	if err != nil {
		if err.Error() == "email is required" || err.Error() == "invalid email format" || err.Error() == "password must be at least 6 characters" {
			h.respondWithError(w, http.StatusBadRequest, err.Error())
			return
		}
		if err == domain.ErrEmailAlreadyExists {
			h.respondWithError(w, http.StatusConflict, err.Error())
			return
		}
		h.respondWithError(w, http.StatusInternalServerError, "Internal server error")
		return
	}

	h.respondWithJSON(w, http.StatusCreated, user)
}

// Login handles user login and authentication.
func (h *UserHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req domain.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.respondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	accessToken, refreshToken, user, err := h.userUseCase.Login(r.Context(), &req)
	if err != nil {
		if err.Error() == "email is required" || err.Error() == "password is required" {
			h.respondWithError(w, http.StatusBadRequest, err.Error())
			return
		}
		if err == domain.ErrInvalidCredentials {
			h.respondWithError(w, http.StatusUnauthorized, err.Error())
			return
		}
		h.respondWithError(w, http.StatusInternalServerError, "Internal server error")
		return
	}

	// Set Refresh Token as an HttpOnly Cookie
	cookie := &http.Cookie{
		Name:     "refresh_token",
		Value:    refreshToken,
		Path:     "/",
		Expires:  time.Now().Add(h.cfg.RefreshTokenExpiry),
		HttpOnly: true,
		Secure:   false, // Set to true in production with HTTPS
		SameSite: http.SameSiteLaxMode,
	}
	http.SetCookie(w, cookie)

	// Return Access Token in response body
	h.respondWithJSON(w, http.StatusOK, domain.AuthResponse{
		AccessToken: accessToken,
		TokenType:   "Bearer",
		User:        user,
	})
}

// Me is a helper protected endpoint to test the AuthMiddleware
func (h *UserHandler) Me(w http.ResponseWriter, r *http.Request) {
	// User ID can be retrieved from request context (set by AuthMiddleware)
	userID, ok := r.Context().Value(domain.ContextKeyUserID).(string)
	if !ok {
		h.respondWithError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	email, _ := r.Context().Value(domain.ContextKeyUserEmail).(string)
	role, _ := r.Context().Value(domain.ContextKeyUserRole).(string)

	response := map[string]string{
		"id":    userID,
		"email": email,
		"role":  role,
	}
	h.respondWithJSON(w, http.StatusOK, response)
}

// Refresh handles renewing the access token using the refresh token cookie.
func (h *UserHandler) Refresh(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("refresh_token")
	if err != nil {
		h.respondWithError(w, http.StatusUnauthorized, "Refresh token is missing")
		return
	}

	accessToken, err := h.userUseCase.Refresh(r.Context(), cookie.Value)
	if err != nil {
		h.respondWithError(w, http.StatusUnauthorized, "Invalid or expired refresh token")
		return
	}

	h.respondWithJSON(w, http.StatusOK, map[string]string{
		"access_token": accessToken,
	})
}

// Logout clears the refresh token cookie.
func (h *UserHandler) Logout(w http.ResponseWriter, r *http.Request) {
	cookie := &http.Cookie{
		Name:     "refresh_token",
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   false, // Set to true in production with HTTPS
		SameSite: http.SameSiteLaxMode,
	}
	http.SetCookie(w, cookie)

	h.respondWithJSON(w, http.StatusOK, map[string]string{"status": "logged_out"})
}



// Helpers for JSON responses
func (h *UserHandler) respondWithError(w http.ResponseWriter, code int, message string) {
	h.respondWithJSON(w, code, map[string]string{"error": message})
}

func (h *UserHandler) respondWithJSON(w http.ResponseWriter, code int, payload interface{}) {
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
