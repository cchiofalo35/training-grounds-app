import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, spacing } from '@training-grounds/shared';

interface StreakBadgeProps {
  count: number;
  isActive: boolean;
  size?: 'small' | 'large';
}

export const StreakBadge: React.FC<StreakBadgeProps> = ({
  count,
  isActive,
  size = 'small',
}) => {
  const isLarge = size === 'large';
  const accentColor = isActive ? colors.warmAccent : colors.steel;

  return (
    <View style={[styles.container, isLarge && styles.containerLarge]}>
      <Text style={[styles.fireIcon, isLarge && styles.fireIconLarge]}>
        🔥
      </Text>
      <Text
        style={[
          styles.count,
          isLarge && styles.countLarge,
          { color: accentColor },
        ]}
      >
        {count}
      </Text>
      <Text
        style={[
          styles.label,
          isLarge && styles.labelLarge,
          { color: isActive ? colors.textLight : colors.steel },
        ]}
      >
        day streak
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  containerLarge: {
    gap: spacing.sm,
  },
  fireIcon: {
    fontSize: 18,
  },
  fireIconLarge: {
    fontSize: 28,
  },
  count: {
    fontFamily: 'BebasNeue',
    fontSize: fonts.size.lg,
    fontWeight: fonts.weight.bold,
  },
  countLarge: {
    fontSize: fonts.size['2xl'],
  },
  label: {
    fontFamily: 'Inter',
    fontSize: fonts.size.xs,
    fontWeight: fonts.weight.medium,
  },
  labelLarge: {
    fontSize: fonts.size.sm,
  },
});
