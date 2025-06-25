import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '../../contexts/ThemeContext';

const { height } = Dimensions.get('window');

interface ParsedEvent {
  title: string;
  startDate: Date;
  endDate?: Date;
  isAllDay: boolean;
  location?: string;
  category?: string;
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  recurring?: {
    type: 'daily' | 'weekly' | 'monthly';
    interval: number;
  };
  confidence: number; // AI 파싱 신뢰도 (0-100)
}

interface SmartSuggestion {
  id: string;
  type: 'template' | 'completion' | 'correction';
  text: string;
  icon: string;
  confidence?: number;
}

interface NaturalLanguageEventDrawerProps {
  visible: boolean;
  onClose: () => void;
  onSave: (event: Omit<ParsedEvent, 'confidence'>) => void;
  initialText?: string;
}

const NaturalLanguageEventDrawer: React.FC<NaturalLanguageEventDrawerProps> = ({
  visible,
  onClose,
  onSave,
  initialText = '',
}) => {
  const { theme } = useTheme();
  const slideAnimation = useSharedValue(height);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // 입력 상태
  const [inputText, setInputText] = useState(initialText);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);

  // 파싱 결과
  const [parsedEvent, setParsedEvent] = useState<ParsedEvent | null>(null);
  const [parsingError, setParsingError] = useState<string | null>(null);

  // 제안 시스템
  const [smartSuggestions, setSmartSuggestions] = useState<SmartSuggestion[]>([]);
  const [recentQueries, setRecentQueries] = useState<string[]>([]);

  // 참조
  const inputRef = useRef<TextInput>(null);
  const debounceTimer = useRef<NodeJS.Timeout>();

  // 스마트 제안 로드 - 입력값에 따라 동적으로 변경
  const loadSmartSuggestions = useCallback((currentInput: string = '') => {
    let suggestions: SmartSuggestion[] = [];

    if (currentInput.length === 0) {
      // 빈 입력일 때 기본 템플릿 제공
      suggestions = [
        {
          id: '1',
          type: 'template',
          text: '내일 오후 2시에 회의',
          icon: 'business-outline',
        },
        {
          id: '2',
          type: 'template',
          text: '매주 월요일 운동',
          icon: 'fitness-outline',
        },
        {
          id: '3',
          type: 'template',
          text: '오늘 저녁 7시에 저녁 약속',
          icon: 'restaurant-outline',
        },
        {
          id: '4',
          type: 'template',
          text: '모레 오전 10시에 병원',
          icon: 'medical-outline',
        },
      ];
    } else {
      // 입력이 있을 때 관련 제안 제공
      const input = currentInput.toLowerCase();

      if (input.includes('회의') || input.includes('미팅')) {
        suggestions.push(
          {
            id: 'meeting1',
            type: 'completion',
            text: '내일 오후 2시에 팀 회의',
            icon: 'business-outline',
          },
          {
            id: 'meeting2',
            type: 'completion',
            text: '오늘 오후 3시에 클라이언트 미팅',
            icon: 'people-outline',
          }
        );
      }

      if (input.includes('운동') || input.includes('헬스') || input.includes('요가')) {
        suggestions.push(
          {
            id: 'workout1',
            type: 'completion',
            text: '매주 월요일 오전 7시 헬스장',
            icon: 'fitness-outline',
          },
          {
            id: 'workout2',
            type: 'completion',
            text: '내일 저녁 6시 요가 클래스',
            icon: 'body-outline',
          }
        );
      }

      if (input.includes('약속') || input.includes('만남') || input.includes('식사')) {
        suggestions.push(
          {
            id: 'social1',
            type: 'completion',
            text: '이번 주말 오후 1시 점심 약속',
            icon: 'restaurant-outline',
          },
          {
            id: 'social2',
            type: 'completion',
            text: '내일 저녁 7시 친구들과 저녁',
            icon: 'happy-outline',
          }
        );
      }

      if (input.includes('병원') || input.includes('치과') || input.includes('검진')) {
        suggestions.push(
          {
            id: 'medical1',
            type: 'completion',
            text: '다음 주 화요일 오전 10시 병원',
            icon: 'medical-outline',
          },
          {
            id: 'medical2',
            type: 'completion',
            text: '모레 오후 2시 치과 예약',
            icon: 'medical-outline',
          }
        );
      }

      // 기본 제안이 없으면 시간 관련 제안 추가
      if (suggestions.length === 0) {
        suggestions = [
          {
            id: 'time1',
            type: 'completion',
            text: '내일 오후 2시에 ' + input,
            icon: 'time-outline',
          },
          {
            id: 'time2',
            type: 'completion',
            text: '오늘 저녁 7시에 ' + input,
            icon: 'time-outline',
          },
          {
            id: 'time3',
            type: 'completion',
            text: '이번 주말에 ' + input,
            icon: 'calendar-outline',
          },
        ];
      }
    }

    setSmartSuggestions(suggestions);
  }, []);

  // 애니메이션 및 키보드 처리
  useEffect(() => {
    if (visible) {
      // 초기화
      setInputText(initialText);
      setParsedEvent(null);
      setParsingError(null);
      setIsProcessing(false);

      // 애니메이션 시작
      slideAnimation.value = withSpring(
        0,
        {
          damping: 15,
          stiffness: 100,
        },
        finished => {
          if (finished) {
            // 애니메이션 완료 후 포커스
            runOnJS(() => {
              setTimeout(() => inputRef.current?.focus(), 100);
            })();
          }
        }
      );

      loadSmartSuggestions(initialText);
    } else {
      slideAnimation.value = withTiming(height, { duration: 300 });
    }
  }, [visible]);

  // 키보드 이벤트 처리
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', e =>
      setKeyboardHeight(e.endCoordinates.height)
    );
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () =>
      setKeyboardHeight(0)
    );

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  // 실시간 자연어 파싱
  useEffect(() => {
    if (inputText.trim().length > 3) {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(() => {
        parseNaturalLanguage(inputText);
      }, 800); // 800ms 디바운스
    } else {
      setParsedEvent(null);
      setParsingError(null);
    }

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [inputText]);

  // 입력값 변경에 따른 스마트 제안 업데이트
  useEffect(() => {
    loadSmartSuggestions(inputText);
  }, [inputText, loadSmartSuggestions]);

  // AI 자연어 파싱 (모의 구현)
  const parseNaturalLanguage = useCallback(async (text: string) => {
    setIsProcessing(true);
    setParsingError(null);

    try {
      // 실제로는 AI API 호출
      await new Promise(resolve => setTimeout(resolve, 1200)); // 모의 지연

      const parsed = await mockNaturalLanguageParser(text);
      setParsedEvent(parsed);

      if (parsed.confidence < 70) {
        setParsingError('입력을 더 명확하게 해주세요. 예: "내일 오후 2시에 회의"');
      }
    } catch (error) {
      setParsingError('일정을 이해하지 못했습니다. 다시 시도해주세요.');
      setParsedEvent(null);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // 모의 자연어 파서
  const mockNaturalLanguageParser = async (text: string): Promise<ParsedEvent> => {
    const today = new Date();
    let confidence = 60;

    // 기본 파싱 로직 (실제로는 더 정교한 NLP/AI 처리)
    const timePatterns = {
      내일: () => {
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        confidence += 20;
        return tomorrow;
      },
      오늘: () => {
        confidence += 20;
        return today;
      },
      모레: () => {
        const dayAfter = new Date(today);
        dayAfter.setDate(today.getDate() + 2);
        confidence += 15;
        return dayAfter;
      },
    };

    let startDate = new Date();

    // 날짜 파싱
    for (const [pattern, dateFunc] of Object.entries(timePatterns)) {
      if (text.includes(pattern)) {
        startDate = dateFunc();
        break;
      }
    }

    // 시간 파싱
    const timeMatch = text.match(/(\d{1,2})시/);
    if (timeMatch) {
      startDate.setHours(parseInt(timeMatch[1]), 0, 0, 0);
      confidence += 15;
    }

    // 제목 추출
    let title = text
      .replace(/(내일|오늘|모레)/g, '')
      .replace(/\d{1,2}시/g, '')
      .replace(/(오전|오후)/g, '')
      .trim();

    if (!title) {
      title = '새 일정';
      confidence -= 20;
    } else {
      confidence += 10;
    }

    // 카테고리 추론
    let category = 'personal';
    const workKeywords = ['회의', '미팅', '업무', '프로젝트', '발표'];
    const healthKeywords = ['운동', '헬스', '요가', '병원', '검진'];

    if (workKeywords.some(keyword => text.includes(keyword))) {
      category = 'work';
      confidence += 10;
    } else if (healthKeywords.some(keyword => text.includes(keyword))) {
      category = 'health';
      confidence += 10;
    }

    // 종료 시간 설정
    const endDate = new Date(startDate);
    endDate.setHours(startDate.getHours() + 1);

    return {
      title,
      startDate,
      endDate,
      isAllDay: false,
      category,
      priority: 'MEDIUM',
      confidence: Math.min(confidence, 95), // 최대 95%
    };
  };

  // 제안 선택
  const handleSuggestionSelect = useCallback(
    (suggestion: SmartSuggestion) => {
      if (inputText.length === 0) {
        // 빈 입력일 때는 전체 텍스트로 교체
        setInputText(suggestion.text);
      } else {
        // 입력이 있을 때는 추가 또는 교체 선택지 제공
        setInputText(suggestion.text);
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [inputText]
  );

  // 음성 입력 토글
  const toggleVoiceMode = useCallback(() => {
    setIsVoiceMode(!isVoiceMode);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!isVoiceMode) {
      // 음성 인식 시작 (실제 구현 시 expo-speech 사용)
      // startVoiceRecognition();
    }
  }, [isVoiceMode]);

  // 저장 처리
  const handleSave = useCallback(() => {
    if (!parsedEvent) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (parsedEvent.confidence < 50) {
      setParsingError('일정 정보가 불명확합니다. 더 자세히 입력해주세요.');
      return;
    }

    // 최근 검색어에 추가
    const newRecentQueries = [inputText, ...recentQueries.filter(q => q !== inputText)].slice(0, 5);
    setRecentQueries(newRecentQueries);

    const eventToSave = {
      title: parsedEvent.title,
      startDate: parsedEvent.startDate,
      endDate: parsedEvent.endDate,
      isAllDay: parsedEvent.isAllDay,
      location: parsedEvent.location,
      category: parsedEvent.category,
      priority: parsedEvent.priority,
      recurring: parsedEvent.recurring,
    };

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave(eventToSave);
    onClose();
  }, [parsedEvent, inputText, recentQueries, onSave, onClose]);

  // 신뢰도에 따른 색상
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return theme.colors.success;
    if (confidence >= 60) return theme.colors.warning;
    return theme.colors.error;
  };

  // 날짜 포맷팅
  const formatDateTime = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    };
    return date.toLocaleDateString('ko-KR', options);
  };

  // 애니메이션 스타일
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideAnimation.value }],
  }));

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />

      <Animated.View
        style={[
          styles.drawer,
          {
            backgroundColor: theme.colors.background.primary,
          },
          animatedStyle,
        ]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <SafeAreaView style={styles.container}>
            {/* 헤더 */}
            <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
              <View style={styles.dragHandle} />

              <View style={styles.headerContent}>
                <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
                  자연어로 일정 추가
                </Text>
                <Text style={[styles.headerSubtitle, { color: theme.colors.text.secondary }]}>
                  "내일 오후 2시에 회의"처럼 자연스럽게 입력하세요
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: theme.colors.surface }]}
                onPress={onClose}
                accessibilityLabel='닫기'
              >
                <Ionicons name='close' size={24} color={theme.colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.content}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps='handled'
            >
              {/* 자연어 입력 영역 */}
              <View style={[styles.inputSection, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.inputContainer}>
                  <TextInput
                    ref={inputRef}
                    style={[
                      styles.input,
                      {
                        color: theme.colors.text.primary,
                        backgroundColor: theme.colors.background.secondary,
                      },
                    ]}
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder='예: 내일 오후 2시에 팀 회의'
                    placeholderTextColor={theme.colors.text.tertiary}
                    multiline
                    numberOfLines={3}
                    autoCorrect={false}
                    autoCapitalize='sentences'
                    accessibilityLabel='일정 입력'
                    accessibilityHint='자연어로 일정을 입력하세요'
                  />

                  <View style={styles.inputActions}>
                    <TouchableOpacity
                      style={[
                        styles.voiceButton,
                        {
                          backgroundColor: isVoiceMode
                            ? theme.colors.primary[500]
                            : theme.colors.surface,
                        },
                      ]}
                      onPress={toggleVoiceMode}
                      accessibilityLabel='음성 입력'
                    >
                      <Ionicons
                        name={isVoiceMode ? 'mic' : 'mic-outline'}
                        size={20}
                        color={
                          isVoiceMode ? theme.colors.text.inverse : theme.colors.text.secondary
                        }
                      />
                    </TouchableOpacity>

                    {inputText.length > 0 && (
                      <TouchableOpacity
                        style={[styles.clearButton, { backgroundColor: theme.colors.surface }]}
                        onPress={() => setInputText('')}
                        accessibilityLabel='입력 내용 지우기'
                      >
                        <Ionicons
                          name='close-circle'
                          size={20}
                          color={theme.colors.text.tertiary}
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* 처리 상태 표시 */}
                {isProcessing && (
                  <View style={styles.processingIndicator}>
                    <ActivityIndicator size='small' color={theme.colors.primary[500]} />
                    <Text style={[styles.processingText, { color: theme.colors.text.secondary }]}>
                      일정을 분석하고 있습니다...
                    </Text>
                  </View>
                )}
              </View>

              {/* 파싱 결과 미리보기 */}
              {parsedEvent && (
                <View style={[styles.previewSection, { backgroundColor: theme.colors.surface }]}>
                  <View style={styles.previewHeader}>
                    <Text style={[styles.previewTitle, { color: theme.colors.text.primary }]}>
                      인식된 일정
                    </Text>
                    <View
                      style={[
                        styles.confidenceBadge,
                        { backgroundColor: getConfidenceColor(parsedEvent.confidence) + '20' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.confidenceText,
                          { color: getConfidenceColor(parsedEvent.confidence) },
                        ]}
                      >
                        {parsedEvent.confidence}% 확신
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.eventPreview,
                      { backgroundColor: theme.colors.background.secondary },
                    ]}
                  >
                    <View style={styles.eventInfo}>
                      <Text style={[styles.eventTitle, { color: theme.colors.text.primary }]}>
                        {parsedEvent.title}
                      </Text>

                      <View style={styles.eventDetails}>
                        <View style={styles.eventDetailRow}>
                          <Ionicons
                            name='time-outline'
                            size={16}
                            color={theme.colors.text.secondary}
                          />
                          <Text
                            style={[styles.eventDetailText, { color: theme.colors.text.secondary }]}
                          >
                            {formatDateTime(parsedEvent.startDate)}
                            {parsedEvent.endDate && ` - ${formatDateTime(parsedEvent.endDate)}`}
                          </Text>
                        </View>

                        {parsedEvent.category && (
                          <View style={styles.eventDetailRow}>
                            <Ionicons
                              name='pricetag-outline'
                              size={16}
                              color={theme.colors.text.secondary}
                            />
                            <Text
                              style={[
                                styles.eventDetailText,
                                { color: theme.colors.text.secondary },
                              ]}
                            >
                              {parsedEvent.category}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[styles.editButton, { backgroundColor: theme.colors.primary[500] }]}
                      onPress={() => {
                        // 수정 모드로 전환 (상세 편집 모달 열기)
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      accessibilityLabel='일정 수정'
                    >
                      <Ionicons name='create-outline' size={18} color={theme.colors.text.inverse} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* 오류 메시지 */}
              {parsingError && (
                <View style={[styles.errorSection, { backgroundColor: theme.colors.error + '10' }]}>
                  <Ionicons name='warning-outline' size={20} color={theme.colors.error} />
                  <Text style={[styles.errorText, { color: theme.colors.error }]}>
                    {parsingError}
                  </Text>
                </View>
              )}

              {/* 스마트 제안 */}
              {showSuggestions && smartSuggestions.length > 0 && (
                <View
                  style={[styles.suggestionsSection, { backgroundColor: theme.colors.surface }]}
                >
                  <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                    {inputText.length === 0 ? '빠른 입력' : '추천 문구'}
                  </Text>

                  <View style={styles.suggestionsGrid}>
                    {smartSuggestions.map(suggestion => (
                      <TouchableOpacity
                        key={suggestion.id}
                        style={[
                          styles.suggestionItem,
                          { backgroundColor: theme.colors.background.secondary },
                        ]}
                        onPress={() => handleSuggestionSelect(suggestion)}
                        accessibilityLabel={`${suggestion.text} 선택`}
                      >
                        <Ionicons
                          name={suggestion.icon as any}
                          size={20}
                          color={theme.colors.primary[500]}
                        />
                        <Text
                          style={[styles.suggestionText, { color: theme.colors.text.secondary }]}
                        >
                          {suggestion.text}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </ScrollView>

            {/* 하단 액션 버튼 */}
            <View
              style={[
                styles.footer,
                {
                  backgroundColor: theme.colors.background.primary,
                  borderTopColor: theme.colors.border,
                  paddingBottom: keyboardHeight > 0 ? 20 : 40,
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  {
                    backgroundColor:
                      parsedEvent && parsedEvent.confidence >= 50
                        ? theme.colors.primary[500]
                        : theme.colors.surfaceDisabled,
                  },
                ]}
                onPress={handleSave}
                disabled={!parsedEvent || parsedEvent.confidence < 50}
                accessibilityLabel='일정 저장'
              >
                <Text
                  style={[
                    styles.saveButtonText,
                    {
                      color:
                        parsedEvent && parsedEvent.confidence >= 50
                          ? theme.colors.text.inverse
                          : theme.colors.text.tertiary,
                    },
                  ]}
                >
                  일정 추가
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  drawer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.9,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 12,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    position: 'relative',
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerContent: {
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 24,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  inputSection: {
    marginTop: 20,
    borderRadius: 16,
    padding: 20,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputActions: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    gap: 8,
  },
  voiceButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingLeft: 4,
  },
  processingText: {
    marginLeft: 8,
    fontSize: 14,
  },
  previewSection: {
    marginTop: 20,
    borderRadius: 16,
    padding: 20,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '500',
  },
  eventPreview: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  eventDetails: {
    gap: 6,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventDetailText: {
    fontSize: 14,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  errorSection: {
    marginTop: 20,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    lineHeight: 20,
  },
  suggestionsSection: {
    marginTop: 20,
    borderRadius: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  suggestionsGrid: {
    gap: 12,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  suggestionText: {
    fontSize: 14,
    flex: 1,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    borderTopWidth: 1,
  },
  saveButton: {
    borderRadius: 16,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default NaturalLanguageEventDrawer;
