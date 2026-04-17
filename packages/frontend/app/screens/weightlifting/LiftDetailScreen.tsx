import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, borderRadius } from '@training-grounds/shared';
import {
  personalRecordService,
  calculatePercentageOfPr,
  roundToPlate,
  STANDARD_PERCENTAGES,
  type PersonalRecord,
} from '../../services/personalRecordService';
import { PrChart } from '../../components/common/PrChart';
import type { AppStackParamList } from '../../navigation/AppStack';

type DetailRoute = RouteProp<AppStackParamList, 'LiftDetail'>;
type DetailNav = NativeStackNavigationProp<AppStackParamList>;

export const LiftDetailScreen: React.FC = () => {
  const theme = useTheme();
  const route = useRoute<DetailRoute>();
  const nav = useNavigation<DetailNav>();
  const movementName = route.params.movementName;

  const [records, setRecords] = useState<PersonalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [customPercent, setCustomPercent] = useState('');

  useEffect(() => {
    nav.setOptions({ title: movementName });
    personalRecordService
      .getHistory(movementName)
      .then(setRecords)
      .finally(() => setLoading(false));
  }, [nav, movementName]);

  const bestPr = useMemo(() => records.find((r) => r.isAllTimePr) ?? records[0] ?? null, [records]);
  const chartData = useMemo(
    () =>
      records
        .slice()
        .sort((a, b) => new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime())
        .map((r) => ({ date: r.loggedAt, value: Number(r.valueNumeric) })),
    [records],
  );

  const prValue = bestPr ? Number(bestPr.valueNumeric) : 0;
  const prUnit = bestPr?.valueUnit ?? 'kg';

  const customValue = useMemo(() => {
    const pct = parseFloat(customPercent);
    if (isNaN(pct) || pct <= 0) return null;
    return roundToPlate(calculatePercentageOfPr(prValue, pct));
  }, [customPercent, prValue]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safe: { flex: 1, backgroundColor: theme.secondaryColor },
        scroll: { padding: spacing.lg, paddingBottom: spacing['3xl'] },
        title: {
          color: theme.textPrimary,
          fontSize: 24,
          fontWeight: '800',
          fontFamily: theme.headingFont,
          letterSpacing: 1,
        },
        prCardLarge: {
          backgroundColor: theme.surfaceColor,
          borderRadius: borderRadius.md,
          padding: spacing.lg,
          marginTop: spacing.md,
          borderWidth: 1,
          borderColor: theme.primaryColor,
          alignItems: 'center',
        },
        prLabel: {
          color: theme.textMuted,
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: 1.5,
        },
        prValue: {
          color: theme.primaryColor,
          fontSize: 56,
          fontWeight: '900',
          fontFamily: theme.headingFont,
          letterSpacing: 2,
        },
        prDate: { color: theme.textMuted, fontSize: 12, marginTop: 4 },
        sectionLabel: {
          color: theme.textMuted,
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: 1.5,
          marginTop: spacing.lg,
          marginBottom: spacing.sm,
        },
        percentGrid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
        },
        percentCard: {
          backgroundColor: theme.surfaceColor,
          borderRadius: borderRadius.sm,
          paddingVertical: 10,
          paddingHorizontal: 14,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.06)',
          width: '31%',
          alignItems: 'center',
        },
        percentLabel: { color: theme.textMuted, fontSize: 11, fontWeight: '600' },
        percentValue: { color: theme.textPrimary, fontSize: 18, fontWeight: '800', marginTop: 2, fontFamily: theme.headingFont },
        customWrap: {
          backgroundColor: theme.surfaceColor,
          borderRadius: borderRadius.md,
          padding: spacing.md,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.06)',
          marginTop: spacing.sm,
        },
        customRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
        customInput: {
          flex: 1,
          backgroundColor: theme.secondaryColor,
          color: theme.textPrimary,
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderRadius: borderRadius.sm,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.08)',
          fontSize: 16,
        },
        customResult: {
          color: theme.primaryColor,
          fontSize: 22,
          fontWeight: '800',
          fontFamily: theme.headingFont,
        },
        historyRow: {
          backgroundColor: theme.surfaceColor,
          borderRadius: borderRadius.sm,
          padding: spacing.md,
          marginBottom: 8,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.06)',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        historyDate: { color: theme.textPrimary, fontSize: 13, fontWeight: '600' },
        historyNotes: { color: theme.textMuted, fontSize: 11, marginTop: 2 },
        historyValue: { color: theme.textPrimary, fontSize: 17, fontWeight: '800', fontFamily: theme.headingFont },
        logButton: {
          backgroundColor: theme.primaryColor,
          borderRadius: borderRadius.sm,
          padding: 14,
          marginTop: spacing.md,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        },
        logButtonText: {
          color: theme.secondaryColor,
          fontWeight: '800',
          fontSize: 13,
          textTransform: 'uppercase',
          letterSpacing: 1,
        },
      }),
    [theme],
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={theme.primaryColor} size="large" style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>{movementName.toUpperCase()}</Text>

        {bestPr ? (
          <View style={styles.prCardLarge}>
            <Text style={styles.prLabel}>Personal Best</Text>
            <Text style={styles.prValue}>
              {prValue}
              <Text style={{ fontSize: 22 }}> {prUnit}</Text>
            </Text>
            <Text style={styles.prDate}>
              set on{' '}
              {new Date(bestPr.loggedAt).toLocaleDateString(undefined, {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </Text>
          </View>
        ) : (
          <View style={styles.prCardLarge}>
            <Text style={styles.prLabel}>No PR Logged</Text>
            <Text style={styles.prDate}>Log your first lift to start the journey</Text>
          </View>
        )}

        <Text style={styles.sectionLabel}>Journey</Text>
        <PrChart data={chartData} unit={prUnit ? ` ${prUnit}` : ''} />

        {bestPr && (
          <>
            <Text style={styles.sectionLabel}>Working Weights (% of PR)</Text>
            <View style={styles.percentGrid}>
              {STANDARD_PERCENTAGES.map((pct) => {
                const weight = roundToPlate(calculatePercentageOfPr(prValue, pct));
                return (
                  <View key={pct} style={styles.percentCard}>
                    <Text style={styles.percentLabel}>{pct}%</Text>
                    <Text style={styles.percentValue}>{weight}</Text>
                  </View>
                );
              })}
            </View>

            <Text style={styles.sectionLabel}>Custom %</Text>
            <View style={styles.customWrap}>
              <View style={styles.customRow}>
                <TextInput
                  style={styles.customInput}
                  placeholder="Enter % (e.g. 72.5)"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="decimal-pad"
                  value={customPercent}
                  onChangeText={setCustomPercent}
                />
                <Text style={styles.customResult}>
                  {customValue !== null ? `${customValue} ${prUnit}` : '—'}
                </Text>
              </View>
            </View>
          </>
        )}

        <Pressable style={styles.logButton} onPress={() => nav.navigate('LogPr', { movementName })}>
          <Ionicons name="add" size={20} color={theme.secondaryColor} />
          <Text style={styles.logButtonText}>Log New Lift</Text>
        </Pressable>

        <Text style={styles.sectionLabel}>History</Text>
        {records.length === 0 ? (
          <Text style={{ color: theme.textMuted, fontSize: 13 }}>
            No lifts logged yet.
          </Text>
        ) : (
          records
            .slice()
            .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime())
            .map((r) => (
              <View key={r.id} style={styles.historyRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.historyDate}>
                    {new Date(r.loggedAt).toLocaleDateString(undefined, {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                    {r.isAllTimePr ? '  🔔' : ''}
                  </Text>
                  {r.notes && <Text style={styles.historyNotes}>{r.notes}</Text>}
                </View>
                <Text style={styles.historyValue}>
                  {Number(r.valueNumeric)} {r.valueUnit}
                </Text>
              </View>
            ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
