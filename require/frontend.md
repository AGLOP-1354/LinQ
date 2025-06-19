# LinQ Frontend 개발 문서

## 1. 프로젝트 개요

**LinQ**는 AI 기반의 스마트 일정 관리 React Native 애플리케이션입니다. 사용자의 일상 패턴과 업무 스타일을 학습하여 개인화된 일정 제안, 자동 정리, 일정 충돌 해결 등의 기능을 제공하는 크로스 플랫폼 모바일 앱입니다.

---

## 2. 기술 스택

### 2.1 Core Framework
- **React Native 0.73+**: 최신 New Architecture (Fabric, TurboModules) 사용
- **TypeScript**: 강타입 시스템으로 안정성 확보
- **Expo**: 개발 환경 및 배포 관리

### 2.2 UI/UX
- **Tailwind CSS (NativeWind)**: 유틸리티 퍼스트 스타일링
- **shadcn/ui for React Native**: 일관성 있는 컴포넌트 라이브러리
- **React Native Reanimated 3**: 고성능 애니메이션
- **React Native Gesture Handler**: 제스처 인터랙션

### 2.3 상태 관리
- **Zustand**: 가벼우면서 강력한 상태 관리
- **React Query (TanStack Query)**: 서버 상태 관리 및 캐싱
- **React Hook Form**: 폼 상태 관리 및 유효성 검사

### 2.4 네비게이션
- **React Navigation 6**: Stack, Tab, Drawer 네비게이션
- **React Native Screens**: 네이티브 스크린 최적화

### 2.5 데이터 & API
- **Axios**: HTTP 클라이언트
- **React Query**: API 캐싱 및 동기화
- **AsyncStorage**: 로컬 데이터 저장
- **React Native Keychain**: 보안 데이터 저장

### 2.6 AI 연동
- **WebSocket**: 실시간 AI 응답 수신
- **Voice-to-Text**: 음성 일정 입력 (React Native Voice)
- **Natural Language Processing**: 자연어 일정 파싱

### 2.7 부가 기능
- **React Native Push Notification**: 스마트 알림
- **React Native Maps**: 위치 기반 서비스
- **React Native Calendar Events**: 디바이스 캘린더 연동
- **React Native Contacts**: 연락처 연동

---

## 3. 앱 구조 및 화면 설계

### 3.1 앱 플로우
```
Splash Screen
    ↓
Onboarding (신규 사용자)
    ↓
Auth Flow (로그인/회원가입)
    ↓
Main App (Tab Navigation)
    ├── Home (오늘 일정)
    ├── Calendar (캘린더 뷰)
    ├── AI Chat (자연어 입력)
    ├── Analytics (리포트)
    └── Profile (설정)
```

### 3.2 주요 화면 상세

#### 3.2.1 Home Screen (홈 화면)
- **Today's Schedule**: 오늘 일정 리스트
- **Quick Actions**: 빠른 일정 추가, AI 제안 보기
- **Weather & Traffic**: 날씨 및 교통 정보
- **AI Insights**: 일정 최적화 제안
- **Upcoming Events**: 다음 일정 미리보기

#### 3.2.2 Calendar Screen (캘린더)
- **Month/Week/Day View**: 다양한 캘린더 뷰
- **Event Details**: 일정 상세 정보
- **Drag & Drop**: 일정 이동 기능
- **Color Coding**: 카테고리별 색상 구분
- **Conflict Detection**: 일정 충돌 표시

#### 3.2.3 AI Chat Screen (AI 대화)
- **Natural Language Input**: 자연어 일정 입력
- **Voice Input**: 음성 인식 입력
- **AI Suggestions**: AI 기반 일정 제안
- **Schedule Optimization**: 일정 최적화 대화
- **Chat History**: 대화 히스토리

#### 3.2.4 Analytics Screen (분석)
- **Weekly Summary**: 주간 일정 요약
- **Productivity Metrics**: 생산성 지표
- **Time Distribution**: 시간 배분 분석
- **Goal Tracking**: 목표 달성 현황
- **AI Insights**: AI 분석 리포트

#### 3.2.5 Profile Screen (프로필)
- **User Settings**: 사용자 설정
- **Notification Preferences**: 알림 설정
- **AI Training**: AI 학습 데이터 관리
- **Data Export**: 데이터 내보내기
- **Privacy Settings**: 개인정보 설정

---

## 4. 컴포넌트 아키텍처

### 4.1 폴더 구조
```
src/
├── components/           # 재사용 가능한 컴포넌트
│   ├── ui/              # shadcn/ui 기반 기본 컴포넌트
│   ├── forms/           # 폼 관련 컴포넌트
│   ├── calendar/        # 캘린더 관련 컴포넌트
│   ├── chat/            # AI 채팅 컴포넌트
│   └── common/          # 공통 컴포넌트
├── screens/             # 화면 컴포넌트
│   ├── auth/            # 인증 관련 화면
│   ├── home/            # 홈 화면
│   ├── calendar/        # 캘린더 화면
│   ├── chat/            # AI 채팅 화면
│   ├── analytics/       # 분석 화면
│   └── profile/         # 프로필 화면
├── navigation/          # 네비게이션 설정
├── services/            # API 및 외부 서비스
├── hooks/               # 커스텀 훅
├── utils/               # 유틸리티 함수
├── types/               # TypeScript 타입 정의
├── stores/              # Zustand 스토어
├── constants/           # 상수 정의
└── assets/              # 이미지, 폰트 등
```

### 4.2 주요 컴포넌트 설계

#### 4.2.1 EventCard 컴포넌트
```typescript
interface EventCardProps {
  event: Event;
  onEdit: (event: Event) => void;
  onDelete: (eventId: string) => void;
  onComplete: (eventId: string) => void;
  onPriorityChange: (eventId: string, priority: 'HIGH' | 'MEDIUM' | 'LOW') => void;
  isDraggable?: boolean;
  showActions?: boolean;
  showAIPriorityIndicator?: boolean;
}
```

#### 4.2.2 AIChat 컴포넌트
```typescript
interface AIChatProps {
  onEventCreate: (event: Partial<Event>) => void;
  onEventUpdate: (eventId: string, updates: Partial<Event>) => void;
  context?: CalendarContext;
}
```

#### 4.2.3 Calendar 컴포넌트
```typescript
interface CalendarProps {
  events: Event[];
  view: 'month' | 'week' | 'day';
  onDateSelect: (date: Date) => void;
  onEventSelect: (event: Event) => void;
  onEventDrop: (eventId: string, newDate: Date) => void;
}
```

---

## 5. 상태 관리 구조

### 5.1 Zustand 스토어 구성

#### 5.1.1 AuthStore
```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  register: (userData: RegisterData) => Promise<void>;
}
```

#### 5.1.2 EventStore
```typescript
interface EventState {
  events: Event[];
  selectedDate: Date;
  view: CalendarView;
  addEvent: (event: Partial<Event>) => Promise<void>;
  updateEvent: (eventId: string, updates: Partial<Event>) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  setSelectedDate: (date: Date) => void;
  setView: (view: CalendarView) => void;
}
```

#### 5.1.3 AIStore
```typescript
interface AIState {
  chatHistory: ChatMessage[];
  isProcessing: boolean;
  suggestions: AISuggestion[];
  sendMessage: (message: string) => Promise<void>;
  acceptSuggestion: (suggestionId: string) => Promise<void>;
  clearHistory: () => void;
}
```

### 5.2 React Query 쿼리 구성
```typescript
// 이벤트 관련 쿼리
const useEvents = (dateRange: DateRange) => useQuery(['events', dateRange], fetchEvents);
const useEventById = (eventId: string) => useQuery(['event', eventId], () => fetchEvent(eventId));

// AI 관련 쿼리
const useAISuggestions = () => useQuery(['ai-suggestions'], fetchAISuggestions);
const useAnalytics = (period: string) => useQuery(['analytics', period], () => fetchAnalytics(period));
```

---

## 6. API 연동 방식

### 6.1 API 서비스 구조
```typescript
class APIService {
  private axiosInstance: AxiosInstance;
  
  // 이벤트 관련 API
  async getEvents(dateRange: DateRange): Promise<Event[]>;
  async createEvent(event: Partial<Event>): Promise<Event>;
  async updateEvent(eventId: string, updates: Partial<Event>): Promise<Event>;
  async deleteEvent(eventId: string): Promise<void>;
  
  // AI 관련 API
  async sendChatMessage(message: string): Promise<ChatResponse>;
  async getAISuggestions(): Promise<AISuggestion[]>;
  async processNaturalLanguage(input: string): Promise<ParsedEvent>;
  
  // 분석 관련 API
  async getAnalytics(period: string): Promise<AnalyticsData>;
  async getUserInsights(): Promise<UserInsights>;
}
```

### 6.2 WebSocket 연결 관리
```typescript
class WebSocketService {
  private ws: WebSocket | null = null;
  
  connect(userId: string): void;
  disconnect(): void;
  sendMessage(type: string, data: any): void;
  onMessage(callback: (message: WebSocketMessage) => void): void;
  onAIResponse(callback: (response: AIResponse) => void): void;
}
```

---

## 7. UI/UX 가이드라인

### 7.1 디자인 시스템
- **Primary Color**: #3B82F6 (Blue)
- **Secondary Color**: #10B981 (Green)
- **Accent Color**: #F59E0B (Amber)
- **Text Colors**: #111827 (Dark), #6B7280 (Gray), #9CA3AF (Light Gray)
- **Background**: #FFFFFF (White), #F9FAFB (Light Gray)

### 7.2 Typography
- **Heading**: Inter Bold 24px/32px
- **Subheading**: Inter SemiBold 18px/24px
- **Body**: Inter Regular 16px/24px
- **Caption**: Inter Regular 14px/20px

### 7.3 Spacing
- **Base Unit**: 4px
- **Common Spacing**: 8px, 12px, 16px, 24px, 32px, 48px

### 7.4 애니메이션 가이드라인
- **Duration**: Fast (200ms), Normal (300ms), Slow (500ms)
- **Easing**: easeInOut for most transitions
- **Gesture Feedback**: Immediate visual feedback for all interactions

---

## 8. 주요 기능 구현 가이드

### 8.1 AI 중요도 자동 분석
```typescript
const useAIPriorityAnalysis = () => {
  const analyzePriority = useCallback(async (eventData: Partial<Event>) => {
    const analysis = await apiService.analyzePriority(eventData);
    
    return {
      priority: analysis.priority, // 'HIGH', 'MEDIUM', 'LOW'
      confidence: analysis.confidence,
      reasoning: analysis.reasoning,
      canOverride: true // 사용자가 수정 가능
    };
  }, []);
  
  return { analyzePriority };
};

const PriorityIndicator = ({ priority, confidence, reasoning, onOverride }) => {
  const [showReasoning, setShowReasoning] = useState(false);
  
  const priorityColors = {
    HIGH: '#ef4444',    // 빨간색 (상)
    MEDIUM: '#f59e0b',  // 주황색 (중)
    LOW: '#10b981'      // 초록색 (하)
  };
  
  const priorityLabels = {
    HIGH: '상',
    MEDIUM: '중', 
    LOW: '하'
  };
  
  return (
    <View style={styles.priorityContainer}>
      <TouchableOpacity onPress={() => setShowReasoning(!showReasoning)}>
        <View style={[styles.priorityBadge, { backgroundColor: priorityColors[priority] }]}>
          <Text style={styles.priorityText}>{priorityLabels[priority]}</Text>
          <Text style={styles.aiLabel}>AI</Text>
        </View>
      </TouchableOpacity>
      
      {showReasoning && (
        <View style={styles.reasoningPopup}>
          <Text style={styles.reasoningText}>{reasoning}</Text>
          <Text style={styles.confidenceText}>신뢰도: {(confidence * 100).toFixed(0)}%</Text>
          <TouchableOpacity onPress={onOverride} style={styles.overrideButton}>
            <Text>수정하기</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};
```

### 8.2 자연어 일정 입력
```typescript
const useNaturalLanguageParser = () => {
  const mutation = useMutation({
    mutationFn: (input: string) => apiService.processNaturalLanguage(input),
    onSuccess: (parsedEvent) => {
      // 파싱된 이벤트를 프리뷰로 표시 (AI 분석된 중요도 포함)
      showEventPreview({
        ...parsedEvent,
        aiPriorityInfo: {
          suggested: parsedEvent.priority,
          confidence: parsedEvent.ai_priority_score,
          reasoning: parsedEvent.priority_reasoning
        }
      });
    }
  });
  
  return {
    parseInput: mutation.mutate,
    isLoading: mutation.isLoading,
    error: mutation.error
  };
};
```

### 8.3 스마트 알림 시스템
```typescript
const useSmartNotifications = () => {
  const scheduleNotification = useCallback(async (event: Event) => {
    const travelTime = await calculateTravelTime(event.location);
    const prepTime = event.preparationTime || 15; // 기본 15분
    const notificationTime = new Date(event.startTime.getTime() - (travelTime + prepTime) * 60000);
    
    await PushNotification.scheduleNotification({
      date: notificationTime,
      title: `${event.title} 준비 시간`,
      message: `${travelTime}분 후 출발하세요.`,
      data: { eventId: event.id }
    });
  }, []);
  
  return { scheduleNotification };
};
```

### 8.4 드래그 앤 드롭 일정 이동
```typescript
const useDragAndDrop = () => {
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      // 드래그 중 시각적 피드백
      runOnJS(updateDragPosition)(event.translationX, event.translationY);
    })
    .onEnd((event) => {
      // 드롭 위치 계산 및 이벤트 업데이트
      const newDate = calculateDateFromPosition(event.absoluteX, event.absoluteY);
      runOnJS(updateEventDate)(eventId, newDate);
    });
    
  return { panGesture };
};
```

### 8.5 오프라인 모드 지원
```typescript
const useOfflineSync = () => {
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const isOnline = useNetInfo().isConnected;
  
  const executeAction = useCallback(async (action: Action) => {
    if (isOnline) {
      await apiService.executeAction(action);
    } else {
      // 오프라인 시 로컬에 저장
      setPendingActions(prev => [...prev, action]);
      await AsyncStorage.setItem('pendingActions', JSON.stringify([...pendingActions, action]));
    }
  }, [isOnline, pendingActions]);
  
  // 온라인 복구 시 동기화
  useEffect(() => {
    if (isOnline && pendingActions.length > 0) {
      syncPendingActions();
    }
  }, [isOnline]);
  
  return { executeAction };
};
```

---

## 9. 성능 최적화

### 9.1 이미지 최적화
- **React Native Fast Image**: 이미지 캐싱 및 최적화
- **WebP 포맷**: 더 작은 파일 크기
- **Lazy Loading**: 화면에 보이는 이미지만 로드

### 9.2 리스트 최적화
- **FlatList**: 대용량 리스트 가상화
- **getItemLayout**: 알려진 아이템 크기로 성능 향상
- **keyExtractor**: 안정적인 키 추출

### 9.3 메모리 관리
- **React.memo**: 불필요한 리렌더링 방지
- **useMemo/useCallback**: 연산 및 함수 메모화
- **Flipper**: 메모리 누수 모니터링

---

## 10. 테스트 전략

### 10.1 단위 테스트 (Jest)
```typescript
describe('EventCard Component', () => {
  it('should render event information correctly', () => {
    const mockEvent = createMockEvent();
    render(<EventCard event={mockEvent} />);
    expect(screen.getByText(mockEvent.title)).toBeInTheDocument();
  });
});
```

### 10.2 통합 테스트 (Detox)
```typescript
describe('Calendar Flow', () => {
  it('should create new event via natural language', async () => {
    await element(by.id('ai-chat-input')).typeText('내일 오후 3시 회의');
    await element(by.id('send-button')).tap();
    await expect(element(by.text('회의'))).toBeVisible();
  });
});
```

---

## 11. 개발 환경 설정

### 11.1 필수 패키지 설치
```bash
# React Native 환경 설정
npx react-native@latest init LinQ --template react-native-template-typescript

# 주요 의존성 설치
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context
npm install @tanstack/react-query zustand
npm install nativewind tailwindcss
npm install react-native-reanimated react-native-gesture-handler
npm install axios react-native-async-storage
npm install @react-native-voice/voice react-native-push-notification
```

### 11.2 개발 도구 설정
- **ESLint + Prettier**: 코드 품질 및 포맷팅
- **Husky**: Git 훅 관리
- **Flipper**: 디버깅 도구
- **Reactotron**: 상태 모니터링

### 11.3 빌드 설정
- **Fastlane**: 자동화된 빌드 및 배포
- **CodePush**: 핫픽스 배포
- **Sentry**: 에러 모니터링

---

## 12. 보안 고려사항

### 12.1 데이터 보안
- **React Native Keychain**: 민감 데이터 암호화 저장
- **Certificate Pinning**: API 통신 보안
- **Biometric Authentication**: 생체 인증 지원

### 12.2 API 보안
- **JWT 토큰**: 인증 및 권한 관리
- **Refresh Token**: 자동 토큰 갱신
- **Rate Limiting**: API 호출 제한

---

## 13. 배포 및 모니터링

### 13.1 배포 파이프라인
- **GitHub Actions**: CI/CD 자동화
- **App Store Connect**: iOS 배포
- **Google Play Console**: Android 배포

### 13.2 모니터링
- **Sentry**: 실시간 에러 추적
- **Analytics**: 사용자 행동 분석
- **Performance Monitoring**: 앱 성능 모니터링

---

## 14. 개발 체크리스트

### 📋 **Phase 1: 프로젝트 초기 설정 (1-2주)**

#### ✅ **환경 설정**
- [x] React Native CLI 설치 및 환경 구성
- [x] TypeScript 설정 완료
- [x] ESLint + Prettier 설정
- [x] Git 저장소 초기화 및 브랜치 전략 수립
- [x] 개발/스테이징/프로덕션 환경 구분 설정

#### ✅ **기본 프로젝트 구조**
- [x] 폴더 구조 생성 (src/components, src/screens, src/services 등)
- [x] 절대경로 import 설정 (@/components, @/utils 등)
- [x] 타입 정의 파일 생성 (types/index.ts)
- [x] 상수 파일 생성 (constants/colors.ts, constants/strings.ts)

#### ✅ **핵심 라이브러리 설치**
- [x] React Navigation 6 설치 및 기본 구조 설정
- [ ] NativeWind (Tailwind CSS) 설정
- [ ] Zustand 상태 관리 설정
- [ ] React Query 설정
- [x] React Native Reanimated 3 설치

### 📋 **Phase 2: 기본 UI 구성 (2-3주)**

#### ✅ **디자인 시스템 구축**
- [x] 색상 팔레트 정의 (primary, secondary, accent colors)
- [x] 타이포그래피 시스템 구축
- [x] 스페이싱 시스템 정의 (4px 기본 단위)
- [x] 기본 컴포넌트 라이브러리 구축
  - [x] Button 컴포넌트
  - [x] Input 컴포넌트
  - [x] Card 컴포넌트
  - [x] Loading 컴포넌트
  - [x] Modal 컴포넌트

#### ✅ **네비게이션 구조**
- [x] Stack Navigator 기본 구조
- [x] Tab Navigator 구현 (Home, AI Chat, Analytics, Profile + 플로팅 버튼)
- [x] 네비게이션 타입 정의
- [ ] 딥링크 설정 (선택적)

#### ✅ **기본 화면 레이아웃**
- [x] Splash Screen 구현
- [ ] Onboarding 화면 구현 (3-4개 슬라이드)
- [x] 로그인/회원가입 화면 기본 레이아웃
- [x] 메인 탭 화면들 기본 레이아웃 생성

### 📋 **Phase 3: 인증 시스템 (1-2주)**

#### ✅ **인증 관련 구현**
- [ ] AuthStore (Zustand) 구현
- [ ] JWT 토큰 관리 (AsyncStorage)
- [ ] 로그인/회원가입 폼 구현
- [ ] 폼 유효성 검사 (React Hook Form)
- [ ] 생체 인증 설정 (React Native Keychain)
- [ ] 자동 로그인 기능
- [ ] 로그아웃 기능

#### ✅ **보안 설정**
- [ ] API 토큰 암호화 저장
- [ ] Certificate Pinning 설정
- [ ] 앱 백그라운드 시 화면 블러 처리
- [ ] 개발자 모드 감지 및 보안 처리

### 📋 **Phase 4: 일정 관리 기능 (3-4주)**

#### ✅ **EventStore 구현**
- [x] 일정 데이터 상태 관리 (AsyncStorage)
- [x] 일정 CRUD 액션 구현
- [x] 캘린더 뷰 상태 관리 (리스트/캘린더)
- [x] 선택된 날짜 상태 관리

#### ✅ **캘린더 컴포넌트**
- [x] 월별 캘린더 뷰 구현
- [ ] 주별 캘린더 뷰 구현
- [ ] 일별 캘린더 뷰 구현
- [x] 캘린더 네비게이션 (이전/다음 월)
- [x] 일정 표시 및 색상 구분
- [x] 터치 이벤트 처리

#### ✅ **EventCard 컴포넌트**
- [x] 일정 카드 기본 레이아웃
- [x] 중요도 표시 (상/중/하 색상 구분)
- [ ] AI 중요도 분석 결과 표시
- [ ] 스와이프 액션 (수정/삭제)
- [ ] 일정 상태 표시 (진행중/완료/취소)

#### ✅ **일정 생성/수정**
- [x] 일정 생성 모달 구현
- [ ] 일정 수정 폼 구현
- [x] 날짜/시간 선택기 구현
- [x] 위치 선택 기능
- [ ] 참석자 추가 기능
- [ ] 반복 일정 설정
- [ ] 알림 설정 기능

### 📋 **Phase 5: AI 기능 구현 (2-3주)**

#### ✅ **자연어 일정 입력**
- [ ] AI Chat 화면 기본 구조
- [ ] 채팅 UI 컴포넌트 구현
- [ ] 음성 인식 기능 (React Native Voice)
- [ ] 자연어 파싱 API 연동
- [ ] 파싱 결과 프리뷰 모달
- [ ] 일정 확정 기능

#### ✅ **AI 중요도 분석**
- [ ] PriorityIndicator 컴포넌트 구현
- [ ] AI 분석 결과 표시
- [ ] 중요도 수정 기능
- [ ] 분석 근거 팝업
- [ ] 신뢰도 표시

#### ✅ **스마트 제안**
- [ ] AI 제안 카드 컴포넌트
- [ ] 일정 최적화 제안 표시
- [ ] 제안 수락/거절 기능
- [ ] 충돌 감지 알림
- [ ] 해결책 제안 UI

### 📋 **Phase 6: 성능 최적화 (1-2주)**

#### ✅ **리스트 최적화**
- [ ] FlatList 가상화 구현
- [ ] getItemLayout 최적화
- [ ] keyExtractor 설정
- [ ] 무한 스크롤 구현
- [ ] Pull-to-refresh 기능

#### ✅ **이미지 및 애니메이션**
- [ ] React Native Fast Image 적용
- [ ] 이미지 캐싱 설정
- [x] 로딩 애니메이션 구현
- [x] 페이지 전환 애니메이션
- [x] 제스처 애니메이션 (플로팅 액션 메뉴)

#### ✅ **메모리 관리**
- [ ] React.memo 적용
- [ ] useMemo/useCallback 최적화
- [ ] 컴포넌트 언마운트 시 리스너 정리
- [ ] 메모리 누수 체크 (Flipper)

### 📋 **Phase 7: 고급 기능 (2-3주)**

#### ✅ **드래그 앤 드롭**
- [ ] React Native Gesture Handler 설정
- [ ] 일정 드래그 기능 구현
- [ ] 드롭 영역 시각적 표시
- [ ] 드래그 중 피드백 애니메이션
- [ ] 드롭 완료 시 일정 업데이트

#### ✅ **오프라인 기능**
- [ ] 네트워크 상태 감지
- [ ] 오프라인 데이터 캐싱
- [ ] 동기화 큐 구현
- [ ] 충돌 해결 로직
- [ ] 오프라인 모드 UI 표시

#### ✅ **푸시 알림**
- [ ] FCM/APNS 설정
- [ ] 디바이스 토큰 관리
- [ ] 알림 권한 요청
- [ ] 포그라운드 알림 처리
- [ ] 알림 터치 시 딥링크

### 📋 **Phase 8: 분석 및 설정 (1-2주)**

#### ✅ **Analytics 화면**
- [ ] 주간/월간 통계 차트
- [ ] 생산성 지표 표시
- [ ] 목표 달성률 시각화
- [ ] AI 인사이트 표시
- [ ] 데이터 내보내기 기능

#### ✅ **Profile/Settings 화면**
- [ ] 사용자 프로필 편집
- [ ] 알림 설정
- [ ] 테마 설정 (다크모드)
- [ ] 언어 설정
- [ ] 개인정보 설정
- [ ] 로그아웃 기능

### 📋 **Phase 9: 테스트 및 품질 보증 (2-3주)**

#### ✅ **단위 테스트**
- [ ] Jest 설정 완료
- [ ] 유틸리티 함수 테스트
- [ ] 커스텀 훅 테스트
- [ ] 컴포넌트 렌더링 테스트
- [ ] 상태 관리 테스트
- [ ] API 서비스 테스트

#### ✅ **통합 테스트**
- [ ] Detox 설정
- [ ] 로그인 플로우 테스트
- [ ] 일정 생성 플로우 테스트
- [ ] AI 기능 테스트
- [ ] 네비게이션 테스트

#### ✅ **접근성**
- [ ] 스크린 리더 지원
- [ ] 접근성 라벨 추가
- [ ] 색상 대비 확인
- [ ] 터치 영역 크기 최적화
- [ ] 키보드 내비게이션

### 📋 **Phase 10: 배포 준비 (1-2주)**

#### ✅ **빌드 최적화**
- [ ] 번들 크기 최적화
- [ ] 코드 스플리팅 적용
- [ ] 이미지 최적화
- [ ] 불필요한 라이브러리 제거
- [ ] ProGuard/R8 설정 (Android)

#### ✅ **배포 설정**
- [ ] Fastlane 설정
- [ ] CodePush 설정
- [x] 앱 아이콘 및 스플래시 스크린
- [ ] 앱 스토어 메타데이터 준비
- [ ] 스크린샷 및 앱 설명 작성

#### ✅ **모니터링**
- [ ] Sentry 에러 추적 설정
- [ ] 성능 모니터링 설정
- [ ] 사용자 분석 도구 연동
- [ ] 크래시 리포팅 설정

### 📋 **Phase 11: 출시 및 유지보수**

#### ✅ **출시**
- [ ] 베타 테스트 진행
- [ ] 피드백 수집 및 반영
- [ ] 스토어 제출
- [ ] 출시 후 모니터링

#### ✅ **유지보수**
- [ ] 버그 수정 프로세스 구축
- [ ] 기능 개선 계획 수립
- [ ] 사용자 피드백 대응
- [ ] 정기 업데이트 계획

---

## 🚀 **현재 개발 진행 상황 (2024년 기준)**

### ✅ **완료된 주요 기능들**
1. **기본 인프라 구축** (Phase 1 완료)
   - React Native + TypeScript 환경 구성
   - 기본 폴더 구조 및 네비게이션 설정
   - 핵심 라이브러리 설치 및 설정

2. **UI/UX 시스템** (Phase 2 거의 완료)
   - 완전한 디자인 시스템 구축 (Colors, Typography, Spacing)
   - 현대적 Tab Navigation (플로팅 액션 버튼 포함)
   - 기본 컴포넌트 라이브러리 완성

3. **일정 관리 핵심 기능** (Phase 4 부분 완료)
   - 월별 캘린더 뷰 완전 구현
   - 리스트/캘린더 뷰 전환 기능
   - 일정 생성 모달 및 기본 CRUD
   - AsyncStorage 기반 로컬 데이터 관리

4. **고급 UI 기능**
   - 플로팅 액션 메뉴 (AI 일정, 수기 등록, 음성 입력)
   - 스프링 애니메이션 및 글래스모피즘 효과
   - 현대적 반응형 캘린더 컴포넌트

5. **앱 배포 준비**
   - 앱 아이콘 및 스플래시 스크린 생성
   - 기본 앱 구조 완성

### 🔄 **현재 진행 중**
- AI 채팅 화면 구현 준비
- 음성 인식 기능 통합 준비
- 백엔드 API 연동 준비

### 📝 **다음 단계 우선순위**
1. **Phase 3: 인증 시스템 구현**
2. **Phase 5: AI 기능 구현** (자연어 일정 입력)
3. **백엔드 API 연동**
4. **Phase 8: Analytics 및 Profile 화면**

### 📊 **전체 진행률**
- **Phase 1 (프로젝트 초기 설정)**: 100% ✅
- **Phase 2 (기본 UI 구성)**: 90% 🔄
- **Phase 3 (인증 시스템)**: 0% ⏳
- **Phase 4 (일정 관리)**: 70% 🔄
- **Phase 5 (AI 기능)**: 0% ⏳
- **Phase 6 (성능 최적화)**: 30% 🔄
- **전체 진행률**: **약 35-40%** 🚀

---

## 🎯 **개발 팁 및 베스트 프랙티스**

### **코드 품질**
- 모든 컴포넌트에 TypeScript 타입 정의
- 컴포넌트당 최대 200줄 제한
- 커스텀 훅으로 로직 분리
- 에러 바운더리 구현

### **성능**
- 이미지는 WebP 포맷 우선 사용
- 큰 리스트는 반드시 FlatList 사용
- 네비게이션 시 불필요한 리렌더링 방지
- Bundle Analyzer로 정기적 크기 체크

### **사용자 경험**
- 로딩 상태는 반드시 표시
- 에러 상황에 대한 친화적 메시지
- 햅틱 피드백 적절히 활용
- 오프라인 상태 명확히 표시

### **보안**
- API 키는 환경변수로 관리
- 민감한 데이터는 Keychain에 저장
- 딥링크 검증 로직 구현
- 앱 변조 감지 기능

---

이 문서는 LinQ 프론트엔드 개발의 전체적인 가이드라인을 제공합니다. 각 섹션의 상세 구현 시 추가적인 기술 문서와 API 명세를 참고하여 개발을 진행하시기 바랍니다.
