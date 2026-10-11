# MODAM-CHAT · Orbit

한국어 ChatGPT 스타일 UI, 라이트/다크 테마, Fastify 채팅 BFF. MODAM-AGI FastAPI/별도 워커/PostgreSQL/Groq와 실제 일반 대화·멀티턴·계정별 복원·취소·삭제를 연결한다.

- [PRD](prd.md) · [Agent](Agent.md) · [skill](skill.md) · [개발 지침](AGENTS.md)
- [API/보안/멀티턴](docs/AGI_INTEGRATION.md) · [실행/배포/주소](docs/DEPLOYMENT.md)
- [검증](docs/VALIDATION.md) · [패키지](docs/PACKAGES.md) · [코드 기준](docs/CODE_CONVENTIONS.md)

## 로컬 전체 서비스 실행

네 저장소를 같은 부모 디렉토리의 modam-chat/modam-agi/modam-rag/modam-ontology로 둔다.
Docker Desktop/Engine + Compose v2, Git, Python 3.12, uv를 준비하고 modam-agi에서:

```bash
python scripts/local-chat.py setup
uv sync --frozen
uv run python -m modam.knowledge_setup setup
docker compose --env-file .local/compose.env --env-file .local/knowledge.env -f deployment/compose.local.yaml -f deployment/compose.knowledge.yaml up --build -d --wait --wait-timeout 180
python scripts/local-chat.py account
```

브라우저 주소는 **http://localhost:3300**이다. setup에서 Groq 키, account에서 로그인 비밀번호를 숨김 입력한다.
기본 ID는 modam-admin이며 기존 계정은 재생성하지 않는다. Windows는 python 대신 py -3, macOS/Linux는 python3도 가능하다.
클라우드 workspace 키·계정은 PC에 자동 복사되지 않는다. Docker 경로에서는 PC Node 설치가 필요 없다.
기업 조회에는 자료 적재·현재 사용자 grant·원천 ACL이 필요하며 서버 시작만으로 합성/사내 자료가 생성되지 않는다.

부모 폴더의 [AGI 로컬 안내](../modam-agi/docs/LOCAL_PC.md)와 [기업 자료 준비](../modam-agi/docs/LOCAL_KNOWLEDGE_DATA.md)를 따른다.
위 상대 링크는 로컬 네 저장소 구조 기준이다. GitHub에서는 MODAM-AGI 저장소 docs/LOCAL_PC.md를 연다.

## CHAT 개별 실행 / 개발

Node 24.15 이상 24.x, npm이 필요하다. AGI API를 먼저 http://127.0.0.1:8000에서 실행한다.
RAG/ONTOLOGY는 AGI에서 연결하며 프론트에 Groq/MCP 키를 넣지 않는다.

```bash
npm ci
npm run check
npm run server
```

npm run check는 클라이언트와 BFF를 빌드한다. 이후 실행은 npm run build, npm run server로 가능하다.
접속: **http://127.0.0.1:3000**. AGI/DB/워커가 없으면 실제 로그인·응답은 동작하지 않는다.
개발 HMR은 두 터미널에서 각각 실행한다.

```bash
# 터미널 1: BFF 3000
npm run server:dev
```

```bash
# 터미널 2: Vite /api → BFF 3000
npm run dev
```

Vite 기본 주소는 http://localhost:5173이다. 포트가 자동 변경되면 origin 설정도 조정해야 한다.
AGI 주소 변경은 MODAM_AGI_URL, 허용 origin은 MODAM_PUBLIC_ORIGINS를 BFF 환경에 설정한다.
BFF 기본 허용값은 localhost/127.0.0.1의 3000·5173이다. 종료는 각 터미널 Ctrl+C다.
통합 Docker의 AGI는 PC 8000에 공개되지 않으므로 native BFF가 자동 연결되는 것으로 가정하지 않는다.
명시적 데모는 VITE_CHAT_MODE=demo 빌드 옵션이며 실제 AGI 테스트와 구분한다.

## 시나리오·후속 계획

[화면 테스트 계획](docs/ONTOLOGY_CHAT_TEST_PLAN.md)에 기업 조회·멀티턴·권한 회수·복원·취소·다크 모드 수용 조건을 정리했다.
새 PDF/XLSX·계산 검증·브라우저 E2E는 계획 단계이며 이번 문서 작업에서 구현하지 않았다.
커밋·푸시는 사용자 검토·승인 후 수행한다. 외부 공개 URL은 이번 작업에서 생성하지 않는다.

[기업 조회 시나리오·검증](docs/KNOWLEDGE_INTEGRATION.md)을 참고한다.
