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
import { Colors, Spacing, BorderRadius, Shadows, Typography, Animations } from '../../constants/design';

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
      color: Colors.primary[500],
      onPress: onManualSchedule,
    },
    {
      id: 'voice',
      title: '음성 입력',
      icon: 'mic',
      color: Colors.error,
      onPress: onVoiceInput,
    },
  ];

  // 3개 버튼 배치: 충분한 간격으로 겹침 방지
  const getPositionForIndex = (index: number) => {
    const positions = [
      { x: -70, y: -20 }, // 좌측
      { x: 0, y: -40 },   // 위
      { x: 70, y: -20 },  // 우측
    ];
    return positions[index] || { x: 0, y: 0 };
  };

  const toggleMenu = () => {
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
        Animated.stagger(80, [
          ...buttonAnims.map(anim =>
            Animated.spring(anim, {
              toValue: 1,
              friction: 8,
              tension: 80,
              useNativeDriver: true,
            })
          ),
        ]),
      ]).start();
    }
    
    setIsOpen(!isOpen);
  };

  const handleActionPress = (action: QuickAction) => {
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
                  style={styles.actionButtonInner}
                  onPress={() => handleActionPress(action)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <View style={[styles.iconContainer, { backgroundColor: action.color }]}>
                    <Ionicons name={action.icon} size={18} color={Colors.text.inverse} />
                  </View>
                </TouchableOpacity>
                
                {/* 라벨 */}
                <Animated.View
                  style={[
                    styles.actionLabel,
                    {
                      opacity: buttonAnims[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 1],
                      }),
                      transform: [
                        {
                          scale: buttonAnims[index],
                        },
                      ],
                    },
                  ]}
                >
                  <Text style={styles.actionLabelText}>{action.title}</Text>
                </Animated.View>
              </Animated.View>
            );
          })}
        </View>
      )}

      {/* 메인 + 버튼 */}
      <TouchableOpacity 
        style={styles.mainButton} 
        onPress={toggleMenu} 
        activeOpacity={0.7}
        hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
      >
        <Animated.View
          style={[
            styles.mainButtonInner,
          ]}
        >
          <Ionicons name={isOpen ? "close" : "add"} size={24} color="#FFFFFF" />
        </Animated.View>
      </TouchableOpacity>
    </>
  );
};

const styles = StyleSheet.create({
  actionContainer: {
    position: 'absolute',
    bottom: 85,
    left: width / 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  actionButton: {
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
  },
  actionButtonInner: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    ...Shadows.md,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    backgroundColor: Colors.gray[800],
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    minWidth: 60,
    alignItems: 'center',
    ...Shadows.sm,
    borderWidth: 0,
    position: 'absolute',
    top: -38,
  },
  actionLabelText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    textAlign: 'center',
  },
  mainButton: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 17,
    left: width / 2 - 28,
    zIndex: 1001,
  },
  mainButtonInner: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.lg,
    borderWidth: 0,
  },
});

export default FloatingActionMenu; 