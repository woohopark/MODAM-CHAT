# 기업 자료 조회 · FR-06/09/16

CHAT은 일반 대화와 기업 자료 조회를 구분한다. 데이터 처리 책임은 별도 서비스다.
기업 조회는 현재 사용자 권한으로 AGI가 규정 RAG·객체/경로 ONTOLOGY MCP를 호출한다.
제공된 근거만 Groq에 보내고 답변 끝에 ref/버전/시점을 표시한다. 근거를 HTML로 해석하지 않는다.

## 사용자 시나리오

기업 자료 조회 모드 선택 → 자료 범위/객체 참조가 포함된 질문 → 진행 상태 → 답변·근거.
예: `poc-warehouse 범위 inventory:B:C의 재고와 관련 규정을 확인해줘`.
poc-warehouse는 검증용 합성 자료다. 조회 grant와 원천 ACL이 있는 별도 테스트 계정만 접근한다.
정보 부족/근거 없음/권한 거절/서비스 장애는 성공으로 표시하지 않는다.
기존 일반 대화·멀티턴·취소·복원·라이트/다크·한글 조합 규칙을 유지한다.

## 현재 권한과 검증

자료·객체 권한 회수 시 대화 복원/실행 상태/SSE/중복 응답의 기존 기업 답변도 숨긴다.
단절 후 재구독은 같은 run을 사용한다. 과거 기업 답변은 새로운 근거로 재전송하지 않는다.
프론트에 RAG/MCP 키나 AGI service token을 넣지 않는다. 브라우저는 동일 origin BFF만 호출한다.

이번 npm run check는 74개 검사와 client/BFF 빌드를 통과했다.
실제 Compose/Groq 기업 조회 3턴, 문서 ACL 회수, 재시작 영속 복원,
Chromium 기업 이력/인용 reload·다크 CSS·mobile·합성 composition을 확인했다.
물리 한글 IME·전체 대비/200% 확대·동시 사용자 부하는 미검증이다.

현재 workspace 내부 주소는 http://127.0.0.1:3300이며 외부 공개 URL은 아직 없다.
전체 서비스 계약·검사·실행은 MODAM-AGI의 docs/KNOWLEDGE_INTEGRATION.md,
독립 구현은 MODAM-RAG/MODAM-ONTOLOGY의 STATUS.md와 docs/SCENARIOS.md를 따른다.
