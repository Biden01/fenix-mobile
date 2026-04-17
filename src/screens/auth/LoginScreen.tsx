import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Lock } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { GoldButton, GlassInput, GlassCard } from '@/components/ui';
import { useAuthStore } from '@/store';
import { useT } from '@/i18n';

const REGISTER_URL = 'https://fenixinternationalcompany.kz/register';

interface LoginScreenProps {
  onForgotPassword: () => void;
}

export function LoginScreen({ onForgotPassword }: LoginScreenProps) {
  const theme = useTheme();
  const t = useT();
  const { login, isLoading, error: storeError, clearError } = useAuthStore();

  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  // Clear errors when inputs change
  useEffect(() => {
    if (localError) setLocalError('');
    if (storeError) clearError();
  }, [userId, password]);

  const error = localError || storeError;

  const handleLogin = async () => {
    setLocalError('');
    clearError();

    if (!userId.trim()) {
      setLocalError(t.auth.loginIdError);
      return;
    }

    if (!password.trim()) {
      setLocalError(t.auth.loginPasswordError);
      return;
    }

    await login(userId, password);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={[theme.colors.background, `${theme.gold.primary}05`]}
        style={styles.gradient}
      >
        {/* Logo */}
        <View style={styles.logoSection}>
          <Image
            source={require('../../../assets/fenix_fav.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text
            style={[
              styles.title,
              {
                fontFamily: theme.fonts.displayBold,
                fontSize: theme.fontSizes['3xl'],
                color: theme.colors.foreground,
              },
            ]}
          >
            Fenix
          </Text>
          <Text
            style={[
              styles.subtitle,
              {
                fontFamily: theme.fonts.regular,
                fontSize: theme.fontSizes.sm,
                color: theme.colors.mutedForeground,
              },
            ]}
          >
            International Company
          </Text>
        </View>

        {/* Login Form */}
        <GlassCard
          cornerRadius={theme.borderRadius['2xl']}
          style={[styles.formCard, { borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border }, theme.shadows.xl]}
        >
          <Text
            style={[
              styles.formTitle,
              {
                fontFamily: theme.fonts.displayBold,
                fontSize: theme.fontSizes.xl,
                color: theme.colors.foreground,
              },
            ]}
          >
            {t.auth.welcomeBack}
          </Text>

          {error ? (
            <View
              style={[
                styles.errorContainer,
                {
                  backgroundColor: `${theme.semantic.error}20`,
                  borderRadius: theme.borderRadius.lg,
                  padding: theme.spacing[3],
                  marginBottom: theme.spacing[4],
                },
              ]}
            >
              <Text
                style={[
                  {
                    fontFamily: theme.fonts.medium,
                    fontSize: theme.fontSizes.sm,
                    color: theme.semantic.error,
                  },
                ]}
              >
                {error}
              </Text>
            </View>
          ) : null}

          <GlassInput
            label={t.auth.userId}
            placeholder={t.auth.loginIdPlaceholder}
            value={userId}
            onChangeText={setUserId}
            autoCapitalize="none"
            leftIcon={<User size={18} color={theme.colors.mutedForeground} />}
            containerStyle={{ marginBottom: theme.spacing[4] }}
          />

          <GlassInput
            label={t.auth.password}
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            isPassword
            leftIcon={<Lock size={18} color={theme.colors.mutedForeground} />}
            containerStyle={{ marginBottom: theme.spacing[2] }}
          />

          <TouchableOpacity
            onPress={onForgotPassword}
            style={styles.forgotPassword}
          >
            <Text
              style={[
                {
                  fontFamily: theme.fonts.medium,
                  fontSize: theme.fontSizes.sm,
                  color: theme.colors.goldForeground,
                },
              ]}
            >
              {t.auth.forgotPassword}
            </Text>
          </TouchableOpacity>

          <GoldButton
            title={t.auth.login}
            onPress={handleLogin}
            loading={isLoading}
            style={{ marginTop: theme.spacing[4] }}
          />

          <View
            style={[
              styles.registerSection,
              {
                borderTopWidth: 1,
                borderTopColor: theme.colors.border,
                marginTop: theme.spacing[6],
                paddingTop: theme.spacing[6],
              },
            ]}
          >
            <Text
              style={{
                fontFamily: theme.fonts.regular,
                fontSize: theme.fontSizes.sm,
                color: theme.colors.mutedForeground,
                textAlign: 'center',
                marginBottom: theme.spacing[3],
              }}
            >
              {t.auth.noAccount}
            </Text>
            <TouchableOpacity
              onPress={() => Linking.openURL(REGISTER_URL)}
              activeOpacity={0.7}
              style={{
                backgroundColor: `${theme.gold.primary}15`,
                borderWidth: 1,
                borderColor: `${theme.gold.primary}40`,
                borderRadius: theme.borderRadius.xl,
                paddingVertical: theme.spacing[3],
                paddingHorizontal: theme.spacing[5],
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontFamily: theme.fonts.semibold,
                  fontSize: theme.fontSizes.sm,
                  color: theme.colors.goldForeground,
                }}
              >
                {t.auth.registerOnSite}
              </Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        <Text
          style={[
            styles.footer,
            {
              fontFamily: theme.fonts.regular,
              fontSize: theme.fontSizes.xs,
              color: theme.colors.mutedForeground,
            },
          ]}
        >
          {t.auth.copyright}
        </Text>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoImage: {
    width: 96,
    height: 96,
    marginBottom: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
  },
  formCard: {
    width: '100%',
    maxWidth: 400,
    padding: 24,
  },
  formTitle: {
    textAlign: 'center',
    marginBottom: 24,
  },
  errorContainer: {},
  forgotPassword: {
    alignSelf: 'flex-end',
  },
  registerSection: {
    alignItems: 'center',
  },
  footer: {
    marginTop: 24,
    textAlign: 'center',
  },
});
