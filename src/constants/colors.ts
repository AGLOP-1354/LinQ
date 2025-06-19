// 기본 색상 팔레트
export const Colors = {
  // Primary Colors
  primary: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6', // Main primary
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },

  // Secondary Colors (Green)
  secondary: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981', // Main secondary
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
  },

  // Accent Colors (Amber)
  accent: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B', // Main accent
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },

  // Neutral Colors
  neutral: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },

  // Status Colors
  status: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },

  // Priority Colors
  priority: {
    HIGH: '#EF4444',    // 빨간색 (상)
    MEDIUM: '#F59E0B',  // 주황색 (중)
    LOW: '#10B981',     // 초록색 (하)
  },

  // AI Related Colors
  ai: {
    gradient: ['#3B82F6', '#10B981'],
    badge: '#10B981',
    chat: {
      user: '#3B82F6',
      ai: '#10B981',
      background: '#F9FAFB',
    },
  },

  // Background Colors
  background: {
    primary: '#FFFFFF',
    secondary: '#F9FAFB',
    tertiary: '#F3F4F6',
  },

  // Text Colors
  text: {
    primary: '#111827',
    secondary: '#6B7280',
    tertiary: '#9CA3AF',
    inverse: '#FFFFFF',
  },

  // Border Colors
  border: {
    light: '#F3F4F6',
    medium: '#E5E7EB',
    dark: '#D1D5DB',
  },

  // Shadow Colors
  shadow: {
    light: 'rgba(0, 0, 0, 0.05)',
    medium: 'rgba(0, 0, 0, 0.1)',
    dark: 'rgba(0, 0, 0, 0.25)',
  },
} as const;

// 다크 모드 색상 (선택적)
export const DarkColors = {
  primary: Colors.primary,
  secondary: Colors.secondary,
  accent: Colors.accent,

  neutral: {
    50: '#1F2937',
    100: '#374151',
    200: '#4B5563',
    300: '#6B7280',
    400: '#9CA3AF',
    500: '#D1D5DB',
    600: '#E5E7EB',
    700: '#F3F4F6',
    800: '#F9FAFB',
    900: '#FFFFFF',
  },

  background: {
    primary: '#111827',
    secondary: '#1F2937',
    tertiary: '#374151',
  },

  text: {
    primary: '#FFFFFF',
    secondary: '#D1D5DB',
    tertiary: '#9CA3AF',
    inverse: '#111827',
  },

  border: {
    light: '#374151',
    medium: '#4B5563',
    dark: '#6B7280',
  },

  shadow: {
    light: 'rgba(0, 0, 0, 0.3)',
    medium: 'rgba(0, 0, 0, 0.5)',
    dark: 'rgba(0, 0, 0, 0.8)',
  },
} as const;

// 편의 함수들
export const getEventCategoryColor = (category: string) => {
  const categoryColors = {
    work: Colors.primary[500],
    personal: Colors.secondary[500],
    health: Colors.accent[500],
    social: '#8B5CF6', // Purple
    travel: '#06B6D4', // Cyan
    other: Colors.neutral[500],
  };
  
  return categoryColors[category as keyof typeof categoryColors] || Colors.neutral[500];
};

export const getPriorityColor = (priority: 'HIGH' | 'MEDIUM' | 'LOW') => {
  return Colors.priority[priority];
};

export const getStatusColor = (status: 'success' | 'warning' | 'error' | 'info') => {
  return Colors.status[status];
}; 