# 개발 참여 규칙

Node 24/npm을 사용하며 최초 설치는 npm ci입니다. 편집기 확장은 선택 사항이고 저장소 명령과 CI가 기준입니다.

## 브랜치·커밋

브랜치는 feat/fix/refactor/docs 접두사와 주제를 사용하고 커밋은 Conventional Commits를 따릅니다.

```text
feat(chat): add response provider adapter
fix(chat): ignore late chunks after cancellation
refactor(ui): separate rendering from events
docs: describe AGI contract
```

호환성 변경은 !와 설명을 추가합니다. 자동 커밋 강제 도구는 없으며 리뷰로 확인합니다.

## PR·완료 기준

작은 목적 단위로 변경하고 .github/pull_request_template.md에 문제/동작/검증/영향을 적습니다. main 보호·최소 1인 리뷰·필수 검사는 팀 GitHub 저장소에서 따로 활성화합니다. 설정 파일만으로 서버 정책이 활성화되지는 않습니다.

- npm run check 통과
- 관련 성공/실패/취소 테스트
- 계약/패키지/기능 문서 갱신
- 수행한 브라우저 확인과 미수행 항목 구분
- 비밀 값·생성물·불필요 의존성 제외

실제 배포 권한과 파이프라인은 Sites 및 팀 저장소 정책에 따라 관리합니다.
