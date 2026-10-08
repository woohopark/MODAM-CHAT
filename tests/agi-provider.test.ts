import { afterEach, describe, expect, it, vi } from 'vitest';
import { AgiChatProvider } from '../src/providers/agi-chat-provider';
import { HttpConversationRepository } from '../src/providers/http-conversation-repository';
import { api, record, string } from '../src/providers/http-client';

const state = (status = 'completed', answer = '실제 답변') => ({
  id: 'run-1',
  conversation_id: 'chat-1',
  status,
  answer,
});
const response = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } });
function stream(items: unknown[], prefix = '') {
  const text =
    prefix +
    items
      .map((item, i) => `id: ${i + 1}\nevent: status\ndata: ${JSON.stringify(item)}\n\n`)
      .join('');
  return new Response(
    new ReadableStream({
      start(controller) {
        const bytes = new TextEncoder().encode(text);
        controller.enqueue(bytes.slice(0, 15));
        controller.enqueue(bytes.slice(15));
        controller.close();
      },
    }),
    { headers: { 'Content-Type': 'text/event-stream' } },
  );
}
afterEach(() => vi.unstubAllGlobals());
async function collect(provider: AgiChatProvider, options = {}) {
  const results = [];
  for await (const item of provider.stream({
    messages: [{ role: 'user', content: '새 메시지' }],
    signal: new AbortController().signal,
    ...options,
  }))
    results.push(item);
  return results;
}

describe('AGI HTTP adapter', () => {
  it.each(['completed', 'failed', 'cancelled'])(
    'creates only a new message and consumes %s SSE',
    async (status) => {
      const fetcher = vi
        .fn()
        .mockResolvedValueOnce(response({ id: 'chat-1' }))
        .mockResolvedValueOnce(response(state('queued')))
        .mockResolvedValueOnce(stream([state('running', ''), state(status)], ': heartbeat\n\n'));
      vi.stubGlobal('fetch', fetcher);
      const events = await collect(new AgiChatProvider());
      expect(events[0]).toEqual({ type: 'accepted', conversationId: 'chat-1', runId: 'run-1' });
      expect(events[1]).toEqual({ type: 'status', status: 'running' });
      expect(events.at(-1)?.type).toBe(
        status === 'completed' ? 'message' : status === 'failed' ? 'error' : 'cancelled',
      );
      const submission = JSON.parse(fetcher.mock.calls[1]?.[1].body as string) as Record<
        string,
        unknown
      >;
      expect(Object.keys(submission).sort()).toEqual(['cloud_allowed', 'message', 'request_id']);
    },
  );
  it('retries an uncertain submission with the same request id', async () => {
    const fetcher = vi
      .fn()
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(response(state('queued')))
      .mockResolvedValueOnce(stream([state()]));
    vi.stubGlobal('fetch', fetcher);
    await collect(new AgiChatProvider(), { conversationId: 'chat-1', mode: 'enterprise' });
    expect(fetcher.mock.calls[0]?.[1].body).toBe(fetcher.mock.calls[1]?.[1].body);
  });
  it.each(['completed', 'failed', 'cancelled'])(
    'restores an existing run and uses %s status fallback',
    async (status) => {
      const fetcher = vi
        .fn()
        .mockResolvedValueOnce(stream([]))
        .mockResolvedValueOnce(response(state(status, '')));
      vi.stubGlobal('fetch', fetcher);
      const events = await collect(new AgiChatProvider(), {
        conversationId: 'chat-1',
        runId: 'run-1',
      });
      expect(events.at(-1)?.type).toBe(
        status === 'completed' ? 'message' : status === 'failed' ? 'error' : 'cancelled',
      );
      expect(fetcher.mock.calls.every((call) => call[1]?.method !== 'POST')).toBe(true);
    },
  );
  it('reconnects using the last cursor without submitting another run', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(stream([state('running', '')]))
      .mockResolvedValueOnce(response(state('running', '')))
      .mockResolvedValueOnce(stream([state()]));
    vi.stubGlobal('fetch', fetcher);
    await collect(new AgiChatProvider(), { conversationId: 'chat-1', runId: 'run-1' });
    expect(fetcher.mock.calls[2]?.[0]).toContain('after=1');
  });
  it.each([
    new Response('', { status: 503 }),
    new Response(null),
    stream([{ ...state(), id: 'other' }]),
    stream([{ ...state(), conversation_id: 'other' }]),
    stream([{ ...state(), status: 'forged' }]),
    new Response('data: ' + 'a'.repeat(100001)),
    new Response('data: invalid\n\n'),
  ])('falls back safely for an invalid stream', async (bad) => {
    const fetcher = vi.fn().mockResolvedValueOnce(bad).mockResolvedValueOnce(response(state()));
    vi.stubGlobal('fetch', fetcher);
    expect(
      (await collect(new AgiChatProvider(), { conversationId: 'chat-1', runId: 'run-1' })).at(-1)
        ?.type,
    ).toBe('message');
  });
  it('does not replay endlessly after repeated connection failures', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((path: string) =>
        Promise.resolve(
          path.includes('events')
            ? new Response('', { status: 503 })
            : response(state('running', '')),
        ),
      ),
    );
    await expect(
      collect(new AgiChatProvider(), { conversationId: 'chat-1', runId: 'run-1' }),
    ).rejects.toThrow('Connection lost');
  });
  it('delivers cancellation to server before accepting another submission', async () => {
    const controller = new AbortController();
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(response(state('queued')))
      .mockImplementationOnce(async () => {
        controller.abort();
        throw new DOMException('aborted', 'AbortError');
      })
      .mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetcher);
    await expect(
      collect(new AgiChatProvider(), { conversationId: 'chat-1', signal: controller.signal }),
    ).rejects.toThrow();
    await Promise.resolve();
    await Promise.resolve();
    expect(fetcher.mock.calls.some((call) => String(call[0]).includes('/cancel'))).toBe(true);
  });
  it('rejects missing message, missing restored conversation, and pre-aborted requests', async () => {
    vi.stubGlobal('fetch', vi.fn());
    await expect(
      collect(new AgiChatProvider(), { conversationId: 'chat-1', messages: [] }),
    ).rejects.toThrow('Missing message');
    await expect(collect(new AgiChatProvider(), { runId: 'run-1' })).rejects.toThrow(
      'Missing conversation',
    );
    const controller = new AbortController();
    controller.abort();
    await expect(collect(new AgiChatProvider(), { signal: controller.signal })).rejects.toThrow();
  });
});

describe('conversation repository and response contracts', () => {
  it('restores both modes, all message states and deletes an owned conversation', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          response([
            { id: 'c', title: '제목', mode: 'general' },
            { id: 'e', title: '기업', mode: 'enterprise' },
          ]),
        )
        .mockResolvedValueOnce(
          response(
            ['complete', 'streaming', 'cancelled', 'error'].map((status, i) => ({
              id: String(i),
              role: i ? 'assistant' : 'user',
              content: '본문',
              status,
              ...(i ? { run_id: 'r' } : {}),
            })),
          ),
        )
        .mockResolvedValueOnce(new Response(null, { status: 204 })),
    );
    const repository = new HttpConversationRepository();
    expect(await repository.list()).toHaveLength(2);
    expect(await repository.messages('c')).toHaveLength(4);
    await repository.remove('c');
  });
  it.each([
    null,
    'text',
    {},
    [{ id: 'c', mode: 'bad', title: 't' }],
    [{ id: 1, mode: 'general', title: 't' }],
  ])('rejects malformed conversation lists', async (value) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(value)));
    await expect(new HttpConversationRepository().list()).rejects.toThrow();
  });
  it.each([
    {},
    [{ role: 'system' }],
    [{ role: 'user', status: 'forged' }],
    [{ role: 'user', status: 'complete', id: 'i', content: 12 }],
  ])('rejects malformed message lists', async (value) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(value)));
    await expect(new HttpConversationRepository().messages('c')).rejects.toThrow();
  });
  it('rejects primitive records, nonstrings and failed HTTP', async () => {
    for (const item of [null, [], 1]) expect(() => record(item)).toThrow();
    expect(() => string(null)).toThrow();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({}, 401)));
    await expect(api('session')).rejects.toThrow('API_401');
  });
});
