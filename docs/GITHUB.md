# GitHub 저장소 이전/연결

## 요청 범위

저장소 이름은 **inqo-agi-chat**입니다. 소스·테스트·패키지 설정·PRD·Agent/Skill·배포 문서를 함께 커밋합니다. 공개 요청이 없으므로 최초 생성 시 비공개로 설정합니다. 기존 Sites 서비스 호스팅은 유지합니다.

## 현재 상태

GitHub 계정 연결이 필요합니다. 이번 환경에서 GitHub CLI 인증이 유효하지 않아 아직 GitHub 저장소 생성/푸시를 완료하지 못했습니다. 저장소 주소나 소유 계정을 추측해 기재하지 않습니다. 실제 생성과 푸시가 확인되면 이 문서를 갱신합니다.

## 연결 후 절차

1. 연결 계정과 저장소 생성 권한을 확인합니다.
2. 동일 이름 저장소 존재 여부를 확인하고 기존 저장소를 덮어쓰지 않습니다.
3. 비공개 inqo-agi-chat 저장소를 생성합니다.
4. Sites용 origin을 유지하고 GitHub용 remote를 별도로 추가합니다.
5. main의 커밋과 소스·문서·lockfile을 푸시합니다.
6. 원격 커밋 SHA/파일과 CI 상태를 확인하고 저장소 URL을 전달합니다.

GitHub Actions 설정은 포함되어 있지만 실제 실행/브랜치 보호 설정은 별도로 확인해야 합니다. node_modules, dist, coverage, 비밀 값은 Git에 포함하지 않습니다. 현재 코드 검사는 [VALIDATION.md](VALIDATION.md), 호스팅은 [DEPLOYMENT.md](DEPLOYMENT.md)를 참고합니다.
