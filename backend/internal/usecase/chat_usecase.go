package usecase

import (
	"context"
	"database/sql"
	"errors"
	"log"
	"strings"

	"backend/config"
	"backend/internal/domain"

	"google.golang.org/genai"
)

type chatUseCase struct {
	chatRepo    domain.ChatRepository
	cfg         *config.Config
	genaiClient *genai.Client
}

func NewChatUseCase(chatRepo domain.ChatRepository, cfg *config.Config) domain.ChatUseCase {
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
		cfg:         cfg,
		genaiClient: genaiClient,
	}
}

func (u *chatUseCase) SendMessage(ctx context.Context, userID string, sessionID string, req *domain.SendMessageRequest) (*domain.ChatResponse, error) {
	if u.genaiClient == nil {
		return nil, errors.New("chat service is currently unavailable (API key not configured)")
	}

	if strings.TrimSpace(req.Message) == "" {
		return nil, errors.New("message cannot be empty")
	}

	var conv *domain.Conversation
	var err error
	isNewConversation := false

	// 1. Get or Create Conversation
	if req.ConversationID == "" {
		// Generate an initial title from the message
		title := req.Message
		if len(title) > 30 {
			title = title[:30] + "..."
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
				return nil, errors.New("conversation not found")
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
	sysInstructionStr := `You are a helpful AI assistant for Yusuf Albayrak's (onlorath) personal portfolio.
Answer questions professionally and concisely in the user's language (Turkish or English) based on Yusuf's resume:

YUSUF ALBAYRAK - Full Stack Developer (Istanbul, Turkey)
Email: ysfalbayrak02@gmail.com | GitHub: github.com/onlorath | LinkedIn: linkedin.com/in/yusuf-albayrak
Summary: Full Stack Developer with 2.5+ years of professional experience building production-grade web applications using GoLang, TypeScript, NestJS, and React.
Skills: GoLang, TypeScript, JavaScript, NestJS, Fastify, React, Node.js, Redux, PostgreSQL, MongoDB, Redis, TypeORM, Docker, Kubernetes (k3s), AWS, Azure, GCP, OpenAI/Gemini APIs, RAG.
Experience: Full Stack Developer at Kartelam (May 2023 - Dec 2025). Developed ReactJS and GoLang microservices.
Education: Istanbul Aydin University, Associate Degree in Computer Programming (Sep 2022 - Jul 2025).

CRITICAL RULE FOR PROJECTS/SYSTEMS:
If the user asks about Yusuf's projects, architecture, works, or systems, you MUST guide them and provide a direct clickable markdown link to the Projects Page: [Sistemler & Projeler](/projects). Tell them they can view all project details, statuses, and tech stacks directly on that page.`

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
		return nil, err
	}

	resp, err := chat.SendMessage(ctx, genai.Part{Text: req.Message})
	if err != nil {
		return nil, err
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
			return nil, errors.New("conversation not found")
		}
		return nil, err
	}

	return u.chatRepo.GetMessagesByConversation(ctx, conversationID, 100)
}

func (u *chatUseCase) DeleteConversation(ctx context.Context, userID string, sessionID string, conversationID string) error {
	err := u.chatRepo.DeleteConversation(ctx, conversationID, userID, sessionID)
	if err != nil {
		if err == sql.ErrNoRows {
			return errors.New("conversation not found")
		}
		return err
	}
	return nil
}
