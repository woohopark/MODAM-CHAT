# MODAM-CHAT · Orbit

한국어 ChatGPT 스타일 UI, 라이트/다크 테마, Fastify 채팅 BFF. MODAM-AGI FastAPI/별도 워커/PostgreSQL/Groq와 실제 일반 대화·멀티턴·계정별 복원·취소·삭제를 연결한다.

- [PRD](prd.md) · [Agent](Agent.md) · [skill](skill.md) · [개발 지침](AGENTS.md)
- [API/보안/멀티턴](docs/AGI_INTEGRATION.md) · [실행/배포/주소](docs/DEPLOYMENT.md)
- [검증](docs/VALIDATION.md) · [패키지](docs/PACKAGES.md) · [코드 기준](docs/CODE_CONVENTIONS.md)

```bash
npm ci
npm run check
npm run server
```

`npm run check`는 클라이언트와 BFF를 모두 빌드한다. 개발 Vite `/api`는 3000 BFF로 proxy한다. 키는 AGI 서버 환경에만 두며 프론트에는 포함하지 않는다. 실제 MCP/ERP는 미연결이다. 기존 Sites 주소는 별도 정적 데모이며 실제 서비스는 현재 workspace의 loopback에서 실행한다. Docker 외부 배포에는 운영 서버/도메인이 필요하다.
