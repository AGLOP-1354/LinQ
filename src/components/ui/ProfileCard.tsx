import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useTheme } from '../../contexts/ThemeContext';

interface ProfileCardProps {
  name: string;
  email: string;
  avatar?: string;
  onEditPress?: () => void;
  style?: any;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  name,
  email,
  avatar,
  onEditPress,
  style,
}) => {
  const { theme } = useTheme();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.card }, style]}>
      {/* 배경 장식 */}
      <View style={[styles.backgroundDecoration, { backgroundColor: theme.colors.primary[100] }]} />
      <View style={[styles.backgroundDecoration2, { backgroundColor: theme.colors.primary[50] }]} />

      <View style={styles.content}>
        {/* 프로필 이미지 */}
        <View style={styles.avatarContainer}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} />
          ) : (
            <View
              style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.primary[500] }]}
            >
              <Text style={[styles.avatarText, { color: theme.colors.text.inverse }]}>
                {getInitials(name)}
              </Text>
            </View>
          )}

          {/* 온라인 상태 표시 */}
          <View
            style={[
              styles.statusIndicator,
              {
                backgroundColor: theme.colors.success,
                borderColor: theme.colors.background.card,
              },
            ]}
          />
        </View>

        {/* 사용자 정보 */}
        <View style={styles.userInfo}>
          <Text style={[styles.name, { color: theme.colors.text.primary }]}>{name}</Text>
          <Text style={[styles.email, { color: theme.colors.text.secondary }]}>{email}</Text>

          {/* 활동 상태 */}
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: theme.colors.success }]} />
            <Text style={[styles.statusText, { color: theme.colors.text.tertiary }]}>
              활성 상태
            </Text>
          </View>
        </View>

        {/* 편집 버튼 */}
        {onEditPress && (
          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: theme.colors.surface }]}
            onPress={onEditPress}
            activeOpacity={0.7}
            accessibilityRole='button'
            accessibilityLabel='프로필 편집'
          >
            <Ionicons name='pencil' size={18} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* 그라데이션 효과 */}
      <View
        style={[styles.gradientOverlay, { backgroundColor: theme.colors.primary[500] + '08' }]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 16,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  backgroundDecoration: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 100,
    height: 100,
    borderRadius: 50,
    opacity: 0.4,
  },
  backgroundDecoration2: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 80,
    height: 80,
    borderRadius: 40,
    opacity: 0.2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    zIndex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  avatarPlaceholder: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '700',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 3,
  },
  userInfo: {
    flex: 1,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  email: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
  },
});
