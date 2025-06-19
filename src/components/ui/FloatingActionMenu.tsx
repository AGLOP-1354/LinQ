import React, { useState, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';
import {
  Colors,
  Spacing,
  BorderRadius,
  Shadows,
  Typography,
  Animations,
} from '../../constants/design';

const { width } = Dimensions.get('window');

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
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // 개별 버튼 애니메이션
  const buttonAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  const radius = 80; // 원형 배치 반지름

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

  // 3개 버튼 배치: 더 자연스러운 호형 배치
  const getPositionForIndex = (index: number) => {
    const positions = [
      { x: -80, y: -30 }, // 좌측
      { x: 0, y: -50 }, // 위 (더 높이)
      { x: 80, y: -30 }, // 우측
    ];
    return positions[index] || { x: 0, y: 0 };
  };

  const toggleMenu = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const toValue = isOpen ? 0 : 1;

    if (isOpen) {
      // 닫기 애니메이션 - 더 빠르게
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        ...buttonAnims.map(anim =>
          Animated.timing(anim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          })
        ),
      ]).start();
    } else {
      // 열기 애니메이션 - 더 인터랙티브하게
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.stagger(60, [
          ...buttonAnims.map(anim =>
            Animated.spring(anim, {
              toValue: 1,
              friction: 6,
              tension: 120,
              useNativeDriver: true,
            })
          ),
        ]),
      ]).start();
    }

    setIsOpen(!isOpen);
  };

  const handleActionPress = (action: QuickAction) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // 메뉴 닫기 애니메이션 먼저 실행
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: Animations.duration.fast,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: Animations.duration.fast,
        useNativeDriver: true,
      }),
      ...buttonAnims.map(anim =>
        Animated.timing(anim, {
          toValue: 0,
          duration: Animations.duration.fast,
          useNativeDriver: true,
        })
      ),
    ]).start(() => {
      setIsOpen(false);
      action.onPress();
    });
  };

  return (
    <>
      {/* 퀵 액션 버튼들 */}
      {isOpen && (
        <View style={styles.actionContainer}>
          {quickActions.map((action, index) => {
            const position = getPositionForIndex(index);
            return (
              <Animated.View
                key={action.id}
                style={[
                  styles.actionButton,
                  {
                    transform: [
                      {
                        scale: buttonAnims[index],
                      },
                      {
                        translateX: buttonAnims[index].interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, position.x],
                        }),
                      },
                      {
                        translateY: buttonAnims[index].interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, position.y],
                        }),
                      },
                    ],
                    opacity: buttonAnims[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 1],
                    }),
                  },
                ]}
              >
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
                <View
                  style={[styles.actionLabel, { backgroundColor: theme.colors.background.card }]}
                >
                  <Text style={[styles.actionLabelText, { color: theme.colors.text.primary }]}>
                    {action.title}
                  </Text>
                </View>
              </Animated.View>
            );
          })}
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
        >
          <Animated.View
            style={{
              transform: [
                {
                  rotate: opacityAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '45deg'],
                  }),
                },
              ],
            }}
          >
            <Ionicons name={isOpen ? 'add' : 'close'} size={28} color={theme.colors.text.inverse} />
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
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
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
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
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
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
});

export default FloatingActionMenu;
