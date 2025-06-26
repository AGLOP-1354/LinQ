// LinQ 카카오 로그인 Edge Function
// 프론트엔드 카카오 OAuth와 Supabase Auth 통합

import { serve } from 'https://deno.land/std@0.192.0/http/server.ts';
import {
  APIError,
  ErrorCode,
  type AuthResult,
  type KakaoLoginRequest,
  type UserProfile
} from '../../_shared/types';
import {
  checkRateLimit,
  createAdminSupabaseClient,
  createErrorResponse,
  createResponse,
  fetchWithTimeout,
  handleCors,
  log,
  measurePerformance
} from '../../_shared/utils';

// 설정 객체
const appConfig = {
  kakao: {
    apiBaseUrl: 'https://kapi.kakao.com',
  },
};

// 카카오 사용자 정보 인터페이스
interface KakaoUserInfo {
  id: number;
  connected_at: string;
  properties: {
    nickname: string;
    profile_image?: string;
    thumbnail_image?: string;
  };
  kakao_account: {
    profile_nickname_needs_agreement: boolean;
    profile_image_needs_agreement: boolean;
    profile: {
      nickname: string;
      thumbnail_image_url?: string;
      profile_image_url?: string;
      is_default_image: boolean;
    };
    has_email: boolean;
    email_needs_agreement: boolean;
    is_email_valid: boolean;
    is_email_verified: boolean;
    email?: string;
  };
}

// 카카오 API에서 사용자 정보 조회
const getKakaoUserInfo = async (accessToken: string): Promise<KakaoUserInfo> => {
  try {
    const response = await fetchWithTimeout(
      `${appConfig.kakao.apiBaseUrl}/v2/user/me`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
        },
      },
      5000 // 5초 타임아웃
    );

    if (!response.ok) {
      const errorText = await response.text();
      log.error('Kakao API error', { status: response.status, error: errorText });

      throw new Error(`Kakao API error: ${response.status}`);
    }

    const userData = await response.json() as KakaoUserInfo;

    // 필수 정보 검증
    if (!userData.id || !userData.properties?.nickname) {
      throw new Error('Incomplete user data from Kakao');
    }

    return userData;
  } catch (error) {
    log.error('Failed to fetch Kakao user info', error);
    throw error;
  }
};

// Supabase 사용자 생성 또는 업데이트
const createOrUpdateSupabaseUser = async (
  kakaoUser: KakaoUserInfo,
  deviceInfo: KakaoLoginRequest['deviceInfo']
): Promise<{ user: any; accessToken: string; refreshToken: string }> => {
  const adminSupabase = createAdminSupabaseClient();

  const email = kakaoUser.kakao_account.email || `kakao_${kakaoUser.id}@linq.app`;
  const kakaoId = kakaoUser.id.toString();

  try {
    // 기존 사용자 확인 (카카오 ID로)
    const { data: existingProfile } = await adminSupabase
      .from('user_profiles')
      .select('id')
      .eq('provider', 'kakao')
      .eq('kakao_id', kakaoId)
      .single();

    let userId: string;
    let isNewUser = false;

    if (existingProfile) {
      // 기존 사용자
      userId = existingProfile.id;
      log.info('Existing user login', { userId, kakaoId });
    } else {
      // 새 사용자 생성
      const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          provider: 'kakao',
          kakao_id: kakaoId,
          name: kakaoUser.properties.nickname,
          avatar_url: kakaoUser.properties.profile_image,
          device_info: deviceInfo,
        },
      });

      if (createError) {
        // 이메일이 이미 존재하는 경우 처리
        if (createError.message.includes('already registered')) {
          // 이메일로 기존 사용자 찾기
          const { data: userData } = await adminSupabase.auth.admin.listUsers();
          const existingUser = userData.users.find((u: any) => u.email === email);

          if (existingUser) {
            userId = existingUser.id;

            // 프로필에 카카오 정보 추가
            await adminSupabase
              .from('user_profiles')
              .update({
                provider: 'kakao',
                kakao_id: kakaoId,
                name: kakaoUser.properties.nickname,
                avatar_url: kakaoUser.properties.profile_image,
                updated_at: new Date().toISOString(),
              })
              .eq('id', userId);
          } else {
            throw createError;
          }
        } else {
          throw createError;
        }
      } else {
        userId = newUser.user!.id;
        isNewUser = true;
      }

      log.info('New user created', { userId, kakaoId, isNewUser });
    }

    // 사용자 프로필 업데이트/생성
    const profileData: Partial<UserProfile> = {
      id: userId,
      name: kakaoUser.properties.nickname,
      avatar_url: kakaoUser.properties.profile_image,
      provider: 'kakao',
      kakao_id: kakaoId,
      updated_at: new Date().toISOString(),
    };

    if (isNewUser) {
      profileData.created_at = new Date().toISOString();
      profileData.preferences = {
        theme: 'system',
        notifications: true,
        aiSuggestions: true,
        defaultCategory: 'work',
      };
    }

    const { error: profileError } = await adminSupabase
      .from('user_profiles')
      .upsert(profileData);

    if (profileError) {
      log.error('Failed to update user profile', profileError);
      throw profileError;
    }

    // JWT 토큰 생성
    const { data: sessionData, error: sessionError } = await adminSupabase.auth.admin.generateAccessToken(userId);

    if (sessionError || !sessionData) {
      log.error('Failed to generate tokens', sessionError);
      throw new Error('Failed to generate authentication tokens');
    }

    // 사용자 정보 조회
    const { data: userProfile, error: fetchError } = await adminSupabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (fetchError || !userProfile) {
      log.error('Failed to fetch user profile', fetchError);
      throw new Error('Failed to fetch user profile');
    }

    return {
      user: {
        id: userId,
        name: userProfile.name,
        email,
        avatar: userProfile.avatar_url,
        provider: 'kakao',
      },
      accessToken: sessionData.access_token,
      refreshToken: sessionData.refresh_token,
    };

  } catch (error) {
    log.error('Failed to create/update Supabase user', error);
    throw error;
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

    // 요청 본문 파싱
    let requestBody: KakaoLoginRequest;
    try {
      requestBody = await req.json();
    } catch (error: unknown) {
      throw new APIError(ErrorCode.VALIDATION_ERROR, 'Invalid JSON in request body');
    }

    // 입력 검증
    if (!requestBody.accessToken || typeof requestBody.accessToken !== 'string') {
      throw new APIError(ErrorCode.VALIDATION_ERROR, 'accessToken is required');
    }

    if (!requestBody.deviceInfo) {
      throw new APIError(ErrorCode.VALIDATION_ERROR, 'deviceInfo is required');
    }

    const { platform, deviceId, appVersion } = requestBody.deviceInfo;
    if (!platform || !['ios', 'android'].includes(platform)) {
      throw new APIError(ErrorCode.VALIDATION_ERROR, 'platform must be ios or android');
    }

    if (!deviceId || !appVersion) {
      throw new APIError(ErrorCode.VALIDATION_ERROR, 'deviceId and appVersion are required');
    }

    // 레이트 리미팅 (디바이스 ID 기준)
    checkRateLimit(`kakao_login:${deviceId}`, 10, 60000); // 10회/분

    log.info('Kakao login request', {
      requestId,
      platform,
      deviceId,
      appVersion
    });

    // 카카오 사용자 정보 조회 및 Supabase 처리
    const { result, duration } = await measurePerformance(async () => {
      const kakaoUser = await getKakaoUserInfo(requestBody.accessToken);
      return await createOrUpdateSupabaseUser(kakaoUser, requestBody.deviceInfo);
    });

    const processingTime = Math.round(performance.now() - startTime);

    log.info('Kakao login success', {
      requestId,
      userId: result.user.id,
      processingTime,
      duration
    });

    const authResult: AuthResult = {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };

    return createResponse(authResult, 200, requestId, processingTime);

  } catch (error: unknown) {
    const processingTime = Math.round(performance.now() - startTime);

    if (error instanceof APIError) {
      log.error('Kakao login API error', {
        requestId,
        code: error.code,
        message: error.message,
        processingTime
      });
      return createErrorResponse(error, requestId);
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // 외부 API 에러 처리
    if (errorMessage.includes('Kakao API error')) {
      const apiError = new APIError(
        ErrorCode.KAKAO_AUTH_FAILED,
        'Failed to verify Kakao access token',
        { originalError: errorMessage },
        401
      );
      log.error('Kakao API verification failed', { requestId, error: errorMessage });
      return createErrorResponse(apiError, requestId);
    }

    // 일반 에러 처리
    const internalError = new APIError(
      ErrorCode.INTERNAL_ERROR,
      'Internal server error during authentication',
      undefined,
      500
    );

    log.error('Kakao login internal error', {
      requestId,
      error: errorMessage,
      processingTime
    });

    return createErrorResponse(internalError, requestId);
  }
});
