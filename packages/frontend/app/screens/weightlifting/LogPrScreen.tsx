import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  SafeAreaView,
  TextInput,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, borderRadius } from '@training-grounds/shared';
import {
  personalRecordService,
  TRACKED_LIFTS,
  type PrValueUnit,
} from '../../services/personalRecordService';
import type { AppStackParamList } from '../../navigation/AppStack';

type LogPrRoute = RouteProp<AppStackParamList, 'LogPr'>;
type LogPrNav = NativeStackNavigationProp<AppStackParamList>;

export const LogPrScreen: React.FC = () => {
  const theme = useTheme();
  const route = useRoute<LogPrRoute>();
  const nav = useNavigation<LogPrNav>();

  const [movement, setMovement] = useState<string>(route.params?.movementName ?? 'Back Squat');
  const [weight, setWeight] = useState('');
  const [unit, setUnit] = useState<PrValueUnit>('kg');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    nav.setOptions({ title: 'Log Lift' });
  }, [nav]);

  const handleSave = async () => {
    const value = parseFloat(weight);
    if (isNaN(value) || value <= 0) {
      Alert.alert('Invalid weight', 'Enter a positive number for the weight.');
      return;
    }
    setSaving(true);
    try {
      const result = await personalRecordService.createPr({
        category: 'lift',
        movementName: movement,
        valueNumeric: value,
        valueUnit: unit,
        notes: notes.trim() || undefined,
      });
      if (result.isNewPr) {
        Alert.alert(
          '🔔 New PR!',
          `${movement}: ${value}${unit}\n+${result.xpAwarded} XP awarded`,
          [{ text: 'Nice!', onPress: () => nav.goBack() }],
        );
      } else {
        Alert.alert('Lift logged', 'Not a PR this time — keep grinding.', [
          { text: 'OK', onPress: () => nav.goBack() },
        ]);
      }
    } catch (e) {
      Alert.alert('Save failed', 'Could not save your lift. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safe: { flex: 1, backgroundColor: theme.secondaryColor },
        scroll: { padding: spacing.lg },
        label: {
          color: theme.textMuted,
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: 1.5,
          marginTop: spacing.md,
          marginBottom: 6,
        },
        input: {
          backgroundColor: theme.surfaceColor,
          color: theme.textPrimary,
          padding: 14,
          borderRadius: borderRadius.sm,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.08)',
          fontSize: 16,
        },
        pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
        pickerPill: {
          backgroundColor: theme.surfaceColor,
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.08)',
        },
        pickerPillActive: {
          backgroundColor: theme.primaryColor,
          borderColor: theme.primaryColor,
        },
        pickerPillText: { color: theme.textPrimary, fontSize: 12, fontWeight: '600' },
        pickerPillTextActive: { color: theme.secondaryColor, fontWeight: '800' },
        unitRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
        submit: {
          backgroundColor: theme.primaryColor,
          borderRadius: borderRadius.sm,
          padding: 16,
          marginTop: spacing.lg,
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 8,
        },
        submitText: {
          color: theme.secondaryColor,
          fontWeight: '800',
          fontSize: 14,
          textTransform: 'uppercase',
          letterSpacing: 1,
        },
      }),
    [theme],
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Movement</Text>
        <View style={styles.pickerRow}>
          {TRACKED_LIFTS.map((lift) => {
            const active = movement === lift.name;
            return (
              <Pressable
                key={lift.name}
                style={[styles.pickerPill, active && styles.pickerPillActive]}
                onPress={() => setMovement(lift.name)}
              >
                <Text style={[styles.pickerPillText, active && styles.pickerPillTextActive]}>
                  {lift.name}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>Weight</Text>
        <TextInput
          style={styles.input}
          value={weight}
          onChangeText={setWeight}
          placeholder="e.g. 120"
          placeholderTextColor={theme.textMuted}
          keyboardType="decimal-pad"
        />
        <View style={styles.unitRow}>
          {(['kg', 'lbs'] as const).map((u) => {
            const active = unit === u;
            return (
              <Pressable
                key={u}
                style={[styles.pickerPill, active && styles.pickerPillActive]}
                onPress={() => setUnit(u)}
              >
                <Text style={[styles.pickerPillText, active && styles.pickerPillTextActive]}>
                  {u}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput
          style={[styles.input, { minHeight: 70, textAlignVertical: 'top' }]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Session notes, cues, how it felt…"
          placeholderTextColor={theme.textMuted}
          multiline
        />

        <Pressable
          style={[styles.submit, saving && { opacity: 0.7 }]}
          disabled={saving}
          onPress={handleSave}
        >
          <Ionicons name="trophy" size={18} color={theme.secondaryColor} />
          <Text style={styles.submitText}>{saving ? 'Saving...' : 'Log Lift'}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};
