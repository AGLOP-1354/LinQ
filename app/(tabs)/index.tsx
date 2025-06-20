import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    Pressable,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import AddEventModal from '../../src/components/forms/AddEventModal';
import NaturalLanguageEventDrawer from '../../src/components/forms/NaturalLanguageEventDrawer';
import FloatingActionMenu from '../../src/components/ui/FloatingActionMenu';
import { useModal } from '../../src/contexts/ModalContext';
import { useTheme } from '../../src/contexts/ThemeContext';

const { width, height } = Dimensions.get('window');
const CALENDAR_PADDING = 16; // 캘린더 좌우 패딩
const CELL_SIZE = (width - CALENDAR_PADDING * 2) / 7; // 좌우 패딩을 제외한 폭 사용
const CELL_HEIGHT = (height - 200) / 5; // 가용 영역을 5주로 나누어 동일한 높이

type ViewType = 'list' | 'calendar';

interface Event {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  isAllDay: boolean;
  color: string;
  location?: string;
  notifications: string[];
  category: 'work' | 'health' | 'social' | 'personal';
  isCompleted?: boolean; // 완료 상태 추가
  // 호환성을 위한 추가 필드들
  time?: string; // 기존 샘플 데이터 호환용
  date?: string; // 기존 샘플 데이터 호환용
  priority?: 'HIGH' | 'MEDIUM' | 'LOW'; // 기존 샘플 데이터 호환용
}

const sampleEvents: Event[] = [
  {
    id: '1',
    title: '팀 스탠드업',
    startDate: new Date(new Date().setHours(9, 0, 0, 0)),
    endDate: new Date(new Date().setHours(9, 30, 0, 0)),
    isAllDay: false,
    color: '#3B82F6',
    location: '회의실 A',
    notifications: ['15_min'],
    category: 'work',
    isCompleted: true, // 과거 일정은 완료로 설정
    time: '09:00',
    date: new Date().toISOString().split('T')[0],
    priority: 'HIGH',
  },
  {
    id: '2',
    title: '프로젝트 리뷰',
    startDate: new Date(new Date().setHours(14, 0, 0, 0)),
    endDate: new Date(new Date().setHours(15, 0, 0, 0)),
    isAllDay: false,
    color: '#3B82F6',
    location: '온라인',
    notifications: ['1_hour'],
    category: 'work',
    isCompleted: false, // 오늘 예정 일정
    time: '14:00',
    date: new Date().toISOString().split('T')[0],
    priority: 'HIGH',
  },
  {
    id: '3',
    title: '점심 약속',
    startDate: new Date(new Date().setHours(12, 30, 0, 0)),
    endDate: new Date(new Date().setHours(13, 30, 0, 0)),
    isAllDay: false,
    color: '#F59E0B',
    location: '강남역',
    notifications: ['15_min'],
    category: 'social',
    isCompleted: true, // 점심은 보통 완료됨
    time: '12:30',
    date: new Date().toISOString().split('T')[0],
    priority: 'MEDIUM',
  },
  {
    id: '4',
    title: '요가 클래스',
    startDate: new Date(new Date().setHours(18, 0, 0, 0)),
    endDate: new Date(new Date().setHours(19, 0, 0, 0)),
    isAllDay: false,
    color: '#10B981',
    location: '피트니스',
    notifications: ['30_min'],
    category: 'health',
    isCompleted: false, // 오늘 저녁 예정
    time: '18:00',
    date: new Date().toISOString().split('T')[0],
    priority: 'LOW',
  },
  {
    id: '5',
    title: '치과 검진',
    startDate: new Date(new Date(Date.now() + 24 * 60 * 60 * 1000).setHours(10, 30, 0, 0)),
    endDate: new Date(new Date(Date.now() + 24 * 60 * 60 * 1000).setHours(11, 0, 0, 0)),
    isAllDay: false,
    color: '#10B981',
    location: '강남 치과',
    notifications: ['1_hour'],
    category: 'health',
    isCompleted: false, // 내일 예정
    time: '10:30',
    date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    priority: 'HIGH',
  },
  {
    id: '6',
    title: '친구들과 브런치',
    startDate: new Date(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).setHours(11, 0, 0, 0)),
    endDate: new Date(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).setHours(12, 30, 0, 0)),
    isAllDay: false,
    color: '#F59E0B',
    location: '카페 더블유',
    notifications: ['15_min'],
    category: 'social',
    isCompleted: false, // 미래 예정
    time: '11:00',
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    priority: 'LOW',
  },
  {
    id: '7',
    title: '독서 모임',
    startDate: new Date(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).setHours(19, 30, 0, 0)),
    endDate: new Date(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).setHours(21, 0, 0, 0)),
    isAllDay: false,
    color: '#8B5CF6',
    location: '북카페',
    notifications: ['15_min'],
    category: 'personal',
    isCompleted: false, // 미래 예정
    time: '19:30',
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    priority: 'MEDIUM',
  },
  {
    id: '8',
    title: '헬스장',
    startDate: new Date(new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).setHours(7, 0, 0, 0)),
    endDate: new Date(new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).setHours(8, 0, 0, 0)),
    isAllDay: false,
    color: '#10B981',
    location: '24시 헬스장',
    notifications: ['15_min'],
    category: 'health',
    isCompleted: false, // 내일 예정
    time: '07:00',
    date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    priority: 'MEDIUM',
  },
];

type FilterType = 'all' | 'completed' | 'upcoming';

export default function HomeScreen() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [allEvents, setAllEvents] = useState<Event[]>(sampleEvents);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedDayEvents, setSelectedDayEvents] = useState<Event[]>([]);
  const [viewType, setViewType] = useState<ViewType>('calendar');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [isNaturalLanguageDrawerVisible, setIsNaturalLanguageDrawerVisible] = useState(false);
  const { isAddEventModalVisible, hideAddEventModal, showAddEventModal } = useModal();
  const { theme } = useTheme();

  const slideAnim = useRef(new Animated.Value(height)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const scrollX = useRef(new Animated.Value(0)).current;

  // 컴포넌트 언마운트 시 애니메이션 정리
  useEffect(() => {
    return () => {
      slideAnim.stopAnimation();
      overlayAnim.stopAnimation();
      scrollX.stopAnimation();
    };
  }, [slideAnim, overlayAnim, scrollX]);

  const getCategoryColor = useCallback((category: string) => {
    const colors = {
      work: '#3B82F6',
      health: '#10B981',
      social: '#F59E0B',
      personal: '#8B5CF6',
    };
    return colors[category as keyof typeof colors] || '#6B7280';
  }, []);

  const getPriorityColor = useCallback((priority: string) => {
    switch (priority) {
      case 'HIGH':
        return '#EF4444';
      case 'MEDIUM':
        return '#F59E0B';
      case 'LOW':
        return '#10B981';
      default:
        return '#6B7280';
    }
  }, []);

  const getCategoryLabel = useCallback((category: string) => {
    switch (category) {
      case 'work':
        return '업무';
      case 'health':
        return '건강';
      case 'social':
        return '사교';
      case 'personal':
        return '개인';
      default:
        return '기타';
    }
  }, []);

  const getEventsForDate = useCallback(
    (date: string) => {
      return allEvents.filter(event => {
        // 새로운 구조에서는 startDate를 사용하고, 호환성을 위해 date 필드도 확인
        if (event.date) {
          return event.date === date;
        }
        // startDate로부터 날짜 문자열 생성
        const eventDateString = event.startDate.toISOString().split('T')[0];
        return eventDateString === date;
      });
    },
    [allEvents]
  );

  const getTodayEvents = useCallback(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return getEventsForDate(todayStr);
  }, [getEventsForDate]);

  const getFilteredEvents = useCallback(
    (events: Event[]) => {
      switch (filterType) {
        case 'completed':
          return events.filter(event => event.isCompleted);
        case 'upcoming':
          return events.filter(event => !event.isCompleted);
        default:
          return events;
      }
    },
    [filterType]
  );

  const getEventStats = useCallback(() => {
    const todayEvents = getTodayEvents();
    const total = todayEvents.length;
    const completed = todayEvents.filter(event => event.isCompleted).length;
    const upcoming = total - completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, upcoming, completionRate };
  }, [getTodayEvents]);

  const openDrawer = useCallback(
    (dateString: string, events: Event[]) => {
      setSelectedDate(dateString);
      setSelectedDayEvents(events);
      setDrawerVisible(true);

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    },
    [slideAnim, overlayAnim]
  );

  const closeDrawer = useCallback(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: height,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.timing(overlayAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setDrawerVisible(false);
      setSelectedDate(null);
      setSelectedDayEvents([]);
    });

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [slideAnim, overlayAnim]);

  const handleAddEvent = useCallback((newEvent: Omit<Event, 'id'>) => {
    const eventWithId = {
      ...newEvent,
      id: Date.now().toString(),
      // 호환성을 위한 추가 필드들
      time: newEvent.startDate.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      date: newEvent.startDate.toISOString().split('T')[0],
      priority: 'MEDIUM' as const,
      isCompleted: false, // 완료 상태 추가
    };
    setAllEvents(prev => [...prev, eventWithId]);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  // 자연어 드로어 관련 함수들
  const handleOpenNaturalLanguageDrawer = useCallback(() => {
    setIsNaturalLanguageDrawerVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleCloseNaturalLanguageDrawer = useCallback(() => {
    setIsNaturalLanguageDrawerVisible(false);
  }, []);

  const handleNaturalLanguageEventSave = useCallback((event: any) => {
    const eventWithId = {
      ...event,
      id: Date.now().toString(),
      // 호환성을 위한 추가 필드들
      time: event.startDate.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      date: event.startDate.toISOString().split('T')[0],
      priority: event.priority || 'MEDIUM' as const,
      isCompleted: false,
      // 자연어 파싱 결과에서 누락될 수 있는 필드들의 기본값
      notifications: event.notifications || ['15_min'],
      color: event.color || getCategoryColor(event.category || 'personal'),
    };

    setAllEvents(prev => [...prev, eventWithId]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [getCategoryColor]);

  // FloatingActionMenu 핸들러들
  const handleManualSchedule = useCallback(() => {
    showAddEventModal();
  }, [showAddEventModal]);

  const handleVoiceInput = useCallback(() => {
    // 음성 입력으로 자연어 드로어 열기
    setIsNaturalLanguageDrawerVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const toggleEventCompletion = useCallback((eventId: string) => {
    setAllEvents(prev =>
      prev.map(event =>
        event.id === eventId ? { ...event, isCompleted: !event.isCompleted } : event
      )
    );

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  // 한국식 요일 (일요일 시작)
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  // 현재 달의 캘린더 데이터 생성 (5주만)
  const renderCalendar = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const weeks = [];
    const currentWeekDate = new Date(startDate);

    // 5주간의 달력 생성
    for (let week = 0; week < 5; week++) {
      const weekDays = [];
      for (let day = 0; day < 7; day++) {
        const date = new Date(currentWeekDate);
        const dateString = date.toISOString().split('T')[0];
        const dayEvents = getEventsForDate(dateString);
        const isCurrentMonth = date.getMonth() === month;
        const isToday = dateString === new Date().toISOString().split('T')[0];

        weekDays.push({
          date: date,
          dateString: dateString,
          events: dayEvents,
          isCurrentMonth: isCurrentMonth,
          isToday: isToday,
        });

        currentWeekDate.setDate(currentWeekDate.getDate() + 1);
      }
      weeks.push(weekDays);
    }

    return weeks.map((week, weekIndex) => (
      <View key={weekIndex} style={styles.weekRow}>
        {week.map((day, dayIndex) => (
          <Pressable
            key={dayIndex}
            style={[
              styles.dayCell,
              { backgroundColor: theme.colors.background.primary },
              !day.isCurrentMonth && styles.otherMonthCell,
            ]}
            onPress={() => {
              openDrawer(day.dateString, day.events);
            }}
            android_ripple={{
              color: theme.colors.primary[100],
              borderless: false,
            }}
          >
            {/* 날짜 숫자 */}
            <View style={styles.dayHeader}>
              <View style={styles.dayNumberContainer}>
                <View
                  style={[
                    styles.dayNumberBackground,
                    day.isToday && {
                      backgroundColor: theme.colors.primary[500],
                      transform: [{ scale: 1.05 }],
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.dayNumber,
                      { color: theme.colors.text.primary },
                      !day.isCurrentMonth && {
                        color: theme.colors.text.tertiary,
                        opacity: 0.4,
                      },
                      day.isToday && {
                        color: '#FFFFFF',
                        fontWeight: '900',
                      },
                      dayIndex === 0 && day.isCurrentMonth && !day.isToday && { color: '#EF4444' },
                      dayIndex === 6 &&
                        day.isCurrentMonth &&
                        !day.isToday && { color: theme.colors.primary[600] },
                    ]}
                  >
                    {day.date.getDate()}
                  </Text>
                </View>
                {day.isToday && (
                  <View style={[styles.todayDot, { backgroundColor: theme.colors.primary[500] }]} />
                )}
              </View>
            </View>

            {/* 이벤트 미니 카드들 (동적 개수) */}
            <View style={styles.eventsContainer}>
              {(() => {
                const availableHeight = CELL_HEIGHT - 18 - 3 - 6; // 총 높이 - 헤더 - 패딩 - 여백
                const cardHeight = 16; // 카드 높이 + 마진
                const maxEvents = Math.floor(availableHeight / cardHeight);
                const visibleEvents = Math.max(
                  1,
                  maxEvents - (day.events.length > maxEvents ? 1 : 0)
                );

                return (
                  <>
                    {day.events.slice(0, visibleEvents).map((event, eventIndex) => (
                      <View
                        key={event.id}
                        style={[
                          styles.miniEventCard,
                          { backgroundColor: getCategoryColor(event.category) },
                        ]}
                      >
                        <Text style={styles.miniEventTitle} numberOfLines={1}>
                          {event.title}
                        </Text>
                      </View>
                    ))}

                    {day.events.length > visibleEvents && (
                      <View
                        style={[
                          styles.moreEventsIndicator,
                          { backgroundColor: theme.colors.surface },
                        ]}
                      >
                        <Text
                          style={[styles.moreEventsText, { color: theme.colors.text.secondary }]}
                        >
                          외 {day.events.length - visibleEvents}개
                        </Text>
                      </View>
                    )}
                  </>
                );
              })()}
            </View>
          </Pressable>
        ))}
      </View>
    ));
  }, [currentDate, allEvents, theme, getCategoryColor, getEventsForDate, openDrawer]);

  const formatSelectedDate = useMemo(() => {
    if (!selectedDate) return '';
    try {
      const date = new Date(selectedDate);
      if (isNaN(date.getTime())) return selectedDate;
      return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
    } catch (error) {
      return selectedDate;
    }
  }, [selectedDate]);

  // 월 데이터 생성 (현재 월 기준 ±3개월)
  const generateMonthsData = useCallback(() => {
    const months = [];
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    for (let i = -3; i <= 3; i++) {
      const date = new Date(currentYear, currentMonth + i, 1);
      months.push({
        date,
        key: `${date.getFullYear()}-${date.getMonth()}`,
        year: date.getFullYear(),
        month: date.getMonth(),
      });
    }

    return months;
  }, [currentDate]);

  const monthsData = generateMonthsData();
  const currentMonthIndex = 3; // 현재 월의 인덱스

  const onMomentumScrollEnd = useCallback(
    (event: any) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / width);
      const newMonth = monthsData[index];

      if (newMonth && index !== currentMonthIndex) {
        setCurrentDate(newMonth.date);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    },
    [monthsData, currentMonthIndex]
  );

  const renderMonth = useCallback(
    (monthData: any) => {
      const year = monthData.date.getFullYear();
      const month = monthData.date.getMonth();

      const firstDay = new Date(year, month, 1);
      const startDate = new Date(firstDay);
      startDate.setDate(startDate.getDate() - firstDay.getDay());

      const weeks = [];
      const currentWeekDate = new Date(startDate);

      // 5주간의 달력 생성
      for (let week = 0; week < 5; week++) {
        const weekDays = [];
        for (let day = 0; day < 7; day++) {
          const date = new Date(currentWeekDate);
          const dateString = date.toISOString().split('T')[0];
          const dayEvents = getEventsForDate(dateString);
          const isCurrentMonth = date.getMonth() === month;
          const isToday = dateString === new Date().toISOString().split('T')[0];

          weekDays.push({
            date: date,
            dateString: dateString,
            events: dayEvents,
            isCurrentMonth: isCurrentMonth,
            isToday: isToday,
          });

          currentWeekDate.setDate(currentWeekDate.getDate() + 1);
        }
        weeks.push(weekDays);
      }

      return weeks.map((week, weekIndex) => (
        <View key={weekIndex} style={styles.weekRow}>
          {week.map((day, dayIndex) => (
            <Pressable
              key={dayIndex}
              style={[
                styles.dayCell,
                { backgroundColor: theme.colors.background.primary },
                !day.isCurrentMonth && styles.otherMonthCell,
              ]}
              onPress={() => {
                openDrawer(day.dateString, day.events);
              }}
              android_ripple={{
                color: theme.colors.primary[100],
                borderless: false,
              }}
            >
              {/* 날짜 숫자 */}
              <View style={styles.dayHeader}>
                <View style={styles.dayNumberContainer}>
                  <View
                    style={[
                      styles.dayNumberBackground,
                      day.isToday && {
                        backgroundColor: theme.colors.primary[500],
                        transform: [{ scale: 1.05 }],
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayNumber,
                        { color: theme.colors.text.primary },
                        !day.isCurrentMonth && {
                          color: theme.colors.text.tertiary,
                          opacity: 0.4,
                        },
                        day.isToday && {
                          color: '#FFFFFF',
                          fontWeight: '900',
                        },
                        dayIndex === 0 &&
                          day.isCurrentMonth &&
                          !day.isToday && { color: '#EF4444' },
                        dayIndex === 6 &&
                          day.isCurrentMonth &&
                          !day.isToday && { color: theme.colors.primary[600] },
                      ]}
                    >
                      {day.date.getDate()}
                    </Text>
                  </View>
                  {day.isToday && (
                    <View
                      style={[styles.todayDot, { backgroundColor: theme.colors.primary[500] }]}
                    />
                  )}
                </View>
              </View>

              {/* 이벤트 미니 카드들 (동적 개수) */}
              <View style={styles.eventsContainer}>
                {(() => {
                  const availableHeight = CELL_HEIGHT - 18 - 3 - 6; // 총 높이 - 헤더 - 패딩 - 여백
                  const cardHeight = 16; // 카드 높이 + 마진
                  const maxEvents = Math.floor(availableHeight / cardHeight);
                  const visibleEvents = Math.max(
                    1,
                    maxEvents - (day.events.length > maxEvents ? 1 : 0)
                  );

                  return (
                    <>
                      {day.events.slice(0, visibleEvents).map((event, eventIndex) => (
                        <View
                          key={event.id}
                          style={[
                            styles.miniEventCard,
                            { backgroundColor: getCategoryColor(event.category) },
                          ]}
                        >
                          <Text style={styles.miniEventTitle} numberOfLines={1}>
                            {event.title}
                          </Text>
                        </View>
                      ))}

                      {day.events.length > visibleEvents && (
                        <View
                          style={[
                            styles.moreEventsIndicator,
                            { backgroundColor: theme.colors.surface },
                          ]}
                        >
                          <Text
                            style={[styles.moreEventsText, { color: theme.colors.text.secondary }]}
                          >
                            외 {day.events.length - visibleEvents}개
                          </Text>
                        </View>
                      )}
                    </>
                  );
                })()}
              </View>
            </Pressable>
          ))}
        </View>
      ));
    },
    [theme, getCategoryColor, getEventsForDate, openDrawer]
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background.primary}
        translucent={false}
      />

      {/* 페이지 헤더 */}
      <View
        style={[
          styles.pageHeader,
          {
            backgroundColor: theme.colors.background.primary,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Text style={[styles.greeting, { color: theme.colors.primary[600] }]}>LinQ</Text>
            <Text style={[styles.dateSubtext, { color: theme.colors.text.secondary }]}>
              스마트 일정 관리
            </Text>
          </View>

          <View style={styles.headerCenter}>
            <Text style={[styles.todayDate, { color: theme.colors.text.primary }]}>
              {new Date().toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'short',
              })}
            </Text>
          </View>

          {/* 뷰 타입 토글 */}
          <View style={[styles.viewToggle, { backgroundColor: theme.colors.surface }]}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                viewType === 'list' && [
                  styles.activeToggle,
                  { backgroundColor: theme.colors.primary[500] },
                ],
              ]}
              onPress={() => {
                setViewType('list');
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Ionicons
                name='list'
                size={16}
                color={viewType === 'list' ? '#FFFFFF' : theme.colors.text.secondary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toggleButton,
                viewType === 'calendar' && [
                  styles.activeToggle,
                  { backgroundColor: theme.colors.primary[500] },
                ],
              ]}
              onPress={() => {
                setViewType('calendar');
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Ionicons
                name='calendar'
                size={16}
                color={viewType === 'calendar' ? '#FFFFFF' : theme.colors.text.secondary}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 컨텐츠 영역 */}
      {viewType === 'calendar' ? (
        <View style={styles.calendarWrapper}>
          {/* 요일 헤더 */}
          <View style={[styles.weekHeader, { backgroundColor: theme.colors.background.primary }]}>
            {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
              <View key={day} style={styles.weekHeaderDay}>
                <Text
                  style={[
                    styles.weekHeaderText,
                    { color: theme.colors.text.secondary },
                    index === 0 && { color: '#EF4444' }, // 일요일
                    index === 6 && { color: theme.colors.primary[600] }, // 토요일
                  ]}
                >
                  {day}
                </Text>
              </View>
            ))}
          </View>

          <ScrollView
            style={styles.calendarContainer}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            snapToInterval={width}
            decelerationRate='fast'
            contentOffset={{ x: width * currentMonthIndex, y: 0 }}
            onMomentumScrollEnd={onMomentumScrollEnd}
          >
            {monthsData.map((monthData, index) => (
              <View key={monthData.key} style={[styles.monthContainer, { width }]}>
                {renderMonth(monthData)}
              </View>
            ))}
          </ScrollView>
        </View>
      ) : (
        <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.listContent}>
            {/* 필터 섹션 */}
            <View style={styles.filterSection}>
              <View style={styles.filterHeader}>
                <Text style={[styles.filterTitle, { color: theme.colors.text.primary }]}>
                  오늘의 일정
                </Text>
                <View style={styles.statsContainer}>
                  <Text style={[styles.statsText, { color: theme.colors.text.secondary }]}>
                    {getEventStats().completed}/{getEventStats().total} 완료
                    <Text style={[styles.statsRate, { color: theme.colors.primary[500] }]}>
                      ({getEventStats().completionRate}%)
                    </Text>
                  </Text>
                </View>
              </View>

              <View style={styles.filterTabs}>
                {[
                  { key: 'all', label: '전체', count: getEventStats().total },
                  { key: 'upcoming', label: '예정', count: getEventStats().upcoming },
                  { key: 'completed', label: '완료', count: getEventStats().completed },
                ].map(tab => (
                  <TouchableOpacity
                    key={tab.key}
                    style={[
                      styles.filterTab,
                      {
                        backgroundColor:
                          filterType === tab.key
                            ? theme.colors.primary[500]
                            : theme.colors.background.secondary,
                      },
                    ]}
                    onPress={() => {
                      setFilterType(tab.key as FilterType);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.filterTabText,
                        {
                          color: filterType === tab.key ? '#FFFFFF' : theme.colors.text.secondary,
                        },
                      ]}
                    >
                      {tab.label}
                    </Text>
                    <View
                      style={[
                        styles.filterTabBadge,
                        {
                          backgroundColor:
                            filterType === tab.key
                              ? 'rgba(255, 255, 255, 0.2)'
                              : theme.colors.primary[100],
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterTabBadgeText,
                          {
                            color: filterType === tab.key ? '#FFFFFF' : theme.colors.primary[600],
                          },
                        ]}
                      >
                        {tab.count}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 일정 리스트 */}
            {getFilteredEvents(
              allEvents
                .filter(event => event.date === new Date().toISOString().split('T')[0])
                .sort((a, b) => {
                  // 1차: 완료 상태 기준 정렬 (미완료가 위로)
                  if (a.isCompleted !== b.isCompleted) {
                    return (a.isCompleted ? 1 : 0) - (b.isCompleted ? 1 : 0);
                  }
                  // 2차: 시간 기준 정렬
                  return (a.time || '').localeCompare(b.time || '');
                })
            ).map((event, index) => {
              const eventDateTime = new Date(`${event.date} ${event.time}`);
              const now = new Date();
              const isCompleted = event.isCompleted || false;
              const isUpcoming = eventDateTime > now && !isCompleted;
              const isInProgress =
                Math.abs(eventDateTime.getTime() - now.getTime()) < 30 * 60 * 1000 && !isCompleted; // 30분 이내

              return (
                <TouchableOpacity
                  key={event.id}
                  style={[
                    styles.enhancedEventCard,
                    {
                      backgroundColor: theme.colors.background.card,
                      borderColor: theme.colors.border,
                    },
                    isCompleted && { opacity: 0.7 },
                    isInProgress && {
                      borderColor: theme.colors.primary[500],
                      borderWidth: 2,
                      shadowColor: theme.colors.primary[500],
                      shadowOpacity: 0.2,
                      shadowRadius: 8,
                      elevation: 6,
                    },
                  ]}
                  onPress={() => toggleEventCompletion(event.id)}
                  activeOpacity={0.7}
                >
                  {/* 상태 인디케이터 */}
                  <View
                    style={[
                      styles.statusIndicator,
                      { backgroundColor: getCategoryColor(event.category) },
                      isCompleted && { backgroundColor: theme.colors.success[500] },
                      isInProgress && { backgroundColor: theme.colors.primary[500] },
                    ]}
                  />

                  {/* 메인 컨텐츠 */}
                  <View style={styles.eventMainContent}>
                    {/* 헤더 라인 */}
                    <View style={styles.eventHeaderLine}>
                      <View style={styles.timeSection}>
                        <Text
                          style={[
                            styles.enhancedEventTime,
                            { color: theme.colors.text.primary },
                            isCompleted && { color: theme.colors.text.tertiary },
                          ]}
                        >
                          {event.time}
                        </Text>
                        <View
                          style={[
                            styles.categoryChip,
                            { backgroundColor: `${getCategoryColor(event.category)}15` },
                          ]}
                        >
                          <Text
                            style={[
                              styles.categoryText,
                              { color: getCategoryColor(event.category) },
                            ]}
                          >
                            {getCategoryLabel(event.category)}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.statusSection}>
                        {isCompleted && (
                          <View
                            style={[
                              styles.statusIndicatorBadge,
                              { backgroundColor: theme.colors.success },
                            ]}
                          >
                            <Text style={styles.statusText}>완료</Text>
                            <Ionicons name='checkmark-circle' size={10} color='#FFFFFF' />
                          </View>
                        )}
                        {isInProgress && (
                          <View
                            style={[
                              styles.statusIndicatorBadge,
                              { backgroundColor: theme.colors.primary[500] },
                            ]}
                          >
                            <Text style={styles.statusText}>진행중</Text>
                            <Ionicons name='radio-button-on' size={10} color='#FFFFFF' />
                          </View>
                        )}
                        {isUpcoming && !isCompleted && !isInProgress && (
                          <View
                            style={[
                              styles.statusIndicatorBadge,
                              { backgroundColor: theme.colors.warning },
                            ]}
                          >
                            <Text style={styles.statusText}>예정</Text>
                            <Ionicons name='time-outline' size={10} color='#FFFFFF' />
                          </View>
                        )}
                        <View
                          style={[
                            styles.priorityBadge,
                            { backgroundColor: getPriorityColor(event.priority || 'MEDIUM') },
                          ]}
                        >
                          <Text style={styles.priorityText}>
                            {event.priority === 'HIGH'
                              ? '높음'
                              : event.priority === 'MEDIUM'
                                ? '보통'
                                : '낮음'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* 제목 */}
                    <Text
                      style={[
                        styles.enhancedEventTitle,
                        { color: theme.colors.text.primary },
                        isCompleted && {
                          textDecorationLine: 'line-through',
                          color: theme.colors.text.tertiary,
                        },
                      ]}
                    >
                      {event.title}
                    </Text>

                    {/* 위치 정보 */}
                    {event.location && (
                      <View style={styles.enhancedLocationContainer}>
                        <Ionicons
                          name='location-outline'
                          size={12}
                          color={theme.colors.text.tertiary}
                        />
                        <Text
                          style={[
                            styles.enhancedLocationText,
                            { color: theme.colors.text.secondary },
                          ]}
                        >
                          {event.location}
                        </Text>
                      </View>
                    )}

                    {/* 빠른 액션 버튼들 */}
                    <View style={styles.quickActions}>
                      <TouchableOpacity
                        style={[
                          styles.quickActionBtn,
                          { backgroundColor: theme.colors.primary[50] },
                        ]}
                        onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                      >
                        <Ionicons
                          name='create-outline'
                          size={14}
                          color={theme.colors.primary[600]}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.quickActionBtn, { backgroundColor: theme.colors.surface }]}
                        onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                      >
                        <Ionicons
                          name='notifications-outline'
                          size={14}
                          color={theme.colors.text.secondary}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* 빈 상태 */}
            {(() => {
              const todayEvents = allEvents.filter(
                event => event.date === new Date().toISOString().split('T')[0]
              );
              const filteredEvents = getFilteredEvents(todayEvents);

              if (todayEvents.length === 0) {
                return (
                  <View style={styles.emptyStateContainer}>
                    <View style={styles.emptyStateIcon}>
                      <Ionicons
                        name='calendar-outline'
                        size={64}
                        color={theme.colors.text.tertiary}
                      />
                    </View>
                    <Text style={[styles.emptyStateTitle, { color: theme.colors.text.primary }]}>
                      오늘은 일정이 없어요
                    </Text>
                    <Text
                      style={[styles.emptyStateSubtitle, { color: theme.colors.text.secondary }]}
                    >
                      새로운 일정을 추가하여 하루를 계획해보세요
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.emptyStateButton,
                        { backgroundColor: theme.colors.primary[500] },
                      ]}
                      onPress={() => {
                        showAddEventModal();
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      }}
                    >
                      <Ionicons name='add' size={20} color='#FFFFFF' />
                      <Text style={styles.emptyStateButtonText}>첫 일정 추가하기</Text>
                    </TouchableOpacity>
                  </View>
                );
              }

              if (filteredEvents.length === 0) {
                const emptyMessages = {
                  completed: {
                    title: '완료된 일정이 없어요',
                    subtitle: '일정을 완료하면 여기에 표시됩니다',
                    icon: 'checkmark-circle-outline',
                  },
                  upcoming: {
                    title: '예정된 일정이 없어요',
                    subtitle: '새로운 일정을 추가해보세요',
                    icon: 'time-outline',
                  },
                };

                const message = emptyMessages[filterType as keyof typeof emptyMessages];
                if (message) {
                  return (
                    <View style={styles.emptyStateContainer}>
                      <View style={styles.emptyStateIcon}>
                        <Ionicons
                          name={message.icon as any}
                          size={64}
                          color={theme.colors.text.tertiary}
                        />
                      </View>
                      <Text style={[styles.emptyStateTitle, { color: theme.colors.text.primary }]}>
                        {message.title}
                      </Text>
                      <Text
                        style={[styles.emptyStateSubtitle, { color: theme.colors.text.secondary }]}
                      >
                        {message.subtitle}
                      </Text>
                    </View>
                  );
                }
              }

              return null;
            })()}
          </View>
        </ScrollView>
      )}

      {/* 모던 드로어 모달 */}
      <Modal
        visible={drawerVisible}
        transparent
        animationType='none'
        statusBarTranslucent
        onRequestClose={closeDrawer}
      >
        {/* 오버레이 */}
        <Animated.View
          style={[
            styles.overlay,
            {
              opacity: overlayAnim,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
            },
          ]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={closeDrawer} />
        </Animated.View>

        {/* 드로어 컨텐츠 */}
        <Animated.View
          style={[
            styles.drawer,
            {
              backgroundColor: theme.colors.background.card,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* 드래그 핸들 */}
          <View style={styles.dragHandle}>
            <View style={[styles.handleBar, { backgroundColor: theme.colors.border }]} />
          </View>

          {/* 드로어 헤더 */}
          <View style={styles.drawerHeader}>
            <View>
              <Text style={[styles.drawerTitle, { color: theme.colors.text.primary }]}>
                {formatSelectedDate}
              </Text>
              <Text style={[styles.drawerSubtitle, { color: theme.colors.text.secondary }]}>
                {selectedDayEvents.length}개의 일정
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: theme.colors.surface }]}
              onPress={closeDrawer}
            >
              <Ionicons name='close' size={20} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* 이벤트 리스트 */}
          <ScrollView style={styles.eventsListContainer} showsVerticalScrollIndicator={false}>
            {selectedDayEvents.map((event, index) => {
              const eventDateTime = new Date(`${event.date} ${event.time}`);
              const now = new Date();
              const isCompleted = event.isCompleted || false;
              const isUpcoming = eventDateTime > now && !isCompleted;
              const isInProgress =
                Math.abs(eventDateTime.getTime() - now.getTime()) < 30 * 60 * 1000 && !isCompleted; // 30분 이내

              return (
                <View
                  key={event.id}
                  style={[
                    styles.eventCard,
                    {
                      backgroundColor: theme.colors.background.primary,
                      borderLeftColor: getCategoryColor(event.category),
                    },
                    isCompleted && { opacity: 0.7 },
                    isInProgress && {
                      borderColor: theme.colors.primary[500],
                      borderWidth: 1,
                    },
                  ]}
                >
                  <View style={styles.eventCardHeader}>
                    <View style={styles.eventTimeContainer}>
                      <Text
                        style={[
                          styles.eventTime,
                          { color: theme.colors.text.secondary },
                          isCompleted && { color: theme.colors.text.tertiary },
                        ]}
                      >
                        {event.time}
                      </Text>
                      <View
                        style={[
                          styles.priorityDot,
                          { backgroundColor: getPriorityColor(event.priority || 'MEDIUM') },
                        ]}
                      />
                    </View>

                    <View style={styles.drawerStatusSection}>
                      {isCompleted && (
                        <View
                          style={[
                            styles.drawerStatusBadge,
                            { backgroundColor: theme.colors.success },
                          ]}
                        >
                          <Text style={styles.drawerStatusText}>완료</Text>
                        </View>
                      )}
                      {isInProgress && (
                        <View
                          style={[
                            styles.drawerStatusBadge,
                            { backgroundColor: theme.colors.primary[500] },
                          ]}
                        >
                          <Text style={styles.drawerStatusText}>진행중</Text>
                        </View>
                      )}
                      {isUpcoming && !isCompleted && !isInProgress && (
                        <View
                          style={[
                            styles.drawerStatusBadge,
                            { backgroundColor: theme.colors.warning },
                          ]}
                        >
                          <Text style={styles.drawerStatusText}>예정</Text>
                        </View>
                      )}

                      <TouchableOpacity style={styles.eventMenuButton}>
                        <Ionicons
                          name='ellipsis-horizontal'
                          size={16}
                          color={theme.colors.text.tertiary}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <Text style={[styles.eventTitle, { color: theme.colors.text.primary }]}>
                    {event.title}
                  </Text>

                  {event.location && (
                    <View style={styles.eventLocationContainer}>
                      <Ionicons
                        name='location-outline'
                        size={14}
                        color={theme.colors.text.tertiary}
                      />
                      <Text style={[styles.eventLocation, { color: theme.colors.text.secondary }]}>
                        {event.location}
                      </Text>
                    </View>
                  )}

                  <View style={styles.eventActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: theme.colors.primary[50] }]}
                      onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                    >
                      <Ionicons name='create-outline' size={16} color={theme.colors.primary[600]} />
                      <Text style={[styles.actionButtonText, { color: theme.colors.primary[600] }]}>
                        수정
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}

            {selectedDayEvents.length === 0 && (
              <View style={styles.emptyEventsContainer}>
                <Ionicons name='calendar-outline' size={48} color={theme.colors.text.tertiary} />
                <Text style={[styles.emptyEventsText, { color: theme.colors.text.secondary }]}>
                  이 날에는 등록된 일정이 없어요
                </Text>
                <Text style={[styles.emptyEventsSubtext, { color: theme.colors.text.tertiary }]}>
                  새로운 일정을 추가해보세요!
                </Text>
                <TouchableOpacity
                  style={[styles.addEventButton, { backgroundColor: theme.colors.primary[500] }]}
                  onPress={() => {
                    closeDrawer();
                    // 약간의 딜레이 후 일정 추가 모달 열기
                    setTimeout(() => {
                      showAddEventModal();
                    }, 300);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }}
                >
                  <Ionicons name='add' size={20} color='#FFFFFF' />
                  <Text style={styles.addEventButtonText}>일정 추가</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </Modal>

      {/* 일정 추가 모달 */}
      <AddEventModal
        visible={isAddEventModalVisible}
        onClose={hideAddEventModal}
        onSave={handleAddEvent}
      />

      {/* 자연어 기반 일정 등록 드로어 */}
      <NaturalLanguageEventDrawer
        visible={isNaturalLanguageDrawerVisible}
        onClose={handleCloseNaturalLanguageDrawer}
        onSave={handleNaturalLanguageEventSave}
      />

      {/* Floating Action Menu - 드로어가 열려있을 때는 숨김 */}
      {!drawerVisible && !isNaturalLanguageDrawerVisible && (
        <FloatingActionMenu
          onAISchedule={handleOpenNaturalLanguageDrawer}
          onManualSchedule={handleManualSchedule}
          onVoiceInput={handleVoiceInput}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  calendarWrapper: {
    flex: 1,
  },
  weekHeader: {
    flexDirection: 'row',
    paddingHorizontal: CALENDAR_PADDING,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  weekHeaderDay: {
    flex: 1,
    alignItems: 'center',
  },
  weekHeaderText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // 헤더 - 미니멀하게 축소
  pageHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  headerLeft: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayDate: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  greeting: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  dateSubtext: {
    fontSize: 10,
    fontWeight: '400',
    marginTop: 1,
  },
  viewToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 3,
    paddingVertical: 3,
    borderRadius: 8,
  },
  toggleButton: {
    width: 32,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeToggle: {
    // 동적으로 테마 색상 적용됨
  },

  // 캘린더
  calendarContainer: {
    flex: 1,
  },
  monthContainer: {
    paddingHorizontal: CALENDAR_PADDING,
    paddingTop: 0,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  dayCell: {
    width: CELL_SIZE,
    height: CELL_HEIGHT,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.05)',
    padding: 3,
    justifyContent: 'flex-start',
  },
  otherMonthCell: {
    opacity: 0.3,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 3,
    height: 18,
    position: 'relative',
  },
  dayNumberContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  dayNumberBackground: {
    borderRadius: 4,
    paddingHorizontal: 2,
    paddingVertical: 1,
    minWidth: 18,
    minHeight: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  todayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    position: 'absolute',
    bottom: -8,
  },

  // 미니 이벤트 카드들
  eventsContainer: {
    flex: 1,
    gap: 1,
    justifyContent: 'flex-start',
  },
  miniEventCard: {
    borderRadius: 2,
    paddingHorizontal: 3,
    paddingVertical: 2,
    height: 14,
    justifyContent: 'center',
    marginBottom: 1,
  },
  miniEventTitle: {
    fontSize: 8,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 10,
    textAlign: 'center',
  },
  moreEventsIndicator: {
    borderRadius: 2,
    paddingHorizontal: 3,
    paddingVertical: 2,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 1,
  },
  moreEventsText: {
    fontSize: 8,
    fontWeight: '600',
  },

  // 드로어 모달
  overlay: {
    flex: 1,
  },
  drawer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.85,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  dragHandle: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  drawerTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  drawerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 이벤트 리스트
  eventsListContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  eventCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  eventCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventTime: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  eventMenuButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 8,
    lineHeight: 24,
  },
  eventLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  eventLocation: {
    fontSize: 14,
    fontWeight: '500',
  },
  eventActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyEventsContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEventsText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
  },
  emptyEventsSubtext: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  addEventButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  addEventButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // 리스트 뷰 스타일
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listContent: {
    paddingTop: 20,
    paddingBottom: 100,
  },
  listHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.7,
  },

  // 통계 카드 - 컴팩트 버전
  statsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  // 향상된 이벤트 카드 - 컴팩트 버전
  enhancedEventCard: {
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    overflow: 'hidden',
  },
  statusIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  eventMainContent: {
    padding: 12,
    paddingLeft: 16,
  },
  eventHeaderLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  timeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  enhancedEventTime: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  categoryChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveIndicator: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  liveText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  statusIndicatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
    minWidth: 45,
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 8,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    minWidth: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityText: {
    fontSize: 8,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  enhancedEventTitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: 4,
    lineHeight: 20,
  },
  enhancedLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  enhancedLocationText: {
    fontSize: 12,
    fontWeight: '400',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 6,
  },
  quickActionBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },

  // 빈 상태
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyStateIcon: {
    marginBottom: 24,
    opacity: 0.6,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  emptyStateButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  emptyStateButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  listEventCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  // 드로어 상태 관련 스타일
  drawerStatusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  drawerStatusBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    minWidth: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerStatusText: {
    fontSize: 7,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },

  // 필터 섹션 스타일
  filterSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 8,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  statsText: {
    fontSize: 13,
    fontWeight: '500',
  },
  statsRate: {
    fontSize: 13,
    fontWeight: '600',
  },
  filterTabs: {
    flexDirection: 'row',
    gap: 8,
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  filterTabBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  filterTabBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 12,
  },
});
