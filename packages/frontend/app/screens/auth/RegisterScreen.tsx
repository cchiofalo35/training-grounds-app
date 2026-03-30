import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as AppleAuthentication from 'expo-apple-authentication';
import { colors, fonts, spacing, borderRadius } from '@training-grounds/shared';
import type { BeltRank } from '@training-grounds/shared';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/common/Button';
import type { AuthStackParamList } from '../../navigation/AuthStack';

type RegisterNavProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

const BELT_OPTIONS: { value: BeltRank; label: string; color: string }[] = [
  { value: 'white', label: 'White', color: '#FFFFFF' },
  { value: 'blue', label: 'Blue', color: '#4A90E2' },
  { value: 'purple', label: 'Purple', color: '#8B5CF6' },
  { value: 'brown', label: 'Brown', color: '#A0522D' },
  { value: 'black', label: 'Black', color: '#1A1A1A' },
];

export const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<RegisterNavProp>();
  const { register, signInWithApple, isLoading, error, dismissError } = useAuth();
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    AppleAuthentication.isAvailableAsync().then(setAppleAvailable);
  }, []);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [beltRank, setBeltRank] = useState<BeltRank>('white');

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Weak Password', 'Password must be at least 8 characters.');
      return;
    }
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        beltRank,
      });
    } catch {
      // Error handled by Redux state
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={() => navigation.goBack()}>
              <Text style={styles.backButton}>← Back</Text>
            </Pressable>
            <Text style={styles.title}>CREATE ACCOUNT</Text>
            <Text style={styles.subtitle}>
              Join the Training Grounds community
            </Text>
          </View>

          {/* Error Display */}
          {error && (
            <Pressable style={styles.errorBanner} onPress={dismissError}>
              <Text style={styles.errorText}>{error}</Text>
            </Pressable>
          )}

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>FULL NAME</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Your full name"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>EMAIL</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>PASSWORD</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Minimum 8 characters"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
              />
            </View>

            {/* Belt Rank Picker */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>CURRENT BELT RANK</Text>
              <View style={styles.beltPicker}>
                {BELT_OPTIONS.map((option) => (
                  <Pressable
                    key={option.value}
                    style={[
                      styles.beltOption,
                      beltRank === option.value && styles.beltOptionSelected,
                    ]}
                    onPress={() => setBeltRank(option.value)}
                  >
                    <View
                      style={[
                        styles.beltSwatch,
                        { backgroundColor: option.color },
                        option.value === 'white' && styles.beltSwatchWhite,
                        option.value === 'black' && styles.beltSwatchBlack,
                      ]}
                    />
                    <Text
                      style={[
                        styles.beltLabel,
                        beltRank === option.value && styles.beltLabelSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <Button
              title="Create Account"
              onPress={handleRegister}
              isLoading={isLoading}
              variant="primary"
              style={styles.submitButton}
            />
          </View>

          {/* Quick Sign-Up with Apple */}
          {appleAvailable && (
            <View style={styles.appleSection}>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
                cornerRadius={borderRadius.md}
                style={styles.appleButton}
                onPress={async () => {
                  try {
                    await signInWithApple();
                  } catch {
                    // handled by Redux
                  }
                }}
              />
            </View>
          )}

          {/* Login Link */}
          <Pressable
            style={styles.loginLink}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.loginText}>
              Already have an account?{' '}
              <Text style={styles.loginTextAccent}>Sign in</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['2xl'],
  },
  header: {
    marginTop: spacing['2xl'],
    marginBottom: spacing['2xl'],
  },
  backButton: {
    fontFamily: 'Inter',
    fontSize: fonts.size.base,
    color: colors.warmAccent,
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: 'BebasNeue',
    fontSize: fonts.size['3xl'],
    color: colors.offWhite,
    letterSpacing: fonts.letterSpacing.wide * 40,
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: fonts.size.base,
    color: colors.steel,
    marginTop: spacing.xs,
  },
  errorBanner: {
    backgroundColor: 'rgba(229, 62, 62, 0.15)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.base,
    borderWidth: 1,
    borderColor: 'rgba(229, 62, 62, 0.3)',
  },
  errorText: {
    fontFamily: 'Inter',
    fontSize: fonts.size.sm,
    color: colors.error,
    textAlign: 'center',
  },
  form: {
    gap: spacing.base,
  },
  inputContainer: {
    gap: spacing.xs,
  },
  inputLabel: {
    fontFamily: 'Inter',
    fontSize: fonts.size.xs,
    fontWeight: fonts.weight.semibold,
    color: colors.steel,
    letterSpacing: fonts.letterSpacing.widest * 11,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: colors.darkGrey,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderDark,
    paddingVertical: 14,
    paddingHorizontal: spacing.base,
    fontFamily: 'Inter',
    fontSize: fonts.size.base,
    color: colors.offWhite,
  },
  beltPicker: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  beltOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.darkGrey,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderDark,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  beltOptionSelected: {
    borderColor: colors.warmAccent,
    backgroundColor: 'rgba(201, 168, 124, 0.1)',
  },
  beltSwatch: {
    width: 16,
    height: 8,
    borderRadius: 2,
  },
  beltSwatchWhite: {
    borderWidth: 1,
    borderColor: colors.steel,
  },
  beltSwatchBlack: {
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  beltLabel: {
    fontFamily: 'Inter',
    fontSize: fonts.size.sm,
    color: colors.steel,
    fontWeight: fonts.weight.medium,
  },
  beltLabelSelected: {
    color: colors.warmAccent,
  },
  submitButton: {
    marginTop: spacing.sm,
  },
  appleSection: {
    marginTop: spacing.lg,
    gap: spacing.base,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderDark,
  },
  dividerText: {
    fontFamily: 'Inter',
    fontSize: fonts.size.xs,
    color: colors.steel,
    marginHorizontal: spacing.md,
    letterSpacing: fonts.letterSpacing.widest * 11,
  },
  appleButton: {
    height: 50,
    width: '100%',
  },
  loginLink: {
    marginTop: spacing['2xl'],
    alignItems: 'center',
  },
  loginText: {
    fontFamily: 'Inter',
    fontSize: fonts.size.sm,
    color: colors.steel,
  },
  loginTextAccent: {
    color: colors.warmAccent,
    fontWeight: fonts.weight.semibold,
  },
});
