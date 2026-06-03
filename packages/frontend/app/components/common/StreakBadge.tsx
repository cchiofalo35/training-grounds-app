import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fonts, spacing } from '@training-grounds/shared';
import { useTheme } from '../../contexts/ThemeContext';

const FLAME_COLOR = '#FF6B35';

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
  const theme = useTheme();
  const isLarge = size === 'large';
  const accentColor = isActive ? theme.primaryColor : theme.textMuted;

  const styles = useMemo(() => StyleSheet.create({
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
  }), [theme]);

  return (
    <View style={[styles.container, isLarge && styles.containerLarge]}>
      <Ionicons
        name="flame"
        size={isLarge ? 28 : 18}
        color={isActive ? FLAME_COLOR : theme.textMuted}
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
            { color: isActive ? theme.textMuted : theme.textMuted },
          ]}
        >
          day streak
        </Text>
      </View>
    </View>
  );
};
