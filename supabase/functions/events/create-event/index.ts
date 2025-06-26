// LinQ 이벤트 생성 Edge Function
// 프론트엔드와 완벽 호환되는 이벤트 생성 API
// 충돌 검사 및 스마트 추천 시스템 포함

import { serve } from 'https://deno.land/std@0.192.0/http/server.ts';
import {
  APIError,
  ErrorCode,
  type CreateEventRequest,
  type DatabaseEvent,
  type Event,
  type NotificationType
} from '../../_shared/types';
import {
  checkRateLimit,
  createErrorResponse,
  createResponse,
  createSupabaseClient,
  extractUserFromRequest,
  handleCors,
  log,
  measurePerformance,
  transformDatabaseEventToEvent,
  transformEventToDatabaseEvent,
  validateEventData,
} from '../../_shared/utils';

// 이벤트 충돌 검사
const checkEventConflicts = async (
  supabase: any,
  userId: string,
  startDate: string,
  endDate: string,
  excludeEventId?: string
): Promise<DatabaseEvent[]> => {
  let query = supabase
    .from('events')
    .select('*')
    .eq('user_id', userId)
    .eq('is_completed', false) // 완료된 이벤트는 충돌 검사에서 제외
    .or(`start_date.lt.${endDate},end_date.gt.${startDate}`); // 시간 겹침 검사

  if (excludeEventId) {
    query = query.neq('id', excludeEventId);
  }

  const { data, error } = await query;

  if (error) {
    log.error('Failed to check event conflicts', error);
    throw new APIError(ErrorCode.DATABASE_ERROR, 'Failed to check event conflicts', error);
  }

  return data || [];
};

// 스마트 카테고리 추천 (제목 기반)
const suggestCategory = (title: string): string => {
  const titleLower = title.toLowerCase();

  const categoryKeywords = {
    work: ['회의', '미팅', '업무', '프로젝트', '발표', '출장', '회사', '팀', '스탠드업', '리뷰', '기획'],
    health: ['운동', '헬스', '요가', '필라테스', '병원', '검진', '마사지', '러닝', '수영', '산책'],
    social: ['식사', '모임', '파티', '약속', '만남', '술', '카페', '여행', '데이트', '친구'],
    personal: ['공부', '독서', '쇼핑', '청소', '정리', '휴식', '취미', '영화', '게임', '개인']
  };

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => titleLower.includes(keyword))) {
      return category;
    }
  }

  return 'personal'; // 기본값
};

// 스마트 우선순위 추천
const suggestPriority = (title: string, category: string): string => {
  const titleLower = title.toLowerCase();

  const highPriorityKeywords = ['중요', '긴급', '필수', '마감', '발표', '회의', '시험', '면접'];
  const lowPriorityKeywords = ['여가', '쇼핑', '산책', '휴식', '취미', '게임'];

  if (highPriorityKeywords.some(keyword => titleLower.includes(keyword))) {
    return 'HIGH';
  }

  if (lowPriorityKeywords.some(keyword => titleLower.includes(keyword))) {
    return 'LOW';
  }

  // 카테고리 기반 기본 우선순위
  switch (category) {
    case 'work': return 'HIGH';
    case 'health': return 'MEDIUM';
    case 'social': return 'MEDIUM';
    case 'personal': return 'LOW';
    default: return 'MEDIUM';
  }
};

// 스마트 알림 설정 추천
const suggestNotifications = (category: string, isAllDay: boolean): NotificationType[] => {
  if (isAllDay) {
    return ['1일전'];
  }

  switch (category) {
    case 'work':
      return ['15분전', '정시'];
    case 'health':
      return ['30분전'];
    case 'social':
      return ['15분전'];
    case 'personal':
      return ['정시'];
    default:
      return ['15분전'];
  }
};

// 메인 핸들러
serve(async (req: Request) => {
  const requestId = crypto.randomUUID();
  const startTime = performance.now();

  try {
    // CORS 처리
    const corsResponse = handleCors(req);
    if (corsResponse) return corsResponse;

    // HTTP 메서드 검증
    if (req.method !== 'POST') {
      throw new APIError(ErrorCode.VALIDATION_ERROR, 'Method not allowed', null, 405);
    }

    // 사용자 인증
    const user = await extractUserFromRequest(req);

    // 레이트 리미팅
    checkRateLimit(`create_event:${user.id}`, 60, 60000); // 60회/분

    // 요청 본문 파싱
    let requestBody: CreateEventRequest;
    try {
      requestBody = await req.json();
    } catch (error: unknown) {
      throw new APIError(ErrorCode.VALIDATION_ERROR, 'Invalid JSON in request body');
    }

    // 기본값 설정 및 검증
    const eventData = {
      ...requestBody,
      is_all_day: requestBody.is_all_day ?? false,
      notifications: requestBody.notifications ?? [],
      priority: requestBody.priority ?? null,
    };

    // 데이터 검증
    validateEventData(eventData);

    // 스마트 추천 적용 (사용자가 지정하지 않은 경우)
    if (!requestBody.category) {
      eventData.category = suggestCategory(eventData.title) as any;
    }

    if (!requestBody.priority) {
      eventData.priority = suggestPriority(eventData.title, eventData.category) as any;
    }

    if (!requestBody.notifications || requestBody.notifications.length === 0) {
      eventData.notifications = suggestNotifications(eventData.category, eventData.is_all_day);
    }

    log.info('Create event request', {
      requestId,
      userId: user.id,
      title: eventData.title,
      category: eventData.category,
      priority: eventData.priority,
      smartRecommendations: {
        category: !requestBody.category,
        priority: !requestBody.priority,
        notifications: !requestBody.notifications || requestBody.notifications.length === 0,
      }
    });

    // Supabase 클라이언트 생성
    const authHeader = req.headers.get('authorization');
    const supabase = createSupabaseClient(authHeader!);

    const { result, duration } = await measurePerformance(async () => {
      // 이벤트 충돌 검사
      const conflicts = await checkEventConflicts(
        supabase,
        user.id,
        eventData.start_date,
        eventData.end_date
      );

      // 충돌 경고 (차단하지는 않음, 사용자에게 알림)
      const hasConflicts = conflicts.length > 0;
      if (hasConflicts) {
        log.info('Event conflicts detected', {
          requestId,
          userId: user.id,
          conflictCount: conflicts.length,
          conflicts: conflicts.map(c => ({ id: c.id, title: c.title }))
        });
      }

      // 데이터베이스용 이벤트 객체 생성
      const dbEventData = transformEventToDatabaseEvent({
        ...eventData,
        startDate: new Date(eventData.start_date),
        endDate: new Date(eventData.end_date),
        isAllDay: eventData.is_all_day,
        isCompleted: false,
        priority: eventData.priority || undefined,
        user_id: user.id,
      });

      // 이벤트 생성
      const { data: newEvent, error: createError } = await supabase
        .from('events')
        .insert(dbEventData)
        .select()
        .single();

      if (createError) {
        log.error('Failed to create event', {
          requestId,
          userId: user.id,
          error: createError
        });
        throw new APIError(ErrorCode.DATABASE_ERROR, 'Failed to create event', createError);
      }

      return {
        event: newEvent,
        conflicts: hasConflicts ? conflicts : undefined,
      };
    });

    const { event: dbEvent, conflicts } = result;

    // 프론트엔드 형식으로 변환
    const event = transformDatabaseEventToEvent(dbEvent);

    const processingTime = Math.round(performance.now() - startTime);

    log.info('Create event success', {
      requestId,
      userId: user.id,
      eventId: event.id,
      hasConflicts: !!conflicts,
      processingTime,
      duration
    });

    // 응답 데이터 구성
    const responseData: { event: Event; conflicts?: DatabaseEvent[]; warnings?: string[] } = {
      event,
    };

    if (conflicts && conflicts.length > 0) {
      responseData.conflicts = conflicts;
      responseData.warnings = [
        `${conflicts.length}개의 기존 일정과 시간이 겹칩니다. 일정을 확인해 주세요.`
      ];
    }

    return createResponse(responseData, 201, requestId, processingTime);

  } catch (error: unknown) {
    const processingTime = Math.round(performance.now() - startTime);

    if (error instanceof APIError) {
      log.error('Create event API error', {
        requestId,
        code: error.code,
        message: error.message,
        processingTime
      });
      return createErrorResponse(error, requestId);
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    // 일반 에러 처리
    const internalError = new APIError(
      ErrorCode.INTERNAL_ERROR,
      'Internal server error while creating event',
      undefined,
      500
    );

    log.error('Create event internal error', {
      requestId,
      error: errorMessage,
      stack: errorStack,
      processingTime
    });

    return createErrorResponse(internalError, requestId);
  }
});
