import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
      <Ionicons
        name="flame"
        size={isLarge ? 28 : 18}
        color={isActive ? '#FF6B35' : colors.steel}
      />
      <View style={styles.textContainer}>
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
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  count: {
    fontFamily: 'BebasNeue',
    fontSize: fonts.size.lg,
  },
  countLarge: {
    fontSize: fonts.size['2xl'],
  },
  label: {
    fontFamily: 'Inter',
    fontSize: fonts.size.xs,
  },
  labelLarge: {
    fontSize: fonts.size.sm,
  },
});
