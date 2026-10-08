import type { ChatMessage, ChatSnapshot } from '../domain/chat';
import { element, icon } from './dom';

export class ChatView {
  readonly prompt = element('prompt', HTMLTextAreaElement);
  private readonly send = element('send', HTMLButtonElement);
  private readonly workspace = element('workspace', HTMLElement);
  private readonly messages = element('messages', HTMLElement);
  private readonly history = element('history', HTMLElement);
  private toastTimer: ReturnType<typeof setTimeout> | undefined;

  dispose(): void {
    clearTimeout(this.toastTimer);
  }

  toast(text: string): void {
    const target = element('toast', HTMLElement);
    target.textContent = text;
    target.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => target.classList.remove('show'), 2400);
  }

  render(snapshot: ChatSnapshot, busy: boolean, onSelect: (id: string) => void): void {
    const chat = snapshot.chats.find((item) => item.id === snapshot.currentId);
    const nearBottom =
      this.workspace.scrollHeight - this.workspace.scrollTop - this.workspace.clientHeight < 100;
    element('welcome', HTMLElement).style.display = chat ? 'none' : '';
    this.messages.style.display = chat ? 'block' : 'none';
    this.messages.replaceChildren(
      ...(chat?.messages ?? []).map((message) => this.message(message)),
    );
    this.history.replaceChildren(
      ...snapshot.chats.map((item) => {
        const button = document.createElement('button');
        button.className = `history-item${item.id === snapshot.currentId ? ' active' : ''}`;
        button.setAttribute('aria-current', item.id === snapshot.currentId ? 'true' : 'false');
        const label = document.createElement('span');
        label.textContent = item.title;
        button.append(icon('chat'), label);
        button.onclick = () => onSelect(item.id);
        return button;
      }),
    );
    element('history-empty', HTMLElement).hidden = snapshot.chats.length > 0;
    element('chat-count', HTMLElement).textContent = String(snapshot.chats.length);
    this.updateSend(busy);
    if (nearBottom) this.scrollToBottom();
  }

  scrollToBottom(): void {
    this.workspace.scrollTop = this.workspace.scrollHeight;
  }

  updateSend(busy: boolean): void {
    this.send.disabled = !busy && !this.prompt.value.trim();
    this.send.classList.toggle('busy', busy);
    this.send.setAttribute('aria-label', busy ? '응답 생성 중단' : '메시지 보내기');
  }

  resize(busy: boolean): void {
    this.prompt.style.height = 'auto';
    this.prompt.style.height = `${Math.min(this.prompt.scrollHeight, 170)}px`;
    this.updateSend(busy);
  }

  private message(message: ChatMessage): HTMLElement {
    const row = document.createElement('div');
    row.className = `message ${message.role}`;
    const body = document.createElement('div');
    body.className = 'message-body';
    // User and provider text must never be interpreted as HTML.
    body.textContent = message.content;
    if (message.role === 'user') {
      row.append(body);
      return row;
    }
    const mark = document.createElement('div');
    mark.className = 'assistant-mark';
    mark.append(icon('spark'));
    const content = document.createElement('div');
    content.className = 'assistant-content';
    const label = document.createElement('div');
    label.className = 'response-label';
    label.textContent =
      document.body.dataset.chatMode === 'agi' ? 'MODAM · AI 응답' : 'ORBIT · 데모 응답';
    if (!message.content && message.status === 'streaming') {
      const typing = document.createElement('div');
      typing.className = 'typing';
      typing.setAttribute('aria-label', '응답 생성 중');
      typing.append(...Array.from({ length: 3 }, () => document.createElement('i')));
      body.append(typing);
    }
    content.append(label, body);
    if (message.status !== 'streaming' && message.content) {
      const copy = document.createElement('button');
      copy.className = 'copy-button';
      copy.append(icon('copy'), '복사');
      copy.onclick = () => {
        void this.copy(message.content);
      };
      content.append(copy);
    }
    row.append(mark, content);
    return row;
  }

  private async copy(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      this.toast('답변을 복사했어요');
    } catch {
      this.toast('복사할 텍스트를 직접 선택해 주세요');
    }
  }
}
