// 사용자 관련 타입
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  preferences: UserPreferences;
  aiProfile: AIProfile;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  workingHours: {
    start: string;
    end: string;
  };
  timezone: string;
  language: string;
  notifications: NotificationSettings;
  theme: 'light' | 'dark' | 'auto';
}

export interface AIProfile {
  learningEnabled: boolean;
  behaviorPatterns: BehaviorPattern[];
  preferences: string[];
  communicationStyle: 'formal' | 'casual' | 'auto';
}

export interface BehaviorPattern {
  type: 'time_preference' | 'location_preference' | 'activity_type';
  pattern: string;
  confidence: number;
  lastUpdated: Date;
}

// 일정 관련 타입
export interface Event {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  priority: Priority;
  status: EventStatus;
  category: EventCategory;
  location?: Location;
  participants?: Participant[];
  isRecurring: boolean;
  recurringPattern?: RecurringPattern;
  reminders: Reminder[];
  aiGenerated: boolean;
  aiPriorityInfo?: AIPriorityInfo;
  metadata: EventMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export type Priority = 'HIGH' | 'MEDIUM' | 'LOW';
export type EventStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type EventCategory = 'work' | 'personal' | 'health' | 'social' | 'travel' | 'other';

export interface Location {
  name: string;
  address?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  travelTime?: number;
}

export interface Participant {
  id: string;
  name: string;
  email: string;
  status: 'pending' | 'accepted' | 'declined';
}

export interface RecurringPattern {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  daysOfWeek?: number[];
  endDate?: Date;
}

export interface Reminder {
  id: string;
  type: 'notification' | 'email' | 'sms';
  timeBeforeEvent: number; // 분 단위
  isEnabled: boolean;
}

export interface AIPriorityInfo {
  suggested: Priority;
  confidence: number;
  reasoning: string;
  factors: string[];
  canOverride: boolean;
}

export interface EventMetadata {
  source: 'user' | 'ai' | 'import';
  conflictsWith?: string[];
  optimizationSuggestions?: string[];
  tags: string[];
}

// AI 채팅 관련 타입
export interface ChatMessage {
  id: string;
  content: string;
  type: 'user' | 'ai';
  timestamp: Date;
  eventData?: Partial<Event>;
  suggestions?: AISuggestion[];
  processingStatus?: 'processing' | 'completed' | 'error';
}

export interface AISuggestion {
  id: string;
  type: 'event_creation' | 'event_modification' | 'schedule_optimization' | 'time_blocking';
  title: string;
  description: string;
  data: any;
  confidence: number;
  isAccepted?: boolean;
}

// 알림 관련 타입
export interface NotificationSettings {
  push: boolean;
  email: boolean;
  sms: boolean;
  quiet_hours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  event_reminders: boolean;
  ai_suggestions: boolean;
  daily_summary: boolean;
  weekly_report: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: 'reminder' | 'suggestion' | 'conflict' | 'summary';
  eventId?: string;
  data?: any;
  isRead: boolean;
  scheduledFor: Date;
  createdAt: Date;
}

// 분석 관련 타입
export interface AnalyticsData {
  period: 'day' | 'week' | 'month' | 'year';
  dateRange: {
    start: Date;
    end: Date;
  };
  productivity: ProductivityMetrics;
  timeDistribution: TimeDistribution;
  goals: GoalTracking[];
  insights: AIInsight[];
}

export interface ProductivityMetrics {
  completionRate: number;
  averageTaskDuration: number;
  busyHours: { hour: number; count: number }[];
  freeTime: number;
  overallScore: number;
}

export interface TimeDistribution {
  categories: {
    category: EventCategory;
    duration: number;
    percentage: number;
  }[];
  dailyAverages: {
    date: string;
    totalTime: number;
    categories: { [key in EventCategory]?: number };
  }[];
}

export interface GoalTracking {
  id: string;
  title: string;
  target: number;
  current: number;
  unit: string;
  category: EventCategory;
  deadline: Date;
  progress: number; // 0-100
  isCompleted: boolean;
}

export interface AIInsight {
  id: string;
  type: 'pattern' | 'suggestion' | 'warning' | 'achievement';
  title: string;
  description: string;
  actionable: boolean;
  confidence: number;
  data?: any;
  createdAt: Date;
}

// API 응답 타입
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

// 폼 관련 타입
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface EventFormData {
  title: string;
  description?: string;
  startDate: Date;
  startTime: string;
  endDate: Date;
  endTime: string;
  priority: Priority;
  category: EventCategory;
  location?: string;
  reminders: number[];
  isRecurring: boolean;
  recurringPattern?: Partial<RecurringPattern>;
}

// 네비게이션 관련 타입
export type RootStackParamList = {
  index: undefined;
  '(auth)': undefined;
  '(tabs)': undefined;
};

export type AuthStackParamList = {
  login: undefined;
  register: undefined;
};

export type TabParamList = {
  index: undefined;
  calendar: undefined;
  chat: undefined;
  analytics: undefined;
  profile: undefined;
};

// 상태 관리 타입
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  register: (userData: RegisterData) => Promise<void>;
}

export interface EventState {
  events: Event[];
  selectedDate: Date;
  view: 'month' | 'week' | 'day';
  isLoading: boolean;
  addEvent: (event: Partial<Event>) => Promise<Event>;
  updateEvent: (eventId: string, updates: Partial<Event>) => Promise<Event>;
  deleteEvent: (eventId: string) => Promise<void>;
  setSelectedDate: (date: Date) => void;
  setView: (view: 'month' | 'week' | 'day') => void;
}

export interface AIState {
  chatHistory: ChatMessage[];
  isProcessing: boolean;
  suggestions: AISuggestion[];
  sendMessage: (message: string) => Promise<void>;
  acceptSuggestion: (suggestionId: string) => Promise<void>;
  clearHistory: () => void;
} 