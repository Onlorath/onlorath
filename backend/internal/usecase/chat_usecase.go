package usecase

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"strings"
	"sync"
	"time"

	"backend/config"
	"backend/internal/domain"
	"backend/internal/pkg/notify"

	"golang.org/x/time/rate"
	"google.golang.org/genai"
)

// siteCacheTTL bounds how stale the assistant's knowledge of site content can be.
const siteCacheTTL = 5 * time.Minute

type chatUseCase struct {
	chatRepo    domain.ChatRepository
	siteUseCase domain.SiteUseCase
	cfg         *config.Config
	genaiClient *genai.Client
	models      *modelPool

	notifier notify.Notifier
	// notifyLimiter caps owner alerts: when the assistant is down, messages aren't
	// stored, so the chat quota alone would not stop someone flooding Telegram.
	notifyLimiter *rate.Limiter

	siteCache    *domain.Site
	siteCacheSet time.Time
	cacheMu      sync.RWMutex
}

// geminiBackend picks the API: the Gemini Developer API (AI Studio keys, both the
// "AIza…" standard keys and the "AQ.…" auth keys AI Studio issues since May 2026)
// unless GEMINI_BACKEND=vertex asks for Vertex AI express mode.
func geminiBackend(override string) genai.Backend {
	if strings.EqualFold(override, "vertex") {
		return genai.BackendVertexAI
	}
	return genai.BackendGeminiAPI
}

func NewChatUseCase(chatRepo domain.ChatRepository, siteUseCase domain.SiteUseCase, notifier notify.Notifier, cfg *config.Config) domain.ChatUseCase {
	var genaiClient *genai.Client
	models := newModelPool(parseModelList(cfg.GeminiModels))

	if cfg.GeminiAPIKey != "" {
		backend := geminiBackend(cfg.GeminiBackend)
		client, err := genai.NewClient(context.Background(), &genai.ClientConfig{
			APIKey:  cfg.GeminiAPIKey,
			Backend: backend,
		})
		if err != nil {
			log.Printf("Failed to initialize Gemini client (%s): %v", backend, err)
		} else {
			genaiClient = client
			log.Printf("Chat assistant uses %s, models: %s", backend, strings.Join(models.models, ", "))
		}
	} else {
		log.Println("Warning: Gemini API Key is empty. Chat functionality will be disabled.")
	}

	return &chatUseCase{
		chatRepo:      chatRepo,
		siteUseCase:   siteUseCase,
		cfg:           cfg,
		genaiClient:   genaiClient,
		models:        models,
		notifier:      notifier,
		notifyLimiter: rate.NewLimiter(rate.Every(30*time.Second), 20),
	}
}

// notifyOwner forwards a visitor's chat message to Telegram/Discord.
func (u *chatUseCase) notifyOwner(sessionID, userID, locale, message string) {
	if u.notifier == nil || !u.notifier.Enabled() || !u.notifyLimiter.Allow() {
		return
	}
	who := "misafir " + shortID(sessionID)
	if userID != "" {
		who = "kullanıcı " + shortID(userID)
	}
	text := fmt.Sprintf("Sohbette yeni mesaj (%s, %s)\n\n%s", strings.ToUpper(domain.NormalizeLocale(locale)), who, message)
	if u.genaiClient == nil {
		text += "\n\n(Asistan kapalı; ziyaretçiye cevap gitmedi.)"
	}
	notify.Async(u.notifier, text)
}

func shortID(id string) string {
	if r := []rune(id); len(r) > 8 {
		return string(r[:8])
	}
	return id
}

// loadSite returns the site content for the system prompt, cached for siteCacheTTL.
func (u *chatUseCase) loadSite(ctx context.Context) (*domain.Site, error) {
	u.cacheMu.RLock()
	cached, fresh := u.siteCache, time.Since(u.siteCacheSet) < siteCacheTTL
	u.cacheMu.RUnlock()
	if cached != nil && fresh {
		return cached, nil
	}

	site, err := u.siteUseCase.GetSite(ctx)
	if err != nil {
		return nil, err
	}
	u.cacheMu.Lock()
	u.siteCache, u.siteCacheSet = site, time.Now()
	u.cacheMu.Unlock()
	return site, nil
}

func (u *chatUseCase) SendMessage(ctx context.Context, userID string, sessionID string, req *domain.SendMessageRequest) (*domain.ChatResponse, error) {
	req.Message = strings.TrimSpace(req.Message)
	if req.Message == "" {
		return nil, domain.ErrEmptyChatMessage
	}
	if len([]rune(req.Message)) > domain.MaxChatMessageLength {
		return nil, domain.ErrChatMessageTooLong
	}

	globalReached, personalReached, err := u.CheckQuota(ctx, userID, sessionID)
	if err != nil {
		return nil, err
	}
	if globalReached {
		return nil, domain.ErrGlobalLimitReached
	}
	if personalReached {
		return nil, domain.ErrChatLimitReached
	}

	// The owner hears about every visitor message, even when the assistant can't answer.
	u.notifyOwner(sessionID, userID, req.Locale, req.Message)
	if u.genaiClient == nil {
		return nil, domain.ErrChatUnavailable
	}

	// Build the instructions before saving anything, so a DB failure leaves no orphan rows.
	site, err := u.loadSite(ctx)
	if err != nil {
		return nil, err
	}
	sysInstructionStr := buildSystemPrompt(site, req.Locale)

	var conv *domain.Conversation
	isNewConversation := false

	// 1. Get or Create Conversation
	if req.ConversationID == "" {
		// Generate an initial title from the message (rune-safe for Turkish characters)
		title := req.Message
		if r := []rune(title); len(r) > 30 {
			title = string(r[:30]) + "..."
		}
		var uID *string
		if userID != "" {
			uID = &userID
		}
		var sID *string
		if sessionID != "" {
			sID = &sessionID
		}
		conv = &domain.Conversation{
			UserID:    uID,
			SessionID: sID,
			Title:     title,
		}
		err = u.chatRepo.CreateConversation(ctx, conv)
		if err != nil {
			return nil, err
		}
		isNewConversation = true
	} else {
		conv, err = u.chatRepo.GetConversationByID(ctx, req.ConversationID, userID, sessionID)
		if err != nil {
			if err == sql.ErrNoRows {
				return nil, domain.ErrConversationNotFound
			}
			return nil, err
		}
	}

	// 2. Save User Message
	userMsg := &domain.Message{
		ConversationID: conv.ID,
		Role:           "user",
		Content:        req.Message,
	}
	err = u.chatRepo.CreateMessage(ctx, userMsg)
	if err != nil {
		return nil, err
	}

	// 3. Load past messages for history (limit to last 20 messages to save context tokens)
	pastMessages, err := u.chatRepo.GetMessagesByConversation(ctx, conv.ID, 20)
	if err != nil {
		return nil, err
	}

	// Convert database messages (excluding the last one we just added to send via SendMessage)
	// to the genai.Content format.
	var history []*genai.Content
	for i := 0; i < len(pastMessages)-1; i++ {
		msg := pastMessages[i]
		history = append(history, &genai.Content{
			Role: msg.Role,
			Parts: []*genai.Part{
				{Text: msg.Content},
			},
		})
	}

	// 4. Send Message to Gemini
	chatConfig := &genai.GenerateContentConfig{
		SystemInstruction: &genai.Content{
			Role: "system",
			Parts: []*genai.Part{
				{Text: sysInstructionStr},
			},
		},
	}

	replyText, err := u.models.generate(ctx, func(ctx context.Context, model string) (string, error) {
		chat, err := u.genaiClient.Chats.Create(ctx, model, chatConfig, history)
		if err != nil {
			return "", err
		}
		resp, err := chat.SendMessage(ctx, genai.Part{Text: req.Message})
		if err != nil {
			return "", err
		}
		return resp.Text(), nil
	})
	if err != nil {
		return nil, err
	}
	if replyText == "" {
		replyText = "Sorry, I couldn't generate a response."
	}

	// 5. Save Model Response
	modelMsg := &domain.Message{
		ConversationID: conv.ID,
		Role:           "model",
		Content:        replyText,
	}
	err = u.chatRepo.CreateMessage(ctx, modelMsg)
	if err != nil {
		return nil, err
	}

	// 6. Return response
	res := &domain.ChatResponse{
		ConversationID: conv.ID,
		Reply:          replyText,
	}
	if isNewConversation {
		res.Title = conv.Title
	}

	return res, nil
}

func (u *chatUseCase) ListConversations(ctx context.Context, userID string, sessionID string) ([]domain.Conversation, error) {
	return u.chatRepo.ListConversations(ctx, userID, sessionID)
}

func (u *chatUseCase) GetConversationMessages(ctx context.Context, userID string, sessionID string, conversationID string) ([]domain.Message, error) {
	// Verify conversation belongs to user/session
	_, err := u.chatRepo.GetConversationByID(ctx, conversationID, userID, sessionID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, domain.ErrConversationNotFound
		}
		return nil, err
	}

	return u.chatRepo.GetMessagesByConversation(ctx, conversationID, 100)
}

func (u *chatUseCase) DeleteConversation(ctx context.Context, userID string, sessionID string, conversationID string) error {
	err := u.chatRepo.DeleteConversation(ctx, conversationID, userID, sessionID)
	if err != nil {
		if err == sql.ErrNoRows {
			return domain.ErrConversationNotFound
		}
		return err
	}
	return nil
}

func (u *chatUseCase) CheckQuota(ctx context.Context, userID string, sessionID string) (bool, bool, error) {
	// 1. Check global limit
	globalCount, err := u.chatRepo.CountAllUserMessages(ctx)
	if err != nil {
		return false, false, err
	}
	globalReached := globalCount >= u.cfg.ChatGlobalLimit

	// 2. Check personal limit
	personalCount, err := u.chatRepo.CountMessagesBySessionOrUser(ctx, userID, sessionID)
	if err != nil {
		return false, false, err
	}
	personalReached := personalCount >= u.cfg.ChatUserLimit

	return globalReached, personalReached, nil
}
