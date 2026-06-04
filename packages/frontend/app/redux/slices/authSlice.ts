import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as SecureStore from 'expo-secure-store';
import type { User } from '@training-grounds/shared';
import { authService } from '../../services/authService';
import { fetchUserGyms, clearPersistedGym } from './gymSlice';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue, dispatch }) => {
    try {
      const response = await authService.login(credentials.email, credentials.password);
      await SecureStore.setItemAsync('auth_token', response.accessToken);
      await dispatch(fetchUserGyms());
      return response.user;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Login failed';
      return rejectWithValue(message);
    }
  },
);

export const register = createAsyncThunk(
  'auth/register',
  async (
    data: { name: string; email: string; password: string; beltRank: string },
    { rejectWithValue, dispatch },
  ) => {
    try {
      const response = await authService.register(data);
      await SecureStore.setItemAsync('auth_token', response.accessToken);
      await dispatch(fetchUserGyms());
      return response.user;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      return rejectWithValue(message);
    }
  },
);

export const signInWithApple = createAsyncThunk(
  'auth/signInWithApple',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response = await authService.signInWithApple();
      await SecureStore.setItemAsync('auth_token', response.accessToken);
      await dispatch(fetchUserGyms());
      return response.user;
    } catch (error: unknown) {
      // User cancelled Apple Sign-In — don't show error
      if (error instanceof Error && error.message.includes('ERR_REQUEST_CANCELED')) {
        return rejectWithValue(null);
      }
      const message = error instanceof Error ? error.message : 'Apple Sign-In failed';
      return rejectWithValue(message);
    }
  },
);

export const logout = createAsyncThunk('auth/logout', async (_, { dispatch }) => {
  await SecureStore.deleteItemAsync('auth_token');
  dispatch(clearPersistedGym());
});

export const restoreSession = createAsyncThunk(
  'auth/restoreSession',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) return rejectWithValue('No token');
      const user = await authService.getMe();
      await dispatch(fetchUserGyms());
      return user;
    } catch (error: unknown) {
      await SecureStore.deleteItemAsync('auth_token');
      const message = error instanceof Error ? error.message : 'Session expired';
      return rejectWithValue(message);
    }
  },
);

/**
 * Lightweight user refresh — re-fetches the current user (XP, streak, level,
 * etc.) without the full session restore / gym re-fetch. Dispatch after any
 * action that earns XP (check-in, logging a PR) so the dashboard reflects it.
 */
export const refreshUser = createAsyncThunk(
  'auth/refreshUser',
  async (_, { rejectWithValue }) => {
    try {
      return await authService.getMe();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to refresh user';
      return rejectWithValue(message);
    }
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    updateAvatar(state, action: { payload: string }) {
      if (state.user) {
        state.user.avatarUrl = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Apple Sign-In
      .addCase(signInWithApple.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signInWithApple.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(signInWithApple.rejected, (state, action) => {
        state.isLoading = false;
        // Don't show error for user cancellation
        if (action.payload !== null) {
          state.error = action.payload as string;
        }
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      // Restore session
      .addCase(restoreSession.pending, (state) => {
        state.isLoading = true;
      })
      // Refresh user (after earning XP) — update user without flipping isLoading
      .addCase(refreshUser.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(restoreSession.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
      });
  },
});

export const { clearError, updateAvatar } = authSlice.actions;
export default authSlice.reducer;
