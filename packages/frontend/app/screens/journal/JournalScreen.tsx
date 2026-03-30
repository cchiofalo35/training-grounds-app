import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  Pressable,
  FlatList,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing, borderRadius } from '@training-grounds/shared';
import type { JournalEntry, Discipline } from '@training-grounds/shared';
import type { AppDispatch, RootState } from '../../redux/store';
import {
  fetchJournalEntries,
  createJournalEntry,
  deleteJournalEntry,
} from '../../redux/slices/journalSlice';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';

const DISCIPLINE_LABELS: Record<Discipline, string> = {
  'bjj-gi': 'BJJ Gi',
  'bjj-nogi': 'BJJ No-Gi',
  'muay-thai': 'Muay Thai',
  wrestling: 'Wrestling',
  mma: 'MMA',
  boxing: 'Boxing',
  'open-mat': 'Open Mat',
};

const JOURNAL_PROMPTS = [
  { key: 'exploration', label: 'What did I explore today?', icon: 'compass-outline' as const },
  { key: 'challenge', label: 'What felt challenging?', icon: 'barbell-outline' as const },
  { key: 'worked', label: 'What seemed to work?', icon: 'checkmark-circle-outline' as const },
  { key: 'takeaways', label: '1-2 key takeaways', icon: 'bulb-outline' as const },
  { key: 'nextSession', label: 'What do I want to explore next?', icon: 'arrow-forward-circle-outline' as const },
];

type ViewMode = 'list' | 'create';

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

export const JournalScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { entries, isLoading, isSaving } = useSelector(
    (state: RootState) => state.journal,
  );

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [form, setForm] = useState({
    exploration: '',
    challenge: '',
    worked: '',
    takeaways: '',
    nextSession: '',
    className: '',
    discipline: '' as string,
    isSharedWithCoach: false,
  });

  useEffect(() => {
    dispatch(fetchJournalEntries());
  }, [dispatch]);

  const handleSubmit = async () => {
    if (!form.exploration.trim() || !form.challenge.trim()) {
      Alert.alert('Missing Fields', 'Please fill in at least the first two prompts.');
      return;
    }

    try {
      await dispatch(
        createJournalEntry({
          exploration: form.exploration,
          challenge: form.challenge,
          worked: form.worked,
          takeaways: form.takeaways,
          nextSession: form.nextSession,
          className: form.className || undefined,
          discipline: form.discipline || undefined,
          isSharedWithCoach: form.isSharedWithCoach,
        }),
      ).unwrap();

      Alert.alert('Saved!', 'Your journal entry has been recorded.');
      setForm({
        exploration: '',
        challenge: '',
        worked: '',
        takeaways: '',
        nextSession: '',
        className: '',
        discipline: '',
        isSharedWithCoach: false,
      });
      setViewMode('list');
    } catch {
      Alert.alert('Error', 'Failed to save journal entry.');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Entry', 'Are you sure you want to delete this journal entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => dispatch(deleteJournalEntry(id)),
      },
    ]);
  };

  if (viewMode === 'create') {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <ScrollView contentContainerStyle={styles.formScroll}>
            {/* Header */}
            <View style={styles.formHeader}>
              <Pressable onPress={() => setViewMode('list')}>
                <Ionicons name="arrow-back" size={24} color={colors.warmAccent} />
              </Pressable>
              <Text style={styles.screenTitle}>NEW ENTRY</Text>
              <View style={{ width: 24 }} />
            </View>

            {/* Class info (optional) */}
            <Card style={styles.classInfoCard}>
              <Text style={styles.classInfoLabel}>Class (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Morning BJJ Fundamentals"
                placeholderTextColor={colors.textMuted}
                value={form.className}
                onChangeText={(t) => setForm({ ...form, className: t })}
              />
            </Card>

            {/* Journal prompts */}
            {JOURNAL_PROMPTS.map((prompt) => (
              <Card key={prompt.key} style={styles.promptCard}>
                <View style={styles.promptHeader}>
                  <Ionicons name={prompt.icon} size={20} color={colors.warmAccent} />
                  <Text style={styles.promptLabel}>{prompt.label}</Text>
                </View>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Write your thoughts..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  value={(form as any)[prompt.key]}
                  onChangeText={(t) => setForm({ ...form, [prompt.key]: t })}
                />
              </Card>
            ))}

            {/* Share with coach toggle */}
            <Pressable
              style={styles.coachToggle}
              onPress={() =>
                setForm({ ...form, isSharedWithCoach: !form.isSharedWithCoach })
              }
            >
              <Ionicons
                name={form.isSharedWithCoach ? 'checkbox' : 'square-outline'}
                size={24}
                color={form.isSharedWithCoach ? colors.warmAccent : colors.steel}
              />
              <Text style={styles.coachToggleText}>Share with my coach</Text>
            </Pressable>

            <Button
              title="Save Entry"
              onPress={handleSubmit}
              isLoading={isSaving}
              variant="primary"
              style={styles.saveButton}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // List view
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.listHeader}>
        <Text style={styles.screenTitle}>TRAINING JOURNAL</Text>
        <Text style={styles.subtitle}>Reflect. Improve. Repeat.</Text>
      </View>

      {/* New Entry Button */}
      <Pressable
        style={({ pressed }) => [
          styles.newEntryButton,
          { opacity: pressed ? 0.85 : 1 },
        ]}
        onPress={() => setViewMode('create')}
      >
        <Ionicons name="add-circle" size={28} color={colors.charcoal} />
        <View style={styles.newEntryTextContainer}>
          <Text style={styles.newEntryTitle}>NEW JOURNAL ENTRY</Text>
          <Text style={styles.newEntrySubtext}>Record today's training reflections</Text>
        </View>
        <Ionicons name="arrow-forward" size={24} color={colors.charcoal} />
      </Pressable>

      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.entryList}
        ListEmptyComponent={
          <Card>
            <View style={styles.emptyState}>
              <Ionicons name="journal-outline" size={48} color={colors.steel} />
              <Text style={styles.emptyTitle}>No entries yet</Text>
              <Text style={styles.emptyText}>
                Start journaling after your next training session to track your progress.
              </Text>
            </View>
          </Card>
        }
        renderItem={({ item }) => (
          <Card style={styles.entryCard}>
            <View style={styles.entryHeader}>
              <View style={styles.entryDateRow}>
                <Ionicons name="calendar-outline" size={16} color={colors.warmAccent} />
                <Text style={styles.entryDate}>{formatDate(item.createdAt)}</Text>
              </View>
              <Pressable onPress={() => handleDelete(item.id)}>
                <Ionicons name="trash-outline" size={18} color={colors.steel} />
              </Pressable>
            </View>

            {item.className && (
              <Text style={styles.entryClassName}>
                {item.className}
                {item.discipline ? ` · ${DISCIPLINE_LABELS[item.discipline]}` : ''}
              </Text>
            )}

            <Text style={styles.entryExploration} numberOfLines={2}>
              {item.exploration}
            </Text>

            {item.takeaways ? (
              <View style={styles.entryTakeaway}>
                <Ionicons name="bulb-outline" size={14} color={colors.warmAccent} />
                <Text style={styles.entryTakeawayText} numberOfLines={1}>
                  {item.takeaways}
                </Text>
              </View>
            ) : null}

            {item.isSharedWithCoach && (
              <View style={styles.sharedBadge}>
                <Ionicons name="people-outline" size={12} color={colors.warmAccent} />
                <Text style={styles.sharedBadgeText}>Shared with coach</Text>
              </View>
            )}
          </Card>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.charcoal,
  },
  flex: {
    flex: 1,
  },
  // List view
  listHeader: {
    padding: spacing.base,
    paddingTop: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  screenTitle: {
    fontFamily: 'BebasNeue',
    fontSize: fonts.size['2xl'],
    color: colors.offWhite,
    letterSpacing: fonts.letterSpacing.wide * 32,
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: fonts.size.sm,
    color: colors.steel,
    fontStyle: 'italic',
  },
  newEntryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warmAccent,
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    marginHorizontal: spacing.base,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  newEntryTextContainer: {
    flex: 1,
  },
  newEntryTitle: {
    fontFamily: 'BebasNeue',
    fontSize: fonts.size.lg,
    color: colors.charcoal,
    letterSpacing: fonts.letterSpacing.wide * 20,
  },
  newEntrySubtext: {
    fontFamily: 'Inter',
    fontSize: fonts.size.xs,
    color: 'rgba(30, 30, 30, 0.7)',
  },
  entryList: {
    padding: spacing.base,
    gap: spacing.sm,
    paddingBottom: spacing['3xl'],
  },
  entryCard: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  entryDate: {
    fontFamily: 'Inter',
    fontSize: fonts.size.sm,
    color: colors.warmAccent,
    fontWeight: fonts.weight.semibold as any,
  },
  entryClassName: {
    fontFamily: 'Inter',
    fontSize: fonts.size.xs,
    color: colors.steel,
    textTransform: 'uppercase',
    letterSpacing: fonts.letterSpacing.wider * 11,
  },
  entryExploration: {
    fontFamily: 'Inter',
    fontSize: fonts.size.base,
    color: colors.offWhite,
    lineHeight: 22,
  },
  entryTakeaway: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(201, 168, 124, 0.08)',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  entryTakeawayText: {
    fontFamily: 'Inter',
    fontSize: fonts.size.sm,
    color: colors.offWhite,
    flex: 1,
  },
  sharedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  sharedBadgeText: {
    fontFamily: 'Inter',
    fontSize: fonts.size.xs,
    color: colors.warmAccent,
  },
  emptyState: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  emptyTitle: {
    fontFamily: 'BebasNeue',
    fontSize: fonts.size.xl,
    color: colors.offWhite,
  },
  emptyText: {
    fontFamily: 'Inter',
    fontSize: fonts.size.sm,
    color: colors.steel,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.lg,
  },
  // Create form
  formScroll: {
    padding: spacing.base,
    paddingBottom: spacing['3xl'],
    gap: spacing.md,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  classInfoCard: {
    gap: spacing.sm,
  },
  classInfoLabel: {
    fontFamily: 'Inter',
    fontSize: fonts.size.xs,
    color: colors.steel,
    textTransform: 'uppercase',
    letterSpacing: fonts.letterSpacing.widest * 11,
  },
  promptCard: {
    gap: spacing.sm,
  },
  promptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  promptLabel: {
    fontFamily: 'Inter',
    fontSize: fonts.size.sm,
    fontWeight: fonts.weight.semibold as any,
    color: colors.offWhite,
  },
  input: {
    fontFamily: 'Inter',
    fontSize: fonts.size.base,
    color: colors.offWhite,
    backgroundColor: colors.charcoal,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  coachToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  coachToggleText: {
    fontFamily: 'Inter',
    fontSize: fonts.size.base,
    color: colors.offWhite,
  },
  saveButton: {
    marginTop: spacing.md,
  },
});
