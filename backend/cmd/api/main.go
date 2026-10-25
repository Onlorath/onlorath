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
	"backend/internal/pkg/migrate"
	"backend/internal/pkg/storage"
	"backend/internal/repository/postgres"
	"backend/internal/usecase"
	"backend/migrations"

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
	log.Printf("Connecting to database at %s...", cfg.DBTarget())
	db, err := sqlx.Connect("postgres", cfg.DSN())
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer func() {
		if err := db.Close(); err != nil {
			log.Printf("Error closing database connection: %v", err)
		}
	}()

	// Configure DB connection pool settings
	db.SetMaxOpenConns(cfg.DBMaxOpenConns)
	db.SetMaxIdleConns(min(5, cfg.DBMaxOpenConns))
	db.SetConnMaxLifetime(5 * time.Minute)
	db.SetConnMaxIdleTime(3 * time.Minute)

	log.Println("Database connection established successfully.")

	// 3. Apply pending schema migrations
	migrateCtx, cancelMigrate := context.WithTimeout(context.Background(), 2*time.Minute)
	if err := migrate.Run(migrateCtx, db, migrations.FS); err != nil {
		log.Fatalf("Database migration failed: %v", err)
	}
	cancelMigrate()

	// 4. Dependency Injection Wiring
	userRepo := postgres.NewUserRepository(db)
	userUseCase := usecase.NewUserUseCase(userRepo, cfg)
	userHandler := handler.NewUserHandler(userUseCase, cfg)

	projectRepo := postgres.NewProjectRepository(db)
	projectUseCase := usecase.NewProjectUseCase(projectRepo, cfg)
	projectHandler := handler.NewProjectHandler(projectUseCase, cfg)

	siteRepo := postgres.NewSiteRepository(db)
	siteUseCase := usecase.NewSiteUseCase(siteRepo, projectRepo)

	chatRepo := postgres.NewChatRepository(db)
	chatUseCase := usecase.NewChatUseCase(chatRepo, siteUseCase, cfg)
	chatHandler := handler.NewChatHandler(chatUseCase, cfg)

	blogRepo := postgres.NewBlogRepository(db)
	blogUseCase := usecase.NewBlogUseCase(blogRepo, cfg)
	blogHandler := handler.NewBlogHandler(blogUseCase, cfg)

	contactRepo := postgres.NewContactRepository(db)
	contactUseCase := usecase.NewContactUsecase(contactRepo, cfg)
	contactHandler := handler.NewContactHandler(contactUseCase)

	siteHandler := handler.NewSiteHandler(siteUseCase, projectUseCase, blogUseCase, contactUseCase)
	var store storage.Store = storage.Local{Dir: cfg.UploadDir}
	if cfg.SupabaseURL != "" && cfg.SupabaseServiceKey != "" {
		store = storage.NewSupabase(cfg.SupabaseURL, cfg.SupabaseServiceKey, cfg.SupabaseBucket)
		log.Printf("Uploads go to Supabase Storage bucket %q", cfg.SupabaseBucket)
	}
	uploadHandler := handler.NewUploadHandler(cfg, store)

	authM := middleware.NewAuthMiddleware(cfg)

	// 5. Bootstrap the admin account from ADMIN_EMAIL / ADMIN_PASSWORD
	if cfg.AdminEmail != "" && cfg.AdminPassword != "" {
		if err := userUseCase.EnsureAdmin(context.Background(), cfg.AdminEmail, cfg.AdminPassword); err != nil {
			log.Fatalf("Failed to bootstrap admin account: %v", err)
		}
		log.Printf("Admin account ready: %s", cfg.AdminEmail)
	} else {
		log.Println("Warning: ADMIN_EMAIL / ADMIN_PASSWORD not set; no admin account is bootstrapped.")
	}

	// 6. Initialize Router
	router := httpDelivery.NewRouter(cfg, httpDelivery.Handlers{
		User:    userHandler,
		Chat:    chatHandler,
		Blog:    blogHandler,
		Project: projectHandler,
		Site:    siteHandler,
		Upload:  uploadHandler,
		Contact: contactHandler,
		Health:  handler.NewHealthHandler(db),
	}, authM)

	// 7. Configure and Start HTTP Server
	serverAddr := fmt.Sprintf(":%s", cfg.Port)
	srv := &http.Server{
		Addr:    serverAddr,
		Handler: router,
		// Generous timeouts so admin video uploads (up to UPLOAD_MAX_MB) can complete.
		ReadTimeout:  2 * time.Minute,
		WriteTimeout: 2 * time.Minute,
		IdleTimeout:  60 * time.Second,
	}

	// Channel to listen for errors during server startup
	serverErrors := make(chan error, 1)

	// Start server in background goroutine
	go func() {
		log.Printf("HTTP Server listening on port %s", cfg.Port)
		serverErrors <- srv.ListenAndServe()
	}()

	// 8. Graceful Shutdown Setup
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
