import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useModal } from '../../src/contexts/ModalContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import FloatingActionMenu from '../../src/components/ui/FloatingActionMenu';

// 중앙 플로팅 버튼 컴포넌트 (FloatingActionMenu로 대체)

export default function TabLayout() {
  const { showAddEventModal, handleAISchedule, handleVoiceInput } = useModal();
  const { theme } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary[500],
        tabBarInactiveTintColor: theme.colors.text.tertiary,
        tabBarStyle: {
          backgroundColor: theme.colors.background.card,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          paddingTop: 8,
          paddingBottom: 16,
          height: 70,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name='index'
        options={{
          title: '홈',
          tabBarIcon: ({ color, size }) => <Ionicons name='home' size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name='chat'
        options={{
          title: 'AI 채팅',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name='chatbubbles' size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name='add'
        options={{
          title: '',
          tabBarButton: () => (
            <FloatingActionMenu
              onAISchedule={handleAISchedule}
              onManualSchedule={showAddEventModal}
              onVoiceInput={handleVoiceInput}
            />
          ),
        }}
      />
      <Tabs.Screen
        name='analytics'
        options={{
          title: '분석',
          tabBarIcon: ({ color, size }) => <Ionicons name='bar-chart' size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name='profile'
        options={{
          title: '프로필',
          tabBarIcon: ({ color, size }) => <Ionicons name='person' size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  // FloatingActionMenu 컴포넌트가 자체 스타일을 가지므로 더 이상 필요하지 않음
  viewToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
  },
  toggleButton: {
    padding: 5,
  },
  activeToggle: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
});
