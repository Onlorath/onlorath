package postgres

import (
	"context"

	"backend/internal/domain"

	"github.com/jmoiron/sqlx"
)

type contactRepository struct {
	db *sqlx.DB
}

func NewContactRepository(db *sqlx.DB) domain.ContactRepository {
	return &contactRepository{db: db}
}

func (r *contactRepository) Create(ctx context.Context, m *domain.ContactMessage) error {
	return r.db.QueryRowxContext(ctx, `
		INSERT INTO contact_messages (name, email, message, locale)
		VALUES ($1, $2, $3, $4) RETURNING id, read, created_at`,
		m.Name, m.Email, m.Message, m.Locale).Scan(&m.ID, &m.Read, &m.CreatedAt)
}

func (r *contactRepository) List(ctx context.Context) ([]domain.ContactMessage, error) {
	items := []domain.ContactMessage{}
	err := r.db.SelectContext(ctx, &items, `
		SELECT id, name, email, message, locale, read, created_at
		FROM contact_messages ORDER BY created_at DESC`)
	return items, err
}

func (r *contactRepository) SetRead(ctx context.Context, id string, read bool) error {
	res, err := r.db.ExecContext(ctx, `UPDATE contact_messages SET read = $1 WHERE id = $2`, read, id)
	if err != nil {
		return mapNoRows(err, domain.ErrContactMessageNotFound)
	}
	rows, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return domain.ErrContactMessageNotFound
	}
	return nil
}

func (r *contactRepository) Delete(ctx context.Context, id string) error {
	return deleteByID(ctx, r.db, `DELETE FROM contact_messages WHERE id = $1`, id, domain.ErrContactMessageNotFound)
}

func (r *contactRepository) CountUnread(ctx context.Context) (int, error) {
	var n int
	err := r.db.GetContext(ctx, &n, `SELECT COUNT(*) FROM contact_messages WHERE NOT read`)
	return n, err
}
