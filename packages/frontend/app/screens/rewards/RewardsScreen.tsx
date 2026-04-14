import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing, borderRadius } from '@training-grounds/shared';
import type { BadgeCatalogEntry, BadgeCategory, XpGuide } from '@training-grounds/shared';
import type { AppDispatch, RootState } from '../../redux/store';
import {
  fetchBadgeCatalog,
  fetchXpGuide,
  fetchLeaderboard,
} from '../../redux/slices/gamificationSlice';
import { Card } from '../../components/common/Card';

const BADGE_CATEGORY_LABELS: Record<BadgeCategory, string> = {
  attendance: 'Attendance',
  discipline: 'Discipline',
  competition: 'Competition',
  social: 'Social',
  secret: 'Secret',
};

const BADGE_CATEGORY_ICONS: Record<BadgeCategory, string> = {
  attendance: 'calendar',
  discipline: 'fitness',
  competition: 'trophy',
  social: 'people',
  secret: 'eye-off',
};

const CATEGORY_ORDER: BadgeCategory[] = [
  'attendance',
  'discipline',
  'competition',
  'social',
  'secret',
];

const STREAK_MILESTONES = [
  { days: 7, label: '7-Day Streak', reward: '7-Day Warrior Badge + 1 Freeze', icon: 'flame' },
  { days: 30, label: '30-Day Streak', reward: '+200 XP + 2 Freezes', icon: 'star' },
  { days: 60, label: '60-Day Streak', reward: '+300 XP + 2 Freezes', icon: 'diamond' },
  { days: 100, label: '100-Day Streak', reward: '+500 XP + 3 Freezes', icon: 'ribbon' },
  { days: 365, label: '365-Day Streak', reward: '+2000 XP + Ambassador Status', icon: 'medal' },
];

type TabKey = 'badges' | 'xp' | 'milestones';

export const RewardsScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { badgeCatalog, isLoadingCatalog, xpGuide } = useSelector(
    (state: RootState) => state.gamification,
  );
  const streak = useSelector((state: RootState) => state.gamification.streak);
  const [activeTab, setActiveTab] = useState<TabKey>('badges');
  const [selectedCategory, setSelectedCategory] = useState<BadgeCategory | 'all'>('all');

  useEffect(() => {
    dispatch(fetchBadgeCatalog());
    dispatch(fetchXpGuide());
  }, [dispatch]);

  const filteredBadges =
    selectedCategory === 'all'
      ? badgeCatalog
      : badgeCatalog.filter((b) => b.category === selectedCategory);

  const earnedCount = badgeCatalog.filter((b) => b.earned).length;
  const currentStreak = streak?.currentStreak ?? 0;

  const renderBadge = ({ item }: { item: BadgeCatalogEntry }) => (
    <View
      style={[
        styles.badgeCard,
        item.earned && styles.badgeCardEarned,
        !item.earned && styles.badgeCardLocked,
      ]}
    >
      <View style={styles.badgeIconContainer}>
        <Ionicons
          name={item.earned ? 'shield-checkmark' : 'lock-closed'}
          size={32}
          color={item.earned ? colors.warmAccent : colors.steel}
        />
      </View>
      <Text style={[styles.badgeName, !item.earned && styles.badgeNameLocked]} numberOfLines={2}>
        {item.name}
      </Text>
      <Text style={styles.badgeDescription} numberOfLines={2}>
        {item.description}
      </Text>
      {item.earned && item.earnedAt && (
        <Text style={styles.badgeDate}>
          {new Date(item.earnedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </Text>
      )}
      {!item.earned && <Text style={styles.badgeLocked}>LOCKED</Text>}
    </View>
  );

  const renderBadgesTab = () => (
    <View>
      {/* Summary */}
      <View style={styles.summaryRow}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{earnedCount}</Text>
          <Text style={styles.summaryLabel}>EARNED</Text>
        </Card>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{badgeCatalog.length}</Text>
          <Text style={styles.summaryLabel}>TOTAL</Text>
        </Card>
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
      >
        <Pressable
          style={[
            styles.categoryChip,
            selectedCategory === 'all' && styles.categoryChipActive,
          ]}
          onPress={() => setSelectedCategory('all')}
        >
          <Text
            style={[
              styles.categoryChipText,
              selectedCategory === 'all' && styles.categoryChipTextActive,
            ]}
          >
            All
          </Text>
        </Pressable>
        {CATEGORY_ORDER.map((cat) => (
          <Pressable
            key={cat}
            style={[
              styles.categoryChip,
              selectedCategory === cat && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Ionicons
              name={BADGE_CATEGORY_ICONS[cat] as never}
              size={14}
              color={selectedCategory === cat ? colors.warmAccent : colors.steel}
            />
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === cat && styles.categoryChipTextActive,
              ]}
            >
              {BADGE_CATEGORY_LABELS[cat]}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Badge Grid */}
      {isLoadingCatalog ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.warmAccent} />
        </View>
      ) : (
        <View style={styles.badgeGrid}>
          {filteredBadges.map((badge) => (
            <View key={badge.id} style={styles.badgeGridItem}>
              {renderBadge({ item: badge })}
            </View>
          ))}
          {filteredBadges.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="ribbon-outline" size={48} color={colors.steel} />
              <Text style={styles.emptyText}>No badges in this category yet.</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );

  const renderXpTab = () => (
    <View style={styles.xpContainer}>
      <Card style={styles.xpCard}>
        <Text style={styles.sectionTitle}>HOW TO EARN XP</Text>
        {xpGuide ? (
          xpGuide.actions.map((action, i) => (
            <View
              key={i}
              style={[
                styles.xpRow,
                i < xpGuide.actions.length - 1 && styles.xpRowBorder,
              ]}
            >
              <View style={styles.xpRowLeft}>
                <Text style={styles.xpAction}>{action.action}</Text>
                <Text style={styles.xpDescription}>{action.description}</Text>
              </View>
              <Text style={styles.xpValue}>+{action.xp} XP</Text>
            </View>
          ))
        ) : (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.warmAccent} />
          </View>
        )}
      </Card>

      <Card style={styles.xpCard}>
        <Text style={styles.sectionTitle}>STREAK MULTIPLIERS</Text>
        {xpGuide?.streakMultipliers.map((item, i) => (
          <View
            key={i}
            style={[
              styles.xpRow,
              i < (xpGuide.streakMultipliers.length) - 1 && styles.xpRowBorder,
            ]}
          >
            <Text style={styles.xpAction}>{item.streak}+ day streak</Text>
            <Text style={styles.multiplierValue}>{item.multiplier}x</Text>
          </View>
        ))}
      </Card>
    </View>
  );

  const renderMilestonesTab = () => (
    <View style={styles.milestonesContainer}>
      {STREAK_MILESTONES.map((milestone, i) => {
        const achieved = currentStreak >= milestone.days;
        return (
          <Card
            key={i}
            style={[
              styles.milestoneCard,
              achieved && styles.milestoneCardAchieved,
            ]}
          >
            <View style={styles.milestoneRow}>
              <View
                style={[
                  styles.milestoneIconCircle,
                  achieved && styles.milestoneIconCircleAchieved,
                ]}
              >
                <Ionicons
                  name={milestone.icon as never}
                  size={24}
                  color={achieved ? colors.warmAccent : colors.steel}
                />
              </View>
              <View style={styles.milestoneInfo}>
                <Text
                  style={[
                    styles.milestoneName,
                    achieved && styles.milestoneNameAchieved,
                  ]}
                >
                  {milestone.label}
                </Text>
                <Text style={styles.milestoneReward}>{milestone.reward}</Text>
              </View>
              <Ionicons
                name={achieved ? 'checkmark-circle' : 'lock-closed'}
                size={24}
                color={achieved ? colors.success : colors.steel}
              />
            </View>
            {!achieved && (
              <View style={styles.milestoneProgress}>
                <View style={styles.milestoneProgressBar}>
                  <View
                    style={[
                      styles.milestoneProgressFill,
                      {
                        width: `${Math.min(
                          (currentStreak / milestone.days) * 100,
                          100,
                        )}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.milestoneProgressText}>
                  {currentStreak}/{milestone.days} days
                </Text>
              </View>
            )}
          </Card>
        );
      })}
    </View>
  );

  const TABS: { key: TabKey; label: string; icon: string }[] = [
    { key: 'badges', label: 'Badges', icon: 'ribbon' },
    { key: 'xp', label: 'XP Guide', icon: 'flash' },
    { key: 'milestones', label: 'Milestones', icon: 'flag' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>REWARDS & BADGES</Text>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <Pressable
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && styles.tabActive,
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons
              name={tab.icon as never}
              size={16}
              color={activeTab === tab.key ? colors.warmAccent : colors.steel}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'badges' && renderBadgesTab()}
        {activeTab === 'xp' && renderXpTab()}
        {activeTab === 'milestones' && renderMilestonesTab()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.charcoal,
  },
  header: {
    padding: spacing.base,
    paddingTop: spacing.lg,
    alignItems: 'center',
  },
  title: {
    fontFamily: 'BebasNeue',
    fontSize: fonts.size['2xl'],
    color: colors.offWhite,
    letterSpacing: fonts.letterSpacing.wide * 32,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.darkGrey,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  tabActive: {
    backgroundColor: 'rgba(201, 168, 124, 0.15)',
    borderColor: colors.warmAccent,
  },
  tabText: {
    fontFamily: 'Inter',
    fontSize: fonts.size.xs,
    fontWeight: fonts.weight.semibold,
    color: colors.steel,
    textTransform: 'uppercase',
    letterSpacing: fonts.letterSpacing.wider * 11,
  },
  tabTextActive: {
    color: colors.warmAccent,
  },
  scrollContent: {
    padding: spacing.base,
    paddingBottom: spacing['3xl'],
  },
  // Summary
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  summaryValue: {
    fontFamily: 'BebasNeue',
    fontSize: fonts.size['2xl'],
    color: colors.warmAccent,
  },
  summaryLabel: {
    fontFamily: 'Inter',
    fontSize: fonts.size.xs,
    fontWeight: fonts.weight.semibold,
    color: colors.steel,
    letterSpacing: fonts.letterSpacing.wider * 11,
    marginTop: 2,
  },
  // Category chips
  categoryScroll: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.darkGrey,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  categoryChipActive: {
    backgroundColor: 'rgba(201, 168, 124, 0.15)',
    borderColor: colors.warmAccent,
  },
  categoryChipText: {
    fontFamily: 'Inter',
    fontSize: fonts.size.xs,
    fontWeight: fonts.weight.medium,
    color: colors.steel,
  },
  categoryChipTextActive: {
    color: colors.warmAccent,
  },
  // Badge Grid
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  badgeGridItem: {
    width: '48%',
  },
  badgeCard: {
    backgroundColor: colors.darkGrey,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.borderDark,
    padding: spacing.md,
    alignItems: 'center',
    minHeight: 140,
  },
  badgeCardEarned: {
    borderColor: colors.warmAccent,
    borderWidth: 2,
  },
  badgeCardLocked: {
    opacity: 0.5,
  },
  badgeIconContainer: {
    marginBottom: spacing.sm,
  },
  badgeName: {
    fontFamily: 'Inter',
    fontSize: fonts.size.sm,
    fontWeight: fonts.weight.semibold,
    color: colors.offWhite,
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeNameLocked: {
    color: colors.steel,
  },
  badgeDescription: {
    fontFamily: 'Inter',
    fontSize: fonts.size.xs,
    color: colors.steel,
    textAlign: 'center',
    lineHeight: 16,
  },
  badgeDate: {
    fontFamily: 'Inter',
    fontSize: 10,
    color: colors.warmAccent,
    textTransform: 'uppercase',
    letterSpacing: fonts.letterSpacing.wider * 10,
    marginTop: spacing.xs,
  },
  badgeLocked: {
    fontFamily: 'Inter',
    fontSize: 10,
    color: colors.steel,
    textTransform: 'uppercase',
    letterSpacing: fonts.letterSpacing.wider * 10,
    marginTop: spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
    gap: spacing.md,
  },
  emptyText: {
    fontFamily: 'Inter',
    fontSize: fonts.size.base,
    color: colors.steel,
  },
  // XP Guide
  xpContainer: {
    gap: spacing.md,
  },
  xpCard: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontFamily: 'BebasNeue',
    fontSize: fonts.size.lg,
    color: colors.offWhite,
    letterSpacing: fonts.letterSpacing.wide * 18,
  },
  xpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  xpRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDark,
  },
  xpRowLeft: {
    flex: 1,
    marginRight: spacing.md,
  },
  xpAction: {
    fontFamily: 'Inter',
    fontSize: fonts.size.sm,
    fontWeight: fonts.weight.semibold,
    color: colors.offWhite,
  },
  xpDescription: {
    fontFamily: 'Inter',
    fontSize: fonts.size.xs,
    color: colors.steel,
    marginTop: 2,
  },
  xpValue: {
    fontFamily: 'BebasNeue',
    fontSize: fonts.size.lg,
    color: colors.warmAccent,
  },
  multiplierValue: {
    fontFamily: 'BebasNeue',
    fontSize: fonts.size.lg,
    color: colors.warmAccent,
  },
  // Milestones
  milestonesContainer: {
    gap: spacing.sm,
  },
  milestoneCard: {
    gap: spacing.sm,
  },
  milestoneCardAchieved: {
    borderColor: colors.warmAccent,
    borderWidth: 2,
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  milestoneIconCircle: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.darkGrey,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  milestoneIconCircleAchieved: {
    backgroundColor: 'rgba(201, 168, 124, 0.15)',
    borderColor: colors.warmAccent,
  },
  milestoneInfo: {
    flex: 1,
  },
  milestoneName: {
    fontFamily: 'Inter',
    fontSize: fonts.size.base,
    fontWeight: fonts.weight.semibold,
    color: colors.offWhite,
  },
  milestoneNameAchieved: {
    color: colors.warmAccent,
  },
  milestoneReward: {
    fontFamily: 'Inter',
    fontSize: fonts.size.xs,
    color: colors.steel,
    marginTop: 2,
  },
  milestoneProgress: {
    marginLeft: 48 + 16,
    gap: 4,
  },
  milestoneProgressBar: {
    height: 6,
    backgroundColor: colors.darkGrey,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  milestoneProgressFill: {
    height: '100%',
    backgroundColor: colors.warmAccent,
    borderRadius: borderRadius.full,
  },
  milestoneProgressText: {
    fontFamily: 'Inter',
    fontSize: 10,
    color: colors.steel,
  },
});
