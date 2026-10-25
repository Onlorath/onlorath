package config

import (
	"errors"
	"fmt"
	"log"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	Port string
	// DatabaseURL (e.g. a Supabase pooler URI) takes precedence over the DB_* fields.
	DatabaseURL        string
	DBMaxOpenConns     int
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
	GeminiAPIKey       string
	DiscordWebhookURL  string
	TelegramBotToken   string
	TelegramChatID     string

	// Admin bootstrap: when both are set, this account is created (or promoted) as admin at startup.
	AdminEmail        string
	AdminPassword     string
	AllowRegistration bool
	CookieSecure      bool

	ChatUserLimit   int
	ChatGlobalLimit int
	UploadMaxBytes  int64
	UploadDir       string

	// Supabase Storage for uploads; when unset, files go to UploadDir on local disk.
	SupabaseURL        string
	SupabaseServiceKey string
	SupabaseBucket     string
}

// DSN returns the database connection string.
func (c *Config) DSN() string {
	if c.DatabaseURL != "" {
		return c.DatabaseURL
	}
	return fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		c.DBHost, c.DBPort, c.DBUser, c.DBPassword, c.DBName, c.DBSSLMode)
}

// DBTarget describes the database for logs without leaking credentials.
func (c *Config) DBTarget() string {
	if c.DatabaseURL == "" {
		return c.DBHost + ":" + c.DBPort
	}
	if u, err := url.Parse(c.DatabaseURL); err == nil {
		return u.Host
	}
	return "DATABASE_URL"
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

	production := getEnv("APP_ENV", "development") == "production"

	jwtSecret := getEnv("JWT_SECRET", "")
	jwtRefreshSecret := getEnv("JWT_REFRESH_SECRET", "")
	if production && (len(jwtSecret) < 32 || len(jwtRefreshSecret) < 32) {
		return nil, errors.New("APP_ENV=production requires JWT_SECRET and JWT_REFRESH_SECRET of at least 32 characters")
	}
	if jwtSecret == "" {
		log.Println("Warning: JWT_SECRET is not set, using default dev secret")
		jwtSecret = "dev-access-secret-key"
	}
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
	geminiAPIKey := getEnv("GEMINI_API_KEY", "")
	if strings.HasPrefix(geminiAPIKey, "your_") { // untouched .env.example placeholder
		geminiAPIKey = ""
	}
	if geminiAPIKey == "" {
		log.Println("Warning: GEMINI_API_KEY is not set, chat will not work")
	}

	return &Config{
		Port:               port,
		DatabaseURL:        getEnv("DATABASE_URL", ""),
		DBMaxOpenConns:     getEnvInt("DB_MAX_OPEN_CONNS", 10),
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
		GeminiAPIKey:       geminiAPIKey,
		DiscordWebhookURL:  getEnv("DISCORD_WEBHOOK_URL", ""),
		TelegramBotToken:   getEnv("TELEGRAM_BOT_TOKEN", ""),
		TelegramChatID:     getEnv("TELEGRAM_CHAT_ID", ""),
		AdminEmail:         getEnv("ADMIN_EMAIL", ""),
		AdminPassword:      getEnv("ADMIN_PASSWORD", ""),
		AllowRegistration:  getEnvBool("ALLOW_REGISTRATION", false),
		CookieSecure:       getEnvBool("COOKIE_SECURE", false),
		ChatUserLimit:      getEnvInt("CHAT_USER_LIMIT", 15),
		ChatGlobalLimit:    getEnvInt("CHAT_GLOBAL_LIMIT", 50),
		UploadMaxBytes:     int64(getEnvInt("UPLOAD_MAX_MB", 25)) << 20,
		UploadDir:          getEnv("UPLOAD_DIR", "assets/uploads"),
		SupabaseURL:        strings.TrimRight(getEnv("SUPABASE_URL", ""), "/"),
		SupabaseServiceKey: getEnv("SUPABASE_SERVICE_KEY", ""),
		SupabaseBucket:     getEnv("SUPABASE_BUCKET", "uploads"),
	}, nil
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}

func getEnvBool(key string, fallback bool) bool {
	v, err := strconv.ParseBool(getEnv(key, ""))
	if err != nil {
		return fallback
	}
	return v
}

func getEnvInt(key string, fallback int) int {
	v, err := strconv.Atoi(getEnv(key, ""))
	if err != nil || v <= 0 {
		return fallback
	}
	return v
}
