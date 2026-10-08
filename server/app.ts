import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import staticFiles from '@fastify/static';
import { Readable } from 'node:stream';
import type { ReadableStream as NodeReadableStream } from 'node:stream/web';
import { resolve } from 'node:path';

interface Options {
  agiUrl?: string;
  origins?: string[];
  production?: boolean;
  serveStatic?: boolean;
}

/** Server-only transport. No Groq key or bearer token is returned to browser JS. */
export async function buildServer(options: Options = {}) {
  const production = options.production ?? process.env.NODE_ENV === 'production';
  const upstream = new URL(options.agiUrl ?? process.env.MODAM_AGI_URL ?? 'http://127.0.0.1:8000');
  if (!['http:', 'https:'].includes(upstream.protocol) || upstream.username || upstream.password) {
    throw new Error('Invalid AGI URL');
  }
  const origins =
    options.origins ??
    (
      process.env.MODAM_PUBLIC_ORIGINS ??
      'http://127.0.0.1:3000,http://localhost:3000,http://127.0.0.1:5173,http://localhost:5173'
    ).split(',');
  if (production && origins.some((origin) => !origin.startsWith('https://'))) {
    throw new Error('Production requires explicit HTTPS origins');
  }
  const app = Fastify({ logger: false, bodyLimit: 64 * 1024 });
  await app.register(cookie);
  const attempts = new Map<string, { count: number; until: number }>();
  const paths =
    /^(auth\/(login|logout)|session|conversations(?:\/[a-zA-Z0-9-]+(?:\/(messages|runs))?)?|runs\/[a-zA-Z0-9-]+(?:\/(events|cancel))?|requests\/[a-zA-Z0-9_-]+\/cancel|admin\/users(?:\/[a-zA-Z0-9-]+\/policy)?)$/;
  app.all('/api/*', async (request, reply) => {
    const path = (request.params as { '*': string })['*'];
    if (!paths.test(path)) return reply.code(404).send({ detail: 'not_found' });
    reply.header('Cache-Control', 'no-store');
    const origin = request.headers.origin;
    if (
      (origin && !origins.includes(origin)) ||
      (request.method !== 'GET' && request.headers['x-modam-request'] !== '1')
    ) {
      return reply.code(403).send({ detail: 'origin_denied' });
    }
    const login = path === 'auth/login' && request.method === 'POST';
    if (login) {
      const now = Date.now();
      for (const [key, value] of attempts) if (value.until <= now) attempts.delete(key);
      const attempt = attempts.get(request.ip) ?? { count: 0, until: now + 60_000 };
      attempt.count += 1;
      attempts.set(request.ip, attempt);
      if (attempt.count > 10) return reply.code(429).send({ detail: 'login_rate_limited' });
    }
    const session = request.cookies.modam_session;
    if (!login && !session) return reply.code(401).send({ detail: 'unauthenticated' });
    const abort = new AbortController();
    const onClose = () => abort.abort();
    reply.raw.on('close', onClose);
    const timeout = setTimeout(() => abort.abort(), 180_000);
    try {
      const url = new URL('/v1/' + path, upstream);
      const query = new URL(request.url, 'http://local').search;
      url.search = query;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session) headers.Authorization = 'Bearer ' + session;
      if (request.headers['last-event-id'])
        headers['Last-Event-ID'] = String(request.headers['last-event-id']);
      const result = await fetch(url, {
        method: request.method,
        headers,
        signal: abort.signal,
        redirect: 'error',
        ...(request.method !== 'GET' && request.body !== undefined
          ? { body: JSON.stringify(request.body) }
          : {}),
      });
      if (login && result.ok) {
        const body: unknown = await result.json();
        if (
          typeof body !== 'object' ||
          body === null ||
          !('token' in body) ||
          typeof body.token !== 'string'
        ) {
          return reply.code(502).send({ detail: 'invalid_upstream_response' });
        }
        reply.setCookie('modam_session', body.token, {
          httpOnly: true,
          secure: production,
          sameSite: 'strict',
          path: '/api',
          maxAge: 86400,
        });
        return reply.send({ authenticated: true });
      }
      if (path === 'auth/logout' && (result.ok || result.status === 401))
        reply.clearCookie('modam_session', { path: '/api' });
      reply.code(result.status);
      const contentType = result.headers.get('content-type') ?? 'application/json';
      if (contentType.includes('text/event-stream') && result.body) {
        reply.header('Content-Type', 'text/event-stream').header('X-Accel-Buffering', 'no');
        const stream = Readable.fromWeb(result.body as NodeReadableStream);
        stream.once('close', () => {
          clearTimeout(timeout);
          reply.raw.off('close', onClose);
        });
        return reply.send(stream);
      }
      const body = await result.text();
      return reply.type(contentType).send(body);
    } catch {
      return reply.code(502).send({ detail: 'agi_unavailable' });
    } finally {
      // SSE remains supervised by its stream close handler.
      if (!reply.getHeader('X-Accel-Buffering')) {
        clearTimeout(timeout);
        reply.raw.off('close', onClose);
      }
    }
  });
  app.get('/health', async () => ({ status: 'ok' }));
  if (options.serveStatic ?? true) {
    await app.register(staticFiles, { root: resolve('dist') });
  }
  return app;
}
