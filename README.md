# Orbit chat frontend

ChatGPT의 대화 중심 UI/UX를 참고한 한국어 정적 프론트엔드입니다. 실제 AI, 인증, 서버 저장은 연결되어 있지 않습니다. 대화는 탭 메모리에만 유지되며 새로고침하면 초기화됩니다.

## Run

```sh
python3 -m http.server 3000 --directory dist
```

## AGI integration

`dist/chat-client.js`의 `streamChat({ messages, signal })` 비동기 제너레이터를 실제 API 클라이언트로 교체하세요. `messages`는 `{role, content}` 배열입니다. 텍스트 청크를 `yield`하고 `AbortSignal`을 준수하면 현재 UI의 스트리밍 표시 및 중단 버튼을 그대로 사용할 수 있습니다. 프론트엔드에 API 키를 넣지 말고 서버 프록시에서 관리하세요. 실제 서버 저장과 로그인은 별도 연동이 필요합니다.

## UI

새 대화 / 대화 전환 / 한국어 IME 지원 / Shift+Enter 줄바꿈 / 응답 중단 / 복사 / 테마 전환 / 반응형 사이드바.
