import * as Haptics from 'expo-haptics';
import React from 'react';
import { StyleSheet, Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';

import { useTheme } from '../../contexts/ThemeContext';

interface SocialLoginButtonProps {
  provider: 'kakao' | 'google' | 'apple';
  onPress: () => void;
  disabled?: boolean;
}

// 카카오톡 아이콘 컴포넌트
const KakaoIcon = ({ size = 24 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox='0 0 24 24' fill='none'>
    <Path
      d='M12 3C7.037 3 3 6.375 3 10.5c0 2.625 1.688 4.95 4.275 6.3l-.825 3.038c-.075.262.187.487.412.337L9.9 18.15c.675.075 1.35.112 2.1.112 4.963 0 9-3.375 9-7.5S16.963 3 12 3z'
      fill='#3C1E1E'
    />
  </Svg>
);

// 구글 아이콘 컴포넌트
const GoogleIcon = ({ size = 24 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox='0 0 24 24' fill='none'>
    <G>
      <Path
        d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
        fill='#4285F4'
      />
      <Path
        d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
        fill='#34A853'
      />
      <Path
        d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
        fill='#FBBC05'
      />
      <Path
        d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
        fill='#EA4335'
      />
    </G>
  </Svg>
);

// 애플 아이콘 컴포넌트
const AppleIcon = ({ size = 24, color = '#000' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox='0 0 24 24' fill='none'>
    <Path
      d='M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z'
      fill={color}
    />
  </Svg>
);

export default function SocialLoginButton({
  provider,
  onPress,
  disabled = false,
}: SocialLoginButtonProps) {
  const { theme } = useTheme();
  const scaleValue = useSharedValue(1);

  const getButtonConfig = () => {
    switch (provider) {
      case 'kakao':
        return {
          backgroundColor: '#FEE500',
          textColor: '#3C1E1E',
          text: '카카오톡으로 로그인',
          icon: <KakaoIcon size={20} />,
        };
      case 'google':
        return {
          backgroundColor: '#FFFFFF',
          textColor: '#1F2937',
          text: 'Google로 로그인',
          icon: <GoogleIcon size={20} />,
          borderColor: '#D1D5DB',
        };
      case 'apple':
        return {
          backgroundColor: '#000000',
          textColor: '#FFFFFF',
          text: 'Apple로 로그인',
          icon: <AppleIcon size={20} color='#FFFFFF' />,
        };
      default:
        return {
          backgroundColor: theme.colors.primary[500],
          textColor: theme.colors.text.inverse,
          text: '로그인',
          icon: null,
        };
    }
  };

  const config = getButtonConfig();

  // 애니메이션 스타일
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
  }));

  const handlePressIn = () => {
    if (!disabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      scaleValue.value = withSpring(0.96, {
        damping: 15,
        stiffness: 150,
      });
    }
  };

  const handlePressOut = () => {
    if (!disabled) {
      scaleValue.value = withSpring(1, {
        damping: 15,
        stiffness: 150,
      });
    }
  };

  const handlePress = () => {
    if (!disabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onPress();
    }
  };

  const buttonStyle: ViewStyle = {
    ...styles.button,
    backgroundColor: config.backgroundColor,
    borderColor: config.borderColor || 'transparent',
    borderWidth: config.borderColor ? 1 : 0,
    opacity: disabled ? 0.5 : 1,
  };

  const textStyle: TextStyle = {
    ...styles.buttonText,
    color: config.textColor,
  };

  return (
    <Animated.View style={[buttonStyle, animatedStyle]}>
      <TouchableOpacity
        style={styles.touchable}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={0.9}
        accessibilityRole='button'
        accessibilityLabel={config.text}
        accessibilityHint={`${provider} 계정으로 로그인합니다`}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>{config.icon}</View>
          <Text style={textStyle}>{config.text}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: 12,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  touchable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  iconContainer: {
    position: 'absolute',
    left: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
});
