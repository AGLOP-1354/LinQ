import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  provider: 'kakao' | 'google' | 'apple';
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (user: User) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = '@LinQ:auth_user';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 앱 시작 시 저장된 로그인 정보 확인
  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      setIsLoading(true);
      const storedUser = await AsyncStorage.getItem(AUTH_STORAGE_KEY);

      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      }
    } catch (error) {
      console.error('인증 상태 확인 실패:', error);
      // 에러 발생 시 저장된 데이터 삭제
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (userData: User) => {
    try {
      // 사용자 정보를 AsyncStorage에 저장
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error('로그인 저장 실패:', error);
      throw new Error('로그인 정보 저장에 실패했습니다.');
    }
  };

  const logout = async () => {
    try {
      // AsyncStorage에서 사용자 정보 제거
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      setUser(null);
    } catch (error) {
      console.error('로그아웃 실패:', error);
      // 에러가 발생해도 메모리에서는 사용자 정보 제거
      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth는 AuthProvider 내에서 사용되어야 합니다');
  }
  return context;
}

// 데모용 사용자 데이터 생성 함수
export const createDemoUser = (provider: 'kakao' | 'google' | 'apple'): User => {
  const demoUsers = {
    kakao: {
      id: 'kakao_123456',
      name: '김링큐',
      email: 'user@kakao.com',
      avatar: undefined,
      provider: 'kakao' as const,
    },
    google: {
      id: 'google_123456',
      name: 'LinQ User',
      email: 'user@gmail.com',
      avatar: undefined,
      provider: 'google' as const,
    },
    apple: {
      id: 'apple_123456',
      name: 'LinQ User',
      email: 'user@icloud.com',
      avatar: undefined,
      provider: 'apple' as const,
    },
  };

  return demoUsers[provider];
};
