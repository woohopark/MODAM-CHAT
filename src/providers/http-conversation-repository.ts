import type { ConversationRepository } from '../application/conversation-repository';
import type { Chat, ChatMessage } from '../domain/chat';
import { api, record, string } from './http-client';

export class HttpConversationRepository implements ConversationRepository {
  async list(): Promise<Chat[]> {
    const value = await api('conversations');
    if (!Array.isArray(value)) throw new Error('Invalid conversation list');
    return value.map((item: unknown) => {
      const data = record(item);
      if (data.mode !== 'general' && data.mode !== 'enterprise') throw new Error('Invalid mode');
      const id = string(data.id);
      return { id, serverId: id, title: string(data.title), mode: data.mode, messages: [] };
    });
  }
  async messages(id: string): Promise<ChatMessage[]> {
    const value = await api(`conversations/${encodeURIComponent(id)}/messages`);
    if (!Array.isArray(value)) throw new Error('Invalid message list');
    return value.map((item: unknown) => {
      const data = record(item);
      if (data.role !== 'user' && data.role !== 'assistant') throw new Error('Invalid role');
      if (
        data.status !== 'complete' &&
        data.status !== 'streaming' &&
        data.status !== 'cancelled' &&
        data.status !== 'error'
      )
        throw new Error('Invalid status');
      return {
        id: string(data.id),
        role: data.role,
        content: string(data.content),
        status: data.status,
        ...(data.run_id === undefined ? {} : { runId: string(data.run_id) }),
      };
    });
  }
  async remove(id: string): Promise<void> {
    await api(`conversations/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }
}
