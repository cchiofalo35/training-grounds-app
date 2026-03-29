import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, spacing, borderRadius } from '@training-grounds/shared';

interface XpProgressBarProps {
  currentXp: number;
  nextLevelXp: number;
  level?: number;
}

export const XpProgressBar: React.FC<XpProgressBarProps> = ({
  currentXp,
  nextLevelXp,
  level,
}) => {
  const progress = nextLevelXp > 0 ? Math.min(currentXp / nextLevelXp, 1) : 0;
  const percentage = Math.round(progress * 100);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.labelRow}>
          <Text style={styles.xpIcon}>⚡</Text>
          <Text style={styles.xpLabel}>
            {currentXp.toLocaleString()} XP
          </Text>
          {level !== undefined && (
            <Text style={styles.levelLabel}>Level {level}</Text>
          )}
        </View>
        <Text style={styles.threshold}>
          {nextLevelXp.toLocaleString()} XP
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percentage}%` }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  xpIcon: {
    fontSize: 16,
  },
  xpLabel: {
    fontFamily: 'Inter',
    fontSize: fonts.size.base,
    fontWeight: fonts.weight.semibold,
    color: colors.warmAccent,
  },
  levelLabel: {
    fontFamily: 'Inter',
    fontSize: fonts.size.xs,
    fontWeight: fonts.weight.medium,
    color: colors.steel,
    marginLeft: spacing.xs,
  },
  threshold: {
    fontFamily: 'Inter',
    fontSize: fonts.size.xs,
    color: colors.steel,
  },
  track: {
    height: 8,
    backgroundColor: colors.darkGrey,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.warmAccent,
    borderRadius: borderRadius.full,
  },
});
