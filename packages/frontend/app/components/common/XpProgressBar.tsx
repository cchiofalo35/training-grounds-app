import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fonts, spacing, borderRadius } from '@training-grounds/shared';
import { useTheme } from '../../contexts/ThemeContext';

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
  const theme = useTheme();
  const progress = nextLevelXp > 0 ? Math.min(currentXp / nextLevelXp, 1) : 0;
  const percentage = Math.round(progress * 100);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      gap: 6,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    xpLabel: {
      fontFamily: 'Inter',
      fontSize: fonts.size.sm,
      fontWeight: '600' as const,
      color: theme.primaryColor,
    },
    levelLabel: {
      fontFamily: 'BebasNeue',
      fontSize: fonts.size.base,
      color: theme.textPrimary,
    },
    threshold: {
      fontFamily: 'Inter',
      fontSize: 10,
      color: theme.textMuted,
    },
    track: {
      height: 6,
      backgroundColor: theme.surfaceColor,
      borderRadius: borderRadius.full,
      overflow: 'hidden',
    },
    fill: {
      height: '100%',
      backgroundColor: theme.primaryColor,
      borderRadius: borderRadius.full,
    },
  }), [theme]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.labelRow}>
          <Ionicons name="flash" size={16} color={theme.primaryColor} />
          <Text style={styles.xpLabel}>
            {currentXp.toLocaleString()} XP
          </Text>
        </View>
        {level !== undefined && (
          <Text style={styles.levelLabel}>Lvl {level}</Text>
        )}
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percentage}%` }]} />
      </View>
      <Text style={styles.threshold}>
        {nextLevelXp.toLocaleString()} XP to next level
      </Text>
    </View>
  );
};
