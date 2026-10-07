import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatController } from '../src/ui/chat-controller';
import { ChatView } from '../src/ui/chat-view';
import { ChatService } from '../src/application/chat-service';
import { ChatStore } from '../src/domain/chat-store';
import type { ChatProvider } from '../src/application/chat-provider';

let controller: ChatController;
let service: ChatService;
const fixture = readFileSync('index.html', 'utf8');

beforeEach(() => {
  const html = new DOMParser().parseFromString(fixture, 'text/html');
  document.body.innerHTML = html.body.innerHTML;
  document.body.className = '';
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: true })),
  );
  const provider: ChatProvider = {
    async *stream() {
      yield '<script>alert(1)</script>';
    },
  };
  service = new ChatService(new ChatStore(), provider);
  controller = new ChatController(service, new ChatView());
  controller.mount();
});

afterEach(() => {
  controller.dispose();
  vi.unstubAllGlobals();
});

function prompt(): HTMLTextAreaElement {
  const target = document.getElementById('prompt');
  if (!(target instanceof HTMLTextAreaElement)) throw new Error('Missing fixture');
  return target;
}

describe('chat UI integration', () => {
  it('uses unique IDs and enables only the real send button for nonblank input', () => {
    const ids = [...document.querySelectorAll('[id]')].map((node) => node.id);
    expect(new Set(ids).size).toBe(ids.length);
    const send = document.getElementById('send');
    expect(send).toBeInstanceOf(HTMLButtonElement);
    if (!(send instanceof HTMLButtonElement)) throw new Error('Missing fixture');
    expect(send.disabled).toBe(true);
    prompt().value = '   ';
    prompt().dispatchEvent(new Event('input'));
    expect(send.disabled).toBe(true);
    prompt().value = '질문';
    prompt().dispatchEvent(new Event('input'));
    expect(send.disabled).toBe(false);
  });

  it('sends with Enter and renders provider content as text rather than HTML', async () => {
    prompt().value = '<img src=x onerror=alert(1)>';
    prompt().dispatchEvent(new Event('input'));
    prompt().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await vi.waitFor(() => expect(service.isBusy).toBe(false));
    expect(document.querySelectorAll('.message')).toHaveLength(2);
    expect(document.querySelector('.user .message-body')?.textContent).toContain('<img');
    expect(document.querySelector('.assistant .message-body')?.textContent).toContain('<script>');
    expect(document.querySelector('.message img, .message script')).toBeNull();
    expect(prompt().value).toBe('');
  });

  it('protects composing text and Shift+Enter from premature submission', () => {
    prompt().value = '한글';
    prompt().dispatchEvent(new CompositionEvent('compositionstart'));
    prompt().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    prompt().dispatchEvent(new CompositionEvent('compositionend'));
    prompt().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true }));
    expect(service.store.snapshot().chats).toHaveLength(0);
  });

  it('selects suggestions, toggles theme and opens/closes the mobile sidebar', () => {
    document.querySelector<HTMLButtonElement>('[data-prompt]')?.click();
    expect(prompt().value).not.toBe('');
    document.getElementById('theme-toggle')?.click();
    expect(document.body.classList.contains('dark')).toBe(true);
    document.getElementById('open-sidebar')?.click();
    expect(document.body.classList.contains('sidebar-open')).toBe(true);
    document.getElementById('overlay')?.click();
    expect(document.body.classList.contains('sidebar-open')).toBe(false);
  });

  it('starts a new chat and restores a prior conversation through the history button', async () => {
    await service.send('기존 대화');
    document.getElementById('new-chat')?.click();
    expect(service.store.snapshot().currentId).toBeNull();
    document.querySelector<HTMLButtonElement>('.history-item')?.click();
    expect(document.querySelectorAll('.message')).toHaveLength(2);
  });

  it('copies a response and shows clipboard failure feedback', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    await service.send('질문');
    document.querySelector<HTMLButtonElement>('.copy-button')?.click();
    await vi.waitFor(() =>
      expect(document.getElementById('toast')?.textContent).toBe('답변을 복사했어요'),
    );
    expect(writeText).toHaveBeenCalledWith('<script>alert(1)</script>');
    writeText.mockRejectedValueOnce(new Error('Denied'));
    document.querySelector<HTMLButtonElement>('.copy-button')?.click();
    await vi.waitFor(() =>
      expect(document.getElementById('toast')?.textContent).toContain('직접 선택'),
    );
  });

  it('releases event listeners when disposed', () => {
    controller.dispose();
    document.getElementById('theme-toggle')?.click();
    expect(document.body.classList.contains('dark')).toBe(false);
  });
});
