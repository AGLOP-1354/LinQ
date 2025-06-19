import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

// 테마 타입 정의
export type ThemeMode = 'light' | 'dark' | 'system';

export interface Theme {
  colors: {
    // Background
    background: {
      primary: string;
      secondary: string;
      tertiary: string;
      card: string;
    };

    // Text
    text: {
      primary: string;
      secondary: string;
      tertiary: string;
      inverse: string;
    };

    // Primary Colors
    primary: {
      50: string;
      100: string;
      500: string;
      600: string;
      700: string;
    };

    // Status Colors
    success: string;
    warning: string;
    error: string;
    info: string;

    // Border & Divider
    border: string;
    divider: string;

    // Shadow
    shadow: string;

    // Interactive
    surface: string;
    surfacePressed: string;
    surfaceDisabled: string;
  };

  // 기타 테마 속성
  isDark: boolean;
}

// 라이트 테마
const lightTheme: Theme = {
  colors: {
    background: {
      primary: '#FFFFFF',
      secondary: '#F9FAFB',
      tertiary: '#F3F4F6',
      card: '#FFFFFF',
    },
    text: {
      primary: '#111827',
      secondary: '#6B7280',
      tertiary: '#9CA3AF',
      inverse: '#FFFFFF',
    },
    primary: {
      50: '#EFF6FF',
      100: '#DBEAFE',
      500: '#3B82F6',
      600: '#2563EB',
      700: '#1D4ED8',
    },
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#06B6D4',
    border: '#E5E7EB',
    divider: '#F3F4F6',
    shadow: 'rgba(0, 0, 0, 0.1)',
    surface: '#FFFFFF',
    surfacePressed: '#F9FAFB',
    surfaceDisabled: '#F3F4F6',
  },
  isDark: false,
};

// 다크 테마
const darkTheme: Theme = {
  colors: {
    background: {
      primary: '#111827',
      secondary: '#1F2937',
      tertiary: '#374151',
      card: '#1F2937',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#D1D5DB',
      tertiary: '#9CA3AF',
      inverse: '#111827',
    },
    primary: {
      50: '#1E3A8A',
      100: '#1E40AF',
      500: '#3B82F6',
      600: '#60A5FA',
      700: '#93C5FD',
    },
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#06B6D4',
    border: '#4B5563',
    divider: '#374151',
    shadow: 'rgba(0, 0, 0, 0.3)',
    surface: '#1F2937',
    surfacePressed: '#374151',
    surfaceDisabled: '#4B5563',
  },
  isDark: true,
};

// 컨텍스트 인터페이스
interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

// 컨텍스트 생성
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// 테마 저장 키
const THEME_STORAGE_KEY = 'user_theme_preference';

// 테마 프로바이더
interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

  // 현재 테마 계산
  const getCurrentTheme = (mode: ThemeMode): Theme => {
    if (mode === 'system') {
      return systemColorScheme === 'dark' ? darkTheme : lightTheme;
    }
    return mode === 'dark' ? darkTheme : lightTheme;
  };

  const [theme, setTheme] = useState<Theme>(() => getCurrentTheme('system'));

  // 테마 모드 변경
  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    setTheme(getCurrentTheme(mode));
    await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
  };

  // 테마 토글 (라이트 ↔ 다크)
  const toggleTheme = () => {
    const newMode = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(newMode);
  };

  // 초기 테마 로드
  useEffect(() => {
    const loadSavedTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
          const mode = savedTheme as ThemeMode;
          setThemeModeState(mode);
          setTheme(getCurrentTheme(mode));
        }
      } catch (error) {
        console.warn('테마 로드 실패:', error);
      }
    };

    loadSavedTheme();
  }, []);

  // 시스템 테마 변경 감지
  useEffect(() => {
    if (themeMode === 'system') {
      setTheme(getCurrentTheme('system'));
    }
  }, [systemColorScheme, themeMode]);

  const value: ThemeContextType = {
    theme,
    themeMode,
    setThemeMode,
    toggleTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

// 테마 훅
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme는 ThemeProvider 내에서 사용되어야 합니다');
  }
  return context;
};
