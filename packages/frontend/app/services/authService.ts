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

  async getMe(): Promise<User> {
    const response = await api.get<BackendApiResponse<User>>('/auth/me');
    return response.data.data;
  },
};
