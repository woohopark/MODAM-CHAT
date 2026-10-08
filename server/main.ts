import { buildServer } from './app.js';

const app = await buildServer();
await app.listen({
  host: process.env.MODAM_BFF_HOST ?? '127.0.0.1',
  port: Number(process.env.PORT ?? 3000),
});
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    void app.close();
  });
}
