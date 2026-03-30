import React, { useEffect } from 'react';
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
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing, borderRadius } from '@training-grounds/shared';
import type { AttendanceRecord, Discipline } from '@training-grounds/shared';
import type { RootState, AppDispatch } from '../../redux/store';
import { fetchHistory } from '../../redux/slices/attendanceSlice';
import { fetchStreak } from '../../redux/slices/gamificationSlice';
import { Card } from '../../components/common/Card';
import { StreakBadge } from '../../components/common/StreakBadge';
import { XpProgressBar } from '../../components/common/XpProgressBar';
import { BeltDisplay } from '../../components/common/BeltDisplay';
import type { MainTabParamList } from '../../navigation/MainTabs';

type DashboardNavProp = BottomTabNavigationProp<MainTabParamList, 'Dashboard'>;

const DISCIPLINE_LABELS: Record<Discipline, string> = {
  'bjj-gi': 'BJJ Gi',
  'bjj-nogi': 'BJJ No-Gi',
  'muay-thai': 'Muay Thai',
  wrestling: 'Wrestling',
  mma: 'MMA',
  boxing: 'Boxing',
  'open-mat': 'Open Mat',
};

const calculateLeague = (xp: number): { name: string; color: string } => {
  if (xp >= 50000) return { name: 'Black Belt Elite', color: colors.league.blackBelt };
  if (xp >= 25000) return { name: 'Diamond', color: colors.league.diamond };
  if (xp >= 10000) return { name: 'Platinum', color: colors.league.platinum };
  if (xp >= 5000) return { name: 'Gold', color: colors.league.gold };
  if (xp >= 2000) return { name: 'Silver', color: colors.league.silver };
  return { name: 'Bronze', color: colors.league.bronze };
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

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<DashboardNavProp>();
  const dispatch = useDispatch<AppDispatch>();

  const user = useSelector((state: RootState) => state.auth.user);
  const { records, isLoading: attendanceLoading } = useSelector(
    (state: RootState) => state.attendance,
  );
  const { streak, isLoadingStreak } = useSelector(
    (state: RootState) => state.gamification,
  );

  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    dispatch(fetchHistory());
    dispatch(fetchStreak());
  }, [dispatch]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([dispatch(fetchHistory()), dispatch(fetchStreak())]);
    setRefreshing(false);
  };

  const recentRecords = records.slice(0, 5);
  const firstName = user?.name?.split(' ')[0] ?? 'Athlete';

  // XP level calculation (every 500 XP = 1 level)
  const totalXp = user?.totalXp ?? 0;
  const XP_PER_LEVEL = 500;
  const currentLevel = Math.floor(totalXp / XP_PER_LEVEL) + 1;
  const xpInLevel = totalXp % XP_PER_LEVEL;
  const nextLevelXp = XP_PER_LEVEL;
  const league = calculateLeague(totalXp);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.warmAccent}
          />
        }
      >
        {/* Greeting */}
        <View style={styles.greetingSection}>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.greetingName}>{firstName}</Text>
          {user && (
            <BeltDisplay belt={user.beltRank} stripes={user.stripes} size="small" />
          )}
          <View style={styles.leagueBadge}>
            <Ionicons name="shield" size={16} color={league.color} />
            <Text style={[styles.leagueText, { color: league.color }]}>
              {league.name} League
            </Text>
          </View>
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
          <Ionicons name="qr-code" size={28} color={colors.charcoal} />
          <View style={styles.checkInTextContainer}>
            <Text style={styles.checkInTitle}>QUICK CHECK-IN</Text>
            <Text style={styles.checkInSubtext}>Scan QR or select class</Text>
          </View>
          <Ionicons name="arrow-forward" size={24} color={colors.charcoal} />
        </Pressable>

        {/* Recent Attendance */}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.charcoal,
  },
  scrollContent: {
    padding: spacing.base,
    paddingBottom: spacing['3xl'],
  },
  greetingSection: {
    marginBottom: spacing.xl,
    gap: spacing.xs,
  },
  greeting: {
    fontFamily: 'Inter',
    fontSize: fonts.size.base,
    color: colors.steel,
  },
  greetingName: {
    fontFamily: 'BebasNeue',
    fontSize: fonts.size['3xl'],
    color: colors.offWhite,
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
    color: colors.steel,
  },
  totalXpText: {
    fontFamily: 'Inter',
    fontSize: fonts.size.xs,
    color: colors.steel,
    textAlign: 'right',
  },
  checkInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warmAccent,
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
    color: colors.charcoal,
    letterSpacing: fonts.letterSpacing.wide * 20,
  },
  checkInSubtext: {
    fontFamily: 'Inter',
    fontSize: fonts.size.xs,
    color: 'rgba(30, 30, 30, 0.7)',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: 'Inter',
    fontSize: fonts.size.xs,
    fontWeight: fonts.weight.semibold,
    color: colors.steel,
    letterSpacing: fonts.letterSpacing.widest * 11,
    textTransform: 'uppercase',
  },
  sectionCount: {
    fontFamily: 'Inter',
    fontSize: fonts.size.xs,
    color: colors.textMuted,
  },
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
    color: colors.offWhite,
  },
  discipline: {
    fontFamily: 'Inter',
    fontSize: fonts.size.sm,
    color: colors.steel,
  },
  attendanceMeta: {
    alignItems: 'flex-end',
    gap: 2,
  },
  xpEarned: {
    fontFamily: 'Inter',
    fontSize: fonts.size.sm,
    fontWeight: fonts.weight.bold,
    color: colors.warmAccent,
  },
  dateText: {
    fontFamily: 'Inter',
    fontSize: fonts.size.xs,
    color: colors.textMuted,
  },
  leagueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(201, 168, 124, 0.08)',
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
    color: colors.steel,
    textAlign: 'center',
    lineHeight: 20,
  },
});
