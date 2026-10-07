# Repository agent instructions

## 진입 및 문서 우선순위

사용자 지시를 우선합니다. 시작 시 [prd.md](prd.md), [Agent.md](Agent.md), [skill.md](skill.md), README와 작업 관련 docs를 읽습니다. 저장소 작업은 [.skills/feature-development/SKILL.md](.skills/feature-development/SKILL.md)를 적용합니다.

요구사항은 prd.md가 기준이고 Agent.md는 역할/보고, skill.md는 절차 안내입니다. 구현 규칙은 docs/CODE_CONVENTIONS.md와 docs/ARCHITECTURE.md를 참조합니다. 문서가 충돌하면 사용자 요구와 실제 소스 상태를 확인해 함께 갱신합니다.

## 범위와 책임

- 사용자 요구에 없는 기능/패키지/데이터 저장을 추가하지 않습니다.
- domain은 상태/모델, application은 유스케이스, providers는 응답 출처, ui는 화면/이벤트를 담당합니다.
- AGI는 ChatProvider 구현과 main.ts 조립으로 연결합니다. API 계약 미확정 상태에서 가짜 연동을 완성으로 보고하지 않습니다.
- src/, 루트 index.html, public/이 소스입니다. dist/는 생성물이므로 직접 수정하거나 커밋하지 않습니다.

## 환경·품질

- Node 24.15 이상 24.x, npm, package-lock.json을 유지합니다. 설치는 npm ci입니다.
- 패키지 변경은 정확한 버전과 lockfile을 함께 갱신하고 이유/호환성을 검토합니다.
- 사용자/모델 텍스트를 HTML로 해석하지 않습니다. 비밀 키·토큰·대화 원문을 Git/로그에 남기지 않습니다.
- 기능 변경은 관련 정상/오류/취소/경쟁 테스트와 npm run check를 수행합니다.
- 문서 전용 변경은 npm run format:check, 링크와 요구사항 정합성을 확인합니다. 이전 코드 검사 기록과 이번 검사를 구분합니다.
- 실제 브라우저/IME/접근성 미검증을 테스트 통과로 포장하지 않습니다.

## 문서·배포·보고

관련 PRD FR/NFR ID와 기능/테스트/문서를 연결합니다. 커밋/PR은 CONTRIBUTING.md, 배포 환경은 docs/DEPLOYMENT.md를 따릅니다. 접근 대상 변경·삭제·외부 동작은 현재 사용자 지시와 실행 환경 권한을 따릅니다.

최종 보고에는 변경 내용, 문서 위치, 수행 검사, 남은 제한, 요청된 서비스 URL을 포함합니다. 배포 URL은 성공한 호스팅 결과에서 확인합니다. 문서만 바뀌고 서비스가 그대로라면 새 배포가 있었다고 보고하지 않습니다.
