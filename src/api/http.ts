/**
 * Minimal typed HTTP client for the HRMS API.
 *
 * - The access token lives in memory only. The refresh token is kept in localStorage so a
 *   session survives a reload (an httpOnly cookie is the stronger option once the API and the
 *   app share a site; see docs/security).
 * - A 401 triggers exactly one token refresh (shared by concurrent requests) and one retry.
 *   If the refresh fails the session is ended and `onSessionExpired` runs.
 */

export const API_BASE_URL: string = (import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api').replace(/\/$/, '');

const REFRESH_KEY = 'hrms.refreshToken';

export class ApiError extends Error {
  readonly status: number;
  /** Server validation messages, when the API returned a list. */
  readonly details: string[];

  constructor(status: number, message: string, details: string[] = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
}

let accessToken: string | null = null;
let refreshInFlight: Promise<boolean> | null = null;
let onSessionExpired: () => void = () => {};

const storage = {
  get: () => {
    try {
      return localStorage.getItem(REFRESH_KEY);
    } catch {
      return null;
    }
  },
  set: (value: string | null) => {
    try {
      if (value) localStorage.setItem(REFRESH_KEY, value);
      else localStorage.removeItem(REFRESH_KEY);
    } catch {
      /* storage unavailable (private mode): the session simply will not survive a reload */
    }
  },
};

export const session = {
  hasRefreshToken: () => storage.get() !== null,
  set: (tokens: SessionTokens) => {
    accessToken = tokens.accessToken;
    storage.set(tokens.refreshToken);
  },
  clear: () => {
    accessToken = null;
    storage.set(null);
  },
  onExpired: (handler: () => void) => {
    onSessionExpired = handler;
  },
};

async function parseError(response: Response): Promise<ApiError> {
  let body: { message?: string | string[] } | null = null;
  try {
    body = await response.json();
  } catch {
    /* non-JSON error body */
  }
  const details = Array.isArray(body?.message) ? body.message : [];
  const message = details.length ? details[0] : (typeof body?.message === 'string' ? body.message : response.statusText || 'Request failed');
  return new ApiError(response.status, message, details);
}

/** Exchanges the stored refresh token for new tokens. Returns false when the session cannot be renewed. */
export function refreshSession(): Promise<boolean> {
  refreshInFlight ??= (async () => {
    const refreshToken = storage.get();
    if (!refreshToken) return false;
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!response.ok) return false;
      const tokens = (await response.json()) as SessionTokens;
      session.set(tokens);
      return true;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | undefined | null>;
  /** Set for endpoints that must not carry credentials or trigger a refresh (login, signup). */
  anonymous?: boolean;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: RequestOptions['query']) {
  const url = new URL(`${API_BASE_URL}${path}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  }
  return url.toString();
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const send = () =>
    fetch(buildUrl(path, options.query), {
      method: options.method ?? 'GET',
      headers: {
        ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(!options.anonymous && accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    });

  let response: Response;
  try {
    response = await send();
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw error;
    throw new ApiError(0, 'Cannot reach the server. Check your connection and try again.');
  }

  if (response.status === 401 && !options.anonymous) {
    if (await refreshSession()) {
      response = await send();
    }
    if (response.status === 401) {
      session.clear();
      onSessionExpired();
    }
  }

  if (!response.ok) throw await parseError(response);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
