import { apiClient } from './apiClient';

export interface ChatMessageResponse {
  conversation_id?: string;
  response?: string;
  reply?: string;
  message?: string;
}

class ChatService {
  private activeConversationId: string | null = null;

  public async sendMessage(messageText: string): Promise<string> {
    try {
      const res = await apiClient.request<ChatMessageResponse>('/chat/send', {
        method: 'POST',
        body: {
          message: messageText,
          conversation_id: this.activeConversationId || undefined,
        },
      });

      if (res.conversation_id) {
        this.activeConversationId = res.conversation_id;
      }

      return res.response || res.reply || res.message || 'System received transmission.';
    } catch {
      // Local fallback if Go backend is temporarily offline
      return `[AI Engine Local Dispatch]: Received query "${messageText}". Backend AI daemon at ${apiClient.getBaseUrl()} is currently in standby mode.`;
    }
  }

  public getConversationId(): string | null {
    return this.activeConversationId;
  }
}

export const chatService = new ChatService();
