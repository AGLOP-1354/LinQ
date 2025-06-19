import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/contexts/ThemeContext';

export default function LoginScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  const handleLogin = () => {
    // 임시로 탭 화면으로 이동
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background.primary}
      />

      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>로그인</Text>
        <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
          LinQ에 다시 오신 것을 환영합니다
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.colors.primary[500] }]}
        onPress={handleLogin}
      >
        <Text style={[styles.buttonText, { color: theme.colors.text.inverse }]}>로그인</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 60,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
  },
});
