import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import LinQLogo from '../../src/components/ui/LinQLogo';
import SocialLoginButton from '../../src/components/ui/SocialLoginButton';
import { createDemoUser, useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { login } = useAuth();

  // 애니메이션 refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 페이지 진입 애니메이션
    Animated.sequence([
      Animated.timing(logoAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const handleSocialLogin = async (provider: 'kakao' | 'google' | 'apple') => {
    try {
      // 실제 소셜 로그인 구현 시에는 해당 SDK를 사용
      // 현재는 데모용으로 가상의 사용자 데이터 생성
      const demoUser = createDemoUser(provider);

      await login(demoUser);

      // AuthGuard에서 자동으로 메인 앱으로 리다이렉트됨
      Alert.alert('로그인 성공', `${provider} 계정으로 로그인되었습니다.`, [{ text: '확인' }]);
    } catch (error) {
      Alert.alert('로그인 실패', '로그인 중 오류가 발생했습니다. 다시 시도해주세요.', [
        { text: '확인' },
      ]);
      console.error('로그인 에러:', error);
    }
  };

  const handleKakaoLogin = () => handleSocialLogin('kakao');
  const handleGoogleLogin = () => handleSocialLogin('google');
  const handleAppleLogin = () => handleSocialLogin('apple');

  const logoScale = logoAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.5, 1.1, 1],
  });

  const logoOpacity = logoAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background.primary}
      />

      <View style={styles.content}>
        {/* 로고 및 브랜드 영역 */}
        <Animated.View
          style={[
            styles.logoSection,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <View style={styles.logoContainer}>
            <LinQLogo size={100} variant={theme.isDark ? 'dark' : 'light'} />
          </View>

          <Animated.View
            style={[
              styles.brandSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={[styles.slogan, { color: theme.colors.text.primary }]}>
              AI와 함께하는 스마트한 일정 관리
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
              자연어로 일정을 등록하고{'\n'}개인화된 추천을 받아보세요
            </Text>
          </Animated.View>
        </Animated.View>

        {/* 소셜 로그인 버튼 영역 */}
        <Animated.View
          style={[
            styles.loginSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.loginContainer}>
            <Text style={[styles.loginTitle, { color: theme.colors.text.primary }]}>
              간편하게 시작하기
            </Text>

            <View style={styles.buttonContainer}>
              <SocialLoginButton provider='kakao' onPress={handleKakaoLogin} />

              <SocialLoginButton provider='google' onPress={handleGoogleLogin} />

              <SocialLoginButton provider='apple' onPress={handleAppleLogin} />
            </View>
          </View>
        </Animated.View>

        {/* 하단 정보 영역 */}
        <Animated.View
          style={[
            styles.footerSection,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <Text style={[styles.termsText, { color: theme.colors.text.tertiary }]}>
            로그인하면{' '}
            <Text style={[styles.linkText, { color: theme.colors.primary[500] }]}>
              개인정보처리방침
            </Text>{' '}
            및{' '}
            <Text style={[styles.linkText, { color: theme.colors.primary[500] }]}>
              서비스 이용약관
            </Text>
            에{'\n'}동의하는 것으로 간주됩니다.
          </Text>

          <View style={styles.versionContainer}>
            <Text style={[styles.versionText, { color: theme.colors.text.tertiary }]}>
              LinQ v1.0.0
            </Text>
          </View>
        </Animated.View>
      </View>

      {/* 배경 그라데이션 효과 */}
      {theme.isDark && (
        <View style={styles.backgroundGradient}>
          <LinearGradient
            colors={['rgba(59, 130, 246, 0.05)', 'rgba(99, 102, 241, 0.03)', 'transparent']}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  logoSection: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  brandSection: {
    alignItems: 'center',
  },
  brandName: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.8,
  },
  slogan: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  loginSection: {
    flex: 2,
    justifyContent: 'center',
  },
  loginContainer: {
    width: '100%',
  },
  loginTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  footerSection: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    minHeight: 80,
  },
  termsText: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 12,
  },
  linkText: {
    fontWeight: '500',
  },
  versionContainer: {
    paddingTop: 4,
  },
  versionText: {
    fontSize: 11,
    textAlign: 'center',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
});
