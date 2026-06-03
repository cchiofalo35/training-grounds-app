import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, fonts, borderRadius } from '@training-grounds/shared';
import type { GymTheme } from '@training-grounds/shared';
import { useTheme } from '../../contexts/ThemeContext';
import { useGym } from '../../contexts/GymContext';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import api from '../../services/api';

interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  theme: GymTheme;
}

const ColorField: React.FC<ColorFieldProps> = ({ label, value, onChange, theme }) => (
  <View style={{ marginBottom: spacing.md }}>
    <Text
      style={{
        color: theme.textMuted,
        fontSize: fonts.size.xs,
        fontWeight: fonts.weight.semibold,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: spacing.xs,
      }}
    >
      {label}
    </Text>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: borderRadius.sm,
          backgroundColor: /^#[0-9A-Fa-f]{6}$/.test(value) ? value : '#000000',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.1)',
        }}
      />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="#000000"
        placeholderTextColor={theme.textMuted}
        maxLength={7}
        autoCapitalize="none"
        autoCorrect={false}
        style={{
          flex: 1,
          backgroundColor: theme.surfaceColor,
          borderRadius: borderRadius.sm,
          padding: spacing.sm,
          color: theme.textPrimary,
          fontFamily: 'Inter',
          fontSize: fonts.size.sm,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.06)',
        }}
      />
    </View>
  </View>
);

interface FontFieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  theme: GymTheme;
}

const FontField: React.FC<FontFieldProps> = ({ label, value, onChange, theme }) => (
  <View style={{ marginBottom: spacing.md }}>
    <Text
      style={{
        color: theme.textMuted,
        fontSize: fonts.size.xs,
        fontWeight: fonts.weight.semibold,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: spacing.xs,
      }}
    >
      {label}
    </Text>
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder="Font name"
      placeholderTextColor={theme.textMuted}
      autoCapitalize="none"
      autoCorrect={false}
      style={{
        backgroundColor: theme.surfaceColor,
        borderRadius: borderRadius.sm,
        padding: spacing.sm,
        color: theme.textPrimary,
        fontFamily: 'Inter',
        fontSize: fonts.size.sm,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
      }}
    />
  </View>
);

interface BrandingForm {
  primaryColor: string;
  secondaryColor: string;
  surfaceColor: string;
  textPrimary: string;
  textMuted: string;
  headingFont: string;
  bodyFont: string;
  logoUrl: string;
}

export const GymBrandingScreen: React.FC = () => {
  const theme = useTheme();
  const { gym, gymId } = useGym();

  const initialForm: BrandingForm = useMemo(() => ({
    primaryColor: gym?.primaryColor ?? '#C9A87C',
    secondaryColor: gym?.secondaryColor ?? '#1E1E1E',
    surfaceColor: '#2A2A2A',
    textPrimary: '#FAFAF8',
    textMuted: '#B0B5B8',
    headingFont: gym?.headingFont ?? 'Bebas Neue',
    bodyFont: gym?.bodyFont ?? 'Inter',
    logoUrl: gym?.logoUrl ?? '',
  }), [gym]);

  const [form, setForm] = useState<BrandingForm>(initialForm);
  const [isSaving, setIsSaving] = useState(false);

  const updateField = useCallback(
    <K extends keyof BrandingForm>(key: K) =>
      (value: BrandingForm[K]) =>
        setForm((prev) => ({ ...prev, [key]: value })),
    [],
  );

  const handleSave = useCallback(async () => {
    if (!gymId) return;
    setIsSaving(true);
    try {
      await api.patch(`/gyms/${gymId}`, form);
      Alert.alert('Success', 'Gym branding updated! Changes will appear on next app restart.');
    } catch {
      Alert.alert('Error', 'Failed to update branding. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [gymId, form]);

  const handleReset = useCallback(() => {
    setForm(initialForm);
  }, [initialForm]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: theme.secondaryColor,
        },
        scrollContent: {
          padding: spacing.base,
          paddingBottom: spacing['3xl'],
        },
        sectionTitle: {
          fontFamily: 'Inter',
          fontSize: fonts.size.xs,
          fontWeight: fonts.weight.semibold,
          color: theme.textMuted,
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          marginBottom: spacing.md,
          marginTop: spacing.xl,
        },
        previewCard: {
          marginTop: spacing.xl,
        },
        previewLabel: {
          fontFamily: 'Inter',
          fontSize: fonts.size.xs,
          fontWeight: fonts.weight.semibold,
          color: theme.textMuted,
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          marginBottom: spacing.md,
        },
        logoInput: {
          backgroundColor: theme.surfaceColor,
          borderRadius: borderRadius.sm,
          padding: spacing.sm,
          color: theme.textPrimary,
          fontFamily: 'Inter',
          fontSize: fonts.size.sm,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.06)',
        },
        logoLabel: {
          color: theme.textMuted,
          fontSize: fonts.size.xs,
          fontWeight: fonts.weight.semibold,
          textTransform: 'uppercase',
          letterSpacing: 1.5,
          marginBottom: spacing.xs,
        },
        buttonRow: {
          flexDirection: 'row',
          gap: spacing.md,
          marginTop: spacing.xl,
        },
        saveButton: {
          flex: 1,
        },
        resetButton: {
          flex: 1,
        },
        headerIcon: {
          alignItems: 'center',
          marginBottom: spacing.md,
          marginTop: spacing.sm,
        },
        headerTitle: {
          fontFamily: 'BebasNeue',
          fontSize: fonts.size['2xl'],
          color: theme.textPrimary,
          textAlign: 'center',
          letterSpacing: 1,
        },
        headerSubtitle: {
          fontFamily: 'Inter',
          fontSize: fonts.size.sm,
          color: theme.textMuted,
          textAlign: 'center',
          marginTop: spacing.xs,
        },
      }),
    [theme],
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.headerIcon}>
          <Ionicons name="color-palette-outline" size={40} color={theme.primaryColor} />
        </View>
        <Text style={styles.headerTitle}>Customize Your Gym</Text>
        <Text style={styles.headerSubtitle}>
          Set colors, fonts, and logo for your members
        </Text>

        {/* Colors Section */}
        <Text style={styles.sectionTitle}>Colors</Text>
        <Card>
          <ColorField
            label="Primary / Accent Color"
            value={form.primaryColor}
            onChange={updateField('primaryColor')}
            theme={theme}
          />
          <ColorField
            label="Secondary / Background Color"
            value={form.secondaryColor}
            onChange={updateField('secondaryColor')}
            theme={theme}
          />
          <ColorField
            label="Surface / Card Color"
            value={form.surfaceColor}
            onChange={updateField('surfaceColor')}
            theme={theme}
          />
          <ColorField
            label="Text Primary"
            value={form.textPrimary}
            onChange={updateField('textPrimary')}
            theme={theme}
          />
          <ColorField
            label="Text Muted"
            value={form.textMuted}
            onChange={updateField('textMuted')}
            theme={theme}
          />
        </Card>

        {/* Fonts Section */}
        <Text style={styles.sectionTitle}>Fonts</Text>
        <Card>
          <FontField
            label="Heading Font"
            value={form.headingFont}
            onChange={updateField('headingFont')}
            theme={theme}
          />
          <FontField
            label="Body Font"
            value={form.bodyFont}
            onChange={updateField('bodyFont')}
            theme={theme}
          />
        </Card>

        {/* Logo Section */}
        <Text style={styles.sectionTitle}>Logo</Text>
        <Card>
          <Text style={styles.logoLabel}>Logo URL</Text>
          <TextInput
            value={form.logoUrl}
            onChangeText={updateField('logoUrl')}
            placeholder="https://example.com/logo.png"
            placeholderTextColor={theme.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            style={styles.logoInput}
          />
        </Card>

        {/* Live Preview */}
        <Card style={styles.previewCard}>
          <Text style={styles.previewLabel}>LIVE PREVIEW</Text>
          <View
            style={{
              backgroundColor: form.secondaryColor,
              borderRadius: borderRadius.md,
              padding: spacing.md,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.06)',
            }}
          >
            <View
              style={{
                backgroundColor: form.surfaceColor,
                borderRadius: borderRadius.sm,
                padding: spacing.md,
                marginBottom: spacing.sm,
              }}
            >
              <Text
                style={{
                  color: form.primaryColor,
                  fontFamily: 'BebasNeue',
                  fontSize: 18,
                }}
              >
                {gym?.name ?? 'Gym Name'}
              </Text>
              <Text
                style={{
                  color: form.textPrimary,
                  fontFamily: 'Inter',
                  fontSize: 14,
                  marginTop: 4,
                }}
              >
                Primary text preview
              </Text>
              <Text
                style={{
                  color: form.textMuted,
                  fontFamily: 'Inter',
                  fontSize: 12,
                  marginTop: 4,
                }}
              >
                Muted text preview
              </Text>
            </View>
            <View
              style={{
                backgroundColor: form.primaryColor,
                borderRadius: borderRadius.sm,
                padding: spacing.sm,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: form.secondaryColor,
                  fontFamily: 'Inter',
                  fontWeight: '700',
                  fontSize: 13,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                }}
              >
                BUTTON PREVIEW
              </Text>
            </View>
          </View>
        </Card>

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          <Button
            title="Reset"
            onPress={handleReset}
            variant="outline"
            style={styles.resetButton}
          />
          <Button
            title="Save Branding"
            onPress={handleSave}
            variant="primary"
            isLoading={isSaving}
            style={styles.saveButton}
          />
        </View>
      </ScrollView>
    </View>
  );
};
