import { describe, expect, it } from 'vitest';
import { ChatService } from '../src/application/chat-service';
import type { ChatProvider, ChatRequest } from '../src/application/chat-provider';
import { ChatStore } from '../src/domain/chat-store';

function deferred() {
  let resolve: () => void = () => undefined;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe('ChatService', () => {
  it('assembles streamed chunks and only sends completed conversation history', async () => {
    const requests: ChatRequest[] = [];
    const provider: ChatProvider = {
      async *stream(request) {
        requests.push(request);
        yield '안';
        yield '녕';
      },
    };
    const service = new ChatService(new ChatStore(), provider);
    await service.send('첫 질문');
    await service.send('두 번째 질문');
    expect(requests[1]?.messages.map((message) => message.content)).toEqual([
      '첫 질문',
      '안녕',
      '두 번째 질문',
    ]);
    expect(service.store.snapshot().chats[0]?.messages.at(-1)).toMatchObject({
      content: '안녕',
      status: 'complete',
    });
    expect(service.isBusy).toBe(false);
  });

  it('ignores empty input and duplicate sends while busy', async () => {
    const gate = deferred();
    const provider: ChatProvider = {
      async *stream() {
        await gate.promise;
        yield '응답';
      },
    };
    const service = new ChatService(new ChatStore(), provider);
    await service.send('  ');
    expect(service.store.snapshot().chats).toHaveLength(0);
    const pending = service.send('질문');
    await service.send('중복');
    expect(service.store.snapshot().chats[0]?.messages).toHaveLength(2);
    gate.resolve();
    await pending;
  });

  it('does not let a cancelled request append a late chunk or clear a newer request', async () => {
    const first = deferred(),
      second = deferred();
    let calls = 0;
    const provider: ChatProvider = {
      async *stream() {
        const gate = calls++ === 0 ? first : second;
        await gate.promise;
        yield 'late';
      },
    };
    const service = new ChatService(new ChatStore(), provider);
    const oldRequest = service.send('이전 질문');
    service.stop();
    const newRequest = service.send('새 질문');
    first.resolve();
    await oldRequest;
    expect(service.isBusy).toBe(true);
    expect(service.store.snapshot().chats[0]?.messages[1]).toMatchObject({
      status: 'cancelled',
      content: '응답 생성을 중단했어요.',
    });
    second.resolve();
    await newRequest;
    expect(service.isBusy).toBe(false);
  });

  it('keeps partial text on cancellation and excludes it from subsequent provider context', async () => {
    const gate = deferred();
    const requests: ChatRequest[] = [];
    const provider: ChatProvider = {
      async *stream(request) {
        requests.push(request);
        yield '부분';
        await gate.promise;
      },
    };
    const service = new ChatService(new ChatStore(), provider);
    const pending = service.send('질문');
    await Promise.resolve();
    await Promise.resolve();
    service.stop();
    gate.resolve();
    await pending;
    expect(service.store.snapshot().chats[0]?.messages[1]).toMatchObject({
      content: '부분',
      status: 'cancelled',
    });
    await service.send('다음');
    expect(requests[1]?.messages.map((message) => message.content)).toEqual(['질문', '다음']);
  });

  it('reports provider errors and empty responses without leaking error details', async () => {
    for (const failure of [true, false]) {
      const provider: ChatProvider = {
        async *stream() {
          if (failure) throw new Error('SECRET_INTERNAL_ERROR');
          yield '';
        },
      };
      const service = new ChatService(new ChatStore(), provider);
      await service.send('질문');
      const answer = service.store.snapshot().chats[0]?.messages.at(-1);
      expect(answer?.status).toBe('error');
      expect(answer?.content).not.toContain('SECRET_INTERNAL_ERROR');
      expect(service.isBusy).toBe(false);
    }
  });

  it('notifies subscribers, supports unsubscribe, and preserves selected conversations', async () => {
    const provider: ChatProvider = {
      async *stream() {
        yield '답';
      },
    };
    const service = new ChatService(new ChatStore(), provider);
    let notifications = 0;
    const unsubscribe = service.subscribe(() => {
      notifications += 1;
    });
    await service.send('질문');
    const id = service.store.snapshot().currentId;
    if (!id) throw new Error('Missing fixture');
    service.newChat();
    service.selectChat(id);
    expect(service.store.snapshot().currentId).toBe(id);
    expect(notifications).toBeGreaterThan(0);
    unsubscribe();
    const previous = notifications;
    service.stop();
    expect(notifications).toBe(previous);
  });
});
