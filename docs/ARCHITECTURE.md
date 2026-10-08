# 코드 구조와 책임

```text
src/domain        ChatStore·입력 제약·로컬 화면 스냅샷
src/application   ChatService·ChatProvider·ConversationRepository 포트
src/providers     AGI HTTP/SSE 제공자·서버 대화 repository·명시적 데모
src/ui            DOM·입력·테마·제품 로그인
src/main.ts       생성자 주입·운영/데모 조립
server/           Fastify BFF·opaque cookie·origin·private AGI proxy
```

domain은 DOM/HTTP를 모르고 application은 구체 제공자/DB를 모른다. repository는 소유 대화 복원/삭제, provider는 신규 실행·재구독·명시적 취소를 담당한다. 문자열 데모와 typed ProviderEvent를 같은 포트로 지원하며 신규 AGI 응답은 최종 JSON 검증 후 텍스트 한 번을 반영한다.

ChatStore의 화면 id와 serverId를 분리하여 첫 생성 응답이 도착할 때 서버 ID를 결합한다. ChatService는 AbortController identity로 늦은 이전 이벤트가 새 요청의 busy/답변을 변경하지 못하게 한다. 비동기 history loading도 selection version으로 늦은 응답을 무시한다. 진행 중 run은 복원 시 신규 전송 없이 구독을 재개한다.

브라우저→BFF는 동일 origin opaque 쿠키, BFF→AGI는 private Bearer HTTP. AGI가 신원·정책·canonical history·PostgreSQL job/event를 소유하며 별도 워커가 Groq를 호출한다. 상세 계약은 [AGI 연동](AGI_INTEGRATION.md). SSE 연결 단절과 명시적 취소를 구분한다.

사용자/모델 텍스트는 textContent로만 표시한다. 세션/키는 프론트 상태나 로그에 저장하지 않는다. 다크 모드/CSS/한국어 IME 규칙은 기존 UI 경계를 유지한다. SOLID·SRP·OCP·DIP·ISP는 [코드 규칙](CODE_CONVENTIONS.md)을 따른다.
