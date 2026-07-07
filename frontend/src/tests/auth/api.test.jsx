import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  apiFetch,
  fetchCsrfToken,
  STORAGE_KEY,
  REFRESH_KEY,
  CSRF_KEY,
} from '../../auth/api';

/**
 * Tests for auth/api.js — the authenticated fetch wrapper.
 *
 * This is the single client-side chokepoint that attaches the bearer token
 * (SR-18) and the anti-CSRF token on state-changing requests (SR-28), and that
 * signs the user out on an unrecoverable 401. Verifying it here ensures every
 * API call across the app inherits those protections.
 */
describe('auth/api.js fetch wrapper', () => {
  beforeEach(() => {
    sessionStorage.clear();
    globalThis.fetch = vi.fn();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('attaches the bearer token to /api requests (SR-18)', async () => {
    sessionStorage.setItem(STORAGE_KEY, 'access.jwt');
    globalThis.fetch.mockResolvedValue({ status: 200, ok: true });

    await apiFetch('/api/experts');

    const [, opts] = globalThis.fetch.mock.calls[0];
    expect(opts.headers.Authorization).toBe('Bearer access.jwt');
  });

  test('does NOT attach the bearer token to non-/api URLs', async () => {
    sessionStorage.setItem(STORAGE_KEY, 'access.jwt');
    globalThis.fetch.mockResolvedValue({ status: 200, ok: true });

    await apiFetch('https://other.example.com/thing');

    const [, opts] = globalThis.fetch.mock.calls[0];
    expect(opts.headers.Authorization).toBeUndefined();
  });

  test('attaches the CSRF token on a mutating (POST) request (SR-28)', async () => {
    sessionStorage.setItem(CSRF_KEY, 'csrf-abc');
    globalThis.fetch.mockResolvedValue({ status: 200, ok: true });

    await apiFetch('/api/conversations', { method: 'POST', body: '{}' });

    const [, opts] = globalThis.fetch.mock.calls[0];
    expect(opts.headers['x-csrf-token']).toBe('csrf-abc');
  });

  test('does NOT attach a CSRF token on a GET (non-mutating) request', async () => {
    sessionStorage.setItem(CSRF_KEY, 'csrf-abc');
    globalThis.fetch.mockResolvedValue({ status: 200, ok: true });

    await apiFetch('/api/experts'); // GET

    const [, opts] = globalThis.fetch.mock.calls[0];
    expect(opts.headers['x-csrf-token']).toBeUndefined();
  });

  test('on an unrecoverable 401 (no refresh token) clears all credentials', async () => {
    sessionStorage.setItem(STORAGE_KEY, 'dead.jwt');
    sessionStorage.setItem(CSRF_KEY, 'csrf-abc');
    // No REFRESH_KEY -> cannot refresh -> full sign-out.
    globalThis.fetch.mockResolvedValue({ status: 401, ok: false });

    await apiFetch('/api/experts');

    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(sessionStorage.getItem(CSRF_KEY)).toBeNull();
  });

  test('retries once after refreshing the token on a 401 (rotation race, SR-18)', async () => {
    sessionStorage.setItem(STORAGE_KEY, 'old.jwt');
    sessionStorage.setItem(REFRESH_KEY, 'refresh-tok');
    sessionStorage.setItem(CSRF_KEY, 'csrf-abc');

    globalThis.fetch
      // 1) original request -> 401 (token was just rotated)
      .mockResolvedValueOnce({ status: 401, ok: false })
      // 2) /api/auth/refresh -> new token
      .mockResolvedValueOnce({ status: 200, ok: true, json: async () => ({ token: 'new.jwt' }) })
      // 3) retried original request -> success
      .mockResolvedValueOnce({ status: 200, ok: true });

    const res = await apiFetch('/api/experts');
    expect(res.status).toBe(200);
    // The refreshed token should now be stored.
    expect(sessionStorage.getItem(STORAGE_KEY)).toBe('new.jwt');
  });

  test('on 401 redirects a regular user to /login (SR-18 sign-out)', async () => {
    const replace = vi.fn();
    const original = globalThis.location;
    // Replace location with a stub exposing pathname + replace().
    delete globalThis.location;
    globalThis.location = { pathname: '/dashboard', replace };
    try {
      sessionStorage.setItem(STORAGE_KEY, 'dead.jwt');
      globalThis.fetch.mockResolvedValue({ status: 401, ok: false });
      await apiFetch('/api/experts');
      expect(replace).toHaveBeenCalledWith('/login');
    } finally {
      globalThis.location = original;
    }
  });

  test('on 401 redirects an admin-panel user to the admin login', async () => {
    const replace = vi.fn();
    const original = globalThis.location;
    delete globalThis.location;
    globalThis.location = { pathname: '/adm/managementDashboard', replace };
    try {
      sessionStorage.setItem(STORAGE_KEY, 'dead.jwt');
      globalThis.fetch.mockResolvedValue({ status: 401, ok: false });
      await apiFetch('/api/admin/users');
      expect(replace).toHaveBeenCalledWith('/adm/administratorLogin');
    } finally {
      globalThis.location = original;
    }
  });

  test('on 401 does NOT redirect if already on a login page (no loop)', async () => {
    const replace = vi.fn();
    const original = globalThis.location;
    delete globalThis.location;
    globalThis.location = { pathname: '/login', replace };
    try {
      sessionStorage.setItem(STORAGE_KEY, 'dead.jwt');
      globalThis.fetch.mockResolvedValue({ status: 401, ok: false });
      await apiFetch('/api/experts');
      expect(replace).not.toHaveBeenCalled();
    } finally {
      globalThis.location = original;
    }
  });

  test('retries a mutating request once after CSRF rejection (SR-28)', async () => {
    sessionStorage.setItem(CSRF_KEY, 'stale-csrf');
    globalThis.fetch
      .mockResolvedValueOnce({
        status: 403,
        ok: false,
        clone: () => ({
          json: async () => ({ code: 'CSRF_INVALID' }),
        }),
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ csrfToken: 'fresh-csrf' }) })
      .mockResolvedValueOnce({ status: 200, ok: true });

    const res = await apiFetch('/api/conversations', { method: 'POST', body: '{}' });

    expect(res.status).toBe(200);
    expect(sessionStorage.getItem(CSRF_KEY)).toBe('fresh-csrf');
    expect(globalThis.fetch).toHaveBeenCalledTimes(3);
  });

  test('does not retry when 403 is not a CSRF rejection', async () => {
    sessionStorage.setItem(CSRF_KEY, 'csrf-abc');
    globalThis.fetch.mockResolvedValue({
      status: 403,
      ok: false,
      clone: () => ({
        json: async () => ({ code: 'FORBIDDEN' }),
      }),
    });

    const res = await apiFetch('/api/conversations', { method: 'POST', body: '{}' });
    expect(res.status).toBe(403);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  test('signs out when refresh fails after a 401', async () => {
    sessionStorage.setItem(STORAGE_KEY, 'old.jwt');
    sessionStorage.setItem(REFRESH_KEY, 'refresh-tok');
    sessionStorage.setItem(CSRF_KEY, 'csrf-abc');

    globalThis.fetch
      .mockResolvedValueOnce({ status: 401, ok: false })
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce({ ok: true, json: async () => ({ csrfToken: 'post-logout-csrf' }) });

    const replace = vi.fn();
    const original = globalThis.location;
    delete globalThis.location;
    globalThis.location = { pathname: '/dashboard', replace };
    try {
      await apiFetch('/api/experts');
      expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
      expect(replace).toHaveBeenCalledWith('/login');
    } finally {
      globalThis.location = original;
    }
  });

  test('fetches CSRF before a mutating request when none is cached', async () => {
    globalThis.fetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ csrfToken: 'boot-csrf' }) })
      .mockResolvedValueOnce({ status: 200, ok: true });

    await apiFetch('/api/conversations', { method: 'POST', body: '{}' });

    expect(globalThis.fetch.mock.calls[0][0]).toBe('/api/csrf-token');
    const [, opts] = globalThis.fetch.mock.calls[1];
    expect(opts.headers['x-csrf-token']).toBe('boot-csrf');
  });
});

describe('fetchCsrfToken', () => {
  beforeEach(() => {
    sessionStorage.clear();
    globalThis.fetch = vi.fn();
  });
  afterEach(() => vi.restoreAllMocks());

  test('stores the CSRF token returned by the server', async () => {
    globalThis.fetch.mockResolvedValue({ ok: true, json: async () => ({ csrfToken: 'server-csrf' }) });
    await fetchCsrfToken();
    expect(sessionStorage.getItem(CSRF_KEY)).toBe('server-csrf');
  });

  test('clears the CSRF token if the request fails', async () => {
    sessionStorage.setItem(CSRF_KEY, 'stale');
    globalThis.fetch.mockRejectedValue(new Error('network'));
    await fetchCsrfToken();
    expect(sessionStorage.getItem(CSRF_KEY)).toBeNull();
  });
});
