# AGI 연결 계약

`src/application/chat-provider.ts`의 ChatProvider를 구현하고 `src/main.ts`의 DemoChatProvider 생성만 교체합니다. 서비스/뷰에 모델별 분기를 넣지 않습니다.

```ts
interface ChatProvider {
  stream(request: {
    messages: readonly { role: 'user' | 'assistant'; content: string }[];
    signal: AbortSignal;
  }): AsyncIterable<string>;
}
```

청크를 순서대로 yield하고 신호를 HTTP 요청·스트림 읽기에 전달합니다. JSON/SSE/NDJSON 검증과 파싱은 제공자 책임입니다. 실패 시 예외를 던지고 사용자 안내는 서비스에서 처리합니다. 빈 응답은 오류입니다. 재시도는 비용/멱등성을 검토하기 전 넣지 않습니다.

## 확정할 계약

요청 URL·메서드, 입력/출력 JSON, 스트리밍 형식, 인증, 시간 제한, 오류 코드, 취소 지원을 확정해야 합니다. 아직 API가 없으므로 가짜 HTTP 어댑터는 제품 코드에 넣지 않았습니다.

## 서버 경계

브라우저는 서버 프록시에 요청하고 API 키는 서버 비밀 저장소에서 관리합니다. VITE_* 값은 클라이언트 번들에 포함되므로 키를 넣으면 안 됩니다. 인증·인가·입력 검증·요청 제한은 서버에서 수행합니다.

연결 시 데모 라벨/하단 안내를 실제 모드로 바꾸고 로그/저장 범위를 명시하세요. 로그인/대화 저장은 요구와 백엔드 계약에 따라 별도로 추가합니다.
