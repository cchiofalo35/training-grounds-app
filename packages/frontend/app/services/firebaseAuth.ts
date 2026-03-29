/**
 * Firebase Auth service using REST API.
 * Works with Firebase Auth Emulator in dev and real Firebase in production.
 *
 * For React Native, we use the REST API directly instead of the Firebase JS SDK
 * to avoid native module complexity during early development.
 */

const FIREBASE_PROJECT_ID = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? 'training-grounds-app';
const FIREBASE_API_KEY = process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? 'fake-api-key';

// In dev, point to the emulator. Use machine IP so device/simulator can reach it.
// In production, use the real Firebase endpoint.
const FIREBASE_EMULATOR_HOST = process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST ?? '127.0.0.1:9099';
const FIREBASE_AUTH_URL = __DEV__
  ? `http://${FIREBASE_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1`
  : `https://identitytoolkit.googleapis.com/v1`;

interface FirebaseAuthResponse {
  idToken: string;
  email: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
  registered?: boolean;
}

interface FirebaseError {
  error: {
    code: number;
    message: string;
    errors: Array<{ message: string; domain: string; reason: string }>;
  };
}

class FirebaseAuthError extends Error {
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
};
