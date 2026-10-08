import type { ChatStore } from '../domain/chat-store';
import type { ChatProvider, ChatRequest } from './chat-provider';
import type { ConversationRepository } from './conversation-repository';
import type { Chat, ChatMessage } from '../domain/chat';

type Listener = () => void;

/** Coordinates use cases; the provider is injected at the composition root. */
export class ChatService {
  private selection = 0;
  private loading = false;
  mode: 'general' | 'enterprise' = 'general';
  private active: AbortController | null = null;
  private readonly listeners = new Set<Listener>();

  constructor(
    readonly store: ChatStore,
    private readonly provider: ChatProvider,
    private readonly repository?: ConversationRepository,
  ) {}

  get isBusy(): boolean {
    return this.active !== null || this.loading;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener());
  }

  stop(): void {
    ++this.selection;
    this.loading = false;
    this.active?.abort();
    this.active = null;
    this.notify();
  }

  newChat(): void {
    ++this.selection;
    this.stop();
    this.store.newChat();
    this.notify();
  }
  async selectChat(id: string): Promise<void> {
    this.stop();
    this.store.selectChat(id);
    this.notify();
    await this.load(id);
  }

  async restore(): Promise<void> {
    if (!this.repository) return;
    const chats = await this.repository.list();
    this.store.replace(chats, chats[0]?.id ?? null);
    this.notify();
    if (chats[0]) await this.load(chats[0].id);
  }

  async removeCurrent(): Promise<void> {
    const id = this.store.snapshot().currentId;
    const chat = id ? this.store.find(id) : undefined;
    if (!chat?.serverId || !this.repository) return;
    this.stop();
    await this.repository.remove(chat.serverId);
    await this.restore();
  }

  private async load(id: string): Promise<void> {
    const version = ++this.selection;
    const chat = this.store.find(id);
    if (!chat?.serverId || !this.repository) return;
    this.loading = true;
    this.notify();
    try {
      const messages = await this.repository.messages(chat.serverId);
      if (version !== this.selection || this.store.snapshot().currentId !== id) return;
      chat.messages.splice(0, chat.messages.length, ...messages);
      const answer = messages.find((message) => message.status === 'streaming' && message.runId);
      if (answer?.runId) {
        const controller = new AbortController();
        this.active = controller;
        void this.receive(chat, answer, controller, {
          messages: [],
          signal: controller.signal,
          conversationId: chat.serverId,
          runId: answer.runId,
        });
      }
    } finally {
      if (version === this.selection) {
        this.loading = false;
        this.notify();
      }
    }
  }

  async send(input: string): Promise<void> {
    if (this.isBusy || !input.trim()) return;
    const { chat, answer } = this.store.beginReply(input);
    chat.mode ??= this.mode;
    const controller = new AbortController();
    this.active = controller;
    const messages = chat.messages
      .slice(0, -1)
      .filter((message) => message.status === 'complete')
      .map(({ role, content }) => ({ role, content }));
    await this.receive(chat, answer, controller, {
      messages,
      signal: controller.signal,
      mode: chat.mode,
      ...(chat.serverId ? { conversationId: chat.serverId } : {}),
    });
  }

  private async receive(
    chat: Chat,
    answer: ChatMessage,
    controller: AbortController,
    request: ChatRequest,
  ): Promise<void> {
    this.notify();
    try {
      for await (const chunk of this.provider.stream(request)) {
        // Guard even against a provider that delivers a chunk after cancellation.
        controller.signal.throwIfAborted();
        if (typeof chunk === 'string') answer.content += chunk;
        else if (chunk.type === 'accepted') {
          chat.serverId = chunk.conversationId;
          answer.runId = chunk.runId;
        } else if (chunk.type === 'message') answer.content = chunk.text;
        else if (chunk.type === 'error') {
          answer.content = chunk.message;
          answer.status = 'error';
        } else if (chunk.type === 'cancelled') {
          answer.status = 'cancelled';
          answer.content ||= '응답 생성을 중단했어요.';
        }
        this.notify();
      }
      controller.signal.throwIfAborted();
      if (!answer.content) throw new Error('Empty provider response');
      if (answer.status === 'streaming') answer.status = 'complete';
    } catch {
      answer.status = controller.signal.aborted ? 'cancelled' : 'error';
      if (answer.status === 'cancelled') {
        if (!answer.content) answer.content = '응답 생성을 중단했어요.';
      } else {
        answer.content += '\n응답을 불러오지 못했어요. 다시 메시지를 보내 주세요.';
      }
    } finally {
      // An earlier request cannot clear a newer request's busy state.
      if (this.active === controller) this.active = null;
      this.notify();
    }
  }
}
