import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, request, session } from './http';

type Handler = (url: string, init: RequestInit) => Response | Promise<Response>;

const json = (status: number, body: unknown = {}) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

function mockFetch(handler: Handler) {
  const calls: { url: string; init: RequestInit }[] = [];
  vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit = {}) => {
    calls.push({ url, init });
    return handler(url, init);
  }));
  return calls;
}

const authHeader = (init: RequestInit) => (init.headers as Record<string, string>)?.Authorization;

describe('http client', () => {
  beforeEach(() => {
    session.set({ accessToken: 'access-1', refreshToken: 'refresh-1' });
  });
  afterEach(() => {
    session.clear();
    session.onExpired(() => {});
    vi.unstubAllGlobals();
  });

  it('sends the access token and parses JSON', async () => {
    const calls = mockFetch(() => json(200, { ok: true }));
    await expect(request('/employees')).resolves.toEqual({ ok: true });
    expect(authHeader(calls[0].init)).toBe('Bearer access-1');
  });

  it('builds query strings and skips empty values', async () => {
    const calls = mockFetch(() => json(200, {}));
    await request('/employees', { query: { page: 2, search: '', status: undefined, departmentId: 'd1' } });
    const url = new URL(calls[0].url);
    expect(url.searchParams.get('page')).toBe('2');
    expect(url.searchParams.get('departmentId')).toBe('d1');
    expect(url.searchParams.has('search')).toBe(false);
    expect(url.searchParams.has('status')).toBe(false);
  });

  it('refreshes once on 401, then retries with the new token', async () => {
    const calls = mockFetch((url, init) => {
      if (url.endsWith('/auth/refresh')) return json(200, { accessToken: 'access-2', refreshToken: 'refresh-2' });
      return authHeader(init) === 'Bearer access-2' ? json(200, { ok: 'retried' }) : json(401, { message: 'Unauthorized' });
    });
    await expect(request('/employees')).resolves.toEqual({ ok: 'retried' });
    expect(calls.map((c) => c.url.split('/api').pop() ?? c.url)).toHaveLength(3);
    expect(localStorage.getItem('hrms.refreshToken')).toBe('refresh-2');
  });

  it('shares a single refresh between concurrent requests', async () => {
    const calls = mockFetch(async (url, init) => {
      if (url.endsWith('/auth/refresh')) {
        await new Promise((r) => setTimeout(r, 20));
        return json(200, { accessToken: 'access-2', refreshToken: 'refresh-2' });
      }
      return authHeader(init) === 'Bearer access-2' ? json(200, {}) : json(401, {});
    });
    await Promise.all([request('/a'), request('/b'), request('/c')]);
    expect(calls.filter((c) => c.url.endsWith('/auth/refresh'))).toHaveLength(1);
  });

  it('ends the session when the refresh fails', async () => {
    const expired = vi.fn();
    session.onExpired(expired);
    mockFetch((url) => (url.endsWith('/auth/refresh') ? json(401, { message: 'expired' }) : json(401, { message: 'Unauthorized' })));
    await expect(request('/employees')).rejects.toMatchObject({ status: 401 });
    expect(expired).toHaveBeenCalledTimes(1);
    expect(session.hasRefreshToken()).toBe(false);
  });

  it('does not attempt a refresh for anonymous calls such as login', async () => {
    const calls = mockFetch(() => json(401, { message: 'Invalid email or password' }));
    await expect(request('/auth/login', { method: 'POST', body: {}, anonymous: true })).rejects.toMatchObject({ message: 'Invalid email or password' });
    expect(calls).toHaveLength(1);
    expect(authHeader(calls[0].init)).toBeUndefined();
  });

  it('surfaces the first validation message and keeps the full list', async () => {
    mockFetch(() => json(400, { message: ['salary must be a decimal', 'joinDate must be a date'] }));
    const error = (await request('/employees', { method: 'POST', body: {} }).catch((e) => e)) as ApiError;
    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toBe('salary must be a decimal');
    expect(error.details).toHaveLength(2);
  });

  it('reports an unreachable server as status 0 with a friendly message', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch'); }));
    await expect(request('/employees')).rejects.toMatchObject({ status: 0, message: expect.stringContaining('Cannot reach the server') });
  });

  it('handles empty 204 responses', async () => {
    mockFetch(() => new Response(null, { status: 204 }));
    await expect(request('/x', { method: 'DELETE' })).resolves.toBeUndefined();
  });
});
