import type { ChatService } from '../application/chat-service';
import type { ChatView } from './chat-view';
import { api } from '../providers/http-client';
import { element } from './dom';

/** Product authentication is independent of Sites access controls. */
export class SessionController {
  private readonly events = new AbortController();
  private readonly dialog = element('login-dialog', HTMLDialogElement);
  constructor(
    private readonly service: ChatService,
    private readonly view: ChatView,
  ) {}
  async mount(): Promise<void> {
    const options = { signal: this.events.signal };
    this.dialog.addEventListener('cancel', (event) => event.preventDefault(), options);
    element('login-form', HTMLFormElement).addEventListener(
      'submit',
      (event) => {
        event.preventDefault();
        void this.login();
      },
      options,
    );
    document.querySelector('.mode-pill')?.replaceChildren(
      Object.assign(document.createElement('select'), {
        id: 'conversation-mode',
        ariaLabel: '새 대화 모드',
      }),
    );
    const mode = element('conversation-mode', HTMLSelectElement);
    for (const [value, text] of [
      ['general', '일반 대화'],
      ['enterprise', '기업 자료 조회'],
    ]) {
      const option = document.createElement('option');
      option.value = value ?? '';
      option.textContent = text ?? '';
      mode.append(option);
    }
    mode.addEventListener(
      'change',
      () => {
        this.service.newChat();
        this.service.mode = mode.value === 'enterprise' ? 'enterprise' : 'general';
        this.view.prompt.placeholder =
          this.service.mode === 'enterprise'
            ? '조회할 자료 범위와 질문을 입력하세요'
            : '무엇이든 물어보세요';
      },
      options,
    );
    const buttons = document.querySelector('.side-bottom');
    for (const [label, action] of [
      [
        '현재 대화 삭제',
        async () => {
          await this.service.removeCurrent();
        },
      ],
      [
        '로그아웃',
        async () => {
          this.service.stop();
          await api('auth/logout', { method: 'POST' });
          this.service.store.replace([]);
          this.service.newChat();
          this.dialog.showModal();
        },
      ],
    ] as const) {
      const button = document.createElement('button');
      button.textContent = label;
      button.className = 'new-chat';
      button.addEventListener(
        'click',
        () => {
          void action().catch(() =>
            this.view.toast('요청을 완료하지 못했습니다. 잠시 후 다시 시도해 주세요.'),
          );
        },
        options,
      );
      buttons?.append(button);
    }
    document
      .querySelector('.demo-note')
      ?.replaceChildren(document.createTextNode('MODAM AGI · Groq 연결'));
    document
      .querySelector('.disclaimer')
      ?.replaceChildren(
        document.createTextNode(
          'AI 답변은 부정확할 수 있습니다. 대화는 계정별 30일 보관됩니다. 기업 조회는 별도 권한과 도구 연결이 필요합니다.',
        ),
      );
    try {
      await api('session');
      await this.service.restore();
    } catch {
      this.dialog.showModal();
    }
  }
  private async login(): Promise<void> {
    const error = element('login-error', HTMLElement);
    error.textContent = '';
    try {
      await api('auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username: element('username', HTMLInputElement).value,
          password: element('password', HTMLInputElement).value,
        }),
      });
      element('password', HTMLInputElement).value = '';
      await this.service.restore();
      this.dialog.close();
    } catch {
      error.textContent =
        '로그인 또는 서버 연결에 실패했습니다. 입력 정보와 서버 상태를 확인해 주세요.';
    }
  }
  dispose(): void {
    this.events.abort();
  }
}
