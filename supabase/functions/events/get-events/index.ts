// LinQ 이벤트 조회 Edge Function
// 프론트엔드와 완벽 호환되는 이벤트 조회 API

import { serve } from 'https://deno.land/std@0.192.0/http/server.ts';
import {
  APIError,
  ErrorCode,
  type DatabaseEvent,
  type EventsResponse,
  type GetEventsQuery,
  type UserStatsResponse
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
} from '../../_shared/utils';

// 쿼리 파라미터 파싱 및 검증
const parseQueryParams = (url: URL): GetEventsQuery => {
  const query: GetEventsQuery = {};

  // 날짜 필터
  const startDate = url.searchParams.get('startDate');
  const endDate = url.searchParams.get('endDate');

  if (startDate) {
    if (!isValidISODate(startDate)) {
      throw new APIError(ErrorCode.VALIDATION_ERROR, 'Invalid startDate format. Use ISO 8601 format.');
    }
    query.startDate = startDate;
  }

  if (endDate) {
    if (!isValidISODate(endDate)) {
      throw new APIError(ErrorCode.VALIDATION_ERROR, 'Invalid endDate format. Use ISO 8601 format.');
    }
    query.endDate = endDate;
  }

  // 날짜 범위 검증
  if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
    throw new APIError(ErrorCode.INVALID_DATE_RANGE, 'startDate must be before or equal to endDate');
  }

  // 카테고리 필터
  const category = url.searchParams.get('category');
  if (category) {
    const validCategories = ['work', 'health', 'social', 'personal'];
    if (!validCategories.includes(category)) {
      throw new APIError(ErrorCode.VALIDATION_ERROR, `Invalid category. Must be one of: ${validCategories.join(', ')}`);
    }
    query.category = category as any;
  }

  // 완료 상태 필터
  const completed = url.searchParams.get('completed');
  if (completed !== null) {
    if (completed !== 'true' && completed !== 'false') {
      throw new APIError(ErrorCode.VALIDATION_ERROR, 'completed must be true or false');
    }
    query.completed = completed === 'true';
  }

  // 우선순위 필터
  const priority = url.searchParams.get('priority');
  if (priority) {
    const validPriorities = ['HIGH', 'MEDIUM', 'LOW'];
    if (!validPriorities.includes(priority)) {
      throw new APIError(ErrorCode.VALIDATION_ERROR, `Invalid priority. Must be one of: ${validPriorities.join(', ')}`);
    }
    query.priority = priority as any;
  }

  // 페이지네이션
  const page = url.searchParams.get('page');
  const limit = url.searchParams.get('limit');

  if (page) {
    const pageNum = parseInt(page, 10);
    if (isNaN(pageNum) || pageNum < 1) {
      throw new APIError(ErrorCode.VALIDATION_ERROR, 'page must be a positive integer');
    }
    query.page = pageNum;
  }

  if (limit) {
    const limitNum = parseInt(limit, 10);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      throw new APIError(ErrorCode.VALIDATION_ERROR, 'limit must be between 1 and 100');
    }
    query.limit = limitNum;
  }

  return query;
};

// 이벤트 쿼리 빌더
const buildEventQuery = (supabase: any, userId: string, query: GetEventsQuery) => {
  let supabaseQuery = supabase
    .from('events')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('start_date', { ascending: true });

  // 날짜 필터 적용
  if (query.startDate) {
    supabaseQuery = supabaseQuery.gte('start_date', query.startDate);
  }

  if (query.endDate) {
    // 종료일 포함을 위해 다음날 00:00 이전으로 설정
    const endDateTime = new Date(query.endDate);
    endDateTime.setDate(endDateTime.getDate() + 1);
    supabaseQuery = supabaseQuery.lt('start_date', endDateTime.toISOString());
  }

  // 카테고리 필터 적용
  if (query.category) {
    supabaseQuery = supabaseQuery.eq('category', query.category);
  }

  // 완료 상태 필터 적용
  if (query.completed !== undefined) {
    supabaseQuery = supabaseQuery.eq('is_completed', query.completed);
  }

  // 우선순위 필터 적용
  if (query.priority) {
    supabaseQuery = supabaseQuery.eq('priority', query.priority);
  }

  // 페이지네이션 적용
  if (query.page && query.limit) {
    const offset = (query.page - 1) * query.limit;
    supabaseQuery = supabaseQuery.range(offset, offset + query.limit - 1);
  } else if (query.limit) {
    supabaseQuery = supabaseQuery.limit(query.limit);
  }

  return supabaseQuery;
};

// 사용자 통계 조회
const getUserStats = async (supabase: any, userId: string): Promise<UserStatsResponse> => {
  const { data: stats, error } = await supabase.rpc('get_user_event_stats', {
    p_user_id: userId
  });

  if (error) {
    log.error('Failed to get user stats', error);
    // 통계 조회 실패 시 기본값 반환
    return {
      total: 0,
      completed: 0,
      pending: 0,
      today: 0,
      this_week: 0,
      by_category: { work: 0, health: 0, social: 0, personal: 0 },
      by_priority: { HIGH: 0, MEDIUM: 0, LOW: 0, NONE: 0 },
    };
  }

  return stats || {
    total: 0,
    completed: 0,
    pending: 0,
    today: 0,
    this_week: 0,
    by_category: { work: 0, health: 0, social: 0, personal: 0 },
    by_priority: { HIGH: 0, MEDIUM: 0, LOW: 0, NONE: 0 },
  };
};

// ISO 날짜 형식 검증
const isValidISODate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
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
    if (req.method !== 'GET') {
      throw new APIError(ErrorCode.VALIDATION_ERROR, 'Method not allowed', null, 405);
    }

    // 사용자 인증
    const user = await extractUserFromRequest(req);

    // 레이트 리미팅
    checkRateLimit(`get_events:${user.id}`, 300, 60000); // 300회/분

    // 쿼리 파라미터 파싱
    const url = new URL(req.url);
    const query = parseQueryParams(url);

    log.info('Get events request', {
      requestId,
      userId: user.id,
      query
    });

    // Supabase 클라이언트 생성
    const authHeader = req.headers.get('authorization');
    const supabase = createSupabaseClient(authHeader!);

    // 통계 조회 요청 확인
    const includeStats = url.searchParams.get('includeStats') === 'true';

    // 이벤트 조회 및 통계 조회 병렬 처리
    const { result, duration } = await measurePerformance(async () => {
      const promises: Promise<any>[] = [
        buildEventQuery(supabase, user.id, query)
      ];

      if (includeStats) {
        promises.push(getUserStats(supabase, user.id));
      }

      const results = await Promise.all(promises);

      return {
        eventsResult: results[0],
        stats: includeStats ? results[1] : undefined,
      };
    });

    const { eventsResult, stats } = result;
    const { data: dbEvents, error: eventsError, count } = eventsResult;

    if (eventsError) {
      log.error('Failed to fetch events', {
        requestId,
        userId: user.id,
        error: eventsError
      });
      throw new APIError(ErrorCode.DATABASE_ERROR, 'Failed to fetch events', eventsError);
    }

    // 프론트엔드 형식으로 변환
    const events = (dbEvents || []).map((dbEvent: DatabaseEvent) =>
      transformDatabaseEventToEvent(dbEvent)
    );

    const processingTime = Math.round(performance.now() - startTime);

    log.info('Get events success', {
      requestId,
      userId: user.id,
      eventCount: events.length,
      totalCount: count,
      processingTime,
      duration,
      includeStats
    });

    // 응답 데이터 구성
    const responseData: EventsResponse & { stats?: UserStatsResponse } = {
      events,
      total: count || 0,
      page: query.page,
      limit: query.limit,
    };

    if (includeStats && stats) {
      responseData.stats = stats;
    }

    return createResponse(responseData, 200, requestId, processingTime);

  } catch (error: unknown) {
    const processingTime = Math.round(performance.now() - startTime);

    if (error instanceof APIError) {
      log.error('Get events API error', {
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
      'Internal server error while fetching events',
      undefined,
      500
    );

    log.error('Get events internal error', {
      requestId,
      error: errorMessage,
      stack: errorStack,
      processingTime
    });

    return createErrorResponse(internalError, requestId);
  }
});
