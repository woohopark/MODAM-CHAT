# 테스트 가이드

```sh
npm test
npm run test:watch
npm run test:coverage
npm run check
```

Vitest/jsdom을 사용합니다. 커버리지는 domain/application/providers/input-policy를 대상으로 statements/functions/lines 85%, branches 80% 기준입니다. DOM 전체·실브라우저 E2E 커버리지를 의미하지 않습니다. `coverage/`의 HTML/LCOV 보고서는 Git에서 제외합니다.

| 테스트 파일                | 보호 동작                                                 |
| -------------------------- | --------------------------------------------------------- |
| chat-store.test.ts         | 입력 제약, 순서, 대화 복원, 스냅샷 격리                   |
| chat-service.test.ts       | 청크, 문맥, 중복, 오류, 빈 응답, 취소 후 새 요청 경쟁     |
| demo-chat-provider.test.ts | 문장 분기, 줄바꿈, 취소/타이머 정리                       |
| input-policy.test.ts       | Enter·Shift+Enter·IME·keyCode 229                         |
| chat-ui.test.ts            | 전송·안전한 텍스트·전환·복사·테마·모바일 토글·이벤트 해제 |

모두 `tests/`에 실행 가능한 코드가 있습니다.

## 작성 원칙과 예

Arrange–Act–Assert로 관찰 가능한 동작을 검증합니다. private 메서드·코드 모양·전체 DOM 스냅샷을 그대로 검증하지 않습니다. 제공자는 계약 대역을 사용하며 실제 네트워크/모델/키가 필요하지 않습니다. 시간은 fake timer, 경쟁 상태는 deferred Promise로 제어합니다. 임의 sleep을 넣지 않습니다.

```ts
const service = new ChatService(new ChatStore(), {
  async *stream() {
    yield '안';
    yield '녕';
  },
});
await service.send('질문');
expect(service.store.snapshot().chats[0]?.messages.at(-1)).toMatchObject({
  content: '안녕',
  status: 'complete',
});
```

위 코드는 테스트 패턴의 발췌입니다. 변경 계약의 정상·경계·오류·취소 중 관련 경로를 확인하고 스타일 숫자에 맞춘 테스트는 피합니다.

## 수동 범위

화면 변경 시 데스크톱/모바일, 200% 확대, 키보드 포커스, 실제 한글 IME, 대비, 긴 메시지를 브라우저에서 확인합니다. jsdom은 CSS 레이아웃을 계산하지 않습니다. Playwright E2E, 자동 접근성 검사, 부하/성능 테스트는 현재 미포함입니다. CI 통과를 이 검증의 완료로 보고하지 않습니다.

AGI 연결 시 스트림 파싱, 단절, 시간 제한, HTTP 오류, 서버 취소 전달 계약 테스트를 추가합니다.
