import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

// WebBrowser 설정
WebBrowser.maybeCompleteAuthSession();

// 카카오 OAuth 설정
const KAKAO_AUTH_URL = 'https://kauth.kakao.com/oauth/authorize';
const KAKAO_TOKEN_URL = 'https://kauth.kakao.com/oauth/token';
const KAKAO_USER_INFO_URL = 'https://kapi.kakao.com/v2/user/me';

// 환경 변수에서 카카오 앱 키 가져오기
const KAKAO_APP_KEY = Constants.expoConfig?.extra?.EXPO_BUILD_KAKAO_APP_KEY ||
                      Constants.manifest?.extra?.EXPO_BUILD_KAKAO_APP_KEY ||
                      process.env.EXPO_BUILD_KAKAO_APP_KEY ||
                      'demo_key_for_testing'; // 개발 시 임시 키

console.log('카카오 앱 키 로드됨:', KAKAO_APP_KEY ? '✓' : '✗');

if (!KAKAO_APP_KEY || KAKAO_APP_KEY === 'demo_key_for_testing') {
  console.warn('⚠️ 카카오 앱 키가 설정되지 않았습니다. .env 파일에 EXPO_BUILD_KAKAO_APP_KEY를 추가해주세요.');
}

// 리다이렉트 URI 생성
const redirectUri = Linking.createURL('oauth');

console.log('카카오 리다이렉트 URI:', redirectUri);

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

interface KakaoAuthResult {
  success: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    provider: 'kakao';
  };
  error?: string;
}

class KakaoAuthService {
  private authState: string = '';
  private isLoggingIn: boolean = false;

  /**
   * 랜덤 문자열 생성
   */
  private generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * 카카오 로그인 시작
   */
    async login(): Promise<KakaoAuthResult> {
    // 중복 로그인 방지
    if (this.isLoggingIn) {
      return {
        success: false,
        error: '이미 로그인이 진행 중입니다.',
      };
    }

    try {
      this.isLoggingIn = true;

      if (!KAKAO_APP_KEY || KAKAO_APP_KEY === 'demo_key_for_testing') {
        return {
          success: false,
          error: '카카오 앱 키가 설정되지 않았습니다. .env 파일에 EXPO_BUILD_KAKAO_APP_KEY를 추가해주세요.',
        };
      }

      console.log('🚀 카카오 로그인 시작...');

      // 기존 웹브라우저 세션 정리
      try {
        await WebBrowser.dismissBrowser();
      } catch (dismissError) {
        console.log('기존 브라우저 세션 정리 완료');
      }

      // state 값 생성 (CSRF 방지)
      this.authState = this.generateRandomString(32);

      // 인증 URL 생성
      const authUrl = this.buildAuthUrl();
      console.log('🔗 인증 URL:', authUrl);
      console.log('📱 리다이렉트 URI:', redirectUri);

      // 링킹 이벤트 리스너 등록
      const subscription = Linking.addEventListener('url', this.handleDeepLink.bind(this));

      try {
        // 잠시 대기 후 웹브라우저로 카카오 로그인 페이지 열기
        await new Promise(resolve => setTimeout(resolve, 500));

        const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri, {
          // 브라우저 옵션 설정
          showTitle: false,
          showInRecents: false,
          enableBarCollapsing: false,
          // iOS 설정
          preferredBrowserPackage: undefined,
          // Android 설정
          browserPackage: undefined,
        });

        console.log('✅ WebBrowser 결과:', result);

        if (result.type === 'success' && result.url) {
          return await this.handleAuthResult(result.url);
        } else if (result.type === 'cancel') {
          return {
            success: false,
            error: '사용자가 로그인을 취소했습니다.',
          };
        } else if (result.type === 'dismiss') {
          return {
            success: false,
            error: '로그인 창이 닫혔습니다.',
          };
        }

        return {
          success: false,
          error: '로그인에 실패했습니다.',
        };
      } finally {
        // 이벤트 리스너 정리
        subscription?.remove();
        // 브라우저 세션 정리
        try {
          await WebBrowser.dismissBrowser();
        } catch (cleanupError) {
          console.log('브라우저 정리 완료');
        }
      }
    } catch (error) {
      console.error('❌ 카카오 로그인 에러:', error);

      // 특정 에러에 대한 사용자 친화적 메시지
      let errorMessage = '알 수 없는 오류가 발생했습니다.';

      if (error instanceof Error) {
        if (error.message.includes('Another web browser is already open')) {
          errorMessage = '다른 브라우저가 열려있습니다. 잠시 후 다시 시도해주세요.';
        } else if (error.message.includes('Network request failed')) {
          errorMessage = '네트워크 연결을 확인하고 다시 시도해주세요.';
        } else if (error.message.includes('Invalid redirect URI')) {
          errorMessage = '앱 설정에 문제가 있습니다. 개발자에게 문의하세요.';
        } else {
          errorMessage = error.message;
        }
      }

      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      this.isLoggingIn = false;
    }
  }

  /**
   * 인증 URL 생성
   */
  private buildAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: KAKAO_APP_KEY,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'profile_nickname,profile_image,account_email',
      state: this.authState,
    });

    return `${KAKAO_AUTH_URL}?${params.toString()}`;
  }

  /**
   * 딥링크 처리
   */
  private async handleDeepLink(event: { url: string }): Promise<void> {
    console.log('딥링크 수신:', event.url);
    // 여기서는 WebBrowser.openAuthSessionAsync의 결과로 처리되므로 별도 처리 불필요
  }

  /**
   * 인증 결과 처리
   */
  private async handleAuthResult(url: string): Promise<KakaoAuthResult> {
    try {
      const urlObj = new URL(url);
      const code = urlObj.searchParams.get('code');
      const state = urlObj.searchParams.get('state');
      const error = urlObj.searchParams.get('error');

      if (error) {
        throw new Error(`카카오 인증 오류: ${error}`);
      }

      if (!code) {
        throw new Error('인증 코드를 받지 못했습니다.');
      }

      if (state !== this.authState) {
        throw new Error('잘못된 state 값입니다.');
      }

      // 액세스 토큰 교환
      const tokenResult = await this.exchangeCodeForToken(code);

      if (tokenResult.access_token) {
        // 사용자 정보 가져오기
        const userInfo = await this.getUserInfo(tokenResult.access_token);

        return {
          success: true,
          user: {
            id: `kakao_${userInfo.id}`,
            name: userInfo.properties.nickname || userInfo.kakao_account.profile.nickname,
            email: userInfo.kakao_account.email || '',
            avatar: userInfo.kakao_account.profile.profile_image_url ||
                    userInfo.properties.profile_image,
            provider: 'kakao',
          },
        };
      }

      throw new Error('액세스 토큰을 받지 못했습니다.');
    } catch (error) {
      console.error('인증 결과 처리 에러:', error);
      throw error;
    }
  }

  /**
   * 인증 코드를 액세스 토큰으로 교환
   */
  private async exchangeCodeForToken(code: string): Promise<any> {
    try {
      const response = await fetch(KAKAO_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: KAKAO_APP_KEY,
          redirect_uri: redirectUri,
          code,
        }).toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('토큰 교환 실패:', errorText);
        throw new Error('토큰 교환에 실패했습니다.');
      }

      const tokenData = await response.json();
      console.log('토큰 교환 성공');

      return tokenData;
    } catch (error) {
      console.error('토큰 교환 에러:', error);
      throw error;
    }
  }

  /**
   * 액세스 토큰으로 사용자 정보 가져오기
   */
  private async getUserInfo(accessToken: string): Promise<KakaoUserInfo> {
    try {
      const response = await fetch(KAKAO_USER_INFO_URL, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('사용자 정보 가져오기 실패:', errorText);
        throw new Error('사용자 정보를 가져올 수 없습니다.');
      }

      const userData = await response.json();
      console.log('사용자 정보 조회 성공');

      return userData;
    } catch (error) {
      console.error('사용자 정보 가져오기 에러:', error);
      throw error;
    }
  }

  /**
   * 카카오 로그아웃 (선택사항)
   */
  async logout(): Promise<boolean> {
    try {
      // 카카오 로그아웃은 웹뷰를 통해 처리
      const logoutUrl = 'https://kauth.kakao.com/oauth/logout';
      await WebBrowser.openBrowserAsync(logoutUrl);
      return true;
    } catch (error) {
      console.error('카카오 로그아웃 에러:', error);
      return false;
    }
  }
}

// 싱글톤 인스턴스 생성
export const kakaoAuthService = new KakaoAuthService();
export default kakaoAuthService;
