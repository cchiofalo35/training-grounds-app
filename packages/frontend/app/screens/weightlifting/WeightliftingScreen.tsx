import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, borderRadius } from '@training-grounds/shared';
import {
  personalRecordService,
  groupByBestPr,
  TRACKED_LIFTS,
  type PersonalRecord,
} from '../../services/personalRecordService';
import type { AppStackParamList } from '../../navigation/AppStack';

type WeightliftingNav = NativeStackNavigationProp<AppStackParamList>;

export const WeightliftingScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<WeightliftingNav>();
  const [records, setRecords] = useState<PersonalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await personalRecordService.listMyPrs({ category: 'lift' });
      setRecords(data);
    } catch (e) {
      // leave records as-is on error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const bestsByMovement = useMemo(() => groupByBestPr(records), [records]);
  const lastSession = useMemo(() => {
    if (records.length === 0) return null;
    return records.reduce((latest, r) =>
      new Date(r.loggedAt) > new Date(latest.loggedAt) ? r : latest,
    );
  }, [records]);

  const totalTonnage = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of Object.values(bestsByMovement)) {
      map.set(r.movementName, Number(r.valueNumeric));
    }
    return Array.from(map.values()).reduce((sum, v) => sum + v, 0);
  }, [bestsByMovement]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safe: { flex: 1, backgroundColor: theme.secondaryColor },
        header: { padding: spacing.lg, paddingBottom: spacing.md },
        title: {
          color: theme.textPrimary,
          fontSize: 28,
          fontWeight: '800',
          fontFamily: theme.headingFont,
          letterSpacing: 1,
        },
        subtitle: { color: theme.textMuted, fontSize: 13, marginTop: 4 },
        summaryRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg },
        summaryCard: {
          flex: 1,
          backgroundColor: theme.surfaceColor,
          borderRadius: borderRadius.md,
          padding: spacing.md,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.06)',
        },
        summaryLabel: { color: theme.textMuted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
        summaryValue: { color: theme.textPrimary, fontSize: 22, fontWeight: '800', marginTop: 4, fontFamily: theme.headingFont },
        summarySub: { color: theme.textMuted, fontSize: 11, marginTop: 2 },
        sectionLabel: {
          color: theme.textMuted,
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: 1.5,
          marginTop: spacing.lg,
          marginBottom: spacing.xs,
          marginHorizontal: spacing.lg,
        },
        liftCard: {
          backgroundColor: theme.surfaceColor,
          borderRadius: borderRadius.md,
          padding: spacing.md,
          marginHorizontal: spacing.lg,
          marginBottom: spacing.sm,
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.06)',
        },
        liftIcon: {
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: `${theme.primaryColor}22`,
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: spacing.md,
        },
        liftName: { color: theme.textPrimary, fontSize: 15, fontWeight: '700' },
        liftPr: { color: theme.textMuted, fontSize: 12, marginTop: 2 },
        liftBest: { color: theme.primaryColor, fontSize: 18, fontWeight: '800', fontFamily: theme.headingFont },
        liftUnit: { color: theme.textMuted, fontSize: 11 },
        liftValueWrap: { alignItems: 'flex-end' },
        fab: {
          position: 'absolute',
          bottom: spacing.lg,
          right: spacing.lg,
          backgroundColor: theme.primaryColor,
          width: 56,
          height: 56,
          borderRadius: 28,
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOpacity: 0.3,
          shadowRadius: 6,
          elevation: 5,
        },
        emptyText: {
          color: theme.textMuted,
          fontSize: 13,
          textAlign: 'center',
          padding: spacing.lg,
        },
        loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
      }),
    [theme],
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loading}>
          <ActivityIndicator color={theme.primaryColor} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  const loggedMovements = TRACKED_LIFTS.filter((l) => bestsByMovement[l.name]);
  const untrackedMovements = TRACKED_LIFTS.filter((l) => !bestsByMovement[l.name]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={theme.primaryColor}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>LIFT TRACKER</Text>
          <Text style={styles.subtitle}>Log PRs, track progression, calculate % work sets</Text>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Tracked Lifts</Text>
            <Text style={styles.summaryValue}>{loggedMovements.length}</Text>
            <Text style={styles.summarySub}>of {TRACKED_LIFTS.length} lifts</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Best Total</Text>
            <Text style={styles.summaryValue}>{totalTonnage.toFixed(0)}</Text>
            <Text style={styles.summarySub}>kg across PRs</Text>
          </View>
        </View>

        {lastSession && (
          <>
            <Text style={styles.sectionLabel}>Last Session</Text>
            <Pressable
              style={styles.liftCard}
              onPress={() =>
                navigation.navigate('LiftDetail', { movementName: lastSession.movementName })
              }
            >
              <View style={styles.liftIcon}>
                <Ionicons name="time" size={22} color={theme.primaryColor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.liftName}>{lastSession.movementName}</Text>
                <Text style={styles.liftPr}>
                  {new Date(lastSession.loggedAt).toLocaleDateString(undefined, {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}
                  {lastSession.notes ? ` · ${lastSession.notes.slice(0, 30)}` : ''}
                </Text>
              </View>
              <View style={styles.liftValueWrap}>
                <Text style={styles.liftBest}>
                  {Number(lastSession.valueNumeric)}
                  <Text style={styles.liftUnit}>{` ${lastSession.valueUnit}`}</Text>
                </Text>
                {lastSession.isAllTimePr && (
                  <Text style={{ color: theme.primaryColor, fontSize: 10, fontWeight: '700' }}>
                    🔔 NEW PR
                  </Text>
                )}
              </View>
            </Pressable>
          </>
        )}

        <Text style={styles.sectionLabel}>Your Personal Bests</Text>
        {loggedMovements.length === 0 ? (
          <Text style={styles.emptyText}>
            No PRs logged yet. Tap the + button to add your first lift.
          </Text>
        ) : (
          loggedMovements.map((lift) => {
            const best = bestsByMovement[lift.name];
            return (
              <Pressable
                key={lift.name}
                style={styles.liftCard}
                onPress={() => navigation.navigate('LiftDetail', { movementName: lift.name })}
              >
                <View style={styles.liftIcon}>
                  <Ionicons name="barbell" size={22} color={theme.primaryColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.liftName}>{lift.name}</Text>
                  <Text style={styles.liftPr}>
                    logged {new Date(best.loggedAt).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.liftValueWrap}>
                  <Text style={styles.liftBest}>
                    {Number(best.valueNumeric)}
                    <Text style={styles.liftUnit}>{` ${best.valueUnit}`}</Text>
                  </Text>
                </View>
              </Pressable>
            );
          })
        )}

        {untrackedMovements.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Add Other Lifts</Text>
            {untrackedMovements.slice(0, 6).map((lift) => (
              <Pressable
                key={lift.name}
                style={styles.liftCard}
                onPress={() => navigation.navigate('LogPr', { movementName: lift.name })}
              >
                <View style={styles.liftIcon}>
                  <Ionicons name="add" size={22} color={theme.primaryColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.liftName}>{lift.name}</Text>
                  <Text style={styles.liftPr}>Tap to log your first PR</Text>
                </View>
              </Pressable>
            ))}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <Pressable style={styles.fab} onPress={() => navigation.navigate('LogPr', {})}>
        <Ionicons name="add" size={28} color={theme.secondaryColor} />
      </Pressable>
    </SafeAreaView>
  );
};
