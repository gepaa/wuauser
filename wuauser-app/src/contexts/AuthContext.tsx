import React, { createContext, useState, useContext, ReactNode } from 'react';

interface User {
  email: string;
  profile?: {
    tipo_usuario?: string;
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
  const [isLoading, setIsLoading] = useState(false);

  const signIn = async (email: string, password: string) => {
    console.log('Mock signIn');
    // Por ahora solo simular
    setUser({ email });
  };

  const signOut = async () => {
    console.log('Mock signOut');
    setUser(null);
  };

  const signUp = async (email: string, password: string, metadata?: any) => {
    console.log('Mock signUp');
    return { user: { email } };
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