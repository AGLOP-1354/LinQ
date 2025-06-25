import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '../../contexts/ThemeContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface QuickAction {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
}

interface FloatingActionMenuProps {
  onAISchedule: () => void;
  onManualSchedule: () => void;
  onVoiceInput: () => void;
}

const FloatingActionMenu: React.FC<FloatingActionMenuProps> = ({
  onAISchedule,
  onManualSchedule,
  onVoiceInput,
}) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  // Reanimated shared values
  const scaleAnim = useSharedValue(0);
  const opacityAnim = useSharedValue(0);
  const button1Anim = useSharedValue(0);
  const button2Anim = useSharedValue(0);
  const button3Anim = useSharedValue(0);

  const buttonAnims = [button1Anim, button2Anim, button3Anim];

  // 3개 버튼 배치: 더 자연스러운 호형 배치
  const getPositionForIndex = (index: number) => {
    const positions = [
      { x: -80, y: -30 }, // 좌측
      { x: 0, y: -50 }, // 위 (더 높이)
      { x: 80, y: -30 }, // 우측
    ];
    return positions[index] || { x: 0, y: 0 };
  };

  // 애니메이션 스타일들을 미리 생성 (hooks 규칙 준수)
  const actionButtonStyles = buttonAnims.map((anim, index) => {
    const position = getPositionForIndex(index);
    return useAnimatedStyle(() => {
      return {
        opacity: anim.value,
        transform: [
          { scale: interpolate(anim.value, [0, 1], [0.8, 1]) }, // 시작 스케일을 0.8로 조정 (덜 극적)
          { translateX: interpolate(anim.value, [0, 1], [0, position.x]) },
          { translateY: interpolate(anim.value, [0, 1], [0, position.y]) },
        ],
      };
    });
  });

  // FAB 아이콘 회전 애니메이션 스타일 - 제거됨 (더 이상 회전하지 않음)
  const fabIconStyle = useAnimatedStyle(() => ({
    opacity: 1, // 단순히 불투명도만 관리
  }));

  const quickActions: QuickAction[] = [
    {
      id: 'ai',
      title: 'AI 일정',
      icon: 'sparkles',
      color: '#8B5CF6',
      onPress: onAISchedule,
    },
    {
      id: 'manual',
      title: '수기 등록',
      icon: 'create-outline',
      color: theme.colors.primary[500],
      onPress: onManualSchedule,
    },
    {
      id: 'voice',
      title: '음성 입력',
      icon: 'mic',
      color: theme.colors.error,
      onPress: onVoiceInput,
    },
  ];

  const toggleMenu = () => {
    // 햅틱 피드백을 약하게 조정
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (isOpen) {
      // 닫기 애니메이션 - 더 빠르고 부드럽게
      scaleAnim.value = withTiming(0, { duration: 150 });
      opacityAnim.value = withTiming(0, { duration: 120 });
      buttonAnims.forEach(anim => {
        anim.value = withTiming(0, { duration: 120 });
      });
    } else {
      // 열기 애니메이션 - 더 차분하게
      opacityAnim.value = withTiming(1, { duration: 150 });
      buttonAnims.forEach((anim, index) => {
        anim.value = withDelay(
          index * 40, // 딜레이 줄임 (60ms → 40ms)
          withSpring(1, {
            damping: 12, // 더 부드럽게 (6 → 12)
            stiffness: 80, // 덜 탄력적으로 (120 → 80)
          })
        );
      });
    }

    setIsOpen(!isOpen);
  };

  const handleActionPress = (action: QuickAction) => {
    // 햅틱 피드백 제거 (너무 과도함)
    // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // 메뉴 닫기 애니메이션 - 더 빠르고 부드럽게
    scaleAnim.value = withTiming(0, { duration: 100 });
    opacityAnim.value = withTiming(0, { duration: 100 });

    // 첫 번째 애니메이션에만 완료 콜백 추가
    buttonAnims[0].value = withTiming(0, { duration: 100 }, finished => {
      if (finished) {
        runOnJS(setIsOpen)(false);
        runOnJS(action.onPress)();
      }
    });

    // 나머지 애니메이션은 콜백 없이
    for (let i = 1; i < buttonAnims.length; i++) {
      buttonAnims[i].value = withTiming(0, { duration: 100 });
    }
  };

  return (
    <>
      {/* 퀵 액션 버튼들 */}
      {isOpen && (
        <View style={styles.actionContainer}>
          {quickActions.map((action, index) => (
            <Animated.View key={action.id} style={[styles.actionButton, actionButtonStyles[index]]}>
              <TouchableOpacity
                style={[
                  styles.actionButtonInner,
                  {
                    backgroundColor: theme.colors.background.card,
                    shadowColor: theme.colors.shadow,
                  },
                ]}
                onPress={() => handleActionPress(action)}
                activeOpacity={0.8}
              >
                <Ionicons name={action.icon} size={20} color={action.color} />
              </TouchableOpacity>

              {/* 액션 라벨 */}
              <View style={[styles.actionLabel, { backgroundColor: theme.colors.background.card }]}>
                <Text style={[styles.actionLabelText, { color: theme.colors.text.primary }]}>
                  {action.title}
                </Text>
              </View>
            </Animated.View>
          ))}
        </View>
      )}

      {/* 메인 FAB */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={[
            styles.fab,
            {
              backgroundColor: theme.colors.primary[500],
              shadowColor: theme.colors.shadow,
            },
          ]}
          onPress={toggleMenu}
          activeOpacity={0.9}
          accessibilityLabel='일정 추가 메뉴'
          accessibilityHint='AI 일정, 수기 등록, 음성 입력 옵션을 제공합니다'
        >
          <Animated.View style={[styles.fabIcon, fabIconStyle]}>
            <Ionicons name={isOpen ? 'close' : 'add'} size={28} color='#FFFFFF' />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  actionContainer: {
    position: 'absolute',
    bottom: 85,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    pointerEvents: 'box-none', // 자식 요소만 터치 가능하도록 설정
  },
  actionButton: {
    position: 'absolute',
    alignItems: 'center',
  },
  actionButtonInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionLabel: {
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionLabelText: {
    fontSize: 12,
    fontWeight: '600',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 25,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    pointerEvents: 'box-none', // 자식 요소만 터치 가능하도록 설정
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  fabIcon: {
    opacity: 1, // 단순히 불투명도만 관리
  },
});

export default FloatingActionMenu;
