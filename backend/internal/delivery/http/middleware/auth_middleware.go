package middleware

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"

	"backend/config"
	"backend/internal/domain"
	"backend/internal/pkg/jwt"
)

type AuthMiddleware struct {
	cfg *config.Config
}

// NewAuthMiddleware creates a new AuthMiddleware.
func NewAuthMiddleware(cfg *config.Config) *AuthMiddleware {
	return &AuthMiddleware{
		cfg: cfg,
	}
}

// Handler returns a middleware that validates the JWT access token in the Authorization header.
func (m *AuthMiddleware) Handler(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			m.respondWithError(w, http.StatusUnauthorized, "Authorization header is required")
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			m.respondWithError(w, http.StatusUnauthorized, "Authorization header must be Bearer {token}")
			return
		}

		tokenStr := parts[1]
		claims, err := jwt.ValidateAccessToken(tokenStr, []byte(m.cfg.JWTSecret))
		if err != nil {
			if err == jwt.ErrExpiredToken {
				m.respondWithError(w, http.StatusUnauthorized, "Access token has expired")
				return
			}
			m.respondWithError(w, http.StatusUnauthorized, "Invalid access token")
			return
		}

		// Inject user info into context
		ctx := r.Context()
		ctx = context.WithValue(ctx, domain.ContextKeyUserID, claims.UserID)
		ctx = context.WithValue(ctx, domain.ContextKeyUserEmail, claims.Email)
		ctx = context.WithValue(ctx, domain.ContextKeyUserRole, claims.Role)

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// OptionalHandler returns a middleware that validates the JWT access token if present.
// If valid, it injects user info into context. If not present or invalid, it proceeds without failing.
func (m *AuthMiddleware) OptionalHandler(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			next.ServeHTTP(w, r)
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			next.ServeHTTP(w, r)
			return
		}

		tokenStr := parts[1]
		claims, err := jwt.ValidateAccessToken(tokenStr, []byte(m.cfg.JWTSecret))
		if err != nil {
			next.ServeHTTP(w, r)
			return
		}

		// Inject user info into context
		ctx := r.Context()
		ctx = context.WithValue(ctx, domain.ContextKeyUserID, claims.UserID)
		ctx = context.WithValue(ctx, domain.ContextKeyUserEmail, claims.Email)
		ctx = context.WithValue(ctx, domain.ContextKeyUserRole, claims.Role)

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// AdminOnly returns a middleware that requires the user to have the "admin" role.
// MUST be used after the Handler middleware (which injects user info into context).
func (m *AuthMiddleware) AdminOnly(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		role, ok := r.Context().Value(domain.ContextKeyUserRole).(string)
		if !ok || role != "admin" {
			m.respondWithError(w, http.StatusForbidden, "Admin access required")
			return
		}
		next.ServeHTTP(w, r)
	})
}


func (m *AuthMiddleware) respondWithError(w http.ResponseWriter, code int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	response, _ := json.Marshal(map[string]string{"error": message})
	_, _ = w.Write(response)
}
