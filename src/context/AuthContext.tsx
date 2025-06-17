import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as authService from '../services/authService';
import { User } from '../services/authService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  signIn: (username: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  register: (
    username: string, 
    email: string,
    password: string, 
    role: 'teacher' | 'classTeacher' | 'admin', 
    group?: string,
    subjects?: string[]
  ) => Promise<boolean>;
  clearError: () => void;
  checkAuth: () => Promise<boolean>; // Добавленный метод
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  error: null,
  signIn: async () => false,
  signOut: async () => {},
  register: async () => false,
  clearError: () => {},
  checkAuth: async () => false, // Добавлен дефолтный метод
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const [userJson, token] = await Promise.all([
          AsyncStorage.getItem('user'),
          AsyncStorage.getItem('token')
        ]);
        
        if (userJson && token) {
          setUser(JSON.parse(userJson));
        }
      } catch (e) {
        console.error('Failed to load user from storage', e);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  const clearError = () => {
    setError(null);
  };

  const checkAuth = async (): Promise<boolean> => {
    try {
      const token = await AsyncStorage.getItem('token');
      return !!token; // Возвращает true если токен существует
    } catch (error) {
      console.error('Error checking auth:', error);
      return false;
    }
  };

  const signIn = async (username: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      clearError();
      const userData = await authService.login({ username, password });
      setUser(userData);
      return true;
    } catch (err: any) {
      setError(err.toString());
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await authService.logout();
      setUser(null);
    } catch (err: any) {
      setError(err.toString());
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    username: string, 
    email: string,
    password: string, 
    role: 'teacher' | 'classTeacher' | 'admin', 
    group?: string,
    subjects?: string[]
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      clearError();
      const userData = await authService.register({ 
        username, 
        email,
        password, 
        role, 
        group,
        subjects
      });
      setUser(userData);
      return true;
    } catch (err: any) {
      setError(err.toString());
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        signIn,
        signOut,
        register,
        clearError,
        checkAuth, // Добавляем метод в провайдер
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};