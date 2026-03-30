import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../redux/store';
import {
  login as loginThunk,
  register as registerThunk,
  signInWithApple as signInWithAppleThunk,
  logout as logoutThunk,
  restoreSession,
  clearError,
} from '../redux/slices/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, isAuthenticated, isLoading, error } = useSelector(
    (state: RootState) => state.auth,
  );

  const login = useCallback(
    (email: string, password: string) => {
      return dispatch(loginThunk({ email, password })).unwrap();
    },
    [dispatch],
  );

  const register = useCallback(
    (data: { name: string; email: string; password: string; beltRank: string }) => {
      return dispatch(registerThunk(data)).unwrap();
    },
    [dispatch],
  );

  const signInWithApple = useCallback(() => {
    return dispatch(signInWithAppleThunk()).unwrap();
  }, [dispatch]);

  const logout = useCallback(() => {
    return dispatch(logoutThunk()).unwrap();
  }, [dispatch]);

  const restore = useCallback(() => {
    return dispatch(restoreSession());
  }, [dispatch]);

  const dismissError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    signInWithApple,
    logout,
    restore,
    dismissError,
  };
};
