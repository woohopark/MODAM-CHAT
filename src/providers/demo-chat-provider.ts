import type { ChatProvider, ChatRequest } from '../application/chat-provider';

export function demoResponse(prompt: string): string {
  let text: string;
  if (/아이디어|프로젝트/.test(prompt))
    text =
      '좋아요. 아이디어를 구체화하려면 세 가지부터 정리해 보세요.\n\n1. 누구를 위한 프로젝트인가요?\n2. 그 사람이 지금 겪는 어려움은 무엇인가요?\n3. 가장 먼저 만들 수 있는 작은 기능은 무엇인가요?\n\n떠오르는 생각을 편하게 적어 주세요. 함께 정리할 수 있어요.';
  else if (/글|문장|다듬/.test(prompt))
    text =
      '다듬고 싶은 글을 입력해 주세요.\n\n누가 읽는 글인지, 어떤 느낌으로 전달하고 싶은지도 알려주면 좋습니다. 담백한 설명, 친근한 말투, 격식 있는 문장처럼 원하는 방향을 골라 주세요.';
  else if (/코드|코딩|개발/.test(prompt))
    text =
      '함께 살펴볼 코드와 오류 메시지를 보내 주세요.\n\n사용하는 언어, 기대한 결과, 실제로 나온 결과를 함께 적으면 문제를 좁히는 데 도움이 됩니다. 비밀번호와 API 키 등 민감한 정보는 제외해 주세요.';
  else if (/개념|이해|설명/.test(prompt))
    text =
      '이해하고 싶은 개념을 알려 주세요.\n\n익숙한 예시 → 핵심 원리 → 직접 해 보는 작은 연습 순서로 접근하면 복잡한 내용도 훨씬 명확해집니다. 어느 부분이 어렵게 느껴지는지도 함께 적어 주세요.';
  else
    text =
      '메시지를 받았어요.\n\n지금은 채팅 화면의 흐름을 확인하는 데모 모드입니다. 실제 AI에 연결되면 이 위치에 입력한 내용에 대한 응답이 표시됩니다.\n\n이어서 메시지를 보내거나, 새 대화를 시작해 보세요.';
  return text;
}

function wait(milliseconds: number, signal: AbortSignal): Promise<void> {
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const onAbort = (): void => {
      clearTimeout(timer);
      reject(new DOMException('Cancelled', 'AbortError'));
    };
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, milliseconds);
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

export class DemoChatProvider implements ChatProvider {
  constructor(private readonly delayMs = 22) {}

  async *stream({ messages, signal }: ChatRequest): AsyncIterable<string> {
    signal.throwIfAborted();
    const prompt = messages.at(-1)?.content;
    if (!prompt) throw new Error('At least one message is required');
    const chunks = demoResponse(prompt).match(/.{1,3}|\n/g) ?? [];
    for (const chunk of chunks) {
      await wait(this.delayMs, signal);
      signal.throwIfAborted();
      yield chunk;
    }
  }
}
