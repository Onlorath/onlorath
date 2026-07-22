import { api } from './client';

export const chatAPI = {
  sendMessage: (data: { conversation_id?: string; message: string }) =>
    api.post<{ conversation_id: string; reply: string; title?: string }>('/api/v1/chat/send', data),

  listConversations: () =>
    api.get<Array<{ id: string; title: string; created_at: string; updated_at: string }>>('/api/v1/chat/conversations'),

  getMessages: (conversationId: string) =>
    api.get<Array<{ id: string; role: string; content: string; created_at: string }>>(`/api/v1/chat/conversations/${conversationId}`),

  deleteConversation: (conversationId: string) =>
    api.delete(`/api/v1/chat/conversations/${conversationId}`),
};
