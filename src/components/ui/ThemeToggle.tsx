import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '../../contexts/ThemeContext';

interface ThemeToggleProps {
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  style?: any;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  size = 'medium',
  showLabel = true,
  style,
}) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme.isDark;

  // 애니메이션 값 - Reanimated
  const toggleAnimation = useSharedValue(isDark ? 1 : 0);

  // 크기별 스타일
  const sizes = {
    small: { width: 44, height: 24, iconSize: 14 },
    medium: { width: 52, height: 28, iconSize: 16 },
    large: { width: 60, height: 32, iconSize: 18 },
  };

  const currentSize = sizes[size];

  React.useEffect(() => {
    toggleAnimation.value = withTiming(isDark ? 1 : 0, { duration: 300 });
  }, [isDark]);

  const handleToggle = () => {
    toggleTheme();
  };

  // 애니메이션 스타일들
  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      toggleAnimation.value,
      [0, 1],
      [theme.colors.border, theme.colors.primary[500]]
    ),
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      toggleAnimation.value,
      [0, 1],
      [theme.colors.text.secondary, theme.colors.text.inverse]
    ),
    transform: [
      {
        translateX: interpolate(
          toggleAnimation.value,
          [0, 1],
          [2, currentSize.width - currentSize.height + 2]
        ),
      },
    ],
  }));

  return (
    <View style={[styles.container, style]}>
      {showLabel && (
        <Text style={[styles.label, { color: theme.colors.text.secondary }]}>다크 모드</Text>
      )}

      <TouchableOpacity
        onPress={handleToggle}
        activeOpacity={0.8}
        accessibilityRole='switch'
        accessibilityState={{ checked: isDark }}
        accessibilityLabel={`다크 모드 ${isDark ? '켜짐' : '꺼짐'}`}
      >
        <Animated.View
          style={[
            styles.track,
            {
              width: currentSize.width,
              height: currentSize.height,
            },
            trackStyle,
          ]}
        >
          <Animated.View
            style={[
              styles.thumb,
              {
                width: currentSize.height - 4,
                height: currentSize.height - 4,
              },
              thumbStyle,
            ]}
          >
            <Ionicons
              name={isDark ? 'moon' : 'sunny'}
              size={currentSize.iconSize}
              color={isDark ? theme.colors.primary[500] : theme.colors.warning}
            />
          </Animated.View>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 12,
  },
  track: {
    borderRadius: 999,
    justifyContent: 'center',
    position: 'relative',
  },
  thumb: {
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
