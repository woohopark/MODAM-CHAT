# GitHub 저장소 연결

## 대상 저장소

- 저장소: [woohopark/MODAM-CHAT](https://github.com/woohopark/MODAM-CHAT)
- Git URL: https://github.com/woohopark/MODAM-CHAT.git
- 사용자 지정 기존 저장소에 소스·테스트·패키지 설정·PRD·Agent/Skill·배포 문서를 함께 커밋/푸시합니다.
- 별도의 inqo-agi-chat 저장소는 생성하지 않습니다. 대상 저장소의 공개 여부와 기존 브랜치 정책을 유지합니다.

## 계정과 관리 방식

2026-10-07 GitHub 공식 기기 인증으로 woohopark 계정 연결 및 저장소 ADMIN 권한을 확인했습니다. 업로드 전 빈 저장소 상태를 확인했으며 소스·테스트·문서·lockfile은 main 브랜치로 관리합니다.

이 작업 공간에서는 Sites용 origin과 GitHub용 github remote를 구분합니다. 일반 GitHub clone에서는 GitHub가 origin이 됩니다. 원격 주소를 확인하고 올바른 대상에 푸시하세요. 인증 정보는 저장소 파일에 넣지 않습니다.

GitHub 연결은 CLI 공식 인증으로 완료했으며 ChatGPT GitHub 플러그인 설치 완료를 뜻하지 않습니다.

## 업로드 검증

푸시 후 GitHub main의 SHA와 로컬 HEAD가 같은지 확인하고 PRD/Agent/Skill/소스 파일을 원격에서 확인합니다. Actions의 품질 검사 결과와 브랜치 보호는 별도로 확인합니다.

## 이후 변경 절차

1. woohopark/MODAM-CHAT을 사용할 수 있는 계정과 쓰기 권한을 확인합니다.
2. 원격 기본 브랜치·기존 이력·저장소 지침을 확인합니다.
3. 기존 내용이 있으면 충돌과 브랜치 정책을 반영해 안전하게 통합합니다.
4. 정책상 직접 푸시가 가능하면 대상 브랜치에, 보호되어 있으면 작업 브랜치/PR로 전달합니다.
5. 원격 커밋 SHA/파일과 CI 상태를 확인하고 실제 커밋/브랜치 URL을 전달합니다.

GitHub Actions 품질 검사 설정이 포함되어 있습니다. 실행 상태는 저장소 Actions에서 확인하며, 브랜치 보호는 별도로 설정해야 합니다. node_modules, dist, coverage, 비밀 값은 Git에 포함하지 않습니다. 코드 검사는 [VALIDATION.md](VALIDATION.md), 서비스 호스팅은 [DEPLOYMENT.md](DEPLOYMENT.md)를 참고합니다.
