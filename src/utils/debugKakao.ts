import Constants from 'expo-constants';
import * as Linking from 'expo-linking';

/**
 * 카카오 로그인 디버깅 정보 출력
 */
export const debugKakaoLogin = () => {
  console.log('=== 카카오 로그인 디버깅 정보 ===');

  // 환경 변수 확인
  const kakaoKey = Constants.expoConfig?.extra?.EXPO_BUILD_KAKAO_APP_KEY ||
                   Constants.manifest?.extra?.EXPO_BUILD_KAKAO_APP_KEY ||
                   process.env.EXPO_BUILD_KAKAO_APP_KEY;

  console.log('📱 앱 정보:');
  console.log('  - Expo SDK:', Constants.expoConfig?.sdkVersion || 'Unknown');
  console.log('  - 앱 스키마:', Constants.expoConfig?.scheme || 'Unknown');
  console.log('  - 번들 ID:', Constants.expoConfig?.ios?.bundleIdentifier || 'Unknown');
  console.log('  - 패키지명:', Constants.expoConfig?.android?.package || 'Unknown');

  console.log('🔑 카카오 설정:');
  console.log('  - 앱 키 설정:', kakaoKey ? '✓' : '✗');
  console.log('  - 앱 키 길이:', kakaoKey?.length || 0);

  console.log('🔗 URL 정보:');
  const redirectUri = Linking.createURL('oauth');
  console.log('  - 리다이렉트 URI:', redirectUri);
  console.log('  - URL 스키마:', redirectUri.split('://')[0]);

  console.log('🌐 네트워크 정보:');
  console.log('  - 인증 URL: https://kauth.kakao.com/oauth/authorize');
  console.log('  - 토큰 URL: https://kauth.kakao.com/oauth/token');
  console.log('  - 사용자 정보 URL: https://kapi.kakao.com/v2/user/me');

  console.log('===============================');
};

/**
 * 카카오 로그인 설정 검증
 */
export const validateKakaoSetup = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // 앱 키 검증
  const kakaoKey = Constants.expoConfig?.extra?.EXPO_BUILD_KAKAO_APP_KEY ||
                   Constants.manifest?.extra?.EXPO_BUILD_KAKAO_APP_KEY ||
                   process.env.EXPO_BUILD_KAKAO_APP_KEY;

  if (!kakaoKey || kakaoKey === 'demo_key_for_testing') {
    errors.push('카카오 앱 키가 설정되지 않았습니다.');
  }

  if (kakaoKey && kakaoKey.length < 10) {
    errors.push('카카오 앱 키가 너무 짧습니다.');
  }

  // 스키마 검증
  const scheme = Constants.expoConfig?.scheme;
  if (!scheme) {
    errors.push('앱 스키마가 설정되지 않았습니다.');
  }

  // 리다이렉트 URI 검증
  try {
    const redirectUri = Linking.createURL('oauth');
    if (!redirectUri.includes('oauth')) {
      errors.push('리다이렉트 URI가 올바르지 않습니다.');
    }
  } catch (error) {
    errors.push('리다이렉트 URI 생성에 실패했습니다.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * 카카오 설정 가이드 출력
 */
export const printKakaoSetupGuide = () => {
  console.log('🔧 카카오 로그인 설정 가이드:');
  console.log('1. 카카오 개발자 콘솔에서 앱 등록');
  console.log('2. JavaScript 키 발급');
  console.log('3. .env 파일에 EXPO_BUILD_KAKAO_APP_KEY 설정');
  console.log('4. 플랫폼 설정 (iOS/Android)');
  console.log('5. Redirect URI 설정');
  console.log('6. 동의항목 설정');
  console.log('자세한 내용은 KAKAO_LOGIN_SETUP.md 파일을 참고하세요.');
};
