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
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/common/Button';
import type { AuthStackParamList } from '../../navigation/AuthStack';

type LoginNavProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginNavProp>();
  const { login, signInWithApple, isLoading, error, dismissError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    AppleAuthentication.isAvailableAsync().then(setAppleAvailable);
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }
    try {
      await login(email.trim(), password);
    } catch {
      // Error handled by Redux state
    }
  };

  const handleAppleSignIn = async () => {
    try {
      await signInWithApple();
    } catch {
      // Error handled by Redux state
    }
  };

  const handleGoogleSignIn = () => {
    Alert.alert('Coming Soon', 'Google login will be available soon.');
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
          {/* Logo Area */}
          <View style={styles.logoArea}>
            <Text style={styles.logoText}>TRAINING</Text>
            <Text style={styles.logoTextAccent}>GROUNDS</Text>
            <Text style={styles.tagline}>Track. Train. Dominate.</Text>
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
                placeholder="Enter your password"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
              />
            </View>

            <Button
              title="Sign In"
              onPress={handleLogin}
              isLoading={isLoading}
              variant="primary"
            />

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Login */}
            <Button
              title="Continue with Google"
              onPress={handleGoogleSignIn}
              variant="outline"
            />
            {appleAvailable && (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
                cornerRadius={borderRadius.md}
                style={styles.appleButton}
                onPress={handleAppleSignIn}
              />
            )}
          </View>

          {/* Register Link */}
          <Pressable
            style={styles.registerLink}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.registerText}>
              Don't have an account?{' '}
              <Text style={styles.registerTextAccent}>Create one</Text>
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
    justifyContent: 'center',
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: spacing['3xl'],
  },
  logoText: {
    fontFamily: 'BebasNeue',
    fontSize: fonts.size['4xl'],
    color: colors.offWhite,
    letterSpacing: fonts.letterSpacing.wide * 48,
    lineHeight: 52,
  },
  logoTextAccent: {
    fontFamily: 'BebasNeue',
    fontSize: fonts.size['4xl'],
    color: colors.warmAccent,
    letterSpacing: fonts.letterSpacing.wide * 48,
    lineHeight: 52,
  },
  tagline: {
    fontFamily: 'Inter',
    fontSize: fonts.size.sm,
    color: colors.steel,
    letterSpacing: fonts.letterSpacing.wider * 13,
    textTransform: 'uppercase',
    marginTop: spacing.sm,
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
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.sm,
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
  registerLink: {
    marginTop: spacing['2xl'],
    alignItems: 'center',
  },
  registerText: {
    fontFamily: 'Inter',
    fontSize: fonts.size.sm,
    color: colors.steel,
  },
  registerTextAccent: {
    color: colors.warmAccent,
    fontWeight: fonts.weight.semibold,
  },
});
