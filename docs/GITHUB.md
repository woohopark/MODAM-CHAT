# GitHub 저장소 연결

## 대상 저장소

- 저장소: [woohopark/MODAM-CHAT](https://github.com/woohopark/MODAM-CHAT)
- Git URL: https://github.com/woohopark/MODAM-CHAT.git
- 사용자 지정 기존 저장소에 소스·테스트·패키지 설정·PRD·Agent/Skill·배포 문서를 함께 커밋/푸시합니다.
- 별도의 inqo-agi-chat 저장소는 생성하지 않습니다. 대상 저장소의 공개 여부와 기존 브랜치 정책을 유지합니다.

## 현재 확인 상태

2026-10-07 GitHub CLI 인증이 HTTP 401 Bad credentials로 실패했습니다. 새 대상 저장소의 공개 Git 조회는 성공했고 참조가 없는 빈 저장소로 확인했습니다. 쓰기 인증은 아직 확인되지 않았습니다. GitHub 플러그인은 연결이 확인되지 않았습니다. 원격 푸시는 아직 완료하지 않았습니다.

로컬 소스와 문서 커밋은 준비되어 있으며 Sites용 origin을 유지하고 GitHub 대상용 github remote를 등록했습니다. 인증/권한이 확인되기 전 강제 푸시하거나 기존 내용을 덮어쓰지 않습니다.

## 연결 후 절차

1. woohopark/MODAM-CHAT을 사용할 수 있는 계정과 쓰기 권한을 확인합니다.
2. 원격 기본 브랜치·기존 이력·저장소 지침을 확인합니다.
3. 기존 내용이 있으면 충돌과 브랜치 정책을 반영해 안전하게 통합합니다.
4. 정책상 직접 푸시가 가능하면 대상 브랜치에, 보호되어 있으면 작업 브랜치/PR로 전달합니다.
5. 원격 커밋 SHA/파일과 CI 상태를 확인하고 실제 커밋/브랜치 URL을 전달합니다.

GitHub Actions 설정은 포함되어 있지만 실제 실행/브랜치 보호는 확인되지 않았습니다. node_modules, dist, coverage, 비밀 값은 Git에 포함하지 않습니다. 코드 검사는 [VALIDATION.md](VALIDATION.md), 서비스 호스팅은 [DEPLOYMENT.md](DEPLOYMENT.md)를 참고합니다.
