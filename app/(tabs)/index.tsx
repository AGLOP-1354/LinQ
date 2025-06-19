import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AddEventModal from '../../src/components/forms/AddEventModal';
import { useModal } from '../../src/contexts/ModalContext';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../src/constants/design';

type ViewType = 'list' | 'calendar';

interface Event {
  id: string;
  title: string;
  time: string;
  location?: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  date: string; // YYYY-MM-DD 형식
}

// 샘플 일정 데이터
const sampleEvents: Event[] = [
  {
    id: '1',
    title: '팀 회의',
    time: '09:00',
    location: '회의실 A',
    priority: 'HIGH',
    date: new Date().toISOString().split('T')[0] // 오늘
  },
  {
    id: '2',
    title: '프로젝트 리뷰',
    time: '14:00',
    location: '온라인',
    priority: 'MEDIUM',
    date: new Date().toISOString().split('T')[0] // 오늘
  },
  {
    id: '3',
    title: '운동',
    time: '18:00',
    location: '헬스장',
    priority: 'LOW',
    date: new Date().toISOString().split('T')[0] // 오늘
  },
  {
    id: '4',
    title: '의사 약속',
    time: '10:30',
    location: '병원',
    priority: 'HIGH',
    date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 내일
  },
  {
    id: '5',
    title: '친구 만남',
    time: '19:00',
    location: '카페',
    priority: 'MEDIUM',
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 모레
  }
];

export default function HomeScreen() {
  const [viewType, setViewType] = useState<ViewType>('list');
  const [allEvents, setAllEvents] = useState<Event[]>(sampleEvents);
  const [currentDate, setCurrentDate] = useState(new Date());
  const { isAddEventModalVisible, hideAddEventModal } = useModal();

  // viewType을 AsyncStorage에서 불러오기
  useEffect(() => {
    loadViewType();
  }, []);

  const loadViewType = async () => {
    try {
      const savedViewType = await AsyncStorage.getItem('home_view_type');
      if (savedViewType) {
        setViewType(savedViewType as ViewType);
      }
    } catch (error) {
      console.log('ViewType 로드 실패:', error);
    }
  };

  // viewType 변경 및 저장
  const changeViewType = async (newViewType: ViewType) => {
    try {
      setViewType(newViewType);
      await AsyncStorage.setItem('home_view_type', newViewType);
    } catch (error) {
      console.log('ViewType 저장 실패:', error);
    }
  };

  // 오늘 일정만 필터링
  const getTodayEvents = () => {
    const today = new Date().toISOString().split('T')[0];
    return allEvents.filter(event => event.date === today);
  };

  // 특정 날짜의 일정 가져오기
  const getEventsForDate = (date: string) => {
    return allEvents.filter(event => event.date === date);
  };

  // 새 일정 추가
  const handleAddEvent = (newEvent: Omit<Event, 'id'>) => {
    const eventWithId = {
      ...newEvent,
      id: Date.now().toString(), // 임시 ID 생성
    };
    setAllEvents(prev => [...prev, eventWithId]);
  };

  const getPriorityColor = (priority: string) => {
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
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return '상';
      case 'MEDIUM':
        return '중';
      case 'LOW':
        return '하';
      default:
        return '';
    }
  };

  const formatDate = () => {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    };
    return today.toLocaleDateString('ko-KR', options);
  };

  const renderEventCard = ({ item }: { item: Event }) => (
    <View style={styles.eventCard}>
      <View style={styles.eventHeader}>
        <View style={styles.eventTime}>
          <Ionicons name="time-outline" size={16} color="#6B7280" />
          <Text style={styles.timeText}>{item.time}</Text>
        </View>
        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
          <Text style={styles.priorityText}>{getPriorityLabel(item.priority)}</Text>
        </View>
      </View>
      <Text style={styles.eventTitle}>{item.title}</Text>
      {item.location && (
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color="#6B7280" />
          <Text style={styles.locationText}>{item.location}</Text>
        </View>
      )}
    </View>
  );

  // 월별 캘린더 뷰 렌더링
  const renderCalendarView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // 월의 첫째 날과 마지막 날
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // 첫 주의 시작 (일요일부터)
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    // 마지막 주의 끝 (토요일까지)
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
    
    const weeks = [];
    const currentWeekDate = new Date(startDate);
    
    while (currentWeekDate <= endDate) {
      const week = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(currentWeekDate);
        const dateString = date.toISOString().split('T')[0];
        const dayEvents = getEventsForDate(dateString);
        const isCurrentMonth = date.getMonth() === month;
        const isToday = dateString === new Date().toISOString().split('T')[0];
        
        week.push({
          date: date,
          dateString: dateString,
          events: dayEvents,
          isCurrentMonth: isCurrentMonth,
          isToday: isToday
        });
        
        currentWeekDate.setDate(currentWeekDate.getDate() + 1);
      }
      weeks.push(week);
    }

    const monthNames = [
      '1월', '2월', '3월', '4월', '5월', '6월',
      '7월', '8월', '9월', '10월', '11월', '12월'
    ];

    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

    return (
      <ScrollView style={styles.calendarScrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.calendarContainer}>
          {/* 월 네비게이션 */}
          <View style={styles.monthNavigation}>
            <TouchableOpacity 
              style={styles.navButton}
              onPress={() => setCurrentDate(new Date(year, month - 1, 1))}
            >
              <Ionicons name="chevron-back" size={24} color="#6B7280" />
            </TouchableOpacity>
            
            <Text style={styles.monthTitle}>
              {year}년 {monthNames[month]}
            </Text>
            
            <TouchableOpacity 
              style={styles.navButton}
              onPress={() => setCurrentDate(new Date(year, month + 1, 1))}
            >
              <Ionicons name="chevron-forward" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* 요일 헤더 */}
          <View style={styles.weekHeader}>
            {dayNames.map((day, index) => (
              <Text 
                key={index} 
                style={[
                  styles.dayHeaderText,
                  index === 0 && styles.sundayHeader,
                  index === 6 && styles.saturdayHeader
                ]}
              >
                {day}
              </Text>
            ))}
          </View>

          {/* 캘린더 그리드 */}
          <View style={styles.calendarGrid}>
            {weeks.map((week, weekIndex) => (
              <View key={weekIndex} style={styles.weekRow}>
                {week.map((day, dayIndex) => (
                  <View 
                    key={dayIndex} 
                    style={[
                      styles.dayCell,
                      day.isToday && styles.todayCell,
                      !day.isCurrentMonth && styles.otherMonthCell
                    ]}
                  >
                    {/* 날짜 숫자 */}
                    <View style={styles.dayHeader}>
                      <Text 
                        style={[
                          styles.dayText,
                          !day.isCurrentMonth && styles.otherMonthText,
                          day.isToday && styles.todayText,
                          dayIndex === 0 && day.isCurrentMonth && styles.sundayText,
                          dayIndex === 6 && day.isCurrentMonth && styles.saturdayText
                        ]}
                      >
                        {day.date.getDate()}
                      </Text>
                    </View>
                    
                    {/* 일정 리스트 */}
                    <View style={styles.eventsList}>
                      {day.events.slice(0, 4).map((event, eventIndex) => (
                        <TouchableOpacity
                          key={eventIndex}
                          style={[
                            styles.eventItem,
                            { backgroundColor: getPriorityColor(event.priority) }
                          ]}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.eventItemTime} numberOfLines={1}>
                            {event.time}
                          </Text>
                          <Text style={styles.eventItemTitle} numberOfLines={1}>
                            {event.title}
                          </Text>
                        </TouchableOpacity>
                      ))}
                      
                      {/* 추가 일정이 있을 경우 더보기 표시 */}
                      {day.events.length > 4 && (
                        <TouchableOpacity style={styles.moreEventsButton}>
                          <Text style={styles.moreEventsText}>
                            +{day.events.length - 4}개 더보기
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    );
  };

  const todayEvents = getTodayEvents();

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.greeting}>LinQ</Text>
        
        {/* ViewType 전환 버튼 */}
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.toggleButton, viewType === 'list' && styles.activeToggle]}
            onPress={() => changeViewType('list')}
          >
            <Ionicons 
              name="list" 
              size={16} 
              color={viewType === 'list' ? '#ffffff' : '#6B7280'} 
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, viewType === 'calendar' && styles.activeToggle]}
            onPress={() => changeViewType('calendar')}
          >
            <Ionicons 
              name="calendar" 
              size={16} 
              color={viewType === 'calendar' ? '#ffffff' : '#6B7280'} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* 일정 표시 영역 */}
      <View style={[styles.content, viewType === 'calendar' && styles.calendarContent]}>
        {viewType === 'list' ? (
          <>
            <Text style={styles.sectionTitle}>
              오늘의 일정 ({todayEvents.length}개)
            </Text>
            
            {todayEvents.length > 0 ? (
              <FlatList
                data={todayEvents}
                renderItem={renderEventCard}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContainer}
              />
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyStateText}>오늘은 예정된 일정이 없습니다</Text>
                <Text style={styles.emptyStateSubtext}>
                  새로운 일정을 추가하거나 AI에게 제안을 받아보세요
                </Text>
              </View>
            )}
          </>
        ) : (
          renderCalendarView()
        )}
      </View>

      {/* 일정 추가 모달 */}
      <AddEventModal
        visible={isAddEventModalVisible}
        onClose={hideAddEventModal}
        onSave={handleAddEvent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.gray[100],
    minHeight: 44,
  },
  greeting: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.primary[600],
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.gray[100],
    borderRadius: BorderRadius.sm,
    padding: Spacing.xs / 2,
  },
  toggleButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Spacing.xs,
  },
  activeToggle: {
    backgroundColor: Colors.primary[500],
    ...Shadows.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  calendarContent: {
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.base,
  },
  listContainer: {
    paddingBottom: Spacing.lg,
  },
  eventCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.gray[100],
    ...Shadows.sm,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginLeft: Spacing.xs,
    fontWeight: '600',
  },
  priorityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  priorityText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.inverse,
    fontWeight: '700',
  },
  eventTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  // 월별 캘린더 스타일
  calendarScrollView: {
    flex: 1,
  },
  calendarContainer: {
    backgroundColor: Colors.background.primary,
    flex: 1,
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  navButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.base,
  },
  monthTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  dayHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    paddingVertical: 8,
  },
  sundayHeader: {
    color: '#EF4444',
  },
  saturdayHeader: {
    color: '#3B82F6',
  },
  sundayText: {
    color: '#EF4444',
  },
  saturdayText: {
    color: '#3B82F6',
  },
  calendarGrid: {
    paddingHorizontal: 4,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 1,
  },
  dayCell: {
    flex: 1,
    minHeight: 120,
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
    marginHorizontal: 0.5,
    padding: 6,
  },
  todayCell: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1.5,
    borderColor: '#3B82F6',
  },
  otherMonthCell: {
    backgroundColor: '#F9FAFB',
  },
  dayHeader: {
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  dayText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  todayText: {
    color: '#3B82F6',
    fontWeight: 'bold',
  },
  otherMonthText: {
    color: '#D1D5DB',
  },
  eventsList: {
    flex: 1,
    gap: 2,
  },
  eventItem: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 1,
  },
  eventItemTime: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 1,
    opacity: 0.9,
  },
  eventItemTitle: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '500',
    lineHeight: 13,
  },
  moreEventsButton: {
    paddingVertical: 2,
    paddingHorizontal: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    marginTop: 2,
  },
  moreEventsText: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '600',
    textAlign: 'center',
  },
}); 