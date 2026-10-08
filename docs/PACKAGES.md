# 패키지 정리

Node 24.15 이상 24.x, npm lockfile, 정확한 직접 버전. 설치 npm ci.

| 패키지                 | 버전    | 범위           |
| ---------------------- | ------- | -------------- |
| @fastify/cookie        | 11.1.2  | 운영 BFF       |
| @fastify/static        | 10.1.5  | 운영 BFF       |
| fastify                | 5.12.5  | 운영 BFF       |
| @eslint/js             | 10.0.1  | 개발·검증·빌드 |
| @types/node            | 24.19.1 | 개발·검증·빌드 |
| @vitest/coverage-v8    | 5.0.3   | 개발·검증·빌드 |
| eslint                 | 10.12.0 | 개발·검증·빌드 |
| eslint-config-prettier | 10.1.8  | 개발·검증·빌드 |
| globals                | 17.13.0 | 개발·검증·빌드 |
| jsdom                  | 30.1.2  | 개발·검증·빌드 |
| prettier               | 3.9.9   | 개발·검증·빌드 |
| tsx                    | 4.23.15 | 개발·검증·빌드 |
| typescript             | 6.0.3   | 개발·검증·빌드 |
| typescript-eslint      | 8.71.1  | 개발·검증·빌드 |
| vite                   | 8.3.3   | 개발·검증·빌드 |
| vitest                 | 5.0.3   | 개발·검증·빌드 |

Fastify는 HTTP 경계, @fastify/cookie는 opaque 세션 쿠키, @fastify/static은 빌드 프론트 제공에 사용한다. tsx는 개발 서버만 사용한다. 운영은 dist-server JS + Node이며 Docker runtime에서 npm ci --omit=dev를 사용한다. SSE는 Node/Web 표준 stream이고 별도 SDK·상태 관리·React 의존성을 추가하지 않았다. 커버리지는 핵심 프론트 경계와 BFF app을 포함한다.
