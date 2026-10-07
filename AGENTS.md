# Repository instructions

작업 시작 시 README와 관련 docs를 읽습니다. 기능 수정은 `.skills/feature-development/SKILL.md`를 적용합니다.

- 사용자 요구를 우선하고 미요청 기능/패키지를 추가하지 않습니다.
- src/index.html/public을 수정하며 dist는 생성물입니다.
- npm/lockfile을 유지하고 설치는 npm ci, 의존성 변경은 정확한 버전을 저장합니다.
- SOLID는 docs/ARCHITECTURE.md, 코드는 docs/CODE_CONVENTIONS.md를 따릅니다.
- 기능 변경은 관련 테스트와 Markdown을 함께 갱신합니다.
- 최종 검사는 npm run check입니다. 실제 검사와 미수행 브라우저 확인을 구분합니다.
- AGI는 ChatProvider로 연결하고 프론트에 비밀 키를 넣지 않습니다.
- 사용자/모델 텍스트를 HTML로 해석하지 않습니다.
- 커밋/PR은 CONTRIBUTING.md를 따릅니다. 외부 배포는 현재 사용자 요청과 호스팅 지침에 따라 처리합니다.
