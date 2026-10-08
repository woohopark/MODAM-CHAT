import { MAX_MESSAGE_LENGTH } from './chat';
import type { Chat, ChatMessage, ChatSnapshot } from './chat';

/** Owns in-memory conversation state. No DOM or transport dependencies. */
export class ChatStore {
  private chats: Chat[] = [];
  private currentId: string | null = null;

  constructor(private readonly createId: () => string = () => crypto.randomUUID()) {}

  snapshot(): ChatSnapshot {
    return structuredClone({ chats: this.chats, currentId: this.currentId });
  }

  replace(chats: Chat[], currentId: string | null = null): void {
    this.chats = chats;
    this.currentId = currentId;
  }

  find(id: string): Chat | undefined {
    return this.chats.find((chat) => chat.id === id);
  }

  newChat(): void {
    this.currentId = null;
  }

  selectChat(id: string): void {
    if (!this.chats.some((chat) => chat.id === id)) throw new Error('Unknown conversation');
    this.currentId = id;
  }

  beginReply(input: string): { chat: Chat; answer: ChatMessage } {
    const content = input.trim();
    if (!content || Array.from(content).length > MAX_MESSAGE_LENGTH) {
      throw new Error('Message must contain 1 to 4000 characters');
    }
    let chat = this.chats.find((item) => item.id === this.currentId);
    if (!chat) {
      chat = { id: this.createId(), title: content.slice(0, 32), messages: [] };
      this.chats.unshift(chat);
      this.currentId = chat.id;
    }
    const answer: ChatMessage = {
      id: this.createId(),
      role: 'assistant',
      content: '',
      status: 'streaming',
    };
    chat.messages.push({ id: this.createId(), role: 'user', content, status: 'complete' }, answer);
    return { chat, answer };
  }
}
