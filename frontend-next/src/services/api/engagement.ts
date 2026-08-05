import type { ApiResponse, Conversation, Message, SocialPost, Notification } from '@/types';
import { api } from './client';

export const chatApi = {
  async getConversations() { return api.get<ApiResponse & { conversations: Conversation[] }>('/api/chat/conversations'); },
  async getMessages(conversationId: number) { return api.get<ApiResponse & { messages: Message[] }>(`/api/chat/conversations/${conversationId}/messages`); },
  async sendMessage(conversationId: number, content: string, type = 'text') { return api.post<ApiResponse & { message: Message }>(`/api/chat/conversations/${conversationId}/messages`, { content, type }); },
};

export const socialApi = {
  async getFeed() { return api.get<ApiResponse & { posts: SocialPost[] }>('/api/social/feed'); },
  async createPost(data: { postType: string; caption: string; mediaUrl?: string }) { return api.post<ApiResponse & { post: SocialPost }>('/api/social/posts', data); },
  async like(id: number) { return api.post<ApiResponse>(`/api/social/posts/${id}/like`); },
  async comment(id: number, content: string) { return api.post<ApiResponse>(`/api/social/posts/${id}/comment`, { content }); },
  async share(id: number) { return api.post<ApiResponse>(`/api/social/posts/${id}/share`); },
  async report(id: number, reason: string) { return api.post<ApiResponse>(`/api/social/posts/${id}/report`, { reason }); },
};

export const notificationApi = {
  async getAll() { return api.get<ApiResponse & { notifications: Notification[] }>('/api/notifications'); },
  async markRead(id: number) { return api.post<ApiResponse>(`/api/notifications/${id}/read`); },
};
