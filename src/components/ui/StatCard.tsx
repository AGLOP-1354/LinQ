import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '../../contexts/ThemeContext';

interface StatItem {
  id: string;
  title: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
  };
  onPress?: () => void;
}

interface StatCardProps {
  title: string;
  stats: StatItem[];
  style?: any;
}

export const StatCard: React.FC<StatCardProps> = ({ title, stats, style }) => {
  const { theme } = useTheme();
  const animatedValues = stats.map(() => useSharedValue(0));

  React.useEffect(() => {
    animatedValues.forEach((animatedValue, index) => {
      animatedValue.value = withDelay(index * 100, withTiming(1, { duration: 800 }));
    });
  }, [animatedValues]);

  const renderStatItem = (item: StatItem, index: number) => {
    const animatedValue = animatedValues[index];

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: interpolate(animatedValue.value, [0, 1], [0.8, 1]) }],
      opacity: animatedValue.value,
    }));

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.statItemContainer}
        onPress={item.onPress}
        activeOpacity={item.onPress ? 0.7 : 1}
        disabled={!item.onPress}
        accessibilityRole={item.onPress ? 'button' : 'text'}
        accessibilityLabel={`${item.title}: ${item.value}`}
      >
        <Animated.View
          style={[
            styles.statItem,
            {
              backgroundColor: theme.colors.surface,
            },
            animatedStyle,
          ]}
        >
          <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
            <Ionicons name={item.icon} size={24} color={item.color} />
          </View>

          <View style={styles.statContent}>
            <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>
              {item.value}
            </Text>
            <Text style={[styles.statTitle, { color: theme.colors.text.secondary }]}>
              {item.title}
            </Text>

            {item.change && (
              <View style={styles.changeContainer}>
                <Ionicons
                  name={item.change.type === 'increase' ? 'trending-up' : 'trending-down'}
                  size={12}
                  color={
                    item.change.type === 'increase' ? theme.colors.success : theme.colors.error
                  }
                />
                <Text
                  style={[
                    styles.changeText,
                    {
                      color:
                        item.change.type === 'increase' ? theme.colors.success : theme.colors.error,
                    },
                  ]}
                >
                  {item.change.value > 0 ? '+' : ''}
                  {item.change.value}%
                </Text>
              </View>
            )}
          </View>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.card }, style]}>
      <Text style={[styles.cardTitle, { color: theme.colors.text.primary }]}>{title}</Text>

      <View style={styles.statsGrid}>
        {stats.map((stat, index) => renderStatItem(stat, index))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginVertical: 8,
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
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItemContainer: {
    width: '48%',
    marginBottom: 12,
  },
  statItem: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statContent: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 8,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 2,
  },
});
