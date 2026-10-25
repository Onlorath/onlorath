package usecase

import (
	"context"

	"backend/config"
	"backend/internal/domain"
	"backend/internal/pkg/bcrypt"
	"backend/internal/pkg/jwt"
)

type userUseCase struct {
	userRepo domain.UserRepository
	cfg      *config.Config
}

// NewUserUseCase creates a new instance of UserUseCase.
func NewUserUseCase(userRepo domain.UserRepository, cfg *config.Config) domain.UserUseCase {
	return &userUseCase{
		userRepo: userRepo,
		cfg:      cfg,
	}
}

// EnsureAdmin creates the configured admin account, or promotes it to admin if it
// already exists. The password of an existing account is left unchanged.
func (u *userUseCase) EnsureAdmin(ctx context.Context, email string, password string) error {
	user, err := u.userRepo.GetByEmail(ctx, email)
	if err == nil {
		if user.Role == domain.RoleAdmin {
			return nil
		}
		return u.userRepo.UpdateRole(ctx, user.ID, domain.RoleAdmin)
	}
	if err != domain.ErrUserNotFound {
		return err
	}

	req := &domain.RegisterRequest{Email: email, Password: password}
	if err := req.Validate(); err != nil {
		return err
	}
	hashedPassword, err := bcrypt.HashPassword(password)
	if err != nil {
		return err
	}
	return u.userRepo.Create(ctx, &domain.User{
		Email:        email,
		PasswordHash: hashedPassword,
		Role:         domain.RoleAdmin,
	})
}

// Register validates user input, hashes the password, and creates a user record.
func (u *userUseCase) Register(ctx context.Context, req *domain.RegisterRequest) (*domain.User, error) {
	if !u.cfg.AllowRegistration {
		return nil, domain.ErrRegistrationDisabled
	}
	if err := req.Validate(); err != nil {
		return nil, err
	}

	hashedPassword, err := bcrypt.HashPassword(req.Password)
	if err != nil {
		return nil, err
	}

	user := &domain.User{
		Email:        req.Email,
		PasswordHash: hashedPassword,
		Role:         "user", // Default role
	}

	err = u.userRepo.Create(ctx, user)
	if err != nil {
		return nil, err
	}

	return user, nil
}

// Login validates credentials and generates access and refresh tokens.
func (u *userUseCase) Login(ctx context.Context, req *domain.LoginRequest) (string, string, *domain.User, error) {
	if err := req.Validate(); err != nil {
		return "", "", nil, err
	}

	user, err := u.userRepo.GetByEmail(ctx, req.Email)
	if err != nil {
		if err == domain.ErrUserNotFound {
			return "", "", nil, domain.ErrInvalidCredentials
		}
		return "", "", nil, err
	}

	err = bcrypt.ComparePassword(user.PasswordHash, req.Password)
	if err != nil {
		return "", "", nil, domain.ErrInvalidCredentials
	}

	// Generate Access Token (contains user details in claims)
	accessToken, err := jwt.GenerateAccessToken(
		user.ID,
		user.Email,
		user.Role,
		[]byte(u.cfg.JWTSecret),
		u.cfg.AccessTokenExpiry,
	)
	if err != nil {
		return "", "", nil, err
	}

	// Generate Refresh Token (contains only UserID)
	refreshToken, err := jwt.GenerateRefreshToken(
		user.ID,
		[]byte(u.cfg.JWTRefreshSecret),
		u.cfg.RefreshTokenExpiry,
	)
	if err != nil {
		return "", "", nil, err
	}

	return accessToken, refreshToken, user, nil
}

// Refresh validates the refresh token and returns a new access token.
func (u *userUseCase) Refresh(ctx context.Context, refreshToken string) (string, error) {
	userID, err := jwt.ValidateRefreshToken(refreshToken, []byte(u.cfg.JWTRefreshSecret))
	if err != nil {
		return "", err
	}

	user, err := u.userRepo.GetByID(ctx, userID)
	if err != nil {
		return "", err
	}

	accessToken, err := jwt.GenerateAccessToken(
		user.ID,
		user.Email,
		user.Role,
		[]byte(u.cfg.JWTSecret),
		u.cfg.AccessTokenExpiry,
	)
	if err != nil {
		return "", err
	}

	return accessToken, nil
}
