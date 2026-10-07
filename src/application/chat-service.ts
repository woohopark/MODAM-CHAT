import type { ChatStore } from '../domain/chat-store';
import type { ChatProvider } from './chat-provider';

type Listener = () => void;

/** Coordinates use cases; the provider is injected at the composition root. */
export class ChatService {
  private active: AbortController | null = null;
  private readonly listeners = new Set<Listener>();

  constructor(
    readonly store: ChatStore,
    private readonly provider: ChatProvider,
  ) {}

  get isBusy(): boolean {
    return this.active !== null;
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
    this.active?.abort();
    this.active = null;
    this.notify();
  }

  newChat(): void {
    this.stop();
    this.store.newChat();
    this.notify();
  }
  selectChat(id: string): void {
    this.stop();
    this.store.selectChat(id);
    this.notify();
  }

  async send(input: string): Promise<void> {
    if (this.isBusy || !input.trim()) return;
    const { chat, answer } = this.store.beginReply(input);
    const controller = new AbortController();
    this.active = controller;
    const messages = chat.messages
      .slice(0, -1)
      .filter((message) => message.status === 'complete')
      .map(({ role, content }) => ({ role, content }));
    this.notify();
    try {
      for await (const chunk of this.provider.stream({ messages, signal: controller.signal })) {
        // Guard even against a provider that delivers a chunk after cancellation.
        controller.signal.throwIfAborted();
        answer.content += chunk;
        this.notify();
      }
      controller.signal.throwIfAborted();
      if (!answer.content) throw new Error('Empty provider response');
      answer.status = 'complete';
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
