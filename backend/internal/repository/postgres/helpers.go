package postgres

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"
)

// reorderable whitelists the tables reorder may touch (the name is interpolated into SQL).
var reorderable = map[string]bool{
	"projects": true, "experiences": true, "skills": true, "social_links": true,
}

// reorder sets sort_order of each row to its index in ids, in one statement.
func reorder(ctx context.Context, db *sqlx.DB, table string, ids []string) error {
	if !reorderable[table] {
		return fmt.Errorf("table %q is not reorderable", table)
	}
	query := fmt.Sprintf(`
		UPDATE %s AS t SET sort_order = x.ord - 1
		FROM unnest($1::uuid[]) WITH ORDINALITY AS x(id, ord)
		WHERE t.id = x.id`, table)
	_, err := db.ExecContext(ctx, query, pq.Array(ids))
	return err
}

// nextSortOrder returns the sort_order that places a new row last.
func nextSortOrder(ctx context.Context, db *sqlx.DB, table string) (int, error) {
	if !reorderable[table] {
		return 0, fmt.Errorf("table %q is not reorderable", table)
	}
	var next int
	err := db.GetContext(ctx, &next, fmt.Sprintf(`SELECT COALESCE(MAX(sort_order) + 1, 0) FROM %s`, table))
	return next, err
}

// deleteByID deletes one row and maps "no rows" to notFound.
func deleteByID(ctx context.Context, db *sqlx.DB, query string, id string, notFound error) error {
	res, err := db.ExecContext(ctx, query, id)
	if err != nil {
		return mapNoRows(err, notFound)
	}
	rows, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return notFound
	}
	return nil
}

// mapNoRows converts sql.ErrNoRows, and a malformed uuid literal (22P02) in an
// id lookup, into notFound.
func mapNoRows(err error, notFound error) error {
	if err == sql.ErrNoRows {
		return notFound
	}
	if pgErr, ok := err.(*pq.Error); ok && pgErr.Code == "22P02" {
		return notFound
	}
	return err
}

// isUniqueViolation reports a Postgres unique_violation (23505).
func isUniqueViolation(err error) bool {
	pgErr, ok := err.(*pq.Error)
	return ok && pgErr.Code == "23505"
}
