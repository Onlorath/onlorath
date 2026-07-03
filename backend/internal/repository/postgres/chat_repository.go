package postgres

import (
	"context"
	"database/sql"

	"backend/internal/domain"

	"github.com/jmoiron/sqlx"
)

type chatRepository struct {
	db *sqlx.DB
}

func NewChatRepository(db *sqlx.DB) domain.ChatRepository {
	return &chatRepository{
		db: db,
	}
}

func (r *chatRepository) CreateConversation(ctx context.Context, conv *domain.Conversation) error {
	query := `
		INSERT INTO conversations (user_id, session_id, title)
		VALUES ($1, $2, $3)
		RETURNING id, created_at, updated_at
	`
	err := r.db.QueryRowxContext(ctx, query, conv.UserID, conv.SessionID, conv.Title).
		Scan(&conv.ID, &conv.CreatedAt, &conv.UpdatedAt)
	return err
}

func (r *chatRepository) GetConversationByID(ctx context.Context, id string, userID string, sessionID string) (*domain.Conversation, error) {
	var conv domain.Conversation
	var query string
	var err error
	if userID != "" {
		query = `
			SELECT id, user_id, session_id, title, created_at, updated_at
			FROM conversations
			WHERE id = $1 AND user_id = $2
		`
		err = r.db.GetContext(ctx, &conv, query, id, userID)
	} else {
		query = `
			SELECT id, user_id, session_id, title, created_at, updated_at
			FROM conversations
			WHERE id = $1 AND session_id = $2
		`
		err = r.db.GetContext(ctx, &conv, query, id, sessionID)
	}
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, sql.ErrNoRows
		}
		return nil, err
	}
	return &conv, nil
}

func (r *chatRepository) ListConversations(ctx context.Context, userID string, sessionID string) ([]domain.Conversation, error) {
	var conversations []domain.Conversation
	var query string
	var err error
	if userID != "" {
		query = `
			SELECT id, user_id, session_id, title, created_at, updated_at
			FROM conversations
			WHERE user_id = $1
			ORDER BY updated_at DESC
		`
		err = r.db.SelectContext(ctx, &conversations, query, userID)
	} else {
		query = `
			SELECT id, user_id, session_id, title, created_at, updated_at
			FROM conversations
			WHERE session_id = $1
			ORDER BY updated_at DESC
		`
		err = r.db.SelectContext(ctx, &conversations, query, sessionID)
	}
	if err != nil {
		return nil, err
	}
	return conversations, nil
}

func (r *chatRepository) UpdateConversationTitle(ctx context.Context, id string, title string) error {
	query := `
		UPDATE conversations
		SET title = $1
		WHERE id = $2
	`
	_, err := r.db.ExecContext(ctx, query, title, id)
	return err
}

func (r *chatRepository) DeleteConversation(ctx context.Context, id string, userID string, sessionID string) error {
	var query string
	var err error
	var res sql.Result
	if userID != "" {
		query = `
			DELETE FROM conversations
			WHERE id = $1 AND user_id = $2
		`
		res, err = r.db.ExecContext(ctx, query, id, userID)
	} else {
		query = `
			DELETE FROM conversations
			WHERE id = $1 AND session_id = $2
		`
		res, err = r.db.ExecContext(ctx, query, id, sessionID)
	}
	if err != nil {
		return err
	}
	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (r *chatRepository) CreateMessage(ctx context.Context, msg *domain.Message) error {
	query := `
		INSERT INTO messages (conversation_id, role, content)
		VALUES ($1, $2, $3)
		RETURNING id, created_at
	`
	err := r.db.QueryRowxContext(ctx, query, msg.ConversationID, msg.Role, msg.Content).
		Scan(&msg.ID, &msg.CreatedAt)
	return err
}

func (r *chatRepository) GetMessagesByConversation(ctx context.Context, conversationID string, limit int) ([]domain.Message, error) {
	var messages []domain.Message
	query := `
		SELECT id, conversation_id, role, content, created_at
		FROM messages
		WHERE conversation_id = $1
		ORDER BY created_at ASC
		LIMIT $2
	`
	err := r.db.SelectContext(ctx, &messages, query, conversationID, limit)
	if err != nil {
		return nil, err
	}
	return messages, nil
}

func (r *chatRepository) CountMessagesBySessionOrUser(ctx context.Context, userID string, sessionID string) (int, error) {
	var count int
	var query string
	var err error

	if userID != "" {
		query = `
			SELECT COUNT(m.id)
			FROM messages m
			JOIN conversations c ON m.conversation_id = c.id
			WHERE c.user_id = $1 AND m.role = 'user'
			  AND m.created_at > NOW() - INTERVAL '24 hours'
		`
		err = r.db.GetContext(ctx, &count, query, userID)
	} else {
		query = `
			SELECT COUNT(m.id)
			FROM messages m
			JOIN conversations c ON m.conversation_id = c.id
			WHERE c.session_id = $1 AND c.user_id IS NULL AND m.role = 'user'
			  AND m.created_at > NOW() - INTERVAL '24 hours'
		`
		err = r.db.GetContext(ctx, &count, query, sessionID)
	}

	if err != nil {
		return 0, err
	}
	return count, nil
}

func (r *chatRepository) CountAllUserMessages(ctx context.Context) (int, error) {
	var count int
	query := `
		SELECT COUNT(m.id)
		FROM messages m
		JOIN conversations c ON m.conversation_id = c.id
		WHERE m.role = 'user'
		  AND m.created_at > NOW() - INTERVAL '24 hours'
	`
	err := r.db.GetContext(ctx, &count, query)
	if err != nil {
		return 0, err
	}
	return count, nil
}
