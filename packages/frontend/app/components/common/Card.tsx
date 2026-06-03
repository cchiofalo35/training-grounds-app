import React, { useMemo } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, borderRadius, shadows } from '@training-grounds/shared';
import { useTheme } from '../../contexts/ThemeContext';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle | (ViewStyle | false | undefined)[];
}

export const Card: React.FC<CardProps> = ({ children, style }) => {
  const theme = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    card: {
      backgroundColor: theme.surfaceColor,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: colors.borderDark,
      padding: 16,
      ...shadows.card,
    },
  }), [theme]);

  return <View style={[styles.card, style]}>{children}</View>;
};
