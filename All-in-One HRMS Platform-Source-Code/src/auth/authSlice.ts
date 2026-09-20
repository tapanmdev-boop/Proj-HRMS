import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';

// Define user types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'hr' | 'employee' | 'manager';
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isLoading: false,
  error: null,
};

// Async thunk for login
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      // Will be replaced with actual API call
      const response = await mockLoginApi(credentials);
      
      // Save token to localStorage
      localStorage.setItem('token', response.token);
      
      return response;
    } catch (error) {
      // Properly handle the error regardless of its type
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Login failed. Please check your credentials.';
      
      return rejectWithValue(errorMessage);
    }
  }
);

// Mock API call - will be replaced with actual API
const mockLoginApi = async (credentials: { email: string; password: string }) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Mock authentication logic
  if (credentials.email === 'admin@hrms.com' && credentials.password === 'admin123') {
    return {
      user: {
        id: '1',
        email: 'admin@hrms.com',
        name: 'Admin User',
        role: 'admin' as const,
      },
      token: 'mock-jwt-token-for-admin',
    };
  }
  
  if (credentials.email === 'hr@hrms.com' && credentials.password === 'hr123') {
    return {
      user: {
        id: '2',
        email: 'hr@hrms.com',
        name: 'HR Manager',
        role: 'hr' as const,
      },
      token: 'mock-jwt-token-for-hr',
    };
  }
  
  if (credentials.email === 'employee@hrms.com' && credentials.password === 'employee123') {
    return {
      user: {
        id: '3',
        email: 'employee@hrms.com',
        name: 'John Employee',
        role: 'employee' as const,
      },
      token: 'mock-jwt-token-for-employee',
    };
  }
  
  throw new Error('Invalid credentials');
};

// The auth slice
export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem('token');
    },
    setCredentials: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { logout, setCredentials } = authSlice.actions;

// Selectors
export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectIsAuthenticated = (state: RootState) => !!state.auth.token;
export const selectAuthError = (state: RootState) => state.auth.error;
export const selectAuthLoading = (state: RootState) => state.auth.isLoading;

export default authSlice.reducer;
