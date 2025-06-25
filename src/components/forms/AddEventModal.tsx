import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '../../contexts/ThemeContext';

const { height } = Dimensions.get('window');

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
}

interface AddEventModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (event: Omit<Event, 'id'>) => void;
  selectedDate?: string;
}

// 사전 정의된 색상 팔레트
const colorPalette = [
  { name: '빨강', value: '#EF4444', light: '#FEF2F2' },
  { name: '주황', value: '#F97316', light: '#FFF7ED' },
  { name: '노랑', value: '#EAB308', light: '#FEFCE8' },
  { name: '초록', value: '#22C55E', light: '#F0FDF4' },
  { name: '파랑', value: '#3B82F6', light: '#EFF6FF' },
  { name: '보라', value: '#8B5CF6', light: '#F5F3FF' },
  { name: '분홍', value: '#EC4899', light: '#FDF2F8' },
  { name: '회색', value: '#6B7280', light: '#F9FAFB' },
];

// 알림 설정 옵션
const notificationOptions = [
  { label: '알림 없음', value: 'none' },
  { label: '정시', value: 'at_time' },
  { label: '15분 전', value: '15_min' },
  { label: '1시간 전', value: '1_hour' },
  { label: '1일 전', value: '1_day' },
];

// 빠른 시간 선택 옵션
const quickTimeOptions = [
  { label: '지금', getTime: () => new Date() },
  { label: '30분 후', getTime: () => new Date(Date.now() + 30 * 60 * 1000) },
  { label: '1시간 후', getTime: () => new Date(Date.now() + 60 * 60 * 1000) },
  {
    label: '오늘 오후 2시',
    getTime: () => {
      const today = new Date();
      today.setHours(14, 0, 0, 0);
      return today;
    },
  },
];

// 자주 사용하는 장소 옵션
const commonLocations = [
  { name: '회의실 A', icon: 'business-outline' },
  { name: '회의실 B', icon: 'business-outline' },
  { name: '카페', icon: 'cafe-outline' },
  { name: '집', icon: 'home-outline' },
  { name: '사무실', icon: 'desktop-outline' },
  { name: '헬스장', icon: 'fitness-outline' },
  { name: '병원', icon: 'medical-outline' },
  { name: '학교', icon: 'school-outline' },
];

const AddEventModal: React.FC<AddEventModalProps> = ({
  visible,
  onClose,
  onSave,
  selectedDate,
}) => {
  const { theme } = useTheme();

  // 기본 상태
  const [title, setTitle] = useState('');
  const [isAllDay, setIsAllDay] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [selectedColor, setSelectedColor] = useState(colorPalette[4].value); // 기본 파랑
  const [location, setLocation] = useState('');
  const [notifications, setNotifications] = useState<string[]>(['15_min']);

  // 커스텀 DatePicker 상태
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [currentEditingDate, setCurrentEditingDate] = useState<'start' | 'end'>('start');
  const [currentEditingMode, setCurrentEditingMode] = useState<'date' | 'time'>('date');
  const [tempDate, setTempDate] = useState(new Date());

  // 장소 관련 상태
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [locationInputFocused, setLocationInputFocused] = useState(false);

  // 애니메이션
  const slideAnimation = useSharedValue(height);

  // 애니메이션 스타일
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideAnimation.value }],
  }));

  // 모달 표시 시 애니메이션
  useEffect(() => {
    if (visible) {
      setTitle('');
      setIsAllDay(false);
      const initialDate = selectedDate ? new Date(selectedDate) : new Date();
      setStartDate(initialDate);
      const endDateTime = new Date(initialDate);
      endDateTime.setHours(endDateTime.getHours() + 1);
      setEndDate(endDateTime);
      setSelectedColor(colorPalette[4].value);
      setLocation('');
      setNotifications(['15_min']);
      setShowLocationSuggestions(false);
      setLocationInputFocused(false);

      slideAnimation.value = withSpring(0, {
        damping: 15,
        stiffness: 100,
      });
    } else {
      slideAnimation.value = withTiming(height, { duration: 300 });
    }
  }, [visible]);

  // 종료일이 시작일보다 이전인 경우 자동 조정
  useEffect(() => {
    if (endDate < startDate) {
      setEndDate(new Date(startDate.getTime() + (isAllDay ? 24 * 60 * 60 * 1000 : 60 * 60 * 1000)));
    }
  }, [startDate, isAllDay]);

  const handleSave = () => {
    if (!title.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('제목을 입력해주세요', '일정 제목은 필수 항목입니다.');
      return;
    }

    const newEvent = {
      title: title.trim(),
      startDate,
      endDate,
      isAllDay,
      color: selectedColor,
      location: location.trim() || undefined,
      notifications,
      category: 'work' as const, // 기본값
    };

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave(newEvent);
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  const openCustomDatePicker = (type: 'start' | 'end', mode: 'date' | 'time') => {
    setCurrentEditingDate(type);
    setCurrentEditingMode(mode);
    setTempDate(type === 'start' ? startDate : endDate);
    setShowCustomDatePicker(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const confirmDateSelection = () => {
    if (currentEditingDate === 'start') {
      setStartDate(tempDate);
    } else {
      setEndDate(tempDate);
    }
    setShowCustomDatePicker(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleQuickTime = (option: any) => {
    const quickTime = option.getTime();
    setStartDate(quickTime);
    const newEndTime = new Date(
      quickTime.getTime() + (isAllDay ? 24 * 60 * 60 * 1000 : 60 * 60 * 1000)
    );
    setEndDate(newEndTime);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleLocationSuggestion = (locationName: string) => {
    setLocation(locationName);
    setShowLocationSuggestions(false);
    setLocationInputFocused(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const toggleNotification = (value: string) => {
    if (value === 'none') {
      setNotifications([]);
    } else {
      const newNotifications = notifications.includes(value)
        ? notifications.filter(n => n !== value)
        : [...notifications.filter(n => n !== 'none'), value];
      setNotifications(newNotifications);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSelectedColorInfo = () => {
    return colorPalette.find(color => color.value === selectedColor) || colorPalette[4];
  };

  // 커스텀 날짜 선택기 렌더링
  const renderCustomDatePicker = () => {
    const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i - 2);
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const days = Array.from({ length: 31 }, (_, i) => i + 1);
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const minutes = Array.from({ length: 60 }, (_, i) => i);

    return (
      <Modal
        visible={showCustomDatePicker}
        transparent
        animationType='slide'
        onRequestClose={() => setShowCustomDatePicker(false)}
      >
        <View style={styles.pickerOverlay}>
          <Animated.View
            style={[styles.pickerContainer, { backgroundColor: theme.colors.background.primary }]}
          >
            <View style={[styles.pickerHeader, { borderBottomColor: theme.colors.border }]}>
              <TouchableOpacity onPress={() => setShowCustomDatePicker(false)}>
                <Text style={[styles.pickerButton, { color: theme.colors.text.secondary }]}>
                  취소
                </Text>
              </TouchableOpacity>
              <Text style={[styles.pickerTitle, { color: theme.colors.text.primary }]}>
                {currentEditingDate === 'start' ? '시작' : '종료'}{' '}
                {currentEditingMode === 'date' ? '날짜' : '시간'}
              </Text>
              <TouchableOpacity onPress={confirmDateSelection}>
                <Text style={[styles.pickerButton, { color: selectedColor }]}>완료</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.pickerContent}>
              {currentEditingMode === 'date' ? (
                <View style={styles.datePickerRow}>
                  <View style={styles.pickerColumn}>
                    <Text style={[styles.pickerLabel, { color: theme.colors.text.secondary }]}>
                      년
                    </Text>
                    <ScrollView
                      style={styles.pickerScrollView}
                      showsVerticalScrollIndicator={false}
                    >
                      {years.map(year => (
                        <TouchableOpacity
                          key={year}
                          style={[
                            styles.pickerItem,
                            tempDate.getFullYear() === year && {
                              backgroundColor: selectedColor + '20',
                            },
                          ]}
                          onPress={() => {
                            const newDate = new Date(tempDate);
                            newDate.setFullYear(year);
                            setTempDate(newDate);
                          }}
                        >
                          <Text
                            style={[
                              styles.pickerItemText,
                              {
                                color:
                                  tempDate.getFullYear() === year
                                    ? selectedColor
                                    : theme.colors.text.primary,
                              },
                            ]}
                          >
                            {year}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  <View style={styles.pickerColumn}>
                    <Text style={[styles.pickerLabel, { color: theme.colors.text.secondary }]}>
                      월
                    </Text>
                    <ScrollView
                      style={styles.pickerScrollView}
                      showsVerticalScrollIndicator={false}
                    >
                      {months.map(month => (
                        <TouchableOpacity
                          key={month}
                          style={[
                            styles.pickerItem,
                            tempDate.getMonth() + 1 === month && {
                              backgroundColor: selectedColor + '20',
                            },
                          ]}
                          onPress={() => {
                            const newDate = new Date(tempDate);
                            newDate.setMonth(month - 1);
                            setTempDate(newDate);
                          }}
                        >
                          <Text
                            style={[
                              styles.pickerItemText,
                              {
                                color:
                                  tempDate.getMonth() + 1 === month
                                    ? selectedColor
                                    : theme.colors.text.primary,
                              },
                            ]}
                          >
                            {month}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  <View style={styles.pickerColumn}>
                    <Text style={[styles.pickerLabel, { color: theme.colors.text.secondary }]}>
                      일
                    </Text>
                    <ScrollView
                      style={styles.pickerScrollView}
                      showsVerticalScrollIndicator={false}
                    >
                      {days.map(day => (
                        <TouchableOpacity
                          key={day}
                          style={[
                            styles.pickerItem,
                            tempDate.getDate() === day && { backgroundColor: selectedColor + '20' },
                          ]}
                          onPress={() => {
                            const newDate = new Date(tempDate);
                            newDate.setDate(day);
                            setTempDate(newDate);
                          }}
                        >
                          <Text
                            style={[
                              styles.pickerItemText,
                              {
                                color:
                                  tempDate.getDate() === day
                                    ? selectedColor
                                    : theme.colors.text.primary,
                              },
                            ]}
                          >
                            {day}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>
              ) : (
                <View style={styles.datePickerRow}>
                  <View style={styles.pickerColumn}>
                    <Text style={[styles.pickerLabel, { color: theme.colors.text.secondary }]}>
                      시
                    </Text>
                    <ScrollView
                      style={styles.pickerScrollView}
                      showsVerticalScrollIndicator={false}
                    >
                      {hours.map(hour => (
                        <TouchableOpacity
                          key={hour}
                          style={[
                            styles.pickerItem,
                            tempDate.getHours() === hour && {
                              backgroundColor: selectedColor + '20',
                            },
                          ]}
                          onPress={() => {
                            const newDate = new Date(tempDate);
                            newDate.setHours(hour);
                            setTempDate(newDate);
                          }}
                        >
                          <Text
                            style={[
                              styles.pickerItemText,
                              {
                                color:
                                  tempDate.getHours() === hour
                                    ? selectedColor
                                    : theme.colors.text.primary,
                              },
                            ]}
                          >
                            {hour.toString().padStart(2, '0')}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  <View style={styles.pickerColumn}>
                    <Text style={[styles.pickerLabel, { color: theme.colors.text.secondary }]}>
                      분
                    </Text>
                    <ScrollView
                      style={styles.pickerScrollView}
                      showsVerticalScrollIndicator={false}
                    >
                      {minutes
                        .filter(m => m % 15 === 0)
                        .map(minute => (
                          <TouchableOpacity
                            key={minute}
                            style={[
                              styles.pickerItem,
                              tempDate.getMinutes() === minute && {
                                backgroundColor: selectedColor + '20',
                              },
                            ]}
                            onPress={() => {
                              const newDate = new Date(tempDate);
                              newDate.setMinutes(minute);
                              setTempDate(newDate);
                            }}
                          >
                            <Text
                              style={[
                                styles.pickerItemText,
                                {
                                  color:
                                    tempDate.getMinutes() === minute
                                      ? selectedColor
                                      : theme.colors.text.primary,
                                },
                              ]}
                            >
                              {minute.toString().padStart(2, '0')}
                            </Text>
                          </TouchableOpacity>
                        ))}
                    </ScrollView>
                  </View>
                </View>
              )}
            </View>
          </Animated.View>
        </View>
      </Modal>
    );
  };

  return (
    <Modal visible={visible} animationType='none' transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              backgroundColor: theme.colors.background.primary,
            },
            animatedStyle,
          ]}
        >
          <SafeAreaView style={styles.safeArea}>
            <StatusBar
              barStyle={theme.isDark ? 'light-content' : 'dark-content'}
              backgroundColor='transparent'
              translucent
            />

            {/* 헤더 */}
            <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
              <TouchableOpacity
                onPress={handleClose}
                style={styles.headerButton}
                onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              >
                <Text style={[styles.headerButtonText, { color: theme.colors.text.secondary }]}>
                  취소
                </Text>
              </TouchableOpacity>

              <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
                새 일정
              </Text>

              <TouchableOpacity
                onPress={handleSave}
                style={[
                  styles.headerButton,
                  { backgroundColor: title.trim() ? selectedColor : theme.colors.surface },
                ]}
                disabled={!title.trim()}
                onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
              >
                <Text
                  style={[
                    styles.headerButtonText,
                    {
                      color: title.trim() ? '#FFFFFF' : theme.colors.text.tertiary,
                      fontWeight: '700',
                    },
                  ]}
                >
                  저장
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* 제목 입력 - 자연스러운 디자인 */}
              <View style={styles.titleSection}>
                <TextInput
                  style={[
                    styles.titleInput,
                    {
                      color: theme.colors.text.primary,
                      borderBottomColor: title ? selectedColor : theme.colors.border,
                    },
                  ]}
                  value={title}
                  onChangeText={text => {
                    setTitle(text);
                    if (text) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  placeholder='새로운 일정...'
                  placeholderTextColor={theme.colors.text.tertiary}
                  autoFocus
                  multiline
                  returnKeyType='done'
                />
              </View>

              {/* 빠른 시간 설정 */}
              <View style={[styles.section, { backgroundColor: theme.colors.background.card }]}>
                <View style={styles.sectionHeader}>
                  <Ionicons name='flash-outline' size={20} color={theme.colors.text.secondary} />
                  <Text style={[styles.sectionLabel, { color: theme.colors.text.primary }]}>
                    빠른 설정
                  </Text>
                </View>
                <View style={styles.quickTimeContainer}>
                  {quickTimeOptions.map((option, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.quickTimeButton,
                        {
                          backgroundColor: theme.colors.surface,
                          borderColor: theme.colors.border,
                        },
                      ]}
                      onPress={() => handleQuickTime(option)}
                    >
                      <Text style={[styles.quickTimeText, { color: theme.colors.text.primary }]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* 종일 설정 */}
              <View style={[styles.section, { backgroundColor: theme.colors.background.card }]}>
                <View style={styles.allDayContainer}>
                  <View style={styles.allDayLeft}>
                    <Ionicons name='time-outline' size={20} color={theme.colors.text.secondary} />
                    <Text style={[styles.sectionLabel, { color: theme.colors.text.primary }]}>
                      종일
                    </Text>
                  </View>
                  <Switch
                    value={isAllDay}
                    onValueChange={value => {
                      setIsAllDay(value);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    }}
                    trackColor={{
                      false: theme.colors.surface,
                      true: selectedColor + '40',
                    }}
                    thumbColor={isAllDay ? selectedColor : theme.colors.text.tertiary}
                  />
                </View>
              </View>

              {/* 날짜 시간 설정 */}
              <View style={[styles.section, { backgroundColor: theme.colors.background.card }]}>
                {/* 시작일 */}
                <View style={styles.dateTimeRow}>
                  <View style={styles.dateTimeLeft}>
                    <Ionicons name='play-outline' size={20} color={theme.colors.text.secondary} />
                    <Text style={[styles.sectionLabel, { color: theme.colors.text.primary }]}>
                      시작
                    </Text>
                  </View>
                  <View style={styles.dateTimeRight}>
                    <TouchableOpacity
                      style={[styles.dateButton, { backgroundColor: theme.colors.surface }]}
                      onPress={() => openCustomDatePicker('start', 'date')}
                    >
                      <Text style={[styles.dateText, { color: theme.colors.text.primary }]}>
                        {formatDate(startDate)}
                      </Text>
                    </TouchableOpacity>
                    {!isAllDay && (
                      <TouchableOpacity
                        style={[styles.timeButton, { backgroundColor: theme.colors.surface }]}
                        onPress={() => openCustomDatePicker('start', 'time')}
                      >
                        <Text style={[styles.timeText, { color: theme.colors.text.primary }]}>
                          {formatTime(startDate)}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* 종료일 */}
                <View style={styles.dateTimeRow}>
                  <View style={styles.dateTimeLeft}>
                    <Ionicons name='stop-outline' size={20} color={theme.colors.text.secondary} />
                    <Text style={[styles.sectionLabel, { color: theme.colors.text.primary }]}>
                      종료
                    </Text>
                  </View>
                  <View style={styles.dateTimeRight}>
                    <TouchableOpacity
                      style={[styles.dateButton, { backgroundColor: theme.colors.surface }]}
                      onPress={() => openCustomDatePicker('end', 'date')}
                    >
                      <Text style={[styles.dateText, { color: theme.colors.text.primary }]}>
                        {formatDate(endDate)}
                      </Text>
                    </TouchableOpacity>
                    {!isAllDay && (
                      <TouchableOpacity
                        style={[styles.timeButton, { backgroundColor: theme.colors.surface }]}
                        onPress={() => openCustomDatePicker('end', 'time')}
                      >
                        <Text style={[styles.timeText, { color: theme.colors.text.primary }]}>
                          {formatTime(endDate)}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>

              {/* 장소 설정 */}
              <View style={[styles.section, { backgroundColor: theme.colors.background.card }]}>
                <View style={styles.sectionHeader}>
                  <Ionicons name='location-outline' size={20} color={theme.colors.text.secondary} />
                  <Text style={[styles.sectionLabel, { color: theme.colors.text.primary }]}>
                    장소
                  </Text>
                </View>

                {/* 장소 입력 필드 */}
                <View
                  style={[
                    styles.locationInputContainer,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: locationInputFocused ? selectedColor : theme.colors.border,
                      borderWidth: locationInputFocused ? 2 : 1,
                    },
                  ]}
                >
                  <Ionicons
                    name='location'
                    size={18}
                    color={location ? selectedColor : theme.colors.text.tertiary}
                    style={styles.locationInputIcon}
                  />
                  <TextInput
                    style={[styles.locationInput, { color: theme.colors.text.primary }]}
                    value={location}
                    onChangeText={setLocation}
                    onFocus={() => {
                      setLocationInputFocused(true);
                      setShowLocationSuggestions(true);
                    }}
                    onBlur={() => {
                      setLocationInputFocused(false);
                      // 약간의 지연을 주어 suggestion 선택이 가능하도록 함
                      setTimeout(() => setShowLocationSuggestions(false), 200);
                    }}
                    placeholder='장소를 입력하거나 선택하세요'
                    placeholderTextColor={theme.colors.text.tertiary}
                    returnKeyType='done'
                  />
                  {location.length > 0 && (
                    <TouchableOpacity
                      onPress={() => {
                        setLocation('');
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      style={styles.clearLocationButton}
                    >
                      <Ionicons name='close-circle' size={20} color={theme.colors.text.tertiary} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* 자주 사용하는 장소 제안 */}
                <View style={styles.commonLocationsContainer}>
                  <Text
                    style={[styles.commonLocationsTitle, { color: theme.colors.text.secondary }]}
                  >
                    자주 사용하는 장소
                  </Text>
                  <View style={styles.commonLocationsGrid}>
                    {commonLocations.map((locationOption, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.locationChip,
                          {
                            backgroundColor:
                              location === locationOption.name
                                ? selectedColor + '20'
                                : theme.colors.surface,
                            borderColor:
                              location === locationOption.name
                                ? selectedColor
                                : theme.colors.border,
                          },
                        ]}
                        onPress={() => handleLocationSuggestion(locationOption.name)}
                      >
                        <Ionicons
                          name={locationOption.icon as any}
                          size={16}
                          color={
                            location === locationOption.name
                              ? selectedColor
                              : theme.colors.text.secondary
                          }
                        />
                        <Text
                          style={[
                            styles.locationChipText,
                            {
                              color:
                                location === locationOption.name
                                  ? selectedColor
                                  : theme.colors.text.secondary,
                            },
                          ]}
                        >
                          {locationOption.name}
                        </Text>
                        {location === locationOption.name && (
                          <Ionicons name='checkmark-circle' size={16} color={selectedColor} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              {/* 색상 선택 */}
              <View style={[styles.section, { backgroundColor: theme.colors.background.card }]}>
                <View style={styles.sectionHeader}>
                  <Ionicons
                    name='color-palette-outline'
                    size={20}
                    color={theme.colors.text.secondary}
                  />
                  <Text style={[styles.sectionLabel, { color: theme.colors.text.primary }]}>
                    색상
                  </Text>
                </View>
                <View style={styles.colorPalette}>
                  {colorPalette.map(color => (
                    <TouchableOpacity
                      key={color.value}
                      style={[
                        styles.colorChip,
                        {
                          backgroundColor: color.value,
                          transform: [{ scale: selectedColor === color.value ? 1.2 : 1 }],
                          borderWidth: selectedColor === color.value ? 3 : 0,
                          borderColor: theme.colors.background.primary,
                        },
                      ]}
                      onPress={() => {
                        setSelectedColor(color.value);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      }}
                    >
                      {selectedColor === color.value && (
                        <Ionicons name='checkmark' size={16} color='#FFFFFF' />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={[styles.colorName, { color: theme.colors.text.secondary }]}>
                  {getSelectedColorInfo().name}
                </Text>
              </View>

              {/* 알림 설정 */}
              <View style={[styles.section, { backgroundColor: theme.colors.background.card }]}>
                <View style={styles.sectionHeader}>
                  <Ionicons
                    name='notifications-outline'
                    size={20}
                    color={theme.colors.text.secondary}
                  />
                  <Text style={[styles.sectionLabel, { color: theme.colors.text.primary }]}>
                    알림
                  </Text>
                </View>
                <View style={styles.notificationOptions}>
                  {notificationOptions.map(option => {
                    const isSelected =
                      option.value === 'none'
                        ? notifications.length === 0
                        : notifications.includes(option.value);

                    return (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.notificationChip,
                          {
                            backgroundColor: isSelected
                              ? selectedColor + '20'
                              : theme.colors.surface,
                            borderColor: isSelected ? selectedColor : theme.colors.border,
                          },
                        ]}
                        onPress={() => toggleNotification(option.value)}
                      >
                        <Text
                          style={[
                            styles.notificationText,
                            { color: isSelected ? selectedColor : theme.colors.text.secondary },
                          ]}
                        >
                          {option.label}
                        </Text>
                        {isSelected && option.value !== 'none' && (
                          <Ionicons name='checkmark-circle' size={16} color={selectedColor} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.bottomSpacer} />
            </ScrollView>
          </SafeAreaView>
        </Animated.View>
      </View>

      {/* 커스텀 DateTimePicker */}
      {renderCustomDatePicker()}
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: height * 0.9,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  headerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingTop: 8,
  },
  titleSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: '600',
    borderBottomWidth: 2,
    paddingVertical: 12,
    paddingHorizontal: 0,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  quickTimeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickTimeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  quickTimeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  allDayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  allDayLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dateTimeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  dateTimeRight: {
    flexDirection: 'row',
    gap: 8,
  },
  dateButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 140,
    alignItems: 'center',
  },
  timeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    fontWeight: '500',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '500',
  },

  // 장소 관련 스타일
  locationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 16,
    minHeight: 48,
  },
  locationInputIcon: {
    marginRight: 8,
  },
  locationInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    paddingVertical: 8,
  },
  clearLocationButton: {
    padding: 4,
  },
  commonLocationsContainer: {
    marginTop: 8,
  },
  commonLocationsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  commonLocationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
    minWidth: '30%',
  },
  locationChipText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },

  colorPalette: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  colorChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  colorName: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  notificationOptions: {
    gap: 8,
  },
  notificationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  notificationText: {
    fontSize: 14,
    fontWeight: '500',
  },

  // 커스텀 DatePicker 스타일
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    height: height * 0.5,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pickerButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  pickerContent: {
    flex: 1,
    padding: 20,
  },
  datePickerRow: {
    flexDirection: 'row',
    gap: 20,
  },
  pickerColumn: {
    flex: 1,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
  pickerScrollView: {
    maxHeight: 200,
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  pickerItemText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 40,
  },
});

export default AddEventModal;
