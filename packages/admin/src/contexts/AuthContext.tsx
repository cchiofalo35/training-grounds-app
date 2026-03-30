import React, { createContext, useContext, useState, useEffect } from 'react';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import api from '../lib/api';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const token = localStorage.getItem('admin_token');
        if (token) {
          try {
            const res = await api.get('/auth/me');
            const userData = res.data.data;
            if (userData.role === 'admin' || userData.role === 'coach') {
              setUser(userData);
            } else {
              await signOut(auth);
              localStorage.removeItem('admin_token');
              setUser(null);
            }
          } catch {
            localStorage.removeItem('admin_token');
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseToken = await credential.user.getIdToken();

    // Exchange for backend JWT
    const res = await api.post('/auth/login', { firebaseToken });
    const { accessToken, user: userData } = res.data.data;

    if (userData.role !== 'admin' && userData.role !== 'coach') {
      await signOut(auth);
      throw new Error('Access denied. Admin or coach role required.');
    }

    localStorage.setItem('admin_token', accessToken);
    setUser(userData);
  };

  const logout = async () => {
    await signOut(auth);
    localStorage.removeItem('admin_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
