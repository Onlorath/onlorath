// Package migrate applies embedded, numbered SQL files exactly once each.
package migrate

import (
	"context"
	"fmt"
	"io/fs"
	"log"
	"sort"
	"strings"

	"github.com/jmoiron/sqlx"
)

// advisoryLockKey serializes concurrent API instances running migrations.
const advisoryLockKey = 727274

// Run applies every *.sql file in fsys whose name is not yet recorded in
// schema_migrations, in lexical order, each inside its own transaction.
func Run(ctx context.Context, db *sqlx.DB, fsys fs.FS) error {
	conn, err := db.Connx(ctx)
	if err != nil {
		return err
	}
	defer conn.Close()

	if _, err := conn.ExecContext(ctx, `SELECT pg_advisory_lock($1)`, advisoryLockKey); err != nil {
		return fmt.Errorf("acquire migration lock: %w", err)
	}
	defer conn.ExecContext(context.Background(), `SELECT pg_advisory_unlock($1)`, advisoryLockKey)

	if _, err := conn.ExecContext(ctx, `
		CREATE TABLE IF NOT EXISTS schema_migrations (
			version VARCHAR(255) PRIMARY KEY,
			applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
		)`); err != nil {
		return fmt.Errorf("create schema_migrations: %w", err)
	}

	var applied []string
	if err := conn.SelectContext(ctx, &applied, `SELECT version FROM schema_migrations`); err != nil {
		return fmt.Errorf("read schema_migrations: %w", err)
	}

	names, err := Pending(fsys, applied)
	if err != nil {
		return err
	}

	for _, name := range names {
		body, err := fs.ReadFile(fsys, name)
		if err != nil {
			return err
		}

		tx, err := conn.BeginTxx(ctx, nil)
		if err != nil {
			return err
		}
		if _, err := tx.ExecContext(ctx, string(body)); err != nil {
			tx.Rollback()
			return fmt.Errorf("migration %s: %w", name, err)
		}
		if _, err := tx.ExecContext(ctx, `INSERT INTO schema_migrations (version) VALUES ($1)`, name); err != nil {
			tx.Rollback()
			return fmt.Errorf("record migration %s: %w", name, err)
		}
		if err := tx.Commit(); err != nil {
			return fmt.Errorf("commit migration %s: %w", name, err)
		}
		log.Printf("Applied migration %s", name)
	}
	return nil
}

// Pending lists the *.sql files in fsys, sorted, excluding those in applied.
func Pending(fsys fs.FS, applied []string) ([]string, error) {
	entries, err := fs.ReadDir(fsys, ".")
	if err != nil {
		return nil, err
	}

	done := make(map[string]bool, len(applied))
	for _, v := range applied {
		done[v] = true
	}

	var names []string
	for _, e := range entries {
		if e.IsDir() || !strings.HasSuffix(e.Name(), ".sql") || done[e.Name()] {
			continue
		}
		names = append(names, e.Name())
	}
	sort.Strings(names)
	return names, nil
}
