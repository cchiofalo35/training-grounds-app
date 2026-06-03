import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing, borderRadius } from '@training-grounds/shared';
import type { LeaderboardEntry, LeagueType, LeaderboardPeriod } from '@training-grounds/shared';
import type { AppDispatch, RootState } from '../../redux/store';
import {
  fetchLeaderboard,
  setSelectedLeague,
  setSelectedPeriod,
} from '../../redux/slices/gamificationSlice';
import { Card } from '../../components/common/Card';
import { BeltDisplay } from '../../components/common/BeltDisplay';

const LEAGUE_TABS: { key: LeagueType; label: string; color: string }[] = [
  { key: 'bronze', label: 'Bronze', color: colors.league.bronze },
  { key: 'silver', label: 'Silver', color: colors.league.silver },
  { key: 'gold', label: 'Gold', color: colors.league.gold },
  { key: 'platinum', label: 'Platinum', color: colors.league.platinum },
  { key: 'diamond', label: 'Diamond', color: colors.league.diamond },
  { key: 'black-belt-elite', label: 'Black Belt', color: colors.league.blackBelt },
];

const PERIOD_TABS: { key: LeaderboardPeriod; label: string }[] = [
  { key: 'weekly', label: 'This Week' },
  { key: 'monthly', label: 'This Month' },
  { key: 'all-time', label: 'All Time' },
];

const RANK_COLORS: Record<number, string> = {
  1: '#FFD700',
  2: '#C0C0C0',
  3: '#CD7F32',
};

export const LeaderboardScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { leaderboard, selectedLeague, selectedPeriod, isLoadingLeaderboard } = useSelector(
    (state: RootState) => state.gamification,
  );
  const currentUserId = useSelector((state: RootState) => state.auth.user?.id);

  useEffect(() => {
    dispatch(fetchLeaderboard({ period: selectedPeriod, league: selectedLeague }));
  }, [dispatch, selectedLeague, selectedPeriod]);

  const handleLeagueChange = (league: LeagueType) => {
    dispatch(setSelectedLeague(league));
  };

  const handlePeriodChange = (period: LeaderboardPeriod) => {
    dispatch(setSelectedPeriod(period));
  };

  const renderEntry = ({ item }: { item: LeaderboardEntry }) => {
    const isCurrentUser = item.userId === currentUserId;
    const isTopThree = item.rank <= 3;
    const medalColor = RANK_COLORS[item.rank];

    return (
      <Card
        style={[
          styles.entryCard,
          isCurrentUser && styles.currentUserCard,
          isTopThree && styles.topThreeCard,
        ]}
      >
        <View style={styles.entryRow}>
          {/* Rank */}
          <View style={styles.rankContainer}>
            {medalColor ? (
              <Ionicons name="medal" size={24} color={medalColor} />
            ) : (
              <Text style={styles.rankNumber}>#{item.rank}</Text>
            )}
          </View>

          {/* Avatar */}
          <View
            style={[
              styles.avatar,
              { borderColor: isTopThree ? colors.warmAccent : colors.borderDark },
            ]}
          >
            <Text style={styles.avatarText}>
              {item.userName.charAt(0).toUpperCase()}
            </Text>
          </View>

          {/* Info */}
          <View style={styles.entryInfo}>
            <Text
              style={[
                styles.entryName,
                isCurrentUser && styles.currentUserName,
              ]}
            >
              {item.userName}
              {isCurrentUser ? ' (You)' : ''}
            </Text>
            <BeltDisplay belt={item.beltRank} stripes={0} size="small" />
          </View>

          {/* XP & Change */}
          <View style={styles.entryXp}>
            <Text
              style={[
                styles.xpValue,
                isTopThree && styles.xpValueGold,
              ]}
            >
              {item.xp.toLocaleString()}
            </Text>
            <Text style={styles.xpLabel}>XP</Text>
            {item.rankChange !== 0 && (
              <Text
                style={[
                  styles.rankChange,
                  item.rankChange > 0
                    ? styles.rankUp
                    : styles.rankDown,
                ]}
              >
                {item.rankChange > 0 ? `+${item.rankChange}` : item.rankChange}
              </Text>
            )}
          </View>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>LEADERBOARD</Text>
      </View>

      {/* Time Period Tabs */}
      <View style={styles.periodContainer}>
        {PERIOD_TABS.map((tab) => (
          <Pressable
            key={tab.key}
            style={[
              styles.periodTab,
              selectedPeriod === tab.key && styles.periodTabActive,
            ]}
            onPress={() => handlePeriodChange(tab.key)}
          >
            <Text
              style={[
                styles.periodText,
                selectedPeriod === tab.key && styles.periodTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* League Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContainer}
      >
        {LEAGUE_TABS.map((tab) => (
          <Pressable
            key={tab.key}
            style={[
              styles.tab,
              selectedLeague === tab.key && styles.tabActive,
              selectedLeague === tab.key && { borderBottomColor: tab.color },
            ]}
            onPress={() => handleLeagueChange(tab.key)}
          >
            <View
              style={[
                styles.tabDot,
                { backgroundColor: tab.color },
                tab.key === 'black-belt-elite' && styles.tabDotBlack,
              ]}
            />
            <Text
              style={[
                styles.tabText,
                selectedLeague === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* List */}
      {isLoadingLeaderboard ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.warmAccent} />
        </View>
      ) : (
        <FlatList
          data={leaderboard}
          keyExtractor={(item) => item.userId}
          renderItem={renderEntry}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="trophy-outline" size={48} color={colors.steel} />
              <Text style={styles.emptyText}>
                No entries yet for this league.
              </Text>
            </View>
          }
        />
      )}
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
  periodContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  periodTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.darkGrey,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  periodTabActive: {
    backgroundColor: 'rgba(201, 168, 124, 0.15)',
    borderColor: colors.warmAccent,
  },
  periodText: {
    fontFamily: 'Inter',
    fontSize: fonts.size.xs,
    fontWeight: fonts.weight.semibold,
    color: colors.steel,
    textTransform: 'uppercase',
    letterSpacing: fonts.letterSpacing.wider * 11,
  },
  periodTextActive: {
    color: colors.warmAccent,
  },
  tabsContainer: {
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomWidth: 2,
  },
  tabDot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
  },
  tabDotBlack: {
    borderWidth: 1,
    borderColor: colors.offWhite,
  },
  tabText: {
    fontFamily: 'Inter',
    fontSize: fonts.size.sm,
    color: colors.steel,
    fontWeight: fonts.weight.medium,
  },
  tabTextActive: {
    color: colors.offWhite,
    fontWeight: fonts.weight.semibold,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: spacing.base,
    gap: spacing.sm,
  },
  entryCard: {
    marginBottom: spacing.sm,
  },
  currentUserCard: {
    borderColor: colors.warmAccent,
    borderWidth: 1,
  },
  topThreeCard: {
    backgroundColor: 'rgba(201, 168, 124, 0.08)',
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rankContainer: {
    width: 36,
    alignItems: 'center',
  },
  rankNumber: {
    fontFamily: 'BebasNeue',
    fontSize: fonts.size.lg,
    color: colors.steel,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.darkGrey,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontFamily: 'BebasNeue',
    fontSize: fonts.size.md,
    color: colors.offWhite,
  },
  entryInfo: {
    flex: 1,
    gap: 2,
  },
  entryName: {
    fontFamily: 'Inter',
    fontSize: fonts.size.base,
    fontWeight: fonts.weight.semibold,
    color: colors.offWhite,
  },
  currentUserName: {
    color: colors.warmAccent,
  },
  entryXp: {
    alignItems: 'flex-end',
  },
  xpValue: {
    fontFamily: 'BebasNeue',
    fontSize: fonts.size.lg,
    color: colors.offWhite,
  },
  xpValueGold: {
    color: colors.warmAccent,
  },
  xpLabel: {
    fontFamily: 'Inter',
    fontSize: fonts.size.xs,
    color: colors.steel,
  },
  rankChange: {
    fontFamily: 'Inter',
    fontSize: fonts.size.xs,
    fontWeight: fonts.weight.bold,
    marginTop: 2,
  },
  rankUp: {
    color: colors.success,
  },
  rankDown: {
    color: colors.error,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
    gap: spacing.md,
  },
  emptyText: {
    fontFamily: 'Inter',
    fontSize: fonts.size.base,
    color: colors.steel,
  },
});
