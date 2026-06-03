import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, spacing, borderRadius } from '@training-grounds/shared';
import type { BeltRank } from '@training-grounds/shared';
import { useTheme } from '../../contexts/ThemeContext';

interface BeltDisplayProps {
  belt: BeltRank;
  stripes: number;
  size?: 'small' | 'large';
}

const BELT_LABELS: Record<BeltRank, string> = {
  white: 'White Belt',
  blue: 'Blue Belt',
  purple: 'Purple Belt',
  brown: 'Brown Belt',
  black: 'Black Belt',
};

export const BeltDisplay: React.FC<BeltDisplayProps> = ({
  belt,
  stripes,
  size = 'small',
}) => {
  const theme = useTheme();
  const isLarge = size === 'large';
  const beltColor = colors.belt[belt];

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    containerLarge: {
      gap: spacing.md,
    },
    belt: {
      width: 40,
      height: 12,
      borderRadius: borderRadius.sm,
      justifyContent: 'center',
      alignItems: 'flex-end',
      paddingRight: 4,
    },
    beltLarge: {
      width: 60,
      height: 18,
      borderRadius: borderRadius.md,
      paddingRight: 6,
    },
    whiteBeltBorder: {
      borderWidth: 1,
      borderColor: colors.borderDark,
    },
    stripeContainer: {
      flexDirection: 'row',
      gap: 2,
    },
    stripe: {
      width: 3,
      height: 8,
      borderRadius: 1,
    },
    stripeLarge: {
      width: 4,
      height: 12,
      borderRadius: 2,
    },
    stripeActive: {
      backgroundColor: theme.primaryColor,
    },
    stripeInactive: {
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
    },
    label: {
      fontFamily: 'Inter',
      fontSize: fonts.size.sm,
      fontWeight: fonts.weight.medium,
      color: theme.textMuted,
    },
    labelLarge: {
      fontSize: fonts.size.base,
      fontWeight: fonts.weight.semibold,
    },
  }), [theme]);

  return (
    <View style={[styles.container, isLarge && styles.containerLarge]}>
      <View
        style={[
          styles.belt,
          isLarge && styles.beltLarge,
          { backgroundColor: beltColor },
          belt === 'white' && styles.whiteBeltBorder,
        ]}
      >
        <View style={styles.stripeContainer}>
          {Array.from({ length: 4 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.stripe,
                isLarge && styles.stripeLarge,
                i < stripes ? styles.stripeActive : styles.stripeInactive,
              ]}
            />
          ))}
        </View>
      </View>
      <Text style={[styles.label, isLarge && styles.labelLarge]}>
        {BELT_LABELS[belt]}
        {stripes > 0 ? ` (${stripes} ${stripes === 1 ? 'stripe' : 'stripes'})` : ''}
      </Text>
    </View>
  );
};
