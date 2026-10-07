# 패키지 관리

## 직접 의존성

모두 devDependencies입니다. 현재 직접 개발 의존성은 12개이며 dependencies 항목은 없습니다. 정확한 버전은 [package.json](../package.json), 전이 의존성은 [package-lock.json](../package-lock.json)을 기준으로 합니다. 별도 패키지 추가 없이 현재 구성을 문서화했습니다.

| 패키지                 | 역할                              |
| ---------------------- | --------------------------------- |
| typescript             | 타입 검사                         |
| @types/node            | 빌드 설정/테스트의 Node API 타입  |
| vite                   | 개발/배포 번들                    |
| vitest                 | 테스트                            |
| @vitest/coverage-v8    | 커버리지; Vitest와 같은 버전 유지 |
| jsdom                  | 테스트 DOM                        |
| eslint, @eslint/js     | 린트 엔진/기본 규칙               |
| typescript-eslint      | TS 규칙                           |
| globals                | 브라우저/Node 전역 선언           |
| eslint-config-prettier | 포맷 충돌 방지                    |
| prettier               | 코드/문서 포맷                    |

## 재현성

직접 버전은 정확히 고정하고 package-lock.json을 함께 커밋합니다. 팀/CI는 `npm ci`, 의존성 변경만 `npm install --save-dev --save-exact <package>@<version>`을 사용합니다. `.npmrc`는 save-exact를 적용합니다. npm 하나만 사용하며 lockfile을 섞지 않습니다.

```sh
npm ci
npm ls --depth=0
npm audit
```

패키지 추가 전 표준 API/기존 모듈 가능성을 확인합니다. 유지보수, Node 지원, 라이선스, 공급망 경고, 번들 영향, 팀 비용을 검토하고 PR에 이유를 적습니다. 라이선스는 실제 해석된 버전 기준으로 확인하며 법적 검토 완료를 주장하지 않습니다.

메이저 업데이트는 changelog/마이그레이션을 검토하고 `npm run check`를 실행합니다. `npm audit fix --force`로 일괄 변경하지 않습니다. 보안 권고는 실제 사용 경로·개발/런타임 영향·호환 패치 가능성을 확인합니다. lockfile을 삭제해 문제를 숨기지 않습니다.

## 산출물

src/, 루트 index.html, public/은 소스, dist는 빌드 생성물입니다. dist/node_modules/coverage/.env는 Git 제외합니다. API 키나 레지스트리 인증을 저장소에 넣지 않습니다. 배포 아카이브는 빌드 산출물과 호스팅 설정을 포함합니다.

## 명령과 운영 구분

| 명령                          | 목적                        |
| ----------------------------- | --------------------------- |
| npm ci                        | lockfile 기준 재현 설치     |
| npm run dev                   | 로컬 Vite 개발 서버         |
| npm run format / format:check | 문서·소스 포맷 수정/검사    |
| npm run lint / typecheck      | 코드 정적 검사              |
| npm test / test:coverage      | 동작·커버리지 검사          |
| npm run build / preview       | 정적 산출물 생성/로컬 확인  |
| npm run check                 | 코드 변경 시 전체 품질 검사 |

로컬 도구 패키지가 배포 서버 런타임을 뜻하지 않습니다. 환경은 [DEPLOYMENT.md](DEPLOYMENT.md), 제품 범위는 [PRD](../prd.md)를 참조합니다.
