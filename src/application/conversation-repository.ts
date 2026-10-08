import type { Chat, ChatMessage } from '../domain/chat';

export interface ConversationRepository {
  list(): Promise<Chat[]>;
  messages(conversationId: string): Promise<ChatMessage[]>;
  remove(conversationId: string): Promise<void>;
}
