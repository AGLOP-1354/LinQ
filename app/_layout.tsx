import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import AuthGuard from '../src/components/AuthGuard';
import { AuthProvider } from '../src/contexts/AuthContext';
import { ModalProvider } from '../src/contexts/ModalContext';
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

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <ModalProvider>
            <AuthGuard>
              <StatusBar style='auto' />
              <Stack screenOptions={{ headerShown: false }} initialRouteName='(auth)'>
                <Stack.Screen name='(auth)' />
                <Stack.Screen name='(tabs)' />
              </Stack>
            </AuthGuard>
          </ModalProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
