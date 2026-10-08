import { expect, it } from 'vitest';
import { ChatService } from '../src/application/chat-service';
import type { ChatProvider } from '../src/application/chat-provider';
import type { ConversationRepository } from '../src/application/conversation-repository';
import { ChatStore } from '../src/domain/chat-store';

const provider: ChatProvider = {
  async *stream() {
    yield { type: 'accepted', conversationId: 'server', runId: 'run' };
    yield { type: 'status', status: 'running' };
    yield { type: 'message', text: '서버 답변' };
  },
};
it('stores server metadata and sends subsequent turns to the same conversation', async () => {
  const service = new ChatService(new ChatStore(), provider);
  await service.send('질문');
  expect(service.store.snapshot().chats[0]).toMatchObject({ serverId: 'server', mode: 'general' });
  expect(service.store.snapshot().chats[0]?.messages[1]).toMatchObject({
    runId: 'run',
    content: '서버 답변',
  });
});
it.each(['error', 'cancelled'] as const)('preserves server %s outcome', async (type) => {
  const service = new ChatService(new ChatStore(), {
    async *stream() {
      yield type === 'error' ? { type, message: '도구 미연결' } : { type };
    },
  });
  await service.send('질문');
  expect(service.store.snapshot().chats[0]?.messages[1]?.status).toBe(type);
});
it('restores persisted history and removes current conversation', async () => {
  let removed = false;
  const repository: ConversationRepository = {
    async list() {
      return removed ? [] : [{ id: 's', serverId: 's', title: '저장된 대화', messages: [] }];
    },
    async messages() {
      return [{ id: 'm', role: 'assistant', content: '복원', status: 'complete' }];
    },
    async remove() {
      removed = true;
    },
  };
  const service = new ChatService(new ChatStore(), provider, repository);
  await service.restore();
  expect(service.store.snapshot().chats[0]?.messages[0]?.content).toBe('복원');
  await service.selectChat('s');
  await service.removeCurrent();
  expect(service.store.snapshot().chats).toEqual([]);
  await service.removeCurrent();
  await new ChatService(new ChatStore(), provider).restore();
  await new ChatService(new ChatStore(), provider).removeCurrent();
});
it('resumes an existing run without creating another message', async () => {
  const service = new ChatService(new ChatStore(), provider, {
    async list() {
      return [{ id: 's', serverId: 's', title: '진행 중', messages: [] }];
    },
    async messages() {
      return [{ id: 'm', role: 'assistant', runId: 'r', content: '', status: 'streaming' }];
    },
    async remove() {},
  });
  await service.restore();
  for (let i = 0; i < 10; i++) await Promise.resolve();
  expect(service.store.snapshot().chats[0]?.messages).toHaveLength(1);
  expect(service.store.snapshot().chats[0]?.messages[0]?.content).toBe('서버 답변');
});
it('ignores late history when selection changed', async () => {
  let resolve: (value: []) => void = () => undefined;
  const pending = new Promise<[]>((done) => {
    resolve = done;
  });
  const service = new ChatService(new ChatStore(), provider, {
    async list() {
      return [{ id: 's', serverId: 's', title: 't', messages: [] }];
    },
    async messages() {
      return pending;
    },
    async remove() {},
  });
  const restoring = service.restore();
  await Promise.resolve();
  await Promise.resolve();
  service.newChat();
  resolve([]);
  await restoring;
  expect(service.store.snapshot().currentId).toBeNull();
});
it('counts Unicode code points rather than UTF-16 units', () => {
  expect(() => new ChatStore().beginReply('😀'.repeat(4000))).not.toThrow();
  expect(() => new ChatStore().beginReply('😀'.repeat(4001))).toThrow();
});

it('does not send a new request while canonical history is loading', async () => {
  let release: (value: []) => void = () => undefined;
  const waiting = new Promise<[]>((resolve) => {
    release = resolve;
  });
  const service = new ChatService(new ChatStore(), provider, {
    async list() {
      return [{ id: 's', serverId: 's', title: 't', messages: [] }];
    },
    async messages() {
      return waiting;
    },
    async remove() {},
  });
  const restore = service.restore();
  await Promise.resolve();
  await Promise.resolve();
  expect(service.isBusy).toBe(true);
  await service.send('loading race');
  expect(service.store.snapshot().chats[0]?.messages).toHaveLength(0);
  release([]);
  await restore;
  expect(service.isBusy).toBe(false);
});
