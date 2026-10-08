// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest';
import { buildServer } from '../server/app';

afterEach(() => vi.unstubAllGlobals());
it('requires session, checks origin and custom request header, rejects unknown paths', async () => {
  const app = await buildServer({ serveStatic: false });
  expect((await app.inject({ method: 'GET', url: '/api/conversations' })).statusCode).toBe(401);
  expect(
    (await app.inject({ method: 'POST', url: '/api/auth/login', payload: {} })).statusCode,
  ).toBe(403);
  expect(
    (
      await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        headers: { origin: 'https://evil.example', 'x-modam-request': '1' },
        payload: {},
      })
    ).statusCode,
  ).toBe(403);
  expect((await app.inject({ method: 'GET', url: '/api/not-allowed' })).statusCode).toBe(404);
  expect((await app.inject('/health')).statusCode).toBe(200);
  await app.close();
});
it('stores opaque token in HttpOnly cookie and only forwards it server-side', async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(new Response(JSON.stringify({ token: 'private-token' })))
    .mockResolvedValueOnce(new Response(JSON.stringify({ username: 'alice' })))
    .mockResolvedValueOnce(new Response(null, { status: 204 }));
  vi.stubGlobal('fetch', fetcher);
  const app = await buildServer({
    serveStatic: false,
    production: true,
    origins: ['https://chat.example'],
  });
  const login = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    headers: { origin: 'https://chat.example', 'x-modam-request': '1' },
    payload: { username: 'alice', password: 'password' },
  });
  expect(login.json()).toEqual({ authenticated: true });
  expect(login.headers['set-cookie']).toContain('HttpOnly');
  expect(login.headers['set-cookie']).toContain('Secure');
  const headers = { cookie: 'modam_session=private-token', 'x-modam-request': '1' };
  const session = await app.inject({ method: 'GET', url: '/api/session', headers });
  expect(session.json()).toEqual({ username: 'alice' });
  expect(fetcher.mock.calls[1]?.[1].headers.Authorization).toBe('Bearer private-token');
  const logout = await app.inject({ method: 'POST', url: '/api/auth/logout', headers });
  expect(logout.statusCode).toBe(204);
  expect(logout.headers['set-cookie']).toContain('Expires=');
  await app.close();
});
it('rate-limits login and hides upstream failures', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('PRIVATE_DETAIL')));
  const app = await buildServer({ serveStatic: false });
  for (let i = 0; i < 10; i++)
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/api/auth/login',
          headers: { 'x-modam-request': '1' },
          payload: {},
        })
      ).statusCode,
    ).toBe(502);
  const result = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    headers: { 'x-modam-request': '1' },
    payload: {},
  });
  expect(result.statusCode).toBe(429);
  expect(result.body).not.toContain('PRIVATE_DETAIL');
  await app.close();
});
it('validates server-only configuration and malformed login responses', async () => {
  await expect(buildServer({ agiUrl: 'file:///tmp/a', serveStatic: false })).rejects.toThrow();
  await expect(
    buildServer({ production: true, origins: ['http://chat.example'], serveStatic: false }),
  ).rejects.toThrow();
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}')));
  const app = await buildServer({ serveStatic: false });
  expect(
    (
      await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        headers: { 'x-modam-request': '1' },
        payload: {},
      })
    ).statusCode,
  ).toBe(502);
  await app.close();
});
