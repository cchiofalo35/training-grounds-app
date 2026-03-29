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
import { colors, fonts, spacing, borderRadius } from '@training-grounds/shared';
import type { LeaderboardEntry, LeagueType, BeltRank } from '@training-grounds/shared';
import type { AppDispatch, RootState } from '../../redux/store';
import {
  fetchLeaderboard,
  setSelectedLeague,
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

const RANK_MEDALS: Record<number, string> = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
};

export const LeaderboardScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { leaderboard, selectedLeague, isLoadingLeaderboard } = useSelector(
    (state: RootState) => state.gamification,
  );
  const currentUserId = useSelector((state: RootState) => state.auth.user?.id);

  useEffect(() => {
    dispatch(fetchLeaderboard(selectedLeague));
  }, [dispatch, selectedLeague]);

  const handleLeagueChange = (league: LeagueType) => {
    dispatch(setSelectedLeague(league));
  };

  const renderEntry = ({ item }: { item: LeaderboardEntry }) => {
    const isCurrentUser = item.userId === currentUserId;
    const isTopThree = item.rank <= 3;
    const medal = RANK_MEDALS[item.rank];

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
            {medal ? (
              <Text style={styles.medal}>{medal}</Text>
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
              <Text style={styles.emptyIcon}>🏆</Text>
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
  medal: {
    fontSize: 22,
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
  emptyIcon: {
    fontSize: 48,
  },
  emptyText: {
    fontFamily: 'Inter',
    fontSize: fonts.size.base,
    color: colors.steel,
  },
});
