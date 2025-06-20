import { useRouter, useSegments } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const segments = useSegments();

  React.useEffect(() => {
    if (isLoading) return; // 로딩 중일 때는 아무것도 하지 않음

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // 로그인되지 않았고 auth 그룹이 아닌 경우 로그인 페이지로 이동
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // 로그인되었고 auth 그룹에 있는 경우 메인 앱으로 이동
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments]);

  // 로딩 중일 때 보여줄 스플래시 화면
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background.primary }]}>
        <ActivityIndicator size='large' color={theme.colors.primary[500]} />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
