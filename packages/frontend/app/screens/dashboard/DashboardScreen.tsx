import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing, borderRadius } from '@training-grounds/shared';
import type { AttendanceRecord, Discipline } from '@training-grounds/shared';
import type { RootState, AppDispatch } from '../../redux/store';
import { fetchHistory } from '../../redux/slices/attendanceSlice';
import { fetchStreak, fetchQuests } from '../../redux/slices/gamificationSlice';
import { Card } from '../../components/common/Card';
import { StreakBadge } from '../../components/common/StreakBadge';
import { XpProgressBar } from '../../components/common/XpProgressBar';
import { BeltDisplay } from '../../components/common/BeltDisplay';
import { ProfileAvatar } from '../../components/common/ProfileAvatar';
import { useTheme } from '../../contexts/ThemeContext';
import { useGymCopy } from '../../utils/gymCopy';
import type { MainTabParamList } from '../../navigation/MainTabs';
import type { AppStackParamList } from '../../navigation/AppStack';

type DashboardNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Dashboard'>,
  NativeStackNavigationProp<AppStackParamList>
>;

const DISCIPLINE_LABELS: Record<Discipline, string> = {
  'bjj-gi': 'BJJ Gi',
  'bjj-nogi': 'BJJ No-Gi',
  'muay-thai': 'Muay Thai',
  wrestling: 'Wrestling',
  mma: 'MMA',
  boxing: 'Boxing',
  'open-mat': 'Open Mat',
  crossfit: 'CrossFit',
  'crossfit-kids': 'CrossFit Kids',
  weightlifting: 'Weightlifting',
  hyrox: 'HYROX',
  'open-gym': 'Open Gym',
};

const calculateLeague = (
  xp: number,
  ladder: Array<{ key: string; label: string }>,
): { name: string; color: string } => {
  // ladder order: [bronze, silver, gold, platinum, diamond, black-belt-elite]
  const lbl = (idx: number) => ladder[idx]?.label ?? 'Bronze';
  if (xp >= 50000) return { name: lbl(5), color: colors.league.blackBelt };
  if (xp >= 25000) return { name: lbl(4), color: colors.league.diamond };
  if (xp >= 10000) return { name: lbl(3), color: colors.league.platinum };
  if (xp >= 5000) return { name: lbl(2), color: colors.league.gold };
  if (xp >= 2000) return { name: lbl(1), color: colors.league.silver };
  return { name: lbl(0), color: colors.league.bronze };
};

const formatRelativeDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/* ─── Quest helpers ─── */

interface Quest {
  title: string;
  current: number;
  target: number;
  xpReward: number;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
}

const buildWeeklyQuests = (
  gymSlug: string | null | undefined,
  weeklyClasses: number,
  weeklyDisciplines: Set<string>,
  hasJournalThisWeek: boolean,
): Quest[] => {
  const isCrossFit = gymSlug === 'crossfit-karuna' || gymSlug === 'karuna-crossfit';

  if (isCrossFit) {
    return [
      {
        title: '3 WODs this week',
        current: Math.min(weeklyClasses, 3),
        target: 3,
        xpReward: 100,
        icon: 'barbell',
        iconColor: '#8BC53F',
      },
      {
        title: 'Log a PR',
        current: 0,
        target: 1,
        xpReward: 150,
        icon: 'trophy',
        iconColor: '#FF9F43',
      },
      {
        title: 'Post a WOD result',
        current: hasJournalThisWeek ? 1 : 0,
        target: 1,
        xpReward: 75,
        icon: 'journal',
        iconColor: '#5F27CD',
      },
    ];
  }

  return [
    {
      title: 'Attend 3 classes',
      current: Math.min(weeklyClasses, 3),
      target: 3,
      xpReward: 150,
      icon: 'fitness',
      iconColor: '#FF9F43',
    },
    {
      title: 'Train 2 disciplines',
      current: Math.min(weeklyDisciplines.size, 2),
      target: 2,
      xpReward: 100,
      icon: 'flash',
      iconColor: '#54A0FF',
    },
    {
      title: 'Write a journal entry',
      current: hasJournalThisWeek ? 1 : 0,
      target: 1,
      xpReward: 75,
      icon: 'journal',
      iconColor: '#5F27CD',
    },
  ];
};

/* ─── Heatmap helpers ─── */

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAY_LABELS = ['M', '', 'W', '', 'F', '', ''];

const buildHeatmapData = (records: AttendanceRecord[]): { weeks: number[][]; monthLabels: { label: string; weekIndex: number }[] } => {
  const today = new Date();
  const totalWeeks = 16; // ~4 months
  const totalDays = totalWeeks * 7;

  // Build a map of date -> class count
  const dateCounts: Record<string, number> = {};
  for (const record of records) {
    const d = new Date(record.checkedInAt);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    dateCounts[key] = (dateCounts[key] ?? 0) + 1;
  }

  // Build weeks grid (columns = weeks, rows = days Mon-Sun)
  const weeks: number[][] = [];
  const monthLabels: { label: string; weekIndex: number }[] = [];
  let lastMonth = -1;

  for (let w = 0; w < totalWeeks; w++) {
    const week: number[] = [];
    for (let d = 0; d < 7; d++) {
      const dayOffset = totalDays - ((totalWeeks - w - 1) * 7 + (6 - d));
      const date = new Date(today);
      date.setDate(today.getDate() - (totalDays - dayOffset));

      // Month label tracking
      if (date.getMonth() !== lastMonth) {
        lastMonth = date.getMonth();
        monthLabels.push({ label: MONTH_LABELS[date.getMonth()], weekIndex: w });
      }

      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      const isFuture = date > today;
      week.push(isFuture ? -1 : (dateCounts[key] ?? 0));
    }
    weeks.push(week);
  }

  return { weeks, monthLabels };
};

const getCellColor = (count: number): string => {
  if (count < 0) return 'transparent'; // future
  if (count === 0) return colors.heatmap.empty;
  if (count === 1) return colors.heatmap.light;
  if (count === 2) return colors.heatmap.medium;
  return colors.heatmap.hot;
};

/* ─── Monthly challenge helper ─── */

const getMonthlyChallenge = (records: AttendanceRecord[]) => {
  const now = new Date();
  const monthName = now.toLocaleString('en-US', { month: 'long' });
  const thisMonthClasses = records.filter((r) => {
    const d = new Date(r.checkedInAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const target = 12; // 12 classes per month = ~3 per week
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = daysInMonth - now.getDate();

  return { monthName, current: Math.min(thisMonthClasses, target), target, daysLeft };
};

const CELL_SIZE = 14;
const CELL_GAP = 3;

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<DashboardNavProp>();
  const dispatch = useDispatch<AppDispatch>();
  const theme = useTheme();

  const user = useSelector((state: RootState) => state.auth.user);
  const { records, isLoading: attendanceLoading } = useSelector(
    (state: RootState) => state.attendance,
  );
  const { streak, isLoadingStreak, quests: apiQuests } = useSelector(
    (state: RootState) => state.gamification,
  );

  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    dispatch(fetchHistory());
    dispatch(fetchStreak());
    dispatch(fetchQuests());
  }, [dispatch]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      dispatch(fetchHistory()),
      dispatch(fetchStreak()),
      dispatch(fetchQuests()),
    ]);
    setRefreshing(false);
  };

  // Computed data
  const gymCopy = useGymCopy();
  const activeGym = useSelector((state: RootState) =>
    state.gym.gyms.find((g) => g.id === state.gym.activeGymId),
  );
  const recentRecords = records.slice(0, 5);
  const firstName = user?.name?.split(' ')[0] ?? 'Athlete';
  const totalXp = user?.totalXp ?? 0;
  const XP_PER_LEVEL = 500;
  const currentLevel = Math.floor(totalXp / XP_PER_LEVEL) + 1;
  const xpInLevel = totalXp % XP_PER_LEVEL;
  const nextLevelXp = XP_PER_LEVEL;
  const league = calculateLeague(totalXp, gymCopy.leagueLadder);

  // Weekly quest data
  const weeklyData = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    const dayOfWeek = now.getDay();
    startOfWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    startOfWeek.setHours(0, 0, 0, 0);

    const weekRecords = records.filter((r) => new Date(r.checkedInAt) >= startOfWeek);
    const disciplines = new Set(weekRecords.map((r) => r.discipline));
    return { count: weekRecords.length, disciplines };
  }, [records]);

  // Use API quests when available, fall back to local calculation
  const weeklyQuests = useMemo(() => {
    if (apiQuests.length > 0) {
      return apiQuests.map((q) => {
        const threshold = (q.quest.criteriaJson['threshold'] as number) ?? 1;
        return {
          title: q.quest.name,
          current: Math.min(q.progress, threshold),
          target: threshold,
          xpReward: q.quest.xpReward,
          icon: q.quest.type === 'weekly' ? 'flame' as const : 'trophy' as const,
          iconColor: q.quest.type === 'weekly' ? '#FF9F43' : '#54A0FF',
        };
      });
    }
    return buildWeeklyQuests(activeGym?.slug, weeklyData.count, weeklyData.disciplines, false);
  }, [apiQuests, weeklyData, activeGym?.slug]);
  const completedQuests = weeklyQuests.filter((q) => q.current >= q.target).length;

  // Heatmap
  const heatmap = useMemo(() => buildHeatmapData(records), [records]);

  // Monthly challenge
  const monthly = useMemo(() => getMonthlyChallenge(records), [records]);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.secondaryColor,
    },
    scrollContent: {
      padding: spacing.base,
      paddingBottom: spacing['3xl'],
    },
    greetingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.xl,
    },
    greetingSection: {
      flex: 1,
      gap: spacing.xs,
    },
    greeting: {
      fontFamily: 'Inter',
      fontSize: fonts.size.base,
      color: theme.textMuted,
    },
    greetingName: {
      fontFamily: 'BebasNeue',
      fontSize: fonts.size['3xl'],
      color: theme.textPrimary,
      letterSpacing: fonts.letterSpacing.wide * 40,
      lineHeight: 44,
    },
    statsRow: {
      flexDirection: 'row',
      gap: spacing.md,
      marginBottom: spacing.base,
    },
    streakCard: {
      flex: 1,
      gap: spacing.sm,
    },
    xpCard: {
      flex: 1.5,
      gap: spacing.sm,
    },
    streakSubtext: {
      fontFamily: 'Inter',
      fontSize: fonts.size.xs,
      color: theme.textMuted,
    },
    totalXpText: {
      fontFamily: 'Inter',
      fontSize: fonts.size.xs,
      color: theme.textMuted,
      textAlign: 'right',
    },
    checkInButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.primaryColor,
      borderRadius: borderRadius.xl,
      padding: spacing.base,
      marginBottom: spacing.xl,
      gap: spacing.md,
    },
    checkInTextContainer: {
      flex: 1,
    },
    checkInTitle: {
      fontFamily: 'BebasNeue',
      fontSize: fonts.size.lg,
      color: theme.secondaryColor,
      letterSpacing: fonts.letterSpacing.wide * 20,
    },
    checkInSubtext: {
      fontFamily: 'Inter',
      fontSize: fonts.size.xs,
      color: 'rgba(30, 30, 30, 0.7)',
    },
    journalButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surfaceColor,
      borderRadius: borderRadius.xl,
      padding: spacing.base,
      marginBottom: spacing.xl,
      gap: spacing.md,
      borderWidth: 1,
      borderColor: colors.borderDark,
    },
    journalButtonTitle: {
      fontFamily: 'BebasNeue',
      fontSize: fonts.size.md,
      color: theme.textPrimary,
      letterSpacing: fonts.letterSpacing.wide * 18,
    },
    journalButtonSubtext: {
      fontFamily: 'Inter',
      fontSize: fonts.size.xs,
      color: theme.textMuted,
    },

    /* ─── Section headers ─── */
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
      marginTop: spacing.md,
    },
    sectionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    sectionTitle: {
      fontFamily: 'Inter',
      fontSize: fonts.size.xs,
      fontWeight: fonts.weight.semibold,
      color: theme.textMuted,
      letterSpacing: fonts.letterSpacing.widest * 11,
      textTransform: 'uppercase',
    },
    sectionCount: {
      fontFamily: 'Inter',
      fontSize: fonts.size.xs,
      color: theme.textMuted,
    },

    /* ─── Weekly Quests ─── */
    questsCard: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.base,
      gap: 0,
    },
    questRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.md,
    },
    questIconContainer: {
      width: 36,
      height: 36,
      borderRadius: borderRadius.lg,
      justifyContent: 'center',
      alignItems: 'center',
    },
    questInfo: {
      flex: 1,
      gap: spacing.xs,
    },
    questTitle: {
      fontFamily: 'Inter',
      fontSize: fonts.size.sm,
      fontWeight: fonts.weight.semibold,
      color: theme.textPrimary,
    },
    questTitleComplete: {
      color: theme.textMuted,
      textDecorationLine: 'line-through',
    },
    questProgressBarBg: {
      height: 20,
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderRadius: borderRadius.full,
      overflow: 'hidden',
      justifyContent: 'center',
    },
    questProgressBarFill: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      borderRadius: borderRadius.full,
    },
    questProgressText: {
      fontFamily: 'Inter',
      fontSize: fonts.size.xs,
      fontWeight: fonts.weight.bold,
      color: theme.textPrimary,
      textAlign: 'center',
    },
    questReward: {
      alignItems: 'center',
      minWidth: 40,
    },
    questXp: {
      fontFamily: 'Inter',
      fontSize: fonts.size.xs,
      fontWeight: fonts.weight.bold,
      color: theme.primaryColor,
    },
    questDivider: {
      height: 1,
      backgroundColor: colors.borderDark,
    },

    /* ─── Monthly Challenge ─── */
    monthlyCard: {
      borderWidth: 1,
      borderColor: theme.primaryColor + '40',
      marginTop: spacing.md,
      marginBottom: spacing.md,
    },
    monthlyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.base,
    },
    monthlyInfo: {
      flex: 1,
      gap: spacing.sm,
    },
    monthlyTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    monthlyTitle: {
      fontFamily: 'BebasNeue',
      fontSize: fonts.size.lg,
      color: theme.primaryColor,
      letterSpacing: fonts.letterSpacing.wide * 20,
    },
    monthlySubtext: {
      fontFamily: 'Inter',
      fontSize: fonts.size.xs,
      color: theme.textMuted,
    },
    monthlyBarBg: {
      height: 8,
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderRadius: borderRadius.full,
      overflow: 'hidden',
    },
    monthlyBarFill: {
      height: '100%',
      backgroundColor: theme.primaryColor,
      borderRadius: borderRadius.full,
    },
    monthlyProgress: {
      fontFamily: 'Inter',
      fontSize: fonts.size.xs,
      color: theme.textMuted,
    },
    monthlyProgressBold: {
      fontWeight: fonts.weight.bold,
      color: theme.primaryColor,
    },
    monthlyBadge: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.primaryColor + '1A',
      justifyContent: 'center',
      alignItems: 'center',
    },

    /* ─── Training Heatmap ─── */
    heatmapCard: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
    },
    heatmapMonthRow: {
      flexDirection: 'row',
      marginBottom: 2,
    },
    heatmapDayLabelSpacer: {
      width: 18,
    },
    heatmapRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: CELL_GAP,
    },
    heatmapDayLabel: {
      width: 18,
      alignItems: 'center',
    },
    heatmapDayText: {
      fontFamily: 'Inter',
      fontSize: 9,
      color: theme.textMuted,
    },
    heatmapCell: {
      width: CELL_SIZE,
      height: 14,
      marginRight: CELL_GAP,
    },
    heatmapCellBox: {
      width: CELL_SIZE,
      height: CELL_SIZE,
      borderRadius: 3,
      marginRight: CELL_GAP,
    },
    heatmapMonthLabel: {
      fontFamily: 'Inter',
      fontSize: 9,
      color: theme.textMuted,
    },
    heatmapLegend: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 4,
      marginTop: spacing.sm,
    },
    heatmapLegendText: {
      fontFamily: 'Inter',
      fontSize: 9,
      color: theme.textMuted,
    },
    heatmapLegendBox: {
      width: 10,
      height: 10,
      borderRadius: 2,
    },

    /* ─── Recent classes ─── */
    attendanceCard: {
      marginBottom: spacing.sm,
    },
    attendanceRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    attendanceInfo: {
      flex: 1,
      gap: 2,
    },
    className: {
      fontFamily: 'Inter',
      fontSize: fonts.size.base,
      fontWeight: fonts.weight.semibold,
      color: theme.textPrimary,
    },
    discipline: {
      fontFamily: 'Inter',
      fontSize: fonts.size.sm,
      color: theme.textMuted,
    },
    attendanceMeta: {
      alignItems: 'flex-end',
      gap: 2,
    },
    xpEarned: {
      fontFamily: 'Inter',
      fontSize: fonts.size.sm,
      fontWeight: fonts.weight.bold,
      color: theme.primaryColor,
    },
    dateText: {
      fontFamily: 'Inter',
      fontSize: fonts.size.xs,
      color: theme.textMuted,
    },
    leagueBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      backgroundColor: theme.primaryColor + '14',
      paddingVertical: 4,
      paddingHorizontal: spacing.sm,
      borderRadius: borderRadius.full,
    },
    leagueText: {
      fontFamily: 'Inter',
      fontSize: fonts.size.xs,
      fontWeight: fonts.weight.semibold as any,
      textTransform: 'uppercase',
      letterSpacing: fonts.letterSpacing.wider * 11,
    },
    emptyText: {
      fontFamily: 'Inter',
      fontSize: fonts.size.sm,
      color: theme.textMuted,
      textAlign: 'center',
      lineHeight: 20,
    },
  }), [theme]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primaryColor}
          />
        }
      >
        {/* Greeting + Profile Avatar */}
        <View style={styles.greetingRow}>
          <View style={styles.greetingSection}>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.greetingName}>{firstName}</Text>
          {user && gymCopy.showBeltPicker && (
            <BeltDisplay belt={user.beltRank} stripes={user.stripes} size="small" />
          )}
          <View style={styles.leagueBadge}>
            <Ionicons name="shield" size={16} color={league.color} />
            <Text style={[styles.leagueText, { color: league.color }]}>
              {league.name.toLowerCase().includes('league') ? league.name : `${league.name} League`}
            </Text>
          </View>
          </View>
          <ProfileAvatar size={42} />
        </View>

        {/* Streak & XP Row */}
        <View style={styles.statsRow}>
          <Card style={styles.streakCard}>
            <StreakBadge
              count={streak?.currentStreak ?? user?.currentStreak ?? 0}
              isActive={streak?.isActive ?? true}
              size="large"
            />
            <Text style={styles.streakSubtext}>
              Longest: {streak?.longestStreak ?? user?.longestStreak ?? 0}
            </Text>
          </Card>

          <Card style={styles.xpCard}>
            <XpProgressBar
              currentXp={xpInLevel}
              nextLevelXp={nextLevelXp}
              level={currentLevel}
            />
            <Text style={styles.totalXpText}>
              {totalXp.toLocaleString()} total XP
            </Text>
          </Card>
        </View>

        {/* Quick Check-in Button */}
        <Pressable
          style={({ pressed }) => [
            styles.checkInButton,
            { opacity: pressed ? 0.85 : 1 },
          ]}
          onPress={() => navigation.navigate('CheckIn')}
        >
          <Ionicons name="qr-code" size={28} color={theme.secondaryColor} />
          <View style={styles.checkInTextContainer}>
            <Text style={styles.checkInTitle}>QUICK CHECK-IN</Text>
            <Text style={styles.checkInSubtext}>Scan QR or select class</Text>
          </View>
          <Ionicons name="arrow-forward" size={24} color={theme.secondaryColor} />
        </Pressable>

        {/* Add Journal Entry Button */}
        <Pressable
          style={({ pressed }) => [
            styles.journalButton,
            { opacity: pressed ? 0.85 : 1 },
          ]}
          onPress={() => navigation.navigate('Journal')}
        >
          <Ionicons name="journal" size={24} color={theme.primaryColor} />
          <View style={styles.checkInTextContainer}>
            <Text style={styles.journalButtonTitle}>ADD JOURNAL ENTRY</Text>
            <Text style={styles.journalButtonSubtext}>Reflect on your training</Text>
          </View>
          <Ionicons name="arrow-forward" size={20} color={theme.primaryColor} />
        </Pressable>

        {/* Lift Tracker — only shown for gyms with PR tracking enabled */}
        {activeGym?.prTrackingEnabled && (
          <Pressable
            style={({ pressed }) => [
              styles.journalButton,
              { opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={() => navigation.navigate('Weightlifting')}
          >
            <Ionicons name="barbell" size={24} color={theme.primaryColor} />
            <View style={styles.checkInTextContainer}>
              <Text style={styles.journalButtonTitle}>LIFT TRACKER</Text>
              <Text style={styles.journalButtonSubtext}>Log PRs, see your journey, work % of max</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color={theme.primaryColor} />
          </Pressable>
        )}

        {/* ─── Weekly Quests ─── */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="flame" size={16} color="#FF9F43" />
            <Text style={styles.sectionTitle}>WEEKLY QUESTS</Text>
          </View>
          <Text style={styles.sectionCount}>{completedQuests}/{weeklyQuests.length} done</Text>
        </View>

        <Card style={styles.questsCard}>
          {weeklyQuests.map((quest, idx) => {
            const progress = quest.target > 0 ? quest.current / quest.target : 0;
            const isComplete = quest.current >= quest.target;
            return (
              <View key={idx}>
                <View style={styles.questRow}>
                  <View style={[styles.questIconContainer, { backgroundColor: quest.iconColor + '20' }]}>
                    <Ionicons name={quest.icon} size={18} color={quest.iconColor} />
                  </View>
                  <View style={styles.questInfo}>
                    <Text style={[styles.questTitle, isComplete && styles.questTitleComplete]}>
                      {quest.title}
                    </Text>
                    <View style={styles.questProgressBarBg}>
                      <View
                        style={[
                          styles.questProgressBarFill,
                          {
                            width: `${Math.min(progress * 100, 100)}%`,
                            backgroundColor: isComplete ? colors.success : theme.primaryColor,
                          },
                        ]}
                      />
                      <Text style={styles.questProgressText}>
                        {quest.current} / {quest.target}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.questReward}>
                    {isComplete ? (
                      <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                    ) : (
                      <Text style={styles.questXp}>+{quest.xpReward}</Text>
                    )}
                  </View>
                </View>
                {idx < weeklyQuests.length - 1 && <View style={styles.questDivider} />}
              </View>
            );
          })}
        </Card>

        {/* ─── Monthly Challenge ─── */}
        <Card style={styles.monthlyCard}>
          <View style={styles.monthlyRow}>
            <View style={styles.monthlyInfo}>
              <View style={styles.monthlyTitleRow}>
                <Ionicons name="trophy" size={18} color={theme.primaryColor} />
                <Text style={styles.monthlyTitle}>{monthly.monthName} Challenge</Text>
              </View>
              <Text style={styles.monthlySubtext}>
                {monthly.current >= monthly.target
                  ? 'Challenge complete! You crushed it.'
                  : `${monthly.daysLeft} days left`}
              </Text>
              <View style={styles.monthlyBarBg}>
                <View
                  style={[
                    styles.monthlyBarFill,
                    { width: `${Math.min((monthly.current / monthly.target) * 100, 100)}%` },
                  ]}
                />
              </View>
              <Text style={styles.monthlyProgress}>
                <Text style={styles.monthlyProgressBold}>{monthly.current}</Text>
                {' / '}
                {monthly.target} classes
              </Text>
            </View>
            <View style={styles.monthlyBadge}>
              <Ionicons
                name={monthly.current >= monthly.target ? 'medal' : 'medal-outline'}
                size={40}
                color={monthly.current >= monthly.target ? theme.primaryColor : theme.textMuted}
              />
            </View>
          </View>
        </Card>

        {/* ─── Training Heatmap ─── */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="grid" size={14} color={theme.primaryColor} />
            <Text style={styles.sectionTitle}>TRAINING ACTIVITY</Text>
          </View>
          <Text style={styles.sectionCount}>{records.length} classes</Text>
        </View>

        <Card style={styles.heatmapCard}>
          {/* Month labels */}
          <View style={styles.heatmapMonthRow}>
            <View style={styles.heatmapDayLabelSpacer} />
            {heatmap.weeks.map((_, weekIdx) => {
              const label = heatmap.monthLabels.find((m) => m.weekIndex === weekIdx);
              return (
                <View key={weekIdx} style={styles.heatmapCell}>
                  {label && (
                    <Text style={styles.heatmapMonthLabel}>{label.label}</Text>
                  )}
                </View>
              );
            })}
          </View>

          {/* Grid rows (Mon through Sun) */}
          {Array.from({ length: 7 }).map((_, dayIdx) => (
            <View key={dayIdx} style={styles.heatmapRow}>
              <View style={styles.heatmapDayLabel}>
                <Text style={styles.heatmapDayText}>{DAY_LABELS[dayIdx]}</Text>
              </View>
              {heatmap.weeks.map((week, weekIdx) => (
                <View
                  key={weekIdx}
                  style={[
                    styles.heatmapCellBox,
                    { backgroundColor: getCellColor(week[dayIdx]) },
                  ]}
                />
              ))}
            </View>
          ))}

          {/* Legend */}
          <View style={styles.heatmapLegend}>
            <Text style={styles.heatmapLegendText}>Less</Text>
            {[colors.heatmap.empty, colors.heatmap.light, colors.heatmap.medium, colors.heatmap.hot].map(
              (c, i) => (
                <View key={i} style={[styles.heatmapLegendBox, { backgroundColor: c }]} />
              ),
            )}
            <Text style={styles.heatmapLegendText}>More</Text>
          </View>
        </Card>

        {/* ─── Recent Classes ─── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>RECENT CLASSES</Text>
          <Text style={styles.sectionCount}>{records.length} total</Text>
        </View>

        {recentRecords.length === 0 && !attendanceLoading ? (
          <Card>
            <Text style={styles.emptyText}>
              No classes yet. Check in to your first class to start earning XP!
            </Text>
          </Card>
        ) : (
          recentRecords.map((record: AttendanceRecord) => (
            <Card key={record.id} style={styles.attendanceCard}>
              <View style={styles.attendanceRow}>
                <View style={styles.attendanceInfo}>
                  <Text style={styles.className}>{record.className}</Text>
                  <Text style={styles.discipline}>
                    {DISCIPLINE_LABELS[record.discipline]}
                  </Text>
                </View>
                <View style={styles.attendanceMeta}>
                  <Text style={styles.xpEarned}>+{record.xpEarned} XP</Text>
                  <Text style={styles.dateText}>
                    {formatRelativeDate(record.checkedInAt)}
                  </Text>
                </View>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
