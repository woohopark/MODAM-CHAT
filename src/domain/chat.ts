export type MessageRole = 'user' | 'assistant';
export type MessageStatus = 'complete' | 'streaming' | 'cancelled' | 'error';

export interface ChatMessage {
  readonly id: string;
  readonly role: MessageRole;
  runId?: string;
  content: string;
  status: MessageStatus;
}

export interface Chat {
  readonly id: string;
  readonly title: string;
  serverId?: string;
  mode?: 'general' | 'enterprise';
  readonly messages: ChatMessage[];
}

export interface ChatSnapshot {
  readonly chats: readonly Chat[];
  readonly currentId: string | null;
}

export const MAX_MESSAGE_LENGTH = 4_000;
