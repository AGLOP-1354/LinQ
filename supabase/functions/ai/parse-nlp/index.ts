// LinQ AI 자연어 처리 Edge Function
// Solar Pro API 연동 및 프론트엔드 NaturalLanguageEventDrawer 지원

import { serve } from 'https://deno.land/std@0.192.0/http/server.ts';
import {
  APIError,
  ErrorCode,
  type NaturalLanguageEvent,
  type ParseNLPRequest
} from '../../_shared/types';
import {
  checkRateLimit,
  createErrorResponse,
  createHash,
  createResponse,
  createSupabaseClient,
  extractUserFromRequest,
  fetchWithTimeout,
  getCachedAIAnalysis,
  getEnvVar,
  handleCors,
  log,
  measurePerformance
} from '../../_shared/utils';

// 설정 상수
const SOLAR_API_KEY = getEnvVar('SOLAR_API_KEY');
const SOLAR_BASE_URL = 'https://api.upstage.ai/v1/solar';

// Solar Pro API 응답 인터페이스
interface SolarProResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// 파싱된 이벤트 정보 인터페이스
interface ParsedEventInfo {
  title: string;
  startDate: string; // ISO 8601 형식
  endDate: string; // ISO 8601 형식
  category: 'work' | 'health' | 'social' | 'personal';
  isAllDay: boolean;
  confidence: number; // 0.0 ~ 1.0
  location?: string;
  description?: string;
  reasoning?: string; // AI의 판단 근거
}

// 한국어 자연어 처리를 위한 시스템 프롬프트
const createSystemPrompt = (currentDate: string): string => {
  return `당신은 한국어 자연어를 일정 정보로 정확하게 파싱하는 AI 어시스턴트입니다.

**현재 시간**: ${currentDate}

**중요 규칙**:
1. 모든 날짜와 시간은 한국 시간(KST, UTC+9) 기준으로 처리하세요.
2. 상대적 표현을 절대적 날짜/시간으로 변환하세요.
3. 시간이 명시되지 않으면 적절한 기본값을 사용하세요.
4. 종료 시간이 없으면 시작 시간에서 1시간 후로 설정하세요.
5. 이벤트 제목은 간결하고 명확하게 작성하세요.

**날짜/시간 해석 예시**:
- "내일" → ${new Date(new Date(currentDate).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
- "다음 주 월요일" → 다음 주 월요일의 정확한 날짜
- "오후 2시" → 14:00:00
- "점심시간" → 12:00:00
- "저녁" → 18:00:00

**카테고리 분류 기준**:
- work: 회사, 업무, 회의, 프로젝트, 출장 관련
- health: 운동, 병원, 검진, 헬스케어 관련
- social: 만남, 식사, 파티, 모임, 여행 관련
- personal: 개인 업무, 쇼핑, 취미, 학습 관련

**JSON 형식으로만 응답하세요**:
{
  "title": "간결한 이벤트 제목",
  "startDate": "YYYY-MM-DDTHH:mm:ss+09:00",
  "endDate": "YYYY-MM-DDTHH:mm:ss+09:00",
  "category": "work|health|social|personal",
  "isAllDay": boolean,
  "confidence": 0.0~1.0,
  "location": "장소 (선택사항)",
  "description": "추가 설명 (선택사항)",
  "reasoning": "판단 근거 설명"
}`;
};

// Solar Pro API 호출
const callSolarProAPI = async (
  input: string,
  context: ParseNLPRequest['context']
): Promise<ParsedEventInfo> => {
  const currentDate = context?.currentDate || new Date().toISOString();
  const systemPrompt = createSystemPrompt(currentDate);

  const requestBody = {
    model: 'solar-1-mini-chat',
    messages: [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: `다음 텍스트를 일정 정보로 파싱해주세요: "${input}"`
      }
    ],
    temperature: 0.1,
    max_tokens: 800,
    top_p: 0.9,
  };

  try {
    const response = await fetchWithTimeout(
      `${SOLAR_BASE_URL}/completions`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SOLAR_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      },
      15000 // 15초 타임아웃
    );

    if (!response.ok) {
      const errorText = await response.text();
      log.error('Solar Pro API error', { status: response.status, error: errorText });
      throw new Error(`Solar Pro API error: ${response.status}`);
    }

    const data: SolarProResponse = await response.json();

    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from Solar Pro API');
    }

    const content = data.choices[0].message.content.trim();

    // JSON 파싱 시도
    let parsed: ParsedEventInfo;
    try {
      // JSON 코드 블록이 있다면 제거
      const jsonContent = content.replace(/```json\n?|```\n?/g, '').trim();
      parsed = JSON.parse(jsonContent);
    } catch (parseError) {
      log.error('Failed to parse Solar Pro response', { content, parseError });
      throw new Error('Invalid JSON response from AI');
    }

    // 응답 검증
    if (!parsed.title || !parsed.startDate || !parsed.endDate || !parsed.category) {
      throw new Error('Incomplete parsing result from AI');
    }

    // 날짜 형식 검증
    const startDate = new Date(parsed.startDate);
    const endDate = new Date(parsed.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error('Invalid date format in AI response');
    }

    if (startDate >= endDate) {
      throw new Error('Invalid date range in AI response');
    }

    // 신뢰도 검증
    if (typeof parsed.confidence !== 'number' || parsed.confidence < 0 || parsed.confidence > 1) {
      parsed.confidence = 0.8; // 기본값
    }

    log.info('Solar Pro API success', {
      input: input.substring(0, 100),
      title: parsed.title,
      confidence: parsed.confidence,
      tokens: data.usage?.total_tokens || 0,
    });

    return parsed;

  } catch (error: unknown) {
    log.error('Solar Pro API call failed', { input, error: error instanceof Error ? error.message : 'Unknown error' });
    throw error;
  }
};

// AI 분석 결과 저장
const saveAIAnalysis = async (
  supabase: any,
  userId: string,
  input: string,
  inputHash: string,
  output: ParsedEventInfo,
  processingTime: number,
  tokensUsed?: number
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('ai_analysis')
      .insert({
        user_id: userId,
        type: 'parsing',
        input_text: input,
        input_hash: inputHash,
        output,
        confidence: output.confidence,
        model: 'solar-1-mini-chat',
        processing_time: processingTime,
        tokens_used: tokensUsed,
      });

    if (error) {
      log.error('Failed to save AI analysis', error);
      // 캐시 저장 실패는 중요하지 않으므로 에러를 던지지 않음
    }
  } catch (error: unknown) {
    log.error('Error saving AI analysis', error);
  }
};

// 스마트 제안 생성
const generateSuggestions = (parsed: ParsedEventInfo, input: string): string[] => {
  const suggestions: string[] = [];

  // 장소 제안
  if (!parsed.location) {
    const locationHints = ['회의실', '카페', '집', '헬스장', '병원', '레스토랑'];
    const matchedLocation = locationHints.find(hint =>
      parsed.title.toLowerCase().includes(hint) ||
      input.toLowerCase().includes(hint)
    );
    if (matchedLocation) {
      suggestions.push(`장소: ${matchedLocation}`);
    }
  }

  // 알림 제안
  switch (parsed.category) {
    case 'work':
      suggestions.push('15분 전 알림 추천');
      break;
    case 'health':
      suggestions.push('30분 전 알림 추천');
      break;
    case 'social':
      suggestions.push('출발 시간 고려한 알림 추천');
      break;
  }

  // 반복 일정 제안
  const recurringKeywords = ['매일', '매주', '월요일마다', '정기'];
  if (recurringKeywords.some(keyword => input.includes(keyword))) {
    suggestions.push('반복 일정으로 설정하시겠습니까?');
  }

  return suggestions.slice(0, 3); // 최대 3개 제한
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

    // 레이트 리미팅 (AI API 비용 고려)
    checkRateLimit(`parse_nlp:${user.id}`, 30, 60000); // 30회/분

    // 요청 본문 파싱
    let requestBody: ParseNLPRequest;
    try {
      requestBody = await req.json();
    } catch (error: unknown) {
      throw new APIError(ErrorCode.VALIDATION_ERROR, 'Invalid JSON in request body');
    }

    // 입력 검증
    if (!requestBody.input || typeof requestBody.input !== 'string') {
      throw new APIError(ErrorCode.VALIDATION_ERROR, 'input is required and must be a string');
    }

    const input = requestBody.input.trim();
    if (input.length === 0) {
      throw new APIError(ErrorCode.VALIDATION_ERROR, 'input cannot be empty');
    }

    if (input.length > 500) {
      throw new APIError(ErrorCode.VALIDATION_ERROR, 'input is too long (max 500 characters)');
    }

    log.info('Parse NLP request', {
      requestId,
      userId: user.id,
      input: input.substring(0, 100),
      inputLength: input.length
    });

    // Supabase 클라이언트 생성
    const authHeader = req.headers.get('authorization');
    const supabase = createSupabaseClient(authHeader!);

    const { result, duration } = await measurePerformance(async () => {
      // 입력 해시 생성 (캐싱용)
      const inputHash = await createHash(input);

      // 캐시 확인
      const cachedResult = await getCachedAIAnalysis(
        supabase,
        user.id,
        'parsing',
        inputHash,
        24 // 24시간 캐시
      );

      if (cachedResult && cachedResult.output) {
        log.info('Cache hit for NLP parsing', { requestId, userId: user.id, inputHash });
        return {
          parsed: cachedResult.output as ParsedEventInfo,
          fromCache: true,
          tokensUsed: cachedResult.tokens_used,
        };
      }

      // AI API 호출
      const aiStartTime = performance.now();
      const parsed = await callSolarProAPI(input, requestBody.context);
      const aiProcessingTime = Math.round(performance.now() - aiStartTime);

      // 결과 저장 (백그라운드)
      saveAIAnalysis(
        supabase,
        user.id,
        input,
        inputHash,
        parsed,
        aiProcessingTime
      ).catch(error => {
        log.error('Background AI analysis save failed', error);
      });

      return {
        parsed,
        fromCache: false,
        tokensUsed: undefined, // Solar Pro에서 제공되면 추가
      };
    });

    const { parsed, fromCache, tokensUsed } = result;

    // 스마트 제안 생성
    const suggestions = generateSuggestions(parsed, input);

    // 프론트엔드 형식으로 변환
    const naturalLanguageEvent: NaturalLanguageEvent = {
      originalText: input,
      parsed: {
        title: parsed.title,
        startDate: new Date(parsed.startDate),
        endDate: new Date(parsed.endDate),
        category: parsed.category,
        isAllDay: parsed.isAllDay,
        confidence: parsed.confidence,
      },
      suggestions: suggestions.length > 0 ? suggestions : undefined,
    };

    const processingTime = Math.round(performance.now() - startTime);

    log.info('Parse NLP success', {
      requestId,
      userId: user.id,
      title: parsed.title,
      confidence: parsed.confidence,
      fromCache,
      tokensUsed,
      processingTime,
      duration
    });

    // 응답 데이터 구성
    const responseData = {
      ...naturalLanguageEvent,
      meta: {
        fromCache,
        confidence: parsed.confidence,
        reasoning: parsed.reasoning,
        location: parsed.location,
        description: parsed.description,
        tokensUsed,
      }
    };

    return createResponse(responseData, 200, requestId, processingTime);

  } catch (error: unknown) {
    const processingTime = Math.round(performance.now() - startTime);

    if (error instanceof APIError) {
      log.error('Parse NLP API error', {
        requestId,
        code: error.code,
        message: error.message,
        processingTime
      });
      return createErrorResponse(error, requestId);
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    // AI API 에러 처리
    if (errorMessage.includes('Solar Pro API error') || errorMessage.includes('AI')) {
      const aiError = new APIError(
        ErrorCode.AI_SERVICE_ERROR,
        'AI service is temporarily unavailable',
        undefined,
        503
      );
      log.error('AI service error', { requestId, error: errorMessage });
      return createErrorResponse(aiError, requestId);
    }

    // 일반 에러 처리
    const internalError = new APIError(
      ErrorCode.INTERNAL_ERROR,
      'Internal server error during NLP parsing',
      undefined,
      500
    );

    log.error('Parse NLP internal error', {
      requestId,
      error: errorMessage,
      stack: errorStack,
      processingTime
    });

    return createErrorResponse(internalError, requestId);
  }
});
