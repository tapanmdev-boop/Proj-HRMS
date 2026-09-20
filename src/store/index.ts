import { configureStore } from '@reduxjs/toolkit';
import authReducer, { sessionExpired } from '../auth/authSlice';
import { session } from '../api/http';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    // Server data is fetched per screen; only session and organization settings are global.
  },
});

// When the HTTP client cannot renew a session, drop the user back to the sign-in page.
session.onExpired(() => store.dispatch(sessionExpired()));

// Types for RootState & AppDispatch
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
