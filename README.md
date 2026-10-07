# Orbit Chat Frontend

ChatGPT의 대화 중심 UI/UX를 참고한 한국어 채팅 프론트엔드입니다. 기존 화면을 유지하면서 TypeScript 모듈·테스트·품질 도구·팀 개발 문서를 적용했습니다.

> 실제 AGI, 로그인, 서버 저장은 미연결입니다. 데모 응답만 제공하며 대화와 테마는 탭 메모리에 유지됩니다. 새로고침하면 초기화됩니다.

## 실행

Node.js 24.15 이상(24.x)과 npm 10 이상을 사용합니다. `.nvmrc`로 개발 환경을 통일합니다.

```sh
npm ci
npm run dev
npm run check         # 포맷·린트·타입·테스트/커버리지·빌드
npm run test:watch    # 테스트 개발
npm run format       # 포맷 수정
npm run build        # dist/ 생성
npm run preview      # 빌드 결과 로컬 확인
```

## 핵심 요구사항·작업 문서

| 문서                                                  | 역할                                                  |
| ----------------------------------------------------- | ----------------------------------------------------- |
| [prd.md](prd.md)                                      | 요구사항 정의서: 목표·FR/NFR·수용 기준·범위·출시 조건 |
| [Agent.md](Agent.md)                                  | 에이전트 책임·판단 경계·완료 보고                     |
| [skill.md](skill.md)                                  | 작업 절차·검증 경로·실제 SKILL.md 연결                |
| [AGENTS.md](AGENTS.md)                                | 자동화 도구의 저장소 진입 지침                        |
| [실제 SKILL.md](.skills/feature-development/SKILL.md) | 실행 가능한 단계별 작업 지침                          |
| [배포 환경](docs/DEPLOYMENT.md)                       | 서비스 주소·비공개 접근·개발/빌드/운영 구분           |

서비스: https://orbit-agi-chat.qkrwnsh1592.chatgpt.site

## 문서

| 문서                                     | 내용                         |
| ---------------------------------------- | ---------------------------- |
| [기능 명세](docs/FEATURES.md)            | 기능별 동작·제한·테스트 연결 |
| [아키텍처](docs/ARCHITECTURE.md)         | 책임 분리·의존 방향·SOLID    |
| [코드 컨벤션](docs/CODE_CONVENTIONS.md)  | 명명·타입·에러·리뷰          |
| [테스트](docs/TESTING.md)                | 실행법·테스트 코드·검증 범위 |
| [검증 기록](docs/VALIDATION.md)          | 실제 검사와 미수행 범위      |
| [기술 스택](docs/TECH_STACK.md)          | 기술과 선택 이유             |
| [패키지 관리](docs/PACKAGES.md)          | 의존성·lockfile·업데이트     |
| [AGI 연결](docs/AGI_INTEGRATION.md)      | 제공자 계약·서버 경계        |
| [스킬 컨벤션](docs/SKILL_CONVENTIONS.md) | SKILL.md 구조·작업 기준      |
| [개발 참여](CONTRIBUTING.md)             | 커밋·PR·완료 기준            |
| [에이전트 지침](AGENTS.md)               | 저장소 자동화 규칙           |

## 구조

```text
src/
  domain/          # 대화 모델·메모리 저장소
  application/     # 유스케이스·응답 제공자 계약
  providers/       # 데모 제공자, 추후 AGI 어댑터
  ui/              # 렌더링·입력 정책·이벤트
  main.ts          # 의존성 조립
  style.css
 tests/            # 단위·DOM 통합 테스트
 docs/             # 팀 문서
 .skills/          # 저장소 작업 스킬
 public/           # 정적 자산
 index.html        # 마크업
```

기업별 표준은 다릅니다. 엄격한 타입 검사, 재현 가능한 패키지 설치, 자동 품질 검사, 동작 중심 테스트, 책임 분리라는 공통 팀 개발 기준을 적용합니다. 특정 기업 내부 규격 인증이나 실제 운영 시스템 완성을 의미하지 않습니다.

GitHub Actions 설정은 포함되어 있습니다. GitHub 팀 저장소에 연결하면 실행할 수 있으며 현재 Sites 소스 저장소에서 Actions 실행을 보장하지 않습니다. main 브랜치 보호·필수 검사·리뷰 정책은 팀 저장소에서 별도로 활성화하세요.
