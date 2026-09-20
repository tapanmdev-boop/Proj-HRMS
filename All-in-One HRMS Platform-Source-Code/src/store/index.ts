import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../auth/authSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    // Add other reducers here as modules are implemented
  },
});

// Types for RootState & AppDispatch
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
