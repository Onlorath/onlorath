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

// Run applies every *.sql file in fsys whose name is not yet recorded in
// schema_migrations, in lexical order, all inside one transaction: either every
// pending migration is applied or none is.
//
// The lock is transaction-scoped (pg_advisory_xact_lock) so it also works through
// a transaction-mode pooler such as Supabase's port 6543, where session-level locks
// can be taken and released on different server connections.
func Run(ctx context.Context, db *sqlx.DB, fsys fs.FS) error {
	tx, err := db.BeginTxx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.ExecContext(ctx, `SELECT pg_advisory_xact_lock(727274)`); err != nil {
		return fmt.Errorf("acquire migration lock: %w", err)
	}

	if _, err := tx.ExecContext(ctx, `
		CREATE TABLE IF NOT EXISTS schema_migrations (
			version VARCHAR(255) PRIMARY KEY,
			applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
		)`); err != nil {
		return fmt.Errorf("create schema_migrations: %w", err)
	}

	var applied []string
	if err := tx.SelectContext(ctx, &applied, `SELECT version FROM schema_migrations`); err != nil {
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
		if _, err := tx.ExecContext(ctx, string(body)); err != nil {
			return fmt.Errorf("migration %s: %w", name, err)
		}
		if _, err := tx.ExecContext(ctx, `INSERT INTO schema_migrations (version) VALUES ($1)`, name); err != nil {
			return fmt.Errorf("record migration %s: %w", name, err)
		}
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("commit migrations: %w", err)
	}
	for _, name := range names {
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
