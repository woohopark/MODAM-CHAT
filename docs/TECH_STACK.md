# 기술 스택

| 경계        | 기술                                      | 목적                                           |
| ----------- | ----------------------------------------- | ---------------------------------------------- |
| 프론트      | TypeScript strict·DOM·Vite                | 기존 한국어 반응형 UI·라이트/다크              |
| application | 생성자 주입·작은 포트                     | ChatProvider·ConversationRepository 교체       |
| 통신        | 표준 fetch·ReadableStream·SSE             | 신규 요청·진행·복원·취소                       |
| 채팅 서버   | Node 24.x·Fastify·cookie·static           | 동일 origin /api·opaque 세션·private AGI proxy |
| AGI HTTP    | Python 3.12·FastAPI·Uvicorn               | 인증·소유 자원·검증된 입력                     |
| AGI DB      | PostgreSQL 17·SQLAlchemy·Alembic·psycopg  | 영속 대화·job·event·lease                      |
| 모델        | Groq API·HTTPX·Pydantic                   | 일반 멀티턴 / 기업 읽기 엔진                   |
| 품질        | ESLint·Prettier·Vitest / Ruff·mypy·pytest | 타입·계약·보안·취소 회귀                       |
| 실행        | Docker Compose                            | private DB/API/worker + BFF loopback 공개      |

정확한 npm 버전과 운영/개발 구분은 [패키지](PACKAGES.md), 환경/실제 주소와 외부 운영 제한은 [배포](DEPLOYMENT.md)를 따른다. React/Redis/Celery/브라우저 모델 SDK는 추가하지 않았다.
