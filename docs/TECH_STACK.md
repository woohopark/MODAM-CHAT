# 기술 스택

| 구분   | 기술                              | 이유                                          |
| ------ | --------------------------------- | --------------------------------------------- |
| 환경   | Node.js 24, npm                   | 팀/빌드 환경 통일                             |
| 언어   | TypeScript strict                 | 명시적 계약·경계 검사                         |
| UI     | HTML/CSS/DOM                      | 기존 화면 유지, 최소 구성                     |
| 빌드   | Vite                              | 모듈 번들링·HMR·정적 빌드                     |
| 상태   | ChatStore/스냅샷                  | 탭 메모리·조회 격리                           |
| 비동기 | AsyncIterable/AbortController     | 청크·중단 계약                                |
| 테스트 | Vitest/jsdom/V8 coverage          | 단위·DOM 통합·커버리지                        |
| 품질   | ESLint/typescript-eslint/Prettier | 정적 규칙·포맷                                |
| CI     | GitHub Actions 설정               | GitHub 팀 저장소 연결 시 실행                 |
| 호스팅 | Sites 정적 dist/                  | 기존 비공개 사이트 업데이트                   |
| 폰트   | Inter/Noto Sans KR                | 기존 디자인; Google Fonts 실패 시 시스템 폰트 |

정확한 직접 버전은 package.json, 전이 버전은 package-lock.json이 기준입니다. 문서에 버전을 중복 기재하지 않습니다.

런타임 npm 의존성은 없습니다. 프레임워크/라우터/전역 상태/HTTP 라이브러리는 현재 요구에 없어 추가하지 않습니다. API 연동은 fetch로 시작하고 필요가 확인되면 패키지를 검토합니다.
