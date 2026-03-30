/**
 * Firebase Auth service using REST API + Apple Sign-In.
 * Works with Firebase Auth Emulator in dev and real Firebase in production.
 */

import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';

const FIREBASE_PROJECT_ID = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? 'training-grounds-app';
const FIREBASE_API_KEY = process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? 'fake-api-key';

// Only use emulator when explicitly configured via env var; otherwise always use real Firebase.
const FIREBASE_EMULATOR_HOST = process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST;
const FIREBASE_AUTH_URL = FIREBASE_EMULATOR_HOST
  ? `http://${FIREBASE_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1`
  : `https://identitytoolkit.googleapis.com/v1`;

interface FirebaseAuthResponse {
  idToken: string;
  email: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
  registered?: boolean;
  displayName?: string;
  fullName?: string;
}

interface FirebaseError {
  error: {
    code: number;
    message: string;
    errors: Array<{ message: string; domain: string; reason: string }>;
  };
}

export class FirebaseAuthError extends Error {
  code: string;

  constructor(firebaseMessage: string) {
    const friendlyMessages: Record<string, string> = {
      EMAIL_EXISTS: 'An account with this email already exists.',
      EMAIL_NOT_FOUND: 'No account found with this email.',
      INVALID_PASSWORD: 'Incorrect password. Please try again.',
      INVALID_LOGIN_CREDENTIALS: 'Invalid email or password.',
      USER_DISABLED: 'This account has been disabled.',
      TOO_MANY_ATTEMPTS_TRY_LATER: 'Too many attempts. Please try again later.',
      WEAK_PASSWORD: 'Password must be at least 6 characters.',
    };

    const message = friendlyMessages[firebaseMessage] ?? `Authentication failed: ${firebaseMessage}`;
    super(message);
    this.code = firebaseMessage;
    this.name = 'FirebaseAuthError';
  }
}

async function firebaseRequest(endpoint: string, body: Record<string, unknown>): Promise<FirebaseAuthResponse> {
  const url = `${FIREBASE_AUTH_URL}/${endpoint}?key=${FIREBASE_API_KEY}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorData = data as FirebaseError;
    throw new FirebaseAuthError(errorData.error?.message ?? 'Unknown error');
  }

  return data as FirebaseAuthResponse;
}

export interface AppleSignInResult {
  firebaseToken: string;
  email: string | null;
  fullName: string | null;
}

export const firebaseAuth = {
  /**
   * Create a new user with email and password.
   * Returns a Firebase ID token to send to the backend.
   */
  async signUp(email: string, password: string): Promise<string> {
    const result = await firebaseRequest('accounts:signUp', {
      email,
      password,
      returnSecureToken: true,
    });
    return result.idToken;
  },

  /**
   * Sign in an existing user with email and password.
   * Returns a Firebase ID token to send to the backend.
   */
  async signIn(email: string, password: string): Promise<string> {
    const result = await firebaseRequest('accounts:signInWithPassword', {
      email,
      password,
      returnSecureToken: true,
    });
    return result.idToken;
  },

  /**
   * Sign in with Apple.
   * Uses Apple's native auth flow, then exchanges the Apple credential
   * for a Firebase ID token via signInWithIdp.
   *
   * Returns the Firebase token plus the user's name/email from Apple
   * (Apple only provides name on first sign-in).
   */
  async signInWithApple(): Promise<AppleSignInResult> {
    // Generate nonce for security
    const nonce = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      Math.random().toString(36) + Date.now().toString(),
    );

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce,
    });

    if (!credential.identityToken) {
      throw new Error('Apple Sign-In failed: no identity token received.');
    }

    // Build full name from Apple credential (only available on first sign-in)
    const fullName = credential.fullName
      ? [credential.fullName.givenName, credential.fullName.familyName]
          .filter(Boolean)
          .join(' ') || null
      : null;

    // Exchange Apple identity token for Firebase token
    const postBody = `id_token=${credential.identityToken}&providerId=apple.com&nonce=${nonce}`;
    const result = await firebaseRequest('accounts:signInWithIdp', {
      postBody,
      requestUri: 'https://training-grounds-app.firebaseapp.com/__/auth/handler',
      returnIdpCredential: true,
      returnSecureToken: true,
    });

    return {
      firebaseToken: result.idToken,
      email: credential.email ?? result.email ?? null,
      fullName,
    };
  },

  /**
   * Check if Apple Sign-In is available on this device.
   */
  async isAppleSignInAvailable(): Promise<boolean> {
    return await AppleAuthentication.isAvailableAsync();
  },
};
