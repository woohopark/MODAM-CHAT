import type { MessageRole } from '../domain/chat';

export interface ProviderMessage {
  readonly role: MessageRole;
  readonly content: string;
}

export interface ChatRequest {
  readonly messages: readonly ProviderMessage[];
  readonly signal: AbortSignal;
}

/** Providers yield plain text and must respect cancellation. */
export interface ChatProvider {
  stream(request: ChatRequest): AsyncIterable<string>;
}
