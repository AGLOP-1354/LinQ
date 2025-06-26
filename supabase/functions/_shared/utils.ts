// LinQ 백엔드 공통 유틸리티 함수들
// 확장성과 재사용성을 고려한 설계

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  APIError,
  APIResponse,
  ErrorCode,
  type DatabaseEvent,
  type Event,
  type User
} from './types';

// ===== 로깅 시스템 =====
export const log = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${message}`, data ? JSON.stringify(data) : '');
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error);
  },
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data ? JSON.stringify(data) : '');
  },
  debug: (message: string, data?: any) => {
    const denoEnv = (globalThis as any).Deno?.env?.get;
    if (denoEnv && denoEnv('DEBUG') === 'true') {
      console.log(`[DEBUG] ${message}`, data ? JSON.stringify(data) : '');
    }
  },
};

// ===== 환경 변수 및 설정 =====
export const getEnvVar = (name: string): string => {
  // Deno 환경에서 실행될 때를 대비한 타입 선언
  const denoEnv = (globalThis as any).Deno?.env?.get;
  const value = denoEnv ? denoEnv(name) : undefined;
  if (!value) {
    throw new Error(`Environment variable ${name} is not set`);
  }
  return value;
};

export const config = {
  supabase: {
    url: getEnvVar('SUPABASE_URL'),
    serviceRoleKey: getEnvVar('SUPABASE_SERVICE_ROLE_KEY'),
    anonKey: getEnvVar('SUPABASE_ANON_KEY'),
  },
  ai: {
    solarApiKey: getEnvVar('SOLAR_API_KEY'),
    solarBaseUrl: 'https://api.upstage.ai/v1/solar',
  },
  kakao: {
    restApiKey: getEnvVar('KAKAO_REST_API_KEY'),
    apiBaseUrl: 'https://kapi.kakao.com',
  },
} as const;

// ===== Supabase 클라이언트 =====
export const createSupabaseClient = (authToken?: string) => {
  const url = getEnvVar('SUPABASE_URL');
  const anonKey = getEnvVar('SUPABASE_ANON_KEY');

  return createClient(url, anonKey, {
    global: {
      headers: authToken ? { Authorization: authToken } : {},
    },
  });
};

export const createAdminSupabaseClient = () => {
  const url = getEnvVar('SUPABASE_URL');
  const serviceKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY');

  return createClient(url, serviceKey);
};

// ===== HTTP 응답 유틸리티 =====
export const createResponse = <T>(
  data: T,
  status: number = 200,
  requestId?: string,
  processingTime?: number
): Response => {
  const response: APIResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: requestId || crypto.randomUUID(),
      processingTime: processingTime || 0,
    }
  };

  return new Response(JSON.stringify(response), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      ...(requestId && { 'X-Request-ID': requestId }),
    },
  });
};

export const createErrorResponse = (
  error: APIError | Error,
  requestId?: string
): Response => {
  const isAPIError = error instanceof APIError;

  // Deno 환경에서의 디버그 모드 확인
  const denoEnv = (globalThis as any).Deno?.env?.get;
  const debugMode = denoEnv && denoEnv('DEBUG') === 'true';

  const response: APIResponse = {
    success: false,
    error: {
      code: isAPIError ? error.code : ErrorCode.INTERNAL_ERROR,
      message: error.message,
      ...(isAPIError && error.details && { details: error.details }),
      ...(debugMode && !isAPIError && { stack: error.stack }),
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: requestId || crypto.randomUUID(),
      processingTime: 0,
    }
  };

  const statusCode = isAPIError ? error.statusCode : 500;

  // 프로덕션에서는 내부 에러 상세 정보 숨김
  const denoEnvProd = (globalThis as any).Deno?.env?.get;
  if (!isAPIError && denoEnvProd && denoEnvProd('ENVIRONMENT') === 'production') {
    response.error!.message = 'Internal server error';
  }

  return new Response(JSON.stringify(response), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      ...(requestId && { 'X-Request-ID': requestId }),
    },
  });
};

// ===== 인증 및 권한 =====
export const extractUserFromRequest = async (req: Request): Promise<User> => {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    throw new APIError(ErrorCode.UNAUTHORIZED, 'Authorization header is required', null, 401);
  }

  const token = authHeader.replace('Bearer ', '');
  const supabase = createSupabaseClient(authHeader);

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new APIError(ErrorCode.INVALID_TOKEN, 'Invalid or expired token', error, 401);
  }

  // user_profiles에서 추가 정보 조회
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError) {
    throw new APIError(ErrorCode.NOT_FOUND, 'User profile not found', profileError, 404);
  }

  return {
    id: user.id,
    name: profile.name,
    email: user.email || '',
    avatar: profile.avatar_url,
    provider: profile.provider,
  };
};

// ===== 데이터 변환 유틸리티 =====
export const transformDatabaseEventToEvent = (dbEvent: DatabaseEvent): Event => {
  return {
    id: dbEvent.id,
    title: dbEvent.title,
    startDate: new Date(dbEvent.start_date),
    endDate: new Date(dbEvent.end_date),
    isAllDay: dbEvent.is_all_day,
    color: dbEvent.color,
    location: dbEvent.location,
    notifications: dbEvent.notifications || [],
    category: dbEvent.category,
    isCompleted: dbEvent.is_completed,
    priority: dbEvent.priority,
    description: dbEvent.description,
  };
};

export const transformEventToDatabaseEvent = (
  event: Partial<Event> & { user_id: string }
): Partial<DatabaseEvent> => {
  const dbEvent: Partial<DatabaseEvent> = {
    user_id: event.user_id,
  };

  if (event.title !== undefined) dbEvent.title = event.title;
  if (event.startDate !== undefined) dbEvent.start_date = event.startDate.toISOString();
  if (event.endDate !== undefined) dbEvent.end_date = event.endDate.toISOString();
  if (event.isAllDay !== undefined) dbEvent.is_all_day = event.isAllDay;
  if (event.color !== undefined) dbEvent.color = event.color;
  if (event.location !== undefined) dbEvent.location = event.location;
  if (event.notifications !== undefined) dbEvent.notifications = event.notifications;
  if (event.category !== undefined) dbEvent.category = event.category;
  if (event.isCompleted !== undefined) dbEvent.is_completed = event.isCompleted;
  if (event.priority !== undefined) dbEvent.priority = event.priority;
  if (event.description !== undefined) dbEvent.description = event.description;

  return dbEvent;
};

// ===== 검증 유틸리티 =====
export const validateEventData = (data: any): void => {
  const errors: string[] = [];

  if (!data.title || typeof data.title !== 'string' || data.title.trim() === '') {
    errors.push('Title is required and must be a non-empty string');
  }

  if (!data.start_date || !isValidISODate(data.start_date)) {
    errors.push('Valid start_date in ISO format is required');
  }

  if (!data.end_date || !isValidISODate(data.end_date)) {
    errors.push('Valid end_date in ISO format is required');
  }

  if (data.start_date && data.end_date && new Date(data.start_date) >= new Date(data.end_date)) {
    errors.push('start_date must be before end_date');
  }

  const validColors = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280'];
  if (!data.color || !validColors.includes(data.color)) {
    errors.push(`color must be one of: ${validColors.join(', ')}`);
  }

  const validCategories = ['work', 'health', 'social', 'personal'];
  if (!data.category || !validCategories.includes(data.category)) {
    errors.push(`category must be one of: ${validCategories.join(', ')}`);
  }

  if (data.priority && !['HIGH', 'MEDIUM', 'LOW'].includes(data.priority)) {
    errors.push('priority must be one of: HIGH, MEDIUM, LOW');
  }

  if (data.notifications && Array.isArray(data.notifications)) {
    const validNotifications = ['정시', '15분전', '30분전', '1시간전', '1일전'];
    const invalidNotifications = data.notifications.filter((n: any) => !validNotifications.includes(n));
    if (invalidNotifications.length > 0) {
      errors.push(`Invalid notifications: ${invalidNotifications.join(', ')}`);
    }
  }

  if (errors.length > 0) {
    throw new APIError(ErrorCode.VALIDATION_ERROR, 'Validation failed', errors, 400);
  }
};

const isValidISODate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime()) && date.toISOString() === dateString;
};

// ===== 해시 유틸리티 =====
export const createHash = async (input: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(input.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// ===== 캐싱 유틸리티 =====
export const getCachedAIAnalysis = async (
  supabase: any,
  userId: string,
  type: string,
  inputHash: string,
  maxAgeHours: number = 24
): Promise<any | null> => {
  const { data, error } = await supabase.rpc('get_cached_ai_analysis', {
    p_user_id: userId,
    p_type: type,
    p_input_hash: inputHash,
    p_max_age_hours: maxAgeHours,
  });

  if (error) {
    console.error('Cache lookup error:', error);
    return null;
  }

  return data;
};

// ===== 레이트 리미팅 =====
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export const checkRateLimit = (
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000
): void => {
  const now = Date.now();
  const key = identifier;

  const current = rateLimitStore.get(key);

  if (!current || now > current.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return;
  }

  if (current.count >= maxRequests) {
    throw new APIError(
      ErrorCode.RATE_LIMIT_EXCEEDED,
      'Rate limit exceeded. Please try again later.',
      { maxRequests, windowMs },
      429
    );
  }

  current.count++;
};

// ===== CORS 핸들링 =====
export const handleCors = (req: Request): Response | null => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Max-Age': '86400',
      },
    });
  }
  return null;
};

// ===== 성능 측정 =====
export const measurePerformance = async <T>(
  operation: () => Promise<T>
): Promise<{ result: T; duration: number }> => {
  const start = performance.now();
  const result = await operation();
  const duration = Math.round(performance.now() - start);
  return { result, duration };
};

// ===== 외부 API 호출 유틸리티 =====
export const fetchWithTimeout = async (
  url: string,
  options: RequestInit,
  timeoutMs: number = 10000
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new APIError(ErrorCode.AI_SERVICE_ERROR, 'Request timeout', null, 408);
    }
    throw error;
  }
};
