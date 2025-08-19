import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { authService, dbService } from '../services/supabase';

interface User {
  id: string;
  email: string;
  profile?: {
    tipo_usuario?: string;
    nombre_completo?: string;
    [key: string]: any;
  };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, metadata?: any) => Promise<{ user: User }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const { user: authUser } = await authService.getCurrentUser();
      if (authUser) {
        await loadUserWithProfile(authUser);
      }
    } catch (error) {
      console.log('No existing session found');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserWithProfile = async (authUser: any) => {
    try {
      const { data: profile } = await dbService.getProfile(authUser.id);
      setUser({
        id: authUser.id,
        email: authUser.email,
        profile: profile
      });
    } catch (error) {
      console.error('Error loading profile:', error);
      setUser({
        id: authUser.id,
        email: authUser.email,
        profile: { tipo_usuario: 'dueno' }
      });
    }
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await authService.signIn(email, password);
      if (error) throw error;
      
      if (data?.user) {
        await loadUserWithProfile(data.user);
      }
    } catch (error) {
      console.error('SignIn error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await authService.signOut();
      setUser(null);
    } catch (error) {
      console.error('SignOut error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, metadata?: any) => {
    try {
      const { data, error } = await authService.signUp(email, password, metadata);
      if (error) throw error;
      return { user: { id: data?.user?.id || '', email } };
    } catch (error) {
      console.error('SignUp error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut, signUp }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};