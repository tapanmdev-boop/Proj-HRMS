import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import { ApiError, refreshSession, session } from '../api/http';
import { authApi, tenantApi } from '../api/endpoints';
import type { ApiUser, SignupInput, Tenant } from '../api/types';

/** The shape the UI works with (lower-case roles, a single display name). */
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'hr' | 'employee' | 'manager';
  tenantId: string;
}

type AuthStatus = 'initializing' | 'anonymous' | 'authenticated';

interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  status: AuthStatus;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  tenant: null,
  // Resolved by restoreSession() on start-up; routes wait for it so a reload never flashes the login page.
  status: 'initializing',
  isLoading: false,
  error: null,
};

const LAST_TENANT_KEY = 'hrms.lastTenant';

export const rememberedTenant = (): string => {
  try {
    return localStorage.getItem(LAST_TENANT_KEY) ?? (import.meta.env.VITE_DEFAULT_TENANT ?? '');
  } catch {
    return import.meta.env.VITE_DEFAULT_TENANT ?? '';
  }
};

const remember = (slug: string) => {
  try {
    localStorage.setItem(LAST_TENANT_KEY, slug);
  } catch {
    /* ignore */
  }
};

export const toUser = (u: Pick<ApiUser, 'id' | 'email' | 'firstName' | 'lastName' | 'role' | 'tenantId'>): User => ({
  id: u.id,
  email: u.email,
  name: `${u.firstName} ${u.lastName}`.trim(),
  role: u.role.toLowerCase() as User['role'],
  tenantId: u.tenantId,
});

const messageOf = (error: unknown, fallback: string) => (error instanceof ApiError || error instanceof Error ? error.message : fallback);

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { tenant?: string; email: string; password: string }, { rejectWithValue }) => {
    try {
      const tenantSlug = credentials.tenant?.trim().toLowerCase() || undefined;
      const response = await authApi.login({ ...credentials, tenant: tenantSlug });
      session.set(response);
      if (tenantSlug) remember(tenantSlug);
      return { user: toUser(response.user), tenant: await tenantApi.current() };
    } catch (error) {
      session.clear();
      return rejectWithValue(messageOf(error, 'Sign-in failed. Please try again.'));
    }
  },
);

export const signup = createAsyncThunk('auth/signup', async (input: SignupInput, { rejectWithValue }) => {
  try {
    const response = await authApi.signup(input);
    session.set(response);
    remember(input.organizationSlug);
    return { user: toUser(response.user), tenant: await tenantApi.current() };
  } catch (error) {
    session.clear();
    return rejectWithValue(messageOf(error, 'Could not create the organization. Please try again.'));
  }
});

/** Called once at start-up: turns a stored refresh token back into a live session. */
export const restoreSession = createAsyncThunk('auth/restore', async (_: void, { rejectWithValue }) => {
  if (!session.hasRefreshToken()) return rejectWithValue('no-session');
  if (!(await refreshSession())) {
    session.clear();
    return rejectWithValue('expired');
  }
  try {
    const [profile, tenant] = await Promise.all([authApi.profile(), tenantApi.current()]);
    return { user: toUser(profile), tenant };
  } catch {
    session.clear();
    return rejectWithValue('expired');
  }
});

export const logout = createAsyncThunk('auth/logout', async () => {
  const refreshToken = localStorage.getItem('hrms.refreshToken');
  session.clear();
  if (refreshToken) {
    try {
      await authApi.logout(refreshToken);
    } catch {
      /* the local session is already gone; the server-side token expires on its own */
    }
  }
});

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /** Dispatched by the HTTP client when a refresh fails mid-session. */
    sessionExpired: (state) => {
      state.user = null;
      state.tenant = null;
      state.status = 'anonymous';
      state.error = 'Your session has expired. Please sign in again.';
    },
    tenantUpdated: (state, action: PayloadAction<Tenant>) => {
      state.tenant = action.payload;
    },
    clearAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    const authenticated = (state: AuthState, payload: { user: User; tenant: Tenant }) => {
      state.isLoading = false;
      state.error = null;
      state.user = payload.user;
      state.tenant = payload.tenant;
      state.status = 'authenticated';
    };
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => authenticated(state, action.payload))
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) ?? 'Sign-in failed.';
      })
      .addCase(signup.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signup.fulfilled, (state, action) => authenticated(state, action.payload))
      .addCase(signup.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) ?? 'Could not create the organization.';
      })
      .addCase(restoreSession.fulfilled, (state, action) => authenticated(state, action.payload))
      .addCase(restoreSession.rejected, (state) => {
        state.status = 'anonymous';
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.tenant = null;
        state.status = 'anonymous';
        state.error = null;
      });
  },
});

export const { sessionExpired, tenantUpdated, clearAuthError } = authSlice.actions;

// Selectors
export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectTenant = (state: RootState) => state.auth.tenant;
export const selectAuthStatus = (state: RootState) => state.auth.status;
export const selectIsAuthenticated = (state: RootState) => state.auth.status === 'authenticated';
export const selectAuthError = (state: RootState) => state.auth.error;
export const selectAuthLoading = (state: RootState) => state.auth.isLoading;

export default authSlice.reducer;
