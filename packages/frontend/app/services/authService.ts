import type { User } from '@training-grounds/shared';
import api from './api';
import { firebaseAuth } from './firebaseAuth';

interface AuthResponse {
  accessToken: string;
  user: User;
}

interface BackendApiResponse<T> {
  success: boolean;
  data: T;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  beltRank: string;
}

export const authService = {
  /**
   * Login flow:
   * 1. Sign in with Firebase Auth (email+password → Firebase ID token)
   * 2. Send Firebase token to backend (→ JWT + user)
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    const firebaseToken = await firebaseAuth.signIn(email, password);
    const response = await api.post<BackendApiResponse<AuthResponse>>('/auth/login', {
      firebaseToken,
    });
    return response.data.data;
  },

  /**
   * Register flow:
   * 1. Create Firebase Auth account (email+password → Firebase ID token)
   * 2. Send Firebase token + name to backend (→ JWT + user)
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    const firebaseToken = await firebaseAuth.signUp(data.email, data.password);
    const response = await api.post<BackendApiResponse<AuthResponse>>('/auth/register', {
      firebaseToken,
      name: data.name,
    });
    return response.data.data;
  },

  /**
   * Apple Sign-In flow:
   * 1. Native Apple auth → Apple credential
   * 2. Exchange for Firebase token via signInWithIdp
   * 3. Try login first; if user not found, register
   */
  async signInWithApple(): Promise<AuthResponse> {
    const appleResult = await firebaseAuth.signInWithApple();

    // Try logging in first (existing user)
    try {
      const response = await api.post<BackendApiResponse<AuthResponse>>('/auth/login', {
        firebaseToken: appleResult.firebaseToken,
      });
      return response.data.data;
    } catch (loginError: unknown) {
      // If user not found, register them
      const isNotFound =
        loginError instanceof Error &&
        (loginError.message.includes('not found') ||
          loginError.message.includes('Please register'));

      if (!isNotFound) {
        // Check axios error response
        const axiosError = loginError as { response?: { data?: { error?: { message?: string } } } };
        const serverMessage = axiosError?.response?.data?.error?.message ?? '';
        if (!serverMessage.includes('not found') && !serverMessage.includes('register')) {
          throw loginError;
        }
      }

      // Register new user with Apple name
      const name = appleResult.fullName || appleResult.email?.split('@')[0] || 'Athlete';
      const response = await api.post<BackendApiResponse<AuthResponse>>('/auth/register', {
        firebaseToken: appleResult.firebaseToken,
        name,
      });
      return response.data.data;
    }
  },

  async getMe(): Promise<User> {
    const response = await api.get<BackendApiResponse<User>>('/auth/me');
    return response.data.data;
  },
};
