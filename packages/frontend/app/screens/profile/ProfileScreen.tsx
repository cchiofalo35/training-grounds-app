import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  Image,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
// Lazy-loaded to avoid crash when native module isn't built yet
let ImagePicker: typeof import('expo-image-picker') | null = null;
try {
  ImagePicker = require('expo-image-picker');
} catch {
  // Native module not available — photo picking will be disabled
}
import { colors, fonts, spacing, borderRadius } from '@training-grounds/shared';
import type { UserBadge } from '@training-grounds/shared';
import type { RootState, AppDispatch } from '../../redux/store';
import { fetchStats } from '../../redux/slices/attendanceSlice';
import { fetchStreak, fetchBadges } from '../../redux/slices/gamificationSlice';
import { updateAvatar } from '../../redux/slices/authSlice';
import { useAuth } from '../../hooks/useAuth';
import { useGym } from '../../contexts/GymContext';
import { Card } from '../../components/common/Card';
import { BeltDisplay } from '../../components/common/BeltDisplay';
import { useGymCopy } from '../../utils/gymCopy';
import { StreakBadge } from '../../components/common/StreakBadge';
import { Button } from '../../components/common/Button';
import { useTheme } from '../../contexts/ThemeContext';

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
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  const theme = useTheme();
  const gymCopy = useGymCopy();
  const { user, logout } = useAuth();
  const { stats } = useSelector((state: RootState) => state.attendance);
  const { streak, badges } = useSelector((state: RootState) => state.gamification);

  useEffect(() => {
    dispatch(fetchStats());
    dispatch(fetchStreak());
    dispatch(fetchBadges());
  }, [dispatch]);

  const handlePickPhoto = async () => {
    if (!ImagePicker) {
      Alert.alert('Not Available', 'Photo picker requires a new build. It will work in the TestFlight version.');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Needed',
        'Please allow photo library access to update your profile picture.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      // Dispatch the avatar update action
      dispatch(updateAvatar(result.assets[0].uri));
    }
  };

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.secondaryColor,
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
    avatarContainer: {
      position: 'relative',
      marginBottom: spacing.sm,
    },
    avatarLarge: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: theme.surfaceColor,
      borderWidth: 3,
      borderColor: theme.primaryColor,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarImage: {
      width: 96,
      height: 96,
      borderRadius: 48,
      borderWidth: 3,
      borderColor: theme.primaryColor,
    },
    avatarText: {
      fontFamily: 'BebasNeue',
      fontSize: fonts.size['3xl'],
      color: theme.textPrimary,
    },
    editBadge: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: theme.primaryColor,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: theme.secondaryColor,
    },
    userName: {
      fontFamily: 'BebasNeue',
      fontSize: fonts.size['2xl'],
      color: theme.textPrimary,
      letterSpacing: fonts.letterSpacing.wide * 32,
    },
    roleTag: {
      fontFamily: 'Inter',
      fontSize: fonts.size.xs,
      color: theme.primaryColor,
      fontWeight: fonts.weight.semibold,
      letterSpacing: fonts.letterSpacing.wider * 11,
      textTransform: 'uppercase',
      backgroundColor: theme.primaryColor + '1F',
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
      color: theme.textPrimary,
    },
    statLabel: {
      fontFamily: 'Inter',
      fontSize: fonts.size.xs,
      color: theme.textMuted,
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
      color: theme.textMuted,
    },
    // Badges
    sectionHeader: {
      marginBottom: spacing.md,
    },
    sectionTitle: {
      fontFamily: 'Inter',
      fontSize: fonts.size.xs,
      fontWeight: fonts.weight.semibold,
      color: theme.textMuted,
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
      color: theme.textMuted,
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
      backgroundColor: theme.primaryColor + '1F',
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
      color: theme.textPrimary,
      textAlign: 'center',
    },
    badgeDescription: {
      fontFamily: 'Inter',
      fontSize: fonts.size.xs,
      color: theme.textMuted,
      textAlign: 'center',
    },
    // Logout
    logoutButton: {
      marginTop: spacing['2xl'],
    },
  }), [theme]);

  if (!user) return null;

  const initial = user.name?.charAt(0).toUpperCase() ?? '?';
  const hasPhoto = !!user.avatarUrl;

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
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Header with Photo */}
        <View style={styles.profileHeader}>
          <Pressable onPress={handlePickPhoto} style={styles.avatarContainer}>
            {hasPhoto ? (
              <Image source={{ uri: user.avatarUrl! }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarLarge}>
                <Text style={styles.avatarText}>{initial}</Text>
              </View>
            )}
            <View style={styles.editBadge}>
              <Ionicons name="camera" size={14} color={theme.textPrimary} />
            </View>
          </Pressable>
          <Text style={styles.userName}>{user.name}</Text>
          {gymCopy.showBeltPicker && (
            <BeltDisplay
              belt={user.beltRank}
              stripes={user.stripes}
              size="large"
            />
          )}
          <Text style={styles.roleTag}>
            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {statCards.map((stat) => (
            <Card key={stat.label} style={styles.statCard}>
              <Ionicons name={stat.icon} size={24} color={theme.primaryColor} />
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
              <Ionicons name="ribbon-outline" size={32} color={theme.textMuted} />
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
                    color={theme.primaryColor}
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
    </View>
  );
};
