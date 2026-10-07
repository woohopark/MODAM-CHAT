import { describe, expect, it, vi, afterEach } from 'vitest';
import { DemoChatProvider, demoResponse } from '../src/providers/demo-chat-provider';

afterEach(() => vi.useRealTimers());

describe('DemoChatProvider', () => {
  it.each([
    ['프로젝트 아이디어', '프로젝트인가요'],
    ['글 다듬기', '다듬고 싶은 글'],
    ['코딩', '코드와 오류'],
    ['개념 설명', '이해하고 싶은 개념'],
    ['안녕', '데모 모드'],
  ])('selects an appropriate demo response for %s', (prompt, expected) => {
    expect(demoResponse(prompt)).toContain(expected);
  });

  it('reconstructs the full response including line breaks', async () => {
    vi.useFakeTimers();
    const provider = new DemoChatProvider(1);
    const result = (async () => {
      let response = '';
      for await (const chunk of provider.stream({
        messages: [{ role: 'user', content: '안녕' }],
        signal: new AbortController().signal,
      }))
        response += chunk;
      return response;
    })();
    await vi.runAllTimersAsync();
    expect(await result).toBe(demoResponse('안녕'));
  });

  it('rejects empty histories and pre-aborted requests', async () => {
    const provider = new DemoChatProvider();
    await expect(
      provider
        .stream({ messages: [], signal: new AbortController().signal })
        [Symbol.asyncIterator]()
        .next(),
    ).rejects.toThrow('At least one');
    const controller = new AbortController();
    controller.abort();
    await expect(
      provider.stream({ messages: [], signal: controller.signal })[Symbol.asyncIterator]().next(),
    ).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('cancels a pending delay immediately', async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    const iterator = new DemoChatProvider(10000)
      .stream({ messages: [{ role: 'user', content: '안녕' }], signal: controller.signal })
      [Symbol.asyncIterator]();
    const rejection = expect(iterator.next()).rejects.toMatchObject({ name: 'AbortError' });
    controller.abort();
    await rejection;
    expect(vi.getTimerCount()).toBe(0);
  });
});
