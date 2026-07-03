package domain

import (
	"context"
	"errors"
	"time"
)

var ErrChatLimitReached = errors.New("Sohbet kotanız dolmuştur. Yusuf ile iletişime geçmek için lütfen iletişim formunu kullanın.")
var ErrGlobalLimitReached = errors.New("Şu anda yoğunluk var o yüzden kullanılamıyor")

type Conversation struct {
	ID        string    `db:"id" json:"id"`
	UserID    *string   `db:"user_id" json:"user_id"` // Pointer since it can be NULL
	SessionID *string   `db:"session_id" json:"session_id"`
	Title     string    `db:"title" json:"title"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
	UpdatedAt time.Time `db:"updated_at" json:"updated_at"`
}

type Message struct {
	ID             string    `db:"id" json:"id"`
	ConversationID string    `db:"conversation_id" json:"conversation_id"`
	Role           string    `db:"role" json:"role"` // "user" | "model"
	Content        string    `db:"content" json:"content"`
	CreatedAt      time.Time `db:"created_at" json:"created_at"`
}

type SendMessageRequest struct {
	ConversationID string `json:"conversation_id"` // Empty for new conversation
	SessionID      string `json:"session_id"`      // Optional session ID for guest chat
	Message        string `json:"message"`
}

type ChatResponse struct {
	ConversationID string `json:"conversation_id"`
	Reply          string `json:"reply"`
	Title          string `json:"title,omitempty"` // Conversation title if newly created or updated
}

type ChatRepository interface {
	CreateConversation(ctx context.Context, conv *Conversation) error
	GetConversationByID(ctx context.Context, id string, userID string, sessionID string) (*Conversation, error)
	ListConversations(ctx context.Context, userID string, sessionID string) ([]Conversation, error)
	UpdateConversationTitle(ctx context.Context, id string, title string) error
	DeleteConversation(ctx context.Context, id string, userID string, sessionID string) error
	CreateMessage(ctx context.Context, msg *Message) error
	GetMessagesByConversation(ctx context.Context, conversationID string, limit int) ([]Message, error)
	CountMessagesBySessionOrUser(ctx context.Context, userID string, sessionID string) (int, error)
	CountAllUserMessages(ctx context.Context) (int, error)
}

type ChatUseCase interface {
	SendMessage(ctx context.Context, userID string, sessionID string, req *SendMessageRequest) (*ChatResponse, error)
	ListConversations(ctx context.Context, userID string, sessionID string) ([]Conversation, error)
	GetConversationMessages(ctx context.Context, userID string, sessionID string, conversationID string) ([]Message, error)
	DeleteConversation(ctx context.Context, userID string, sessionID string, conversationID string) error
	CheckQuota(ctx context.Context, userID string, sessionID string) (globalReached bool, personalReached bool, err error)
}
