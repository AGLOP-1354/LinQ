import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { Dimensions, StatusBar, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import LinQLogo from './ui/LinQLogo';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

// 플로팅 파티클 컴포넌트
const FloatingParticle = ({
  delay = 0,
  size = 4,
  duration = 3000,
}: {
  delay?: number;
  size?: number;
  duration?: number;
}) => {
  const translateY = useSharedValue(height + 50);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);

  useEffect(() => {
    const startAnimation = () => {
      translateY.value = withRepeat(
        withSequence(
          withTiming(-50, { duration, easing: Easing.linear }),
          withTiming(height + 50, { duration: 0 })
        ),
        -1
      );

      opacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: duration * 0.1 }),
          withTiming(0.3, { duration: duration * 0.8 }),
          withTiming(0, { duration: duration * 0.1 })
        ),
        -1
      );

      scale.value = withRepeat(
        withSequence(
          withTiming(1, { duration: duration * 0.1 }),
          withTiming(0.8, { duration: duration * 0.9 })
        ),
        -1
      );
    };

    const timeout = setTimeout(startAnimation, delay);
    return () => clearTimeout(timeout);
  }, [delay, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  const randomX = Math.random() * (width - 20) + 10;

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: size,
          height: size,
          left: randomX,
        },
        animatedStyle,
      ]}
    />
  );
};

// AI 브레인 웨이브 애니메이션
const BrainWave = ({ delay = 0 }: { delay?: number }) => {
  const scaleX = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const startAnimation = () => {
      scaleX.value = withRepeat(
        withSequence(withTiming(1, { duration: 1500 }), withTiming(0, { duration: 0 })),
        -1
      );

      opacity.value = withRepeat(
        withSequence(withTiming(0.4, { duration: 200 }), withTiming(0, { duration: 1300 })),
        -1
      );
    };

    const timeout = setTimeout(startAnimation, delay);
    return () => clearTimeout(timeout);
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scaleX: scaleX.value }],
  }));

  return <Animated.View style={[styles.brainWave, animatedStyle]} />;
};

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  // 애니메이션 값들
  const fadeAnim = useSharedValue(0);
  const slideUpAnim = useSharedValue(50);
  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const taglineSlide = useSharedValue(30);
  const glowPulse = useSharedValue(0.5);

  useEffect(() => {
    const startTime = Date.now();
    const minDisplayTime = 3000; // 최소 3초 유지

    const finishSplash = () => {
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minDisplayTime - elapsedTime);

      setTimeout(() => {
        onFinish();
      }, remainingTime);
    };

    // 메인 애니메이션 시퀀스
    fadeAnim.value = withTiming(1, { duration: 600 });

    // 로고 애니메이션 (배경 후)
    logoScale.value = withDelay(600, withSpring(1, { damping: 8, stiffness: 40 }));
    logoOpacity.value = withDelay(600, withTiming(1, { duration: 800 }));
    slideUpAnim.value = withDelay(600, withTiming(0, { duration: 800 }));

    // 텍스트 애니메이션 (로고 후)
    textOpacity.value = withDelay(1400, withTiming(1, { duration: 600 }));
    taglineSlide.value = withDelay(1400, withTiming(0, { duration: 600 }));

    // 글로우 펄스 애니메이션 (로고 등장 후)
    glowPulse.value = withDelay(
      1400,
      withRepeat(
        withSequence(withTiming(1, { duration: 2000 }), withTiming(0.5, { duration: 2000 })),
        -1
      )
    );

    // 애니메이션 완료 후 콜백
    const animationTimeout = setTimeout(() => {
      runOnJS(finishSplash)();
    }, 2400); // 모든 애니메이션 완료 후

    return () => {
      clearTimeout(animationTimeout);
    };
  }, [onFinish]);

  // 애니메이션 스타일들
  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideUpAnim.value }],
  }));

  const logoSectionStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowPulse.value,
  }));

  const textSectionStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: taglineSlide.value }],
  }));

  const footerStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const loadingProgressStyle = useAnimatedStyle(() => ({
    opacity: glowPulse.value,
  }));

  return (
    <View style={styles.container}>
      <StatusBar barStyle='light-content' backgroundColor='transparent' translucent />

      {/* 배경 그라데이션 */}
      <Animated.View style={[styles.background, backgroundStyle]}>
        <LinearGradient
          colors={[
            '#0f0f23', // 다크 네이비
            '#1a1a2e', // 다크 퍼플
            '#16213e', // 미드나잇 블루
            '#0f3460', // 딥 블루
          ]}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* 플로팅 파티클들 */}
      <Animated.View style={[styles.particleContainer, backgroundStyle]}>
        {Array.from({ length: 15 }, (_, i) => (
          <FloatingParticle
            key={i}
            delay={i * 200}
            size={Math.random() * 3 + 2}
            duration={3000 + Math.random() * 2000}
          />
        ))}
      </Animated.View>

      {/* AI 브레인 웨이브 배경 */}
      <Animated.View style={[styles.brainWaveContainer, backgroundStyle]}>
        <BrainWave delay={0} />
        <BrainWave delay={500} />
        <BrainWave delay={1000} />
      </Animated.View>

      {/* 메인 콘텐츠 */}
      <Animated.View style={[styles.content, contentStyle]}>
        {/* 로고 섹션 */}
        <Animated.View style={[styles.logoSection, logoSectionStyle]}>
          {/* 글로우 효과 */}
          <Animated.View style={[styles.logoGlow, glowStyle]} />

          {/* 로고 */}
          <View style={styles.logoContainer}>
            <LinQLogo size={100} variant='light' />
          </View>
        </Animated.View>

        {/* 브랜드 텍스트 */}
        <Animated.View style={[styles.textSection, textSectionStyle]}>
          <Text style={styles.brandName}>LinQ</Text>
          <View style={styles.taglineContainer}>
            <Text style={styles.tagline}>AI-Powered</Text>
            <Text style={styles.taglineMain}>Smart Scheduling</Text>
          </View>
          <Text style={styles.subtitle}>당신의 시간을 더 스마트하게</Text>
        </Animated.View>
      </Animated.View>

      {/* 하단 로딩 및 버전 */}
      <Animated.View style={[styles.footer, footerStyle]}>
        {/* 미니멀 로딩 바 */}
        <View style={styles.loadingBar}>
          <Animated.View style={[styles.loadingProgress, loadingProgressStyle]} />
        </View>

        <Text style={styles.versionText}>v1.0.0 • AI Technology</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  particleContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  particle: {
    position: 'absolute',
    borderRadius: 50,
    backgroundColor: '#64b5f6',
    shadowColor: '#64b5f6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },
  brainWaveContainer: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brainWave: {
    position: 'absolute',
    width: width * 0.8,
    height: 2,
    backgroundColor: '#64b5f6',
    borderRadius: 1,
    shadowColor: '#64b5f6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 3,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logoGlow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(100, 181, 246, 0.1)',
    shadowColor: '#64b5f6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 10,
  },
  logoContainer: {
    padding: 20,
  },
  textSection: {
    alignItems: 'center',
  },
  brandName: {
    fontSize: 42,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 20,
    letterSpacing: -1,
    textShadowColor: 'rgba(100, 181, 246, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  taglineContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  tagline: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64b5f6',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  taglineMain: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  loadingBar: {
    width: 120,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 1,
    marginBottom: 20,
    overflow: 'hidden',
  },
  loadingProgress: {
    width: '60%',
    height: '100%',
    backgroundColor: '#64b5f6',
    borderRadius: 1,
    shadowColor: '#64b5f6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  versionText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '500',
    letterSpacing: 1,
  },
});
