# 기능·검증 매핑

현재 요구사항은 [PRD 2.0](../prd.md)이 기준이다.

| 기능 / PRD                                       | 구현                                   | 자동 검사                              |
| ------------------------------------------------ | -------------------------------------- | -------------------------------------- |
| 환영·입력·추천·복사·다크·사이드바 FR-01/05/10~12 | ui                                     | chat-ui·input-policy                   |
| 새 대화·전환·응답 중단 FR-02/03/07/08            | domain/application                     | chat-store·chat-service                |
| Unicode 4,000자 FR-04                            | domain / AGI Submission                | chat-store·remote-chat-service·AGI API |
| 실제 응답·SSE·재구독·상태 fallback FR-06/09      | AgiChatProvider                        | agi-provider                           |
| 서버 복원·삭제 FR-03/13/15                       | HttpConversationRepository·ChatService | agi-provider·remote-chat-service       |
| 로그인·세션·origin FR-14                         | SessionController·BFF·AGI              | bff·AGI API + Chromium 실통신          |
| 멀티턴·서버 canonical history FR-16              | AGI worker·Groq                        | AGI worker + 실제 3턴 Groq             |
| 재시작·lease NFR-09                              | PG job + worker                        | AGI worker + Docker 프로세스 재시작    |

일반 대화와 기업 조회를 구분한다. 기업 도구가 없으면 미연결 상태다. 첨부/음성/Markdown HTML/실제 MCP/ERP는 미구현이다. 대화는 서버 보관, 테마는 탭 메모리다. 자동·실브라우저·외부 배포 결과는 [검증 기록](VALIDATION.md)에서 구분한다.
