import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { useModal } from '../../src/contexts/ModalContext';
import { useTheme } from '../../src/contexts/ThemeContext';

export default function TabLayout() {
  const { showAddEventModal } = useModal();
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
            <TouchableOpacity
              style={[styles.centerButton, { backgroundColor: theme.colors.primary[500] }]}
              onPress={showAddEventModal}
              activeOpacity={0.8}
            >
              <Ionicons name='add' size={24} color='#FFFFFF' />
            </TouchableOpacity>
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
  centerButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -20,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
});
