import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing, borderRadius } from '@training-grounds/shared';
import type { UserBadge } from '@training-grounds/shared';
import type { RootState, AppDispatch } from '../../redux/store';
import { fetchStats } from '../../redux/slices/attendanceSlice';
import { fetchStreak, fetchBadges } from '../../redux/slices/gamificationSlice';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../../components/common/Card';
import { BeltDisplay } from '../../components/common/BeltDisplay';
import { StreakBadge } from '../../components/common/StreakBadge';
import { Button } from '../../components/common/Button';

const BADGE_ICONS: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  attendance: 'fitness-outline',
  discipline: 'school-outline',
  competition: 'trophy-outline',
  social: 'people-outline',
  secret: 'eye-outline',
};

const formatJoinDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

export const ProfileScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, logout } = useAuth();
  const { stats } = useSelector((state: RootState) => state.attendance);
  const { streak, badges } = useSelector((state: RootState) => state.gamification);

  useEffect(() => {
    dispatch(fetchStats());
    dispatch(fetchStreak());
    dispatch(fetchBadges());
  }, [dispatch]);

  if (!user) return null;

  const statCards: { label: string; value: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
    {
      label: 'Total XP',
      value: user.totalXp.toLocaleString(),
      icon: 'flash',
    },
    {
      label: 'Current Streak',
      value: `${streak?.currentStreak ?? user.currentStreak}`,
      icon: 'flame',
    },
    {
      label: 'Classes This Month',
      value: `${stats.classesThisMonth}`,
      icon: 'calendar',
    },
    {
      label: 'Member Since',
      value: formatJoinDate(user.joinedAt),
      icon: 'time',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarText}>
              {user.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.userName}>{user.name}</Text>
          <BeltDisplay
            belt={user.beltRank}
            stripes={user.stripes}
            size="large"
          />
          <Text style={styles.roleTag}>
            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {statCards.map((stat) => (
            <Card key={stat.label} style={styles.statCard}>
              <Ionicons name={stat.icon} size={24} color={colors.warmAccent} />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </Card>
          ))}
        </View>

        {/* Streak Section */}
        {streak && (
          <Card style={styles.streakSection}>
            <View style={styles.streakRow}>
              <StreakBadge
                count={streak.currentStreak}
                isActive={streak.isActive}
                size="large"
              />
              <View style={styles.streakDetails}>
                <Text style={styles.streakDetailText}>
                  Longest: {streak.longestStreak} days
                </Text>
                <Text style={styles.streakDetailText}>
                  Freezes: {streak.freezesAvailable} left
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Recent Badges */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>RECENT BADGES</Text>
        </View>

        {badges.length === 0 ? (
          <Card>
            <View style={styles.emptyBadges}>
              <Ionicons name="ribbon-outline" size={32} color={colors.steel} />
              <Text style={styles.emptyText}>
                Keep training to earn your first badge!
              </Text>
            </View>
          </Card>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.badgeList}
          >
            {badges.map((ub) => (
              <Card key={ub.id} style={styles.badgeCard}>
                <View style={styles.badgeIconContainer}>
                  <Ionicons
                    name={BADGE_ICONS[ub.badge.category] ?? 'ribbon'}
                    size={28}
                    color={colors.warmAccent}
                  />
                </View>
                <Text style={styles.badgeName}>{ub.badge.name}</Text>
                <Text style={styles.badgeDescription}>
                  {ub.badge.description}
                </Text>
              </Card>
            ))}
          </ScrollView>
        )}

        {/* Logout */}
        <Button
          title="Sign Out"
          onPress={logout}
          variant="outline"
          style={styles.logoutButton}
        />
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
  // Profile Header
  profileHeader: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    gap: spacing.sm,
  },
  avatarLarge: {
    width: 88,
    height: 88,
    borderRadius: borderRadius.full,
    backgroundColor: colors.darkGrey,
    borderWidth: 3,
    borderColor: colors.warmAccent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatarText: {
    fontFamily: 'BebasNeue',
    fontSize: fonts.size['3xl'],
    color: colors.offWhite,
  },
  userName: {
    fontFamily: 'BebasNeue',
    fontSize: fonts.size['2xl'],
    color: colors.offWhite,
    letterSpacing: fonts.letterSpacing.wide * 32,
  },
  roleTag: {
    fontFamily: 'Inter',
    fontSize: fonts.size.xs,
    color: colors.warmAccent,
    fontWeight: fonts.weight.semibold,
    letterSpacing: fonts.letterSpacing.wider * 11,
    textTransform: 'uppercase',
    backgroundColor: 'rgba(201, 168, 124, 0.12)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginTop: spacing.xs,
  },
  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    width: '47%',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.lg,
  },
  statValue: {
    fontFamily: 'BebasNeue',
    fontSize: fonts.size.xl,
    color: colors.offWhite,
  },
  statLabel: {
    fontFamily: 'Inter',
    fontSize: fonts.size.xs,
    color: colors.steel,
    fontWeight: fonts.weight.medium,
    textTransform: 'uppercase',
    letterSpacing: fonts.letterSpacing.widest * 11,
  },
  // Streak
  streakSection: {
    marginBottom: spacing.xl,
  },
  streakRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  streakDetails: {
    alignItems: 'flex-end',
    gap: 4,
  },
  streakDetailText: {
    fontFamily: 'Inter',
    fontSize: fonts.size.sm,
    color: colors.steel,
  },
  // Badges
  sectionHeader: {
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
  emptyBadges: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  emptyText: {
    fontFamily: 'Inter',
    fontSize: fonts.size.sm,
    color: colors.steel,
    textAlign: 'center',
  },
  badgeList: {
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  badgeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(201, 168, 124, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  badgeCard: {
    width: 140,
    alignItems: 'center',
    gap: spacing.xs,
  },
  badgeName: {
    fontFamily: 'Inter',
    fontSize: fonts.size.sm,
    fontWeight: fonts.weight.bold,
    color: colors.offWhite,
    textAlign: 'center',
  },
  badgeDescription: {
    fontFamily: 'Inter',
    fontSize: fonts.size.xs,
    color: colors.steel,
    textAlign: 'center',
  },
  // Logout
  logoutButton: {
    marginTop: spacing['2xl'],
  },
});
