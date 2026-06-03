import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  FlatList,
  Pressable,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { colors, fonts, spacing, borderRadius } from '@training-grounds/shared';
import type { Discipline } from '@training-grounds/shared';
import type { RootState } from '../../redux/store';
import { Card } from '../../components/common/Card';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../services/api';

interface MemberResult {
  id: string;
  name: string;
  email: string;
  beltRank: string;
  totalXp: number;
  currentStreak: number;
}

interface ClassOption {
  id: string;
  name: string;
  discipline: Discipline;
  startTime: string;
}

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

const BELT_COLORS: Record<string, string> = {
  white: '#FFFFFF',
  blue: '#4A90E2',
  purple: '#8B5CF6',
  brown: '#A0522D',
  black: '#1A1A1A',
};

type CoachMode = 'search' | 'selectClass' | 'confirm' | 'success';

export const CoachCheckinScreen: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const theme = useTheme();

  const [mode, setMode] = useState<CoachMode>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MemberResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberResult | null>(null);
  const [todayClasses, setTodayClasses] = useState<ClassOption[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassOption | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [lastCheckedIn, setLastCheckedIn] = useState<{ member: string; className: string; xp: number } | null>(null);

  // Fetch today's classes on mount
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const dayOfWeek = new Date().getDay();
        const res = await api.get(`/admin/classes?dayOfWeek=${dayOfWeek}`);
        const classes = res.data.data || [];
        setTodayClasses(classes.filter((c: any) => c.isActive !== false));
      } catch {
        // Fall back to empty — coach can still type class info
      }
    };
    fetchClasses();
  }, []);

  // Debounced search
  const searchMembers = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await api.get(`/attendance/coach-checkin/search?q=${encodeURIComponent(query)}`);
      setSearchResults(res.data.data || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchMembers(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchMembers]);

  const handleSelectMember = (member: MemberResult) => {
    setSelectedMember(member);
    if (todayClasses.length > 0) {
      setMode('selectClass');
    } else {
      // No classes configured — go straight to confirm with a generic class
      setSelectedClass({ id: `manual-${Date.now()}`, name: 'Open Training', discipline: 'open-mat', startTime: '' });
      setMode('confirm');
    }
  };

  const handleSelectClass = (cls: ClassOption) => {
    setSelectedClass(cls);
    setMode('confirm');
  };

  const handleConfirmCheckin = async () => {
    if (!selectedMember || !selectedClass) return;
    setCheckingIn(true);
    try {
      const res = await api.post('/attendance/coach-checkin', {
        memberEmail: selectedMember.email,
        classId: selectedClass.id,
        className: selectedClass.name,
        discipline: selectedClass.discipline,
      });
      const xpEarned = res.data.data?.xpEarned ?? 50;
      setLastCheckedIn({ member: selectedMember.name, className: selectedClass.name, xp: xpEarned });
      setMode('success');
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Check-in failed';
      Alert.alert('Check-in Failed', msg);
    } finally {
      setCheckingIn(false);
    }
  };

  const handleReset = () => {
    setMode('search');
    setSearchQuery('');
    setSearchResults([]);
    setSelectedMember(null);
    setSelectedClass(null);
    setLastCheckedIn(null);
  };

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.secondaryColor,
    },

    // Header
    header: {
      alignItems: 'center',
      gap: spacing.xs,
      paddingTop: spacing.lg,
      paddingBottom: spacing.base,
    },
    headerTitle: {
      fontFamily: 'BebasNeue',
      fontSize: fonts.size['2xl'],
      color: theme.textPrimary,
      letterSpacing: fonts.letterSpacing.wide * 32,
    },
    headerSubtext: {
      fontFamily: 'Inter',
      fontSize: fonts.size.sm,
      color: theme.textMuted,
    },

    // Search
    searchContainer: {
      flex: 1,
      padding: spacing.base,
    },
    searchInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surfaceColor,
      borderRadius: borderRadius.xl,
      paddingHorizontal: spacing.base,
      paddingVertical: spacing.md,
      marginBottom: spacing.base,
      borderWidth: 1,
      borderColor: colors.borderDark,
    },
    searchIcon: {
      marginRight: spacing.sm,
    },
    searchInput: {
      flex: 1,
      fontFamily: 'Inter',
      fontSize: fonts.size.base,
      color: theme.textPrimary,
    },
    loader: {
      marginVertical: spacing.base,
    },
    resultsList: {
      gap: spacing.sm,
      paddingBottom: spacing['3xl'],
    },
    noResults: {
      fontFamily: 'Inter',
      fontSize: fonts.size.sm,
      color: theme.textMuted,
      textAlign: 'center',
      marginTop: spacing.xl,
    },
    hintContainer: {
      alignItems: 'center',
      marginTop: spacing['3xl'],
      gap: spacing.md,
    },
    hintText: {
      fontFamily: 'Inter',
      fontSize: fonts.size.sm,
      color: theme.textMuted,
    },

    // Member Card
    memberCard: {
      marginBottom: spacing.sm,
    },
    memberRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    beltDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
    },
    beltDotSmall: {
      width: 8,
      height: 8,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
    },
    memberInfo: {
      flex: 1,
      gap: 2,
    },
    memberName: {
      fontFamily: 'Inter',
      fontSize: fonts.size.base,
      fontWeight: fonts.weight.semibold,
      color: theme.textPrimary,
    },
    memberEmail: {
      fontFamily: 'Inter',
      fontSize: fonts.size.xs,
      color: theme.textMuted,
    },
    memberStats: {
      alignItems: 'flex-end',
      gap: 2,
    },
    memberXp: {
      fontFamily: 'Inter',
      fontSize: fonts.size.xs,
      fontWeight: fonts.weight.bold,
      color: theme.primaryColor,
    },
    memberStreak: {
      fontFamily: 'Inter',
      fontSize: fonts.size.xs,
      color: theme.textMuted,
    },

    // Select Class
    selectClassContainer: {
      flex: 1,
      padding: spacing.base,
    },
    backRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginBottom: spacing.base,
    },
    backText: {
      fontFamily: 'Inter',
      fontSize: fonts.size.base,
      color: theme.primaryColor,
    },
    sectionTitle: {
      fontFamily: 'BebasNeue',
      fontSize: fonts.size.xl,
      color: theme.textPrimary,
      letterSpacing: fonts.letterSpacing.wide * 24,
      marginBottom: spacing.sm,
    },
    selectedMemberPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: theme.primaryColor + '1A',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.base,
      borderRadius: borderRadius.full,
      alignSelf: 'flex-start',
      marginBottom: spacing.xl,
    },
    selectedMemberName: {
      fontFamily: 'Inter',
      fontSize: fonts.size.sm,
      fontWeight: fonts.weight.semibold,
      color: theme.primaryColor,
    },
    classListContent: {
      gap: spacing.sm,
      paddingBottom: spacing['3xl'],
    },
    classCard: {
      marginBottom: spacing.sm,
    },
    classRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    classInfo: {
      flex: 1,
      gap: 2,
    },
    className: {
      fontFamily: 'Inter',
      fontSize: fonts.size.base,
      fontWeight: fonts.weight.semibold,
      color: theme.textPrimary,
    },
    classDiscipline: {
      fontFamily: 'Inter',
      fontSize: fonts.size.sm,
      color: theme.textMuted,
    },
    emptyCard: {
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing['2xl'],
    },
    emptyText: {
      fontFamily: 'Inter',
      fontSize: fonts.size.sm,
      color: theme.textMuted,
      textAlign: 'center',
    },
    manualClassButton: {
      backgroundColor: theme.primaryColor,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      borderRadius: borderRadius.xl,
      marginTop: spacing.sm,
    },
    manualClassText: {
      fontFamily: 'Inter',
      fontSize: fonts.size.sm,
      fontWeight: fonts.weight.semibold,
      color: theme.secondaryColor,
    },

    // Confirm
    confirmContainer: {
      flex: 1,
      padding: spacing.base,
      justifyContent: 'center',
    },
    confirmTitle: {
      fontFamily: 'BebasNeue',
      fontSize: fonts.size['2xl'],
      color: theme.textPrimary,
      textAlign: 'center',
      letterSpacing: fonts.letterSpacing.wide * 32,
      marginBottom: spacing.xl,
    },
    confirmCard: {
      gap: spacing.md,
      marginBottom: spacing.xl,
    },
    confirmMemberRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    confirmMemberName: {
      fontFamily: 'Inter',
      fontSize: fonts.size.md,
      fontWeight: fonts.weight.bold,
      color: theme.textPrimary,
    },
    confirmMemberEmail: {
      fontFamily: 'Inter',
      fontSize: fonts.size.sm,
      color: theme.textMuted,
    },
    confirmDivider: {
      height: 1,
      backgroundColor: colors.borderDark,
    },
    confirmClassLabel: {
      fontFamily: 'Inter',
      fontSize: fonts.size.xs,
      color: theme.textMuted,
      textTransform: 'uppercase',
      letterSpacing: fonts.letterSpacing.widest * 11,
    },
    confirmClassName: {
      fontFamily: 'Inter',
      fontSize: fonts.size.lg,
      fontWeight: fonts.weight.semibold,
      color: theme.textPrimary,
    },
    confirmDiscipline: {
      fontFamily: 'Inter',
      fontSize: fonts.size.sm,
      color: theme.primaryColor,
    },
    checkInButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.primaryColor,
      borderRadius: borderRadius.xl,
      paddingVertical: spacing.base,
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    checkInButtonText: {
      fontFamily: 'BebasNeue',
      fontSize: fonts.size.lg,
      color: theme.secondaryColor,
      letterSpacing: fonts.letterSpacing.wide * 20,
    },
    cancelText: {
      fontFamily: 'Inter',
      fontSize: fonts.size.base,
      color: theme.textMuted,
      textAlign: 'center',
    },

    // Success
    successContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing['2xl'],
      gap: spacing.md,
    },
    successIconCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.success,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    successTitle: {
      fontFamily: 'BebasNeue',
      fontSize: fonts.size['3xl'],
      color: colors.success,
      letterSpacing: fonts.letterSpacing.wide * 40,
    },
    successName: {
      fontFamily: 'Inter',
      fontSize: fonts.size.xl,
      fontWeight: fonts.weight.bold,
      color: theme.textPrimary,
    },
    successClass: {
      fontFamily: 'Inter',
      fontSize: fonts.size.base,
      color: theme.textMuted,
    },
    successXpBadge: {
      backgroundColor: theme.primaryColor + '26',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.xl,
      borderRadius: borderRadius.full,
      marginTop: spacing.sm,
    },
    successXpText: {
      fontFamily: 'Inter',
      fontSize: fonts.size.lg,
      fontWeight: fonts.weight.bold,
      color: theme.primaryColor,
    },
    anotherButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.primaryColor,
      borderRadius: borderRadius.xl,
      paddingVertical: spacing.base,
      paddingHorizontal: spacing['2xl'],
      gap: spacing.sm,
      marginTop: spacing.xl,
    },
    anotherButtonText: {
      fontFamily: 'BebasNeue',
      fontSize: fonts.size.lg,
      color: theme.secondaryColor,
      letterSpacing: fonts.letterSpacing.wide * 20,
    },
  }), [theme]);

  // ─── Success Screen ───
  if (mode === 'success' && lastCheckedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIconCircle}>
            <Ionicons name="checkmark" size={48} color={theme.secondaryColor} />
          </View>
          <Text style={styles.successTitle}>CHECKED IN!</Text>
          <Text style={styles.successName}>{lastCheckedIn.member}</Text>
          <Text style={styles.successClass}>{lastCheckedIn.className}</Text>
          <View style={styles.successXpBadge}>
            <Text style={styles.successXpText}>+{lastCheckedIn.xp} XP</Text>
          </View>

          <Pressable
            style={({ pressed }) => [styles.anotherButton, { opacity: pressed ? 0.85 : 1 }]}
            onPress={handleReset}
          >
            <Ionicons name="person-add" size={20} color={theme.secondaryColor} />
            <Text style={styles.anotherButtonText}>Check In Another</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Confirm Screen ───
  if (mode === 'confirm' && selectedMember && selectedClass) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.confirmContainer}>
          <Pressable onPress={() => setMode('selectClass')} style={styles.backRow}>
            <Ionicons name="arrow-back" size={20} color={theme.primaryColor} />
            <Text style={styles.backText}>Back</Text>
          </Pressable>

          <Text style={styles.confirmTitle}>CONFIRM CHECK-IN</Text>

          <Card style={styles.confirmCard}>
            <View style={styles.confirmMemberRow}>
              <View style={[styles.beltDot, { backgroundColor: BELT_COLORS[selectedMember.beltRank] || '#666' }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.confirmMemberName}>{selectedMember.name}</Text>
                <Text style={styles.confirmMemberEmail}>{selectedMember.email}</Text>
              </View>
            </View>
            <View style={styles.confirmDivider} />
            <Text style={styles.confirmClassLabel}>CLASS</Text>
            <Text style={styles.confirmClassName}>{selectedClass.name}</Text>
            <Text style={styles.confirmDiscipline}>
              {DISCIPLINE_LABELS[selectedClass.discipline]}
              {selectedClass.startTime ? ` · ${selectedClass.startTime}` : ''}
            </Text>
          </Card>

          <Pressable
            style={({ pressed }) => [styles.checkInButton, { opacity: pressed ? 0.85 : 1 }]}
            onPress={handleConfirmCheckin}
            disabled={checkingIn}
          >
            {checkingIn ? (
              <ActivityIndicator color={theme.secondaryColor} />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={24} color={theme.secondaryColor} />
                <Text style={styles.checkInButtonText}>Confirm Check-In</Text>
              </>
            )}
          </Pressable>

          <Pressable onPress={handleReset}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Select Class Screen ───
  if (mode === 'selectClass' && selectedMember) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.selectClassContainer}>
          <Pressable onPress={() => { setMode('search'); setSelectedMember(null); }} style={styles.backRow}>
            <Ionicons name="arrow-back" size={20} color={theme.primaryColor} />
            <Text style={styles.backText}>Back</Text>
          </Pressable>

          <Text style={styles.sectionTitle}>SELECT CLASS FOR</Text>
          <View style={styles.selectedMemberPill}>
            <View style={[styles.beltDotSmall, { backgroundColor: BELT_COLORS[selectedMember.beltRank] || '#666' }]} />
            <Text style={styles.selectedMemberName}>{selectedMember.name}</Text>
          </View>

          <ScrollView contentContainerStyle={styles.classListContent}>
            {todayClasses.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Ionicons name="calendar-outline" size={32} color={theme.textMuted} />
                <Text style={styles.emptyText}>No classes scheduled for today.</Text>
                <Pressable
                  style={({ pressed }) => [styles.manualClassButton, { opacity: pressed ? 0.85 : 1 }]}
                  onPress={() => {
                    setSelectedClass({ id: `manual-${Date.now()}`, name: 'Open Training', discipline: 'open-mat', startTime: '' });
                    setMode('confirm');
                  }}
                >
                  <Text style={styles.manualClassText}>Check in to Open Training</Text>
                </Pressable>
              </Card>
            ) : (
              todayClasses.map((cls) => (
                <Pressable key={cls.id} onPress={() => handleSelectClass(cls)}>
                  <Card style={styles.classCard}>
                    <View style={styles.classRow}>
                      <View style={styles.classInfo}>
                        <Text style={styles.className}>{cls.name}</Text>
                        <Text style={styles.classDiscipline}>
                          {DISCIPLINE_LABELS[cls.discipline]}
                          {cls.startTime ? ` · ${cls.startTime}` : ''}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
                    </View>
                  </Card>
                </Pressable>
              ))
            )}
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Search Screen (default) ───
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.header}>
          <Ionicons name="people" size={24} color={theme.primaryColor} />
          <Text style={styles.headerTitle}>COACH CHECK-IN</Text>
          <Text style={styles.headerSubtext}>Search for a member to check them in</Text>
        </View>

        {/* Search Input */}
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={18} color={theme.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or email..."
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => { setSearchQuery(''); setSearchResults([]); }}>
              <Ionicons name="close-circle" size={18} color={theme.textMuted} />
            </Pressable>
          )}
        </View>

        {/* Results */}
        {searching && (
          <ActivityIndicator color={theme.primaryColor} style={styles.loader} />
        )}

        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.resultsList}
          ListEmptyComponent={
            searchQuery.length >= 2 && !searching ? (
              <Text style={styles.noResults}>No members found for "{searchQuery}"</Text>
            ) : searchQuery.length === 0 ? (
              <View style={styles.hintContainer}>
                <Ionicons name="search-outline" size={40} color={colors.borderDark} />
                <Text style={styles.hintText}>Type a name or email to search</Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <Pressable onPress={() => handleSelectMember(item)}>
              <Card style={styles.memberCard}>
                <View style={styles.memberRow}>
                  <View style={[styles.beltDot, { backgroundColor: BELT_COLORS[item.beltRank] || '#666' }]} />
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{item.name}</Text>
                    <Text style={styles.memberEmail}>{item.email}</Text>
                  </View>
                  <View style={styles.memberStats}>
                    <Text style={styles.memberXp}>{item.totalXp.toLocaleString()} XP</Text>
                    <Text style={styles.memberStreak}>{item.currentStreak}d streak</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
                </View>
              </Card>
            </Pressable>
          )}
        />
      </View>
    </SafeAreaView>
  );
};
