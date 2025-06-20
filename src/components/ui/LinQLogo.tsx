import React from 'react';
import Svg, { Circle, Defs, G, LinearGradient, Path, Stop } from 'react-native-svg';

interface LinQLogoProps {
  size?: number;
  variant?: 'default' | 'light' | 'dark' | 'monochrome';
  animated?: boolean;
}

export default function LinQLogo({
  size = 80,
  variant = 'default',
  animated = false,
}: LinQLogoProps) {
  const getColors = () => {
    switch (variant) {
      case 'light':
        return {
          primary: '#3B82F6',
          secondary: '#10B981',
          accent: '#8B5CF6',
          background: '#FFFFFF',
        };
      case 'dark':
        return {
          primary: '#60A5FA',
          secondary: '#34D399',
          accent: '#A78BFA',
          background: '#1F2937',
        };
      case 'monochrome':
        return {
          primary: '#374151',
          secondary: '#6B7280',
          accent: '#9CA3AF',
          background: 'transparent',
        };
      default:
        return {
          primary: '#3B82F6',
          secondary: '#10B981',
          accent: '#8B5CF6',
          background: 'transparent',
        };
    }
  };

  const colors = getColors();

  return (
    <Svg width={size} height={size} viewBox='0 0 100 100' fill='none'>
      <Defs>
        {/* 메인 그라데이션 */}
        <LinearGradient id='mainGradient' x1='0%' y1='0%' x2='100%' y2='100%'>
          <Stop offset='0%' stopColor={colors.primary} stopOpacity='1' />
          <Stop offset='50%' stopColor={colors.accent} stopOpacity='1' />
          <Stop offset='100%' stopColor={colors.secondary} stopOpacity='1' />
        </LinearGradient>

        {/* 보조 그라데이션 */}
        <LinearGradient id='accentGradient' x1='0%' y1='0%' x2='100%' y2='0%'>
          <Stop offset='0%' stopColor={colors.secondary} stopOpacity='0.8' />
          <Stop offset='100%' stopColor={colors.primary} stopOpacity='0.8' />
        </LinearGradient>

        {/* 글로우 효과 */}
        <LinearGradient id='glowGradient' x1='0%' y1='0%' x2='100%' y2='100%'>
          <Stop offset='0%' stopColor={colors.primary} stopOpacity='0.3' />
          <Stop offset='100%' stopColor={colors.secondary} stopOpacity='0.1' />
        </LinearGradient>
      </Defs>

      {/* 배경 원 (선택적) */}
      {variant !== 'monochrome' && (
        <Circle cx='50' cy='50' r='48' fill='url(#glowGradient)' opacity='0.1' />
      )}

      {/* 메인 로고 - 연결된 노드들 (AI 네트워크 표현) */}
      <G>
        {/* 중앙 핵심 노드 */}
        <Circle cx='50' cy='50' r='8' fill='url(#mainGradient)' />

        {/* 연결 링크들 */}
        <Path
          d='M35 35 L50 50 L65 35'
          stroke='url(#accentGradient)'
          strokeWidth='3'
          strokeLinecap='round'
          fill='none'
        />

        <Path
          d='M35 65 L50 50 L65 65'
          stroke='url(#accentGradient)'
          strokeWidth='3'
          strokeLinecap='round'
          fill='none'
        />

        <Path
          d='M25 50 L50 50 L75 50'
          stroke='url(#accentGradient)'
          strokeWidth='3'
          strokeLinecap='round'
          fill='none'
        />

        {/* 외곽 노드들 */}
        <Circle cx='35' cy='35' r='5' fill={colors.primary} />
        <Circle cx='65' cy='35' r='5' fill={colors.secondary} />
        <Circle cx='35' cy='65' r='5' fill={colors.secondary} />
        <Circle cx='65' cy='65' r='5' fill={colors.primary} />
        <Circle cx='25' cy='50' r='4' fill={colors.accent} />
        <Circle cx='75' cy='50' r='4' fill={colors.accent} />

        {/* 추가 연결 포인트 (AI 뉴럴 네트워크 느낌) */}
        <Circle cx='50' cy='25' r='3' fill={colors.primary} opacity='0.7' />
        <Circle cx='50' cy='75' r='3' fill={colors.secondary} opacity='0.7' />

        {/* 중앙에서 상하로 연결 */}
        <Path
          d='M50 25 L50 42'
          stroke={colors.primary}
          strokeWidth='2'
          strokeLinecap='round'
          opacity='0.6'
        />

        <Path
          d='M50 58 L50 75'
          stroke={colors.secondary}
          strokeWidth='2'
          strokeLinecap='round'
          opacity='0.6'
        />

        {/* 디테일 점들 (데이터 포인트 표현) */}
        <Circle cx='42' cy='42' r='1.5' fill={colors.accent} opacity='0.8' />
        <Circle cx='58' cy='42' r='1.5' fill={colors.accent} opacity='0.8' />
        <Circle cx='42' cy='58' r='1.5' fill={colors.accent} opacity='0.8' />
        <Circle cx='58' cy='58' r='1.5' fill={colors.accent} opacity='0.8' />
      </G>

      {/* 동적 요소 (Q의 꼬리 모티브) */}
      <Path
        d='M62 62 Q68 68 72 65 Q75 62 73 58'
        stroke='url(#mainGradient)'
        strokeWidth='2.5'
        strokeLinecap='round'
        fill='none'
        opacity='0.9'
      />

      {/* 미세한 글로우 포인트들 */}
      <Circle cx='30' cy='30' r='1' fill={colors.primary} opacity='0.5' />
      <Circle cx='70' cy='30' r='1' fill={colors.secondary} opacity='0.5' />
      <Circle cx='30' cy='70' r='1' fill={colors.secondary} opacity='0.5' />
      <Circle cx='70' cy='70' r='1' fill={colors.primary} opacity='0.5' />
    </Svg>
  );
}
