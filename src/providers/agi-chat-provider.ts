import type { ChatProvider, ChatRequest, ProviderEvent } from '../application/chat-provider';
import { api, record, string } from './http-client';

function run(value: unknown) {
  const data = record(value);
  const status = string(data.status);
  if (!['queued', 'running', 'completed', 'failed', 'cancelled'].includes(status))
    throw new Error('Invalid run status');
  return {
    id: string(data.id),
    conversationId: string(data.conversation_id),
    status,
    answer: string(data.answer),
  };
}

/** A disconnect reconnects to the same run; it never creates another execution. */
export class AgiChatProvider implements ChatProvider {
  private cancellation: Promise<unknown> = Promise.resolve();
  async *stream(request: ChatRequest): AsyncIterable<ProviderEvent> {
    await this.cancellation;
    request.signal.throwIfAborted();
    const requestId = crypto.randomUUID();
    let runId = request.runId;
    let conversationId = request.conversationId;
    const stop = () => {
      this.cancellation = api(`requests/${requestId}/cancel`, {
        method: 'POST',
        keepalive: true,
      }).catch(() => undefined);
      if (runId)
        this.cancellation = this.cancellation.then(() =>
          api(`runs/${runId}/cancel`, { method: 'POST', keepalive: true }).catch(() => undefined),
        );
    };
    request.signal.addEventListener('abort', stop, { once: true });
    try {
      if (!runId) {
        if (!conversationId) {
          const created = record(
            await api('conversations', {
              method: 'POST',
              body: JSON.stringify({ mode: request.mode ?? 'general' }),
              signal: request.signal,
            }),
          );
          conversationId = string(created.id);
        }
        const message = request.messages.at(-1)?.content;
        if (!message) throw new Error('Missing message');
        const payload = JSON.stringify({ request_id: requestId, message, cloud_allowed: true });
        let submitted: unknown;
        try {
          submitted = await api(`conversations/${conversationId}/runs`, {
            method: 'POST',
            body: payload,
            signal: request.signal,
          });
        } catch {
          request.signal.throwIfAborted();
          // Same id and body after an ambiguous network failure.
          submitted = await api(`conversations/${conversationId}/runs`, {
            method: 'POST',
            body: payload,
            signal: request.signal,
          });
        }
        runId = run(submitted).id;
      }
      if (!conversationId) throw new Error('Missing conversation');
      yield { type: 'accepted', conversationId, runId };
      let cursor = '0';
      let failures = 0;
      while (!request.signal.aborted) {
        try {
          const response = await fetch(`/api/runs/${runId}/events?after=${cursor}`, {
            credentials: 'same-origin',
            signal: request.signal,
          });
          if (!response.ok || !response.body) throw new Error('Stream unavailable');
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          try {
            while (true) {
              const { value, done } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true }).replace(/\r/g, '');
              if (buffer.length > 100_000) throw new Error('Event too large');
              let separator: number;
              while ((separator = buffer.indexOf('\n\n')) >= 0) {
                const block = buffer.slice(0, separator);
                buffer = buffer.slice(separator + 2);
                const data = block.split('\n').find((line) => line.startsWith('data: '));
                if (!data) continue;
                const id = block
                  .split('\n')
                  .find((line) => line.startsWith('id: '))
                  ?.slice(4);
                if (id && /^\d+$/.test(id)) cursor = id;
                const state = run(JSON.parse(data.slice(6)) as unknown);
                if (state.id !== runId || state.conversationId !== conversationId)
                  throw new Error('Mismatched event');
                if (state.status === 'completed') {
                  yield { type: 'message', text: state.answer };
                  return;
                }
                if (state.status === 'failed') {
                  yield { type: 'error', message: state.answer || '요청을 처리하지 못했습니다.' };
                  return;
                }
                if (state.status === 'cancelled') {
                  yield { type: 'cancelled' };
                  return;
                }
                yield { type: 'status', status: state.status };
              }
            }
          } finally {
            await reader.cancel().catch(() => undefined);
            reader.releaseLock();
          }
          failures = 0;
        } catch {
          request.signal.throwIfAborted();
          failures += 1;
        }
        // Durable status also handles an ended stream or a lost terminal event.
        const state = run(await api(`runs/${runId}`, { signal: request.signal }));
        if (state.status === 'completed') {
          yield { type: 'message', text: state.answer };
          return;
        }
        if (state.status === 'failed') {
          yield { type: 'error', message: state.answer || '요청을 처리하지 못했습니다.' };
          return;
        }
        if (state.status === 'cancelled') {
          yield { type: 'cancelled' };
          return;
        }
        if (failures > 5) throw new Error('Connection lost; reload to restore run');
      }
      request.signal.throwIfAborted();
    } finally {
      request.signal.removeEventListener('abort', stop);
    }
  }
}
