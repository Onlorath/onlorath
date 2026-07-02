package config

import (
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	Port               string
	DBHost             string
	DBPort             string
	DBUser             string
	DBPassword         string
	DBName             string
	DBSSLMode          string
	JWTSecret          string
	JWTRefreshSecret   string
	AccessTokenExpiry  time.Duration
	RefreshTokenExpiry time.Duration
	ClientURL          string
}

func LoadConfig() (*Config, error) {
	// Load .env file if it exists (ignore error if not present in production)
	_ = godotenv.Load()

	port := getEnv("PORT", "8080")
	dbHost := getEnv("DB_HOST", "localhost")
	dbPort := getEnv("DB_PORT", "5432")
	dbUser := getEnv("DB_USER", "postgres")
	dbPassword := getEnv("DB_PASSWORD", "")
	dbName := getEnv("DB_NAME", "postgres")
	dbSSLMode := getEnv("DB_SSLMODE", "disable")

	jwtSecret := getEnv("JWT_SECRET", "")
	if jwtSecret == "" {
		log.Println("Warning: JWT_SECRET is not set, using default dev secret")
		jwtSecret = "dev-access-secret-key"
	}

	jwtRefreshSecret := getEnv("JWT_REFRESH_SECRET", "")
	if jwtRefreshSecret == "" {
		log.Println("Warning: JWT_REFRESH_SECRET is not set, using default dev secret")
		jwtRefreshSecret = "dev-refresh-secret-key"
	}

	accessTokenExpiryStr := getEnv("ACCESS_TOKEN_EXPIRY", "15m")
	accessTokenExpiry, err := time.ParseDuration(accessTokenExpiryStr)
	if err != nil {
		accessTokenExpiry = 15 * time.Minute
	}

	refreshTokenExpiryStr := getEnv("REFRESH_TOKEN_EXPIRY", "168h") // 7 days
	refreshTokenExpiry, err := time.ParseDuration(refreshTokenExpiryStr)
	if err != nil {
		refreshTokenExpiry = 7 * 24 * time.Hour
	}

	clientURL := getEnv("CLIENT_URL", "http://localhost:3000")

	return &Config{
		Port:               port,
		DBHost:             dbHost,
		DBPort:             dbPort,
		DBUser:             dbUser,
		DBPassword:         dbPassword,
		DBName:             dbName,
		DBSSLMode:          dbSSLMode,
		JWTSecret:          jwtSecret,
		JWTRefreshSecret:   jwtRefreshSecret,
		AccessTokenExpiry:  accessTokenExpiry,
		RefreshTokenExpiry: refreshTokenExpiry,
		ClientURL:          clientURL,
	}, nil
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
