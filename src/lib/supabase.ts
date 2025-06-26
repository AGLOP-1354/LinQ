// LinQ Supabase 클라이언트 라이브러리
// 프론트엔드와 백엔드 Edge Functions 연동

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import type {
    AuthResult,
    CreateEventRequest,
    Event,
    EventsResponse,
    GetEventsQuery,
    KakaoLoginRequest,
    NaturalLanguageEvent,
    ParseNLPRequest,
    UpdateEventRequest,
    User,
    UserStatsResponse
} from './types';

// Supabase 설정
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Supabase 클라이언트 생성
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// API 응답 타입
interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    requestId?: string;
    processingTime?: number;
  };
}

// Edge Function 호출 헬퍼
const callEdgeFunction = async <T = any>(
  functionName: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'POST',
  body?: any,
  params?: Record<string, string>
): Promise<T> => {
  const session = await supabase.auth.getSession();

  let url = `${supabaseUrl}/functions/v1/${functionName}`;

  // GET 요청의 경우 쿼리 파라미터 추가
  if (method === 'GET' && params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // 인증 토큰 추가
  if (session?.data?.session?.access_token) {
    headers['Authorization'] = `Bearer ${session.data.session.access_token}`;
  }

  const requestOptions: RequestInit = {
    method,
    headers,
  };

  if (method !== 'GET' && body) {
    requestOptions.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, requestOptions);

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;

      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }

      throw new Error(errorData.error?.message || errorData.message || `HTTP ${response.status}`);
    }

    const result: APIResponse<T> = await response.json();

    if (!result.success) {
      throw new Error(result.error?.message || 'API call failed');
    }

    return result.data as T;
  } catch (error) {
    console.error(`Edge Function ${functionName} error:`, error);
    throw error;
  }
};

// ===== 인증 API =====
export const auth = {
  // 카카오 로그인
  kakaoLogin: async (accessToken: string): Promise<AuthResult> => {
    const request: KakaoLoginRequest = {
      accessToken,
      deviceInfo: {
        platform: 'react-native',
        version: '1.0.0',
      },
    };

    return callEdgeFunction<AuthResult>('auth/kakao-login', 'POST', request);
  },

  // 로그아웃
  logout: async (): Promise<void> => {
    await supabase.auth.signOut();
  },

  // 현재 사용자 정보
  getCurrentUser: async (): Promise<User | null> => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // user_profiles 테이블에서 추가 정보 조회
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile) return null;

    return {
      id: profile.id,
      name: profile.name,
      email: user.email || '',
      avatar: profile.avatar_url,
      provider: profile.provider,
    };
  },
};

// ===== 이벤트 API =====
export const events = {
  // 이벤트 목록 조회
  getEvents: async (query?: GetEventsQuery): Promise<EventsResponse & { stats?: UserStatsResponse }> => {
    const params: Record<string, string> = {};

    if (query?.startDate) params.startDate = query.startDate;
    if (query?.endDate) params.endDate = query.endDate;
    if (query?.category) params.category = query.category;
    if (query?.completed !== undefined) params.completed = query.completed.toString();
    if (query?.priority) params.priority = query.priority;
    if (query?.page) params.page = query.page.toString();
    if (query?.limit) params.limit = query.limit.toString();
    if (query?.includeStats) params.includeStats = 'true';

    return callEdgeFunction<EventsResponse & { stats?: UserStatsResponse }>(
      'events/get-events',
      'GET',
      undefined,
      params
    );
  },

  // 이벤트 생성
  createEvent: async (eventData: CreateEventRequest): Promise<{
    event: Event;
    conflicts?: Event[];
    warnings?: string[];
  }> => {
    return callEdgeFunction('events/create-event', 'POST', eventData);
  },

  // 이벤트 수정
  updateEvent: async (eventId: string, eventData: UpdateEventRequest): Promise<{
    event: Event;
    conflicts?: Event[];
    warnings?: string[];
  }> => {
    return callEdgeFunction(`events/update-event`, 'PUT', {
      id: eventId,
      ...eventData,
    });
  },

  // 이벤트 삭제
  deleteEvent: async (eventId: string): Promise<void> => {
    return callEdgeFunction(`events/delete-event`, 'DELETE', { id: eventId });
  },

  // 이벤트 완료 상태 토글
  toggleComplete: async (eventId: string): Promise<Event> => {
    return callEdgeFunction(`events/toggle-complete`, 'POST', { id: eventId });
  },

  // 이벤트 충돌 검사
  checkConflicts: async (startDate: string, endDate: string, excludeId?: string): Promise<Event[]> => {
    const params: Record<string, string> = {
      startDate,
      endDate,
    };

    if (excludeId) {
      params.excludeId = excludeId;
    }

    return callEdgeFunction<Event[]>('events/check-conflicts', 'GET', undefined, params);
  },
};

// ===== AI API =====
export const ai = {
  // 자연어 파싱
  parseNLP: async (input: string, context?: { currentDate?: string }): Promise<NaturalLanguageEvent & {
    meta?: {
      fromCache?: boolean;
      confidence?: number;
      reasoning?: string;
      location?: string;
      description?: string;
      tokensUsed?: number;
    };
  }> => {
    const request: ParseNLPRequest = {
      input,
      context,
    };

    return callEdgeFunction('ai/parse-nlp', 'POST', request);
  },

  // AI 추천 받기
  getRecommendations: async (eventData: Partial<Event>): Promise<{
    category?: string;
    priority?: string;
    notifications?: string[];
    location?: string;
    suggestions?: string[];
  }> => {
    return callEdgeFunction('ai/recommendations', 'POST', eventData);
  },
};

// ===== 통계 API =====
export const stats = {
  // 사용자 통계
  getUserStats: async (): Promise<UserStatsResponse> => {
    return callEdgeFunction<UserStatsResponse>('stats/user-stats', 'GET');
  },

  // 월별 통계
  getMonthlyStats: async (year: number, month: number): Promise<{
    events: Event[];
    stats: {
      total: number;
      completed: number;
      by_category: Record<string, number>;
      by_day: Record<string, number>;
    };
  }> => {
    const params = {
      year: year.toString(),
      month: month.toString(),
    };

    return callEdgeFunction('stats/monthly-stats', 'GET', undefined, params);
  },
};

// ===== 실시간 구독 =====
export const realtime = {
  // 이벤트 변경 구독
  subscribeToEvents: (
    userId: string,
    callback: (payload: any) => void
  ) => {
    return supabase
      .channel(`user_events:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
          filter: `user_id=eq.${userId}`,
        },
        callback
      )
      .subscribe();
  },

  // 구독 해제
  unsubscribe: (subscription: any) => {
    return supabase.removeChannel(subscription);
  },
};

// ===== 유틸리티 함수 =====
export const utils = {
  // 연결 상태 확인
  checkConnection: async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.from('user_profiles').select('count').limit(1);
      return !error;
    } catch {
      return false;
    }
  },

  // 오프라인 상태 확인
  isOffline: (): boolean => {
    // React Native에서 네트워크 상태 확인
    // 실제 구현에서는 @react-native-community/netinfo 사용
    return false;
  },

  // 에러 분석
  analyzeError: (error: any): {
    type: 'network' | 'auth' | 'validation' | 'server' | 'unknown';
    message: string;
    retryable: boolean;
  } => {
    const errorMessage = error?.message || error?.toString() || 'Unknown error';

    if (errorMessage.includes('Failed to fetch') || errorMessage.includes('network')) {
      return { type: 'network', message: '네트워크 연결을 확인해 주세요.', retryable: true };
    }

    if (errorMessage.includes('JWT') || errorMessage.includes('Unauthorized')) {
      return { type: 'auth', message: '로그인이 필요합니다.', retryable: false };
    }

    if (errorMessage.includes('validation') || errorMessage.includes('Invalid')) {
      return { type: 'validation', message: '입력한 정보를 확인해 주세요.', retryable: false };
    }

    if (errorMessage.includes('500') || errorMessage.includes('Internal')) {
      return { type: 'server', message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.', retryable: true };
    }

    return { type: 'unknown', message: errorMessage, retryable: false };
  },
};

// 기본 export
export default {
  supabase,
  auth,
  events,
  ai,
  stats,
  realtime,
  utils,
};
