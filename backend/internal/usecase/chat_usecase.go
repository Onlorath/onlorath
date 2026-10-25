package usecase

import (
	"context"
	"database/sql"
	"log"
	"strings"
	"sync"
	"time"

	"backend/config"
	"backend/internal/domain"

	"google.golang.org/genai"
)

// siteCacheTTL bounds how stale the assistant's knowledge of site content can be.
const siteCacheTTL = 5 * time.Minute

type chatUseCase struct {
	chatRepo    domain.ChatRepository
	siteUseCase domain.SiteUseCase
	cfg         *config.Config
	genaiClient *genai.Client

	siteCache    *domain.Site
	siteCacheSet time.Time
	cacheMu      sync.RWMutex
}

func NewChatUseCase(chatRepo domain.ChatRepository, siteUseCase domain.SiteUseCase, cfg *config.Config) domain.ChatUseCase {
	var genaiClient *genai.Client
	var err error

	if cfg.GeminiAPIKey != "" {
		// Initialize the GenAI client with background context
		genaiClient, err = genai.NewClient(context.Background(), &genai.ClientConfig{
			APIKey:  cfg.GeminiAPIKey,
			Backend: genai.BackendGeminiAPI,
		})
		if err != nil {
			log.Printf("Failed to initialize Gemini GenAI client: %v", err)
		}
	} else {
		log.Println("Warning: Gemini API Key is empty. Chat functionality will be disabled.")
	}

	return &chatUseCase{
		chatRepo:    chatRepo,
		siteUseCase: siteUseCase,
		cfg:         cfg,
		genaiClient: genaiClient,
	}
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

// mapGeminiError turns Gemini failures into the stable chat error codes:
// overload → retry later, bad/expired key → chat unavailable.
func mapGeminiError(err error) error {
	msg := strings.ToLower(err.Error())
	switch {
	case strings.Contains(msg, "high demand") || strings.Contains(msg, "unavailable") || strings.Contains(msg, "503"):
		return domain.ErrChatUpstreamBusy
	case strings.Contains(msg, "api key") || strings.Contains(msg, "permission_denied") || strings.Contains(msg, "unauthenticated"):
		return domain.ErrChatUnavailable
	}
	return err
}

func (u *chatUseCase) SendMessage(ctx context.Context, userID string, sessionID string, req *domain.SendMessageRequest) (*domain.ChatResponse, error) {
	if u.genaiClient == nil {
		return nil, domain.ErrChatUnavailable
	}

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

	chat, err := u.genaiClient.Chats.Create(ctx, "gemini-2.5-flash", chatConfig, history)
	if err != nil {
		log.Printf("Gemini Chats.Create error: %v", err)
		return nil, mapGeminiError(err)
	}

	resp, err := chat.SendMessage(ctx, genai.Part{Text: req.Message})
	if err != nil {
		log.Printf("Gemini SendMessage error: %v", err)
		return nil, mapGeminiError(err)
	}

	replyText := resp.Text()
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
