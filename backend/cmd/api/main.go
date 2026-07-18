package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"backend/config"
	httpDelivery "backend/internal/delivery/http"
	"backend/internal/delivery/http/handler"
	"backend/internal/delivery/http/middleware"
	"backend/internal/repository/postgres"
	"backend/internal/usecase"

	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq" // PostgreSQL driver
)

func main() {
	log.Println("Starting API server...")

	// 1. Load Configurations
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// 2. Initialize Database Connection
	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		cfg.DBHost, cfg.DBPort, cfg.DBUser, cfg.DBPassword, cfg.DBName, cfg.DBSSLMode)

	log.Printf("Connecting to database at %s:%s...", cfg.DBHost, cfg.DBPort)
	db, err := sqlx.Connect("postgres", dsn)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer func() {
		if err := db.Close(); err != nil {
			log.Printf("Error closing database connection: %v", err)
		}
	}()

	// Configure DB connection pool settings
	db.SetMaxOpenConns(10)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)
	db.SetConnMaxIdleTime(3 * time.Minute)

	log.Println("Database connection established successfully.")

	// 3. Dependency Injection Wiring
	userRepo := postgres.NewUserRepository(db)
	userUseCase := usecase.NewUserUseCase(userRepo, cfg)
	userHandler := handler.NewUserHandler(userUseCase, cfg)

	// Project DI
	projectRepo := postgres.NewProjectRepository(db)
	projectUseCase := usecase.NewProjectUseCase(projectRepo, cfg)
	projectHandler := handler.NewProjectHandler(projectUseCase, cfg)

	chatRepo := postgres.NewChatRepository(db)
	chatUseCase := usecase.NewChatUseCase(chatRepo, projectRepo, cfg)
	chatHandler := handler.NewChatHandler(chatUseCase, cfg)

	// Blog DI
	blogRepo := postgres.NewBlogRepository(db)
	blogUseCase := usecase.NewBlogUseCase(blogRepo, cfg)
	blogHandler := handler.NewBlogHandler(blogUseCase, cfg)

	// Upload DI
	uploadHandler := handler.NewUploadHandler()

	contactUseCase := usecase.NewContactUsecase(cfg)
	contactHandler := handler.NewContactHandler(contactUseCase)

	authM := middleware.NewAuthMiddleware(cfg)

	// 4. Initialize Router
	router := httpDelivery.NewRouter(
		cfg,
		userHandler,
		chatHandler,
		blogHandler,
		projectHandler,
		uploadHandler,
		contactHandler,
		authM,
	)

	// 5. Configure and Start HTTP Server
	serverAddr := fmt.Sprintf(":%s", cfg.Port)
	srv := &http.Server{
		Addr:         serverAddr,
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Channel to listen for errors during server startup
	serverErrors := make(chan error, 1)

	// Start server in background goroutine
	go func() {
		log.Printf("HTTP Server listening on port %s", cfg.Port)
		serverErrors <- srv.ListenAndServe()
	}()

	// 6. Graceful Shutdown Setup
	shutdown := make(chan os.Signal, 1)
	signal.Notify(shutdown, os.Interrupt, syscall.SIGTERM)

	// Block until a signal or server error is received
	select {
	case err := <-serverErrors:
		if err != http.ErrServerClosed {
			log.Fatalf("HTTP Server failed to start: %v", err)
		}

	case sig := <-shutdown:
		log.Printf("Received signal %v. Initiating graceful shutdown...", sig)

		// Set context timeout for shutdown operations
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		// Attempt to gracefully shutdown the server
		if err := srv.Shutdown(ctx); err != nil {
			log.Printf("Could not gracefully shut down server: %v", err)
			// Force close server
			if err := srv.Close(); err != nil {
				log.Printf("Error during forced server close: %v", err)
			}
		}
	}

	log.Println("Server stopped cleanly.")
}
