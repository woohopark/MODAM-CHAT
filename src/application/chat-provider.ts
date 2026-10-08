export interface ProviderMessage {
  readonly role: 'user' | 'assistant';
  readonly content: string;
}
export interface ChatRequest {
  readonly messages: readonly ProviderMessage[];
  readonly signal: AbortSignal;
  readonly conversationId?: string;
  readonly mode?: 'general' | 'enterprise';
  readonly runId?: string;
}
export type ProviderEvent =
  | { type: 'accepted'; conversationId: string; runId: string }
  | { type: 'status'; status: string }
  | { type: 'message'; text: string }
  | { type: 'error'; message: string }
  | { type: 'cancelled' };
export interface ChatProvider {
  stream(request: ChatRequest): AsyncIterable<string | ProviderEvent>;
}
