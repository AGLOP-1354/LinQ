import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { View } from 'react-native';
import AuthGuard from '../src/components/AuthGuard';
import FloatingActionMenu from '../src/components/ui/FloatingActionMenu';

import { AuthProvider } from '../src/contexts/AuthContext';
import { ModalProvider, useModal } from '../src/contexts/ModalContext';
import { ThemeProvider } from '../src/contexts/ThemeContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5분
      gcTime: 1000 * 60 * 30, // 30분
      retry: 1,
    },
  },
});

// FloatingActionMenu를 포함하는 내부 컴포넌트
function AppContent() {
  const { showAddEventModal, handleAISchedule, handleVoiceInput } = useModal();
  const segments = useSegments();

  // 탭 화면에서만 FloatingActionMenu 표시
  const isTabsScreen = segments[0] === '(tabs)';

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style='auto' />
      <Stack screenOptions={{ headerShown: false }} initialRouteName='(auth)'>
        <Stack.Screen name='(auth)' />
        <Stack.Screen name='(tabs)' />
      </Stack>
      {isTabsScreen && (
        <FloatingActionMenu
          onAISchedule={handleAISchedule}
          onManualSchedule={showAddEventModal}
          onVoiceInput={handleVoiceInput}
        />
      )}
    </View>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <ModalProvider>
            <AuthGuard>
              <AppContent />
            </AuthGuard>
          </ModalProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
