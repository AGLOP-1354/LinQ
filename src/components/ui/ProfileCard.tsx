import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface ProfileCardProps {
  name: string;
  email: string;
  avatar?: string;
  onEditPress?: () => void;
  style?: any;
}

const { width } = Dimensions.get('window');

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
      <View style={[styles.backgroundDecoration, { backgroundColor: theme.colors.primary[50] }]} />

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
          <View style={[styles.statusIndicator, { backgroundColor: theme.colors.success }]} />
        </View>

        {/* 사용자 정보 */}
        <View style={styles.userInfo}>
          <Text style={[styles.name, { color: theme.colors.text.primary }]}>{name}</Text>
          <Text style={[styles.email, { color: theme.colors.text.secondary }]}>{email}</Text>
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
            <Ionicons name='pencil' size={16} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* 그라데이션 효과 */}
      <View
        style={[styles.gradientOverlay, { backgroundColor: theme.colors.primary[500] + '10' }]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    marginVertical: 16,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  backgroundDecoration: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 120,
    height: 120,
    borderRadius: 60,
    opacity: 0.3,
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
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#fff',
  },
  userInfo: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    fontWeight: '500',
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
