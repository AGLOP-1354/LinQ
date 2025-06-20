import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    Dimensions,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { MenuCard, ProfileCard, ThemeToggle } from '../../src/components/ui';
import { useTheme } from '../../src/contexts/ThemeContext';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  // 샘플 사용자 데이터
  const userData = {
    name: '김민수',
    email: 'kimminsu@example.com',
    avatar: undefined,
    memberSince: '2024년 1월',
    planType: 'Premium',
  };

  // 빠른 액션 버튼들
  const quickActions = [
    {
      id: 'analytics',
      title: '분석 보기',
      icon: 'analytics' as const,
      color: theme.colors.primary[500],
      onPress: () => handleAnalyticsView(),
    },
    {
      id: 'backup',
      title: '백업',
      icon: 'cloud-upload' as const,
      color: theme.colors.success,
      onPress: () => handleBackup(),
    },
    {
      id: 'share',
      title: '공유',
      icon: 'share' as const,
      color: theme.colors.info,
      onPress: () => handleShare(),
    },
    {
      id: 'support',
      title: '지원',
      icon: 'help-circle' as const,
      color: theme.colors.warning,
      onPress: () => handleSupport(),
    },
  ];

  // 계정 관리 메뉴
  const accountMenuItems = [
    {
      id: 'edit-profile',
      title: '프로필 편집',
      icon: 'person-circle' as const,
      description: '개인정보 및 프로필 사진 변경',
      onPress: () => handleEditProfile(),
    },
    {
      id: 'account-security',
      title: '계정 보안',
      icon: 'shield-checkmark' as const,
      description: '비밀번호 변경 및 2단계 인증',
      onPress: () => handleAccountSecurity(),
    },
    {
      id: 'subscription',
      title: '구독 관리',
      icon: 'card' as const,
      description: 'Premium 플랜 관리',
      value: userData.planType,
      onPress: () => handleSubscription(),
    },
  ];

  // 앱 설정 메뉴
  const appMenuItems = [
    {
      id: 'notifications',
      title: '알림 설정',
      icon: 'notifications' as const,
      description: '푸시 알림 및 이메일 설정',
      value: '켜짐',
      onPress: () => handleNotificationSettings(),
    },
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
      title: '저장소 관리',
      icon: 'folder' as const,
      description: '캐시 정리 및 저장 공간 관리',
      value: '2.4GB',
      onPress: () => handleStorageSettings(),
    },
  ];

  // 지원 및 정보 메뉴
  const supportMenuItems = [
    {
      id: 'help',
      title: '도움말 센터',
      icon: 'help-circle' as const,
      description: '자주 묻는 질문 및 가이드',
      onPress: () => handleHelp(),
    },
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
  ];

  // 계정 관련 메뉴
  const accountActionsItems = [
    {
      id: 'export-data',
      title: '데이터 내보내기',
      icon: 'download' as const,
      description: '개인 데이터 다운로드',
      onPress: () => handleExportData(),
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
  const handleAnalyticsView = () => {
    Alert.alert('분석 페이지', '분석 탭으로 이동합니다.');
  };

  const handleBackup = () => {
    Alert.alert('백업', '데이터 백업을 시작합니다.');
  };

  const handleShare = () => {
    Alert.alert('공유', 'LinQ 앱을 친구들과 공유하세요!');
  };

  const handleSupport = () => {
    Alert.alert('고객 지원', '고객 지원 센터로 연결합니다.');
  };

  const handleEditProfile = () => {
    Alert.alert('프로필 편집', '프로필 편집 화면으로 이동합니다.');
  };

  const handleAccountSecurity = () => {
    Alert.alert('계정 보안', '보안 설정 화면으로 이동합니다.');
  };

  const handleSubscription = () => {
    Alert.alert('구독 관리', '구독 관리 화면으로 이동합니다.');
  };

  const handleNotificationSettings = () => {
    Alert.alert('알림 설정', '알림 설정 화면으로 이동합니다.');
  };

  const handleLanguageSettings = () => {
    Alert.alert('언어 설정', '언어 설정 화면으로 이동합니다.');
  };

  const handleStorageSettings = () => {
    Alert.alert('저장소 관리', '저장소 관리 화면으로 이동합니다.');
  };

  const handleHelp = () => {
    Alert.alert('도움말', '도움말 센터로 이동합니다.');
  };

  const handleFeedback = () => {
    Alert.alert('피드백', '피드백 제출 화면으로 이동합니다.');
  };

  const handleAbout = () => {
    Alert.alert('앱 정보', 'LinQ v1.0.0\n\nAI 기반 스마트 일정 관리 서비스\n\n© 2024 LinQ Team');
  };

  const handleExportData = () => {
    Alert.alert('데이터 내보내기', '개인 데이터 내보내기를 시작합니다.');
  };

  const handleLogout = () => {
    Alert.alert('로그아웃', '정말로 로그아웃하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: () => {
          Alert.alert('로그아웃 완료', '성공적으로 로그아웃되었습니다.');
        },
      },
    ]);
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
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
        {/* 프로필 헤더 */}
        <View style={styles.profileHeader}>
          <ProfileCard
            name={userData.name}
            email={userData.email}
            avatar={userData.avatar}
            onEditPress={handleEditProfile}
          />

          {/* 멤버십 정보 */}
          <View style={[styles.membershipInfo, { backgroundColor: theme.colors.background.card }]}>
            <View style={styles.membershipContent}>
              <View>
                <Text style={[styles.membershipTitle, { color: theme.colors.text.primary }]}>
                  {userData.planType} 멤버
                </Text>
                <Text style={[styles.membershipDate, { color: theme.colors.text.secondary }]}>
                  {userData.memberSince}부터
                </Text>
              </View>
              <View style={[styles.planBadge, { backgroundColor: theme.colors.primary[500] }]}>
                <Text style={[styles.planBadgeText, { color: theme.colors.text.inverse }]}>
                  PRO
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 빠른 액션 */}
        <View style={[styles.quickActionsContainer, { backgroundColor: theme.colors.background.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
            빠른 액션
          </Text>
          <View style={styles.quickActions}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={[styles.quickAction, { backgroundColor: theme.colors.surface }]}
                onPress={action.onPress}
                activeOpacity={0.7}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: action.color + '15' }]}>
                  <Ionicons name={action.icon} size={24} color={action.color} />
                </View>
                <Text style={[styles.quickActionText, { color: theme.colors.text.primary }]}>
                  {action.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 계정 관리 */}
        <MenuCard title='계정 관리' items={accountMenuItems} />

        {/* 앱 설정 */}
        <MenuCard title='앱 설정' items={appMenuItems} />

        {/* 지원 및 정보 */}
        <MenuCard title='지원 및 정보' items={supportMenuItems} />

        {/* 계정 작업 */}
        <MenuCard title='계정 작업' items={accountActionsItems} />

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
  profileHeader: {
    marginBottom: 8,
  },
  membershipInfo: {
    marginHorizontal: 16,
    marginTop: -8,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  membershipContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  membershipTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  membershipDate: {
    fontSize: 14,
    fontWeight: '500',
  },
  planBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  planBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  quickActionsContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
    padding: 16,
    borderRadius: 12,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 32,
  },
});
