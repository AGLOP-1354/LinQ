import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface MenuItem {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  description?: string;
  value?: string;
  color?: string;
  onPress?: () => void;
  showArrow?: boolean;
  component?: React.ReactNode;
}

interface MenuCardProps {
  title: string;
  items: MenuItem[];
  style?: any;
}

export const MenuCard: React.FC<MenuCardProps> = ({ title, items, style }) => {
  const { theme } = useTheme();

  const renderItem = ({ item, index }: { item: MenuItem; index: number }) => {
    const isLast = index === items.length - 1;

    return (
      <TouchableOpacity
        style={[
          styles.menuItem,
          {
            borderBottomColor: theme.colors.divider,
            borderBottomWidth: isLast ? 0 : 1,
          },
        ]}
        onPress={item.onPress}
        activeOpacity={0.6}
        disabled={!item.onPress}
        accessibilityRole='button'
        accessibilityLabel={item.title}
      >
        <View style={styles.menuItemLeft}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: item.color || theme.colors.primary[50] },
            ]}
          >
            <Ionicons name={item.icon} size={20} color={item.color || theme.colors.primary[500]} />
          </View>

          <View style={styles.textContainer}>
            <Text style={[styles.menuTitle, { color: theme.colors.text.primary }]}>
              {item.title}
            </Text>
            {item.description && (
              <Text style={[styles.menuDescription, { color: theme.colors.text.tertiary }]}>
                {item.description}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.menuItemRight}>
          {item.component ? (
            item.component
          ) : (
            <>
              {item.value && (
                <Text style={[styles.menuValue, { color: theme.colors.text.secondary }]}>
                  {item.value}
                </Text>
              )}
              {item.showArrow !== false && item.onPress && (
                <Ionicons
                  name='chevron-forward'
                  size={16}
                  color={theme.colors.text.tertiary}
                  style={styles.arrow}
                />
              )}
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.card }, style]}>
      <Text style={[styles.cardTitle, { color: theme.colors.text.primary }]}>{title}</Text>

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    marginHorizontal: 20,
    marginVertical: 8,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    marginHorizontal: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    minHeight: 56,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  menuDescription: {
    fontSize: 14,
    fontWeight: '400',
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuValue: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 8,
  },
  arrow: {
    marginLeft: 4,
  },
});
