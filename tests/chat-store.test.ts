import { describe, expect, it } from 'vitest';
import { ChatStore } from '../src/domain/chat-store';

describe('ChatStore', () => {
  it('trims input, creates a conversation and preserves message order', () => {
    const store = new ChatStore();
    const { chat, answer } = store.beginReply('  안녕하세요  ');
    expect(chat.title).toBe('안녕하세요');
    expect(chat.messages.map((message) => message.role)).toEqual(['user', 'assistant']);
    expect(answer.status).toBe('streaming');
    expect(store.snapshot().currentId).toBe(chat.id);
  });

  it('rejects blank and oversized messages without creating a chat', () => {
    const store = new ChatStore();
    expect(() => store.beginReply('  ')).toThrow();
    expect(() => store.beginReply('a'.repeat(4_001))).toThrow();
    expect(store.snapshot().chats).toHaveLength(0);
    expect(() => store.beginReply('a'.repeat(4_000))).not.toThrow();
  });

  it('retains existing conversations when creating and selecting another', () => {
    const store = new ChatStore();
    const first = store.beginReply('첫 번째').chat;
    store.newChat();
    const second = store.beginReply('두 번째').chat;
    expect(store.snapshot().chats.map((chat) => chat.id)).toEqual([second.id, first.id]);
    store.selectChat(first.id);
    expect(store.beginReply('이어서').chat.messages).toHaveLength(4);
    expect(() => store.selectChat('missing')).toThrow('Unknown conversation');
  });

  it('isolates returned snapshots from the internal mutable state', () => {
    const store = new ChatStore();
    store.beginReply('원본');
    const copy = store.snapshot().chats[0];
    if (!copy) throw new Error('Missing fixture');
    copy.messages.splice(0);
    expect(store.snapshot().chats[0]?.messages).toHaveLength(2);
  });
});
