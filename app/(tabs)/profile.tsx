import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  StatusBar,
  Alert,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { useTheme } from '../../src/contexts/ThemeContext';
import { ProfileCard, MenuCard, StatCard, ThemeToggle } from '../../src/components/ui';

export default function ProfileScreen() {
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  // 샘플 사용자 데이터
  const userData = {
    name: '김민수',
    email: 'kimminsu@example.com',
    avatar: undefined, // 프로필 이미지가 없으면 이니셜로 표시
  };

  // 통계 데이터
  const statsData = [
    {
      id: 'events',
      title: '완료한 일정',
      value: 42,
      icon: 'checkmark-circle' as const,
      color: theme.colors.success,
      change: { value: 12, type: 'increase' as const },
    },
    {
      id: 'streak',
      title: '연속 달성일',
      value: 7,
      icon: 'flame' as const,
      color: theme.colors.warning,
      change: { value: 2, type: 'increase' as const },
    },
    {
      id: 'productivity',
      title: '생산성 점수',
      value: '92%',
      icon: 'trending-up' as const,
      color: theme.colors.primary[500],
      change: { value: 5, type: 'increase' as const },
    },
    {
      id: 'time',
      title: '절약한 시간',
      value: '4.2h',
      icon: 'time' as const,
      color: theme.colors.info,
      change: { value: 8, type: 'increase' as const },
    },
  ];

  // 계정 설정 메뉴
  const accountMenuItems = [
    {
      id: 'edit-profile',
      title: '프로필 편집',
      icon: 'person-circle' as const,
      description: '개인정보 및 설정 변경',
      onPress: () => handleEditProfile(),
    },
    {
      id: 'notifications',
      title: '알림 설정',
      icon: 'notifications' as const,
      description: '푸시 알림 및 이메일 설정',
      value: '켜짐',
      onPress: () => handleNotificationSettings(),
    },
    {
      id: 'privacy',
      title: '개인정보 보호',
      icon: 'shield-checkmark' as const,
      description: '데이터 보안 및 개인정보 설정',
      onPress: () => handlePrivacySettings(),
    },
  ];

  // 앱 설정 메뉴
  const appMenuItems = [
    {
      id: 'theme',
      title: '다크 모드',
      icon: 'moon' as const,
      description: '테마 설정',
      showArrow: false,
      component: <ThemeToggle size='small' showLabel={false} />,
    },
    {
      id: 'language',
      title: '언어',
      icon: 'language' as const,
      description: '앱 언어 설정',
      value: '한국어',
      onPress: () => handleLanguageSettings(),
    },
    {
      id: 'storage',
      title: '저장소',
      icon: 'cloud' as const,
      description: '데이터 동기화 및 백업',
      value: '2.4GB',
      onPress: () => handleStorageSettings(),
    },
    {
      id: 'help',
      title: '도움말 및 지원',
      icon: 'help-circle' as const,
      description: '자주 묻는 질문 및 고객 지원',
      onPress: () => handleHelp(),
    },
  ];

  // 기타 메뉴
  const otherMenuItems = [
    {
      id: 'feedback',
      title: '피드백 보내기',
      icon: 'chatbubble-ellipses' as const,
      description: '앱 개선을 위한 의견 제출',
      onPress: () => handleFeedback(),
    },
    {
      id: 'about',
      title: '앱 정보',
      icon: 'information-circle' as const,
      description: '버전 정보 및 라이센스',
      value: 'v1.0.0',
      onPress: () => handleAbout(),
    },
    {
      id: 'logout',
      title: '로그아웃',
      icon: 'log-out' as const,
      description: '현재 계정에서 로그아웃',
      color: theme.colors.error,
      onPress: () => handleLogout(),
    },
  ];

  // 이벤트 핸들러들
  const handleEditProfile = () => {
    Alert.alert('프로필 편집', '프로필 편집 화면으로 이동합니다.');
  };

  const handleNotificationSettings = () => {
    Alert.alert('알림 설정', '알림 설정 화면으로 이동합니다.');
  };

  const handlePrivacySettings = () => {
    Alert.alert('개인정보 보호', '개인정보 보호 설정 화면으로 이동합니다.');
  };

  const handleLanguageSettings = () => {
    Alert.alert('언어 설정', '언어 설정 화면으로 이동합니다.');
  };

  const handleStorageSettings = () => {
    Alert.alert('저장소 설정', '저장소 관리 화면으로 이동합니다.');
  };

  const handleHelp = () => {
    Alert.alert('도움말', '도움말 및 지원 화면으로 이동합니다.');
  };

  const handleFeedback = () => {
    Alert.alert('피드백', '피드백 제출 화면으로 이동합니다.');
  };

  const handleAbout = () => {
    Alert.alert('앱 정보', 'LinQ v1.0.0\n\nAI 기반 스마트 일정 관리 서비스\n\n© 2024 LinQ Team');
  };

  const handleLogout = () => {
    Alert.alert('로그아웃', '정말로 로그아웃하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: () => {
          // 실제 로그아웃 로직 구현
          Alert.alert('로그아웃 완료', '성공적으로 로그아웃되었습니다.');
        },
      },
    ]);
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // 실제 데이터 새로고침 로직
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background.primary}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary[500]}
            colors={[theme.colors.primary[500]]}
          />
        }
      >
        {/* 프로필 카드 */}
        <ProfileCard
          name={userData.name}
          email={userData.email}
          avatar={userData.avatar}
          onEditPress={handleEditProfile}
        />

        {/* 통계 카드 */}
        <StatCard title='이번 주 활동' stats={statsData} />

        {/* 계정 설정 */}
        <MenuCard title='계정' items={accountMenuItems} />

        {/* 앱 설정 */}
        <MenuCard title='설정' items={appMenuItems} />

        {/* 기타 */}
        <MenuCard title='기타' items={otherMenuItems} />

        {/* 하단 여백 */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  bottomSpacer: {
    height: 32,
  },
});
