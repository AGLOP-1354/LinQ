// LinQ 백엔드 공유 타입 정의
// 프론트엔드 인터페이스와 완벽 호환

// ===== 사용자 관련 타입 =====
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  provider: 'kakao' | 'google' | 'apple';
}

export interface UserProfile {
  id: string;
  name: string;
  avatar_url?: string;
  provider: 'kakao' | 'google' | 'apple';
  kakao_id?: string;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    aiSuggestions: boolean;
    defaultCategory: 'work' | 'health' | 'social' | 'personal';
  };
  created_at: string;
  updated_at: string;
}

// ===== 이벤트 관련 타입 =====
export interface Event {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  isAllDay: boolean;
  color: EventColor;
  location?: string;
  notifications: NotificationType[];
  category: EventCategory;
  isCompleted?: boolean;
  priority?: EventPriority;
  description?: string;
}

export interface DatabaseEvent {
  id: string;
  user_id: string;
  title: string;
  start_date: string;
  end_date: string;
  is_all_day: boolean;
  color: EventColor;
  location?: string;
  notifications: NotificationType[];
  category: EventCategory;
  is_completed: boolean;
  priority?: EventPriority;
  description?: string;
  ai_analysis?: any;
  created_at: string;
  updated_at: string;
}

export type EventColor =
  | '#EF4444' // 빨강
  | '#F97316' // 주황
  | '#EAB308' // 노랑
  | '#22C55E' // 초록
  | '#3B82F6' // 파랑
  | '#8B5CF6' // 보라
  | '#EC4899' // 분홍
  | '#6B7280'; // 회색

export type EventCategory = 'work' | 'health' | 'social' | 'personal';
export type EventPriority = 'HIGH' | 'MEDIUM' | 'LOW';
export type NotificationType = '정시' | '15분전' | '30분전' | '1시간전' | '1일전';

// ===== AI 분석 관련 타입 =====
export interface AIAnalysis {
  id: string;
  user_id: string;
  type: 'parsing' | 'priority' | 'suggestion' | 'conflict';
  input_text: string;
  input_hash: string;
  output: any;
  confidence: number;
  model: string;
  processing_time?: number;
  tokens_used?: number;
  created_at: string;
}

export interface NaturalLanguageEvent {
  originalText: string;
  parsed: {
    title: string;
    startDate: Date;
    endDate: Date;
    category: EventCategory;
    isAllDay: boolean;
    confidence: number;
  };
  suggestions?: string[];
}

// ===== API 응답 타입 =====
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId: string;
    processingTime: number;
  };
}

export interface AuthResult {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface EventsResponse {
  events: Event[];
  total: number;
  page?: number;
  limit?: number;
}

export interface UserStatsResponse {
  total: number;
  completed: number;
  pending: number;
  today: number;
  this_week: number;
  by_category: Record<EventCategory, number>;
  by_priority: Record<EventPriority | 'NONE', number>;
}

// ===== 요청 타입 =====
export interface KakaoLoginRequest {
  accessToken: string;
  deviceInfo: {
    platform: 'ios' | 'android';
    deviceId: string;
    appVersion: string;
  };
}

export interface CreateEventRequest {
  title: string;
  start_date: string;
  end_date: string;
  is_all_day?: boolean;
  color: EventColor;
  location?: string;
  notifications?: NotificationType[];
  category: EventCategory;
  priority?: EventPriority;
  description?: string;
}

export interface UpdateEventRequest extends Partial<CreateEventRequest> {
  is_completed?: boolean;
}

export interface ParseNLPRequest {
  input: string;
  context?: {
    currentDate: string;
    userPreferences?: UserProfile['preferences'];
  };
}

export interface GetEventsQuery {
  startDate?: string;
  endDate?: string;
  category?: EventCategory;
  completed?: boolean;
  priority?: EventPriority;
  page?: number;
  limit?: number;
}

// ===== 에러 타입 =====
export enum ErrorCode {
  // 인증 에러
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  KAKAO_AUTH_FAILED = 'KAKAO_AUTH_FAILED',

  // 데이터 에러
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  DUPLICATE_ERROR = 'DUPLICATE_ERROR',

  // 비즈니스 로직 에러
  EVENT_CONFLICT = 'EVENT_CONFLICT',
  INVALID_DATE_RANGE = 'INVALID_DATE_RANGE',
  CANNOT_COMPLETE_FUTURE_EVENT = 'CANNOT_COMPLETE_FUTURE_EVENT',

  // 외부 서비스 에러
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // 시스템 에러
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
}

export class APIError extends Error {
  public code: ErrorCode;
  public details?: any;
  public statusCode: number;

  constructor(
    code: ErrorCode,
    message: string,
    details?: any,
    statusCode: number = 400
  ) {
    super(message);
    this.name = 'APIError';
    this.code = code;
    this.details = details;
    this.statusCode = statusCode;
  }
}
