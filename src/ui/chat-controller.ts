import type { ChatService } from '../application/chat-service';
import type { ChatView } from './chat-view';
import { element } from './dom';
import { shouldSubmit } from './input-policy';

/** Binds browser events; dispose releases listeners and pending work. */
export class ChatController {
  private readonly events = new AbortController();
  private composing = false;
  private unsubscribe: (() => void) | undefined;

  constructor(
    private readonly service: ChatService,
    private readonly view: ChatView,
  ) {}

  mount(): void {
    if (this.unsubscribe) return;
    const options = { signal: this.events.signal };
    this.unsubscribe = this.service.subscribe(() => this.render());
    element('composer', HTMLFormElement).addEventListener(
      'submit',
      (event) => {
        event.preventDefault();
        if (this.service.isBusy) this.service.stop();
        else void this.send();
      },
      options,
    );
    this.view.prompt.addEventListener(
      'input',
      () => this.view.resize(this.service.isBusy),
      options,
    );
    this.view.prompt.addEventListener(
      'compositionstart',
      () => {
        this.composing = true;
      },
      options,
    );
    this.view.prompt.addEventListener(
      'compositionend',
      () => {
        this.composing = false;
      },
      options,
    );
    this.view.prompt.addEventListener(
      'keydown',
      (event) => {
        if (shouldSubmit(event, this.composing)) {
          event.preventDefault();
          if (!this.service.isBusy) void this.send();
        }
      },
      options,
    );
    element('new-chat', HTMLButtonElement).addEventListener('click', () => this.newChat(), options);
    document.querySelectorAll<HTMLButtonElement>('[data-prompt]').forEach((button) => {
      button.addEventListener(
        'click',
        () => {
          this.view.prompt.value = button.dataset.prompt ?? '';
          this.view.resize(this.service.isBusy);
          this.view.prompt.focus();
        },
        options,
      );
    });
    element('close-sidebar', HTMLButtonElement).addEventListener(
      'click',
      () => {
        if (matchMedia('(max-width:700px)').matches) this.closeSidebar();
        else document.body.classList.add('collapsed');
      },
      options,
    );
    element('open-sidebar', HTMLButtonElement).addEventListener(
      'click',
      () => {
        if (matchMedia('(max-width:700px)').matches) document.body.classList.add('sidebar-open');
        else document.body.classList.remove('collapsed');
      },
      options,
    );
    element('overlay', HTMLElement).addEventListener('click', () => this.closeSidebar(), options);
    document.addEventListener(
      'keydown',
      (event) => {
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
          event.preventDefault();
          this.newChat();
        }
        if (event.key === 'Escape') this.closeSidebar();
      },
      options,
    );
    element('theme-toggle', HTMLButtonElement).addEventListener(
      'click',
      () => {
        const dark = document.body.classList.toggle('dark');
        element('theme-toggle', HTMLButtonElement).setAttribute(
          'aria-label',
          dark ? '밝은 화면으로 변경' : '어두운 화면으로 변경',
        );
      },
      options,
    );
    this.render();
  }

  dispose(): void {
    this.unsubscribe?.();
    this.events.abort();
    this.service.stop();
    this.view.dispose();
  }

  private render(): void {
    this.view.render(this.service.store.snapshot(), this.service.isBusy, (id) => {
      this.service.selectChat(id);
      this.closeSidebar();
      this.view.scrollToBottom();
    });
  }

  private closeSidebar(): void {
    document.body.classList.remove('sidebar-open');
  }

  private newChat(): void {
    this.service.newChat();
    this.view.prompt.value = '';
    this.view.resize(false);
    this.closeSidebar();
    this.view.prompt.focus();
  }

  private async send(): Promise<void> {
    const input = this.view.prompt.value;
    if (!input.trim()) return;
    this.view.prompt.value = '';
    this.view.resize(false);
    try {
      await this.service.send(input);
    } catch {
      this.view.prompt.value = input;
      this.view.resize(false);
      this.view.toast('메시지는 12,000자 이내로 입력해 주세요.');
    }
  }
}
