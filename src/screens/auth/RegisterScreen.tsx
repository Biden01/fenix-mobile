import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Linking,
} from 'react-native';
import { ArrowLeft, User, Phone, Mail, Lock, Search, MapPin, CheckCircle, Square, CheckSquare } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { GoldButton, GlassInput, GradientCard } from '@/components/ui';
import { useAuthStore } from '@/store';
import { authService } from '@/api';
import { useT } from '@/i18n';

interface RegisterScreenProps {
  onBack: () => void;
  sponsorIdFromLink?: string;
  legFromLink?: 'left' | 'right';
}

export function RegisterScreen({
  onBack,
  sponsorIdFromLink,
  legFromLink,
}: RegisterScreenProps) {
  const theme = useTheme();
  const t = useT();
  const { register, isLoading, error: storeError, clearError } = useAuthStore();

  const COUNTRIES = [
    { code: 'KZ', label: 'Казахстан 🇰🇿', currency: '₸' },
    { code: 'KG', label: 'Кыргызстан 🇰🇬', currency: 'сом' },
    { code: 'UZ', label: 'Өзбекстан 🇺🇿', currency: 'сўм' },
    { code: 'RU', label: 'Россия 🇷🇺', currency: '₽' },
  ];

  const [sponsorId, setSponsorId] = useState(sponsorIdFromLink || '');
  const [sponsorName, setSponsorName] = useState('');
  const [sponsorLookupLoading, setSponsorLookupLoading] = useState(false);
  const [partnerType, setPartnerType] = useState<0 | 1 | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('KZ');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [registered, setRegistered] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);

  const error = localError || storeError;

  // Clear errors when inputs change
  useEffect(() => {
    if (localError) setLocalError('');
    if (storeError) clearError();
  }, [name, phone, email, password, confirmPassword, sponsorId, partnerType]);

  const handleLookupSponsor = async () => {
    if (!sponsorId.trim()) {
      setLocalError(t.auth.sponsorPlaceholder);
      return;
    }

    setSponsorLookupLoading(true);
    setSponsorName('');

    try {
      const result = await authService.checkUser(sponsorId);
      if ('error' in result) {
        setLocalError(t.auth.sponsorNotFound);
      } else if (result.exists && result.user) {
        setSponsorName(result.user.fio || result.user.user_id);
      } else {
        setLocalError(t.auth.sponsorNotFound);
      }
    } catch {
      setLocalError(t.auth.sponsorCheckError);
    } finally {
      setSponsorLookupLoading(false);
    }
  };

  const handleRegister = async () => {
    setLocalError('');
    clearError();

    if (!sponsorId.trim()) {
      setLocalError(t.auth.sponsorPlaceholder);
      return;
    }

    if (!sponsorName) {
      setLocalError(t.auth.checkSponsorFirst);
      return;
    }

    if (partnerType === null) {
      setLocalError('Выберите тип партнёрства');
      return;
    }

    if (!name.trim()) {
      setLocalError(t.auth.enterFio);
      return;
    }

    if (!phone.trim()) {
      setLocalError(t.auth.enterPhone);
      return;
    }

    if (!password.trim()) {
      setLocalError(t.auth.loginPasswordError);
      return;
    }

    if (password.length < 6) {
      setLocalError(t.auth.passwordTooShort);
      return;
    }

    if (password !== confirmPassword) {
      setLocalError(t.auth.passwordMismatch);
      return;
    }

    if (!ageConfirmed) {
      setLocalError('Необходимо подтвердить, что вам 18 лет или больше');
      return;
    }

    // Parse sponsor ID as number
    const sponsorNum = parseInt(sponsorId, 10);
    if (isNaN(sponsorNum)) {
      setLocalError(t.auth.sponsorInvalidFmt);
      return;
    }

    const success = await register({
      password,
      fio: name,
      phone,
      type: partnerType!,
      email: email || undefined,
      sponsor: sponsorNum,
      city: city || undefined,
      country,
    });

    if (!success && !storeError) {
      setLocalError(t.auth.registerError);
    } else if (success) {
      setRegistered(true);
    }
  };

  if (registered) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center', padding: 32 }]}>
        <CheckCircle size={64} color={theme.semantic.success} style={{ marginBottom: 20 }} />
        <Text style={{ fontFamily: theme.fonts.displayBold, fontSize: theme.fontSizes['2xl'], color: theme.colors.foreground, textAlign: 'center', marginBottom: 12 }}>
          Заявка отправлена!
        </Text>
        <Text style={{ fontFamily: theme.fonts.regular, fontSize: theme.fontSizes.md, color: theme.colors.mutedForeground, textAlign: 'center', marginBottom: 32 }}>
          Ваш аккаунт создан и ожидает активации администратором. После активации вы сможете войти в систему.
        </Text>
        <GoldButton title="На страницу входа" onPress={onBack} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onBack}
            style={[
              styles.backButton,
              {
                backgroundColor: theme.colors.card,
                borderRadius: theme.borderRadius.full,
                padding: theme.spacing[2],
              },
            ]}
          >
            <ArrowLeft size={24} color={theme.colors.foreground} />
          </TouchableOpacity>
          <Text
            style={[
              styles.headerTitle,
              {
                fontFamily: theme.fonts.displayBold,
                fontSize: theme.fontSizes['2xl'],
                color: theme.colors.foreground,
              },
            ]}
          >
            {t.auth.registerTitle}
          </Text>
          <View style={styles.placeholder} />
        </View>

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

        {/* Sponsor Section */}
        <GradientCard style={{ marginBottom: theme.spacing[4] }}>
          <Text
            style={[
              styles.sectionTitle,
              {
                fontFamily: theme.fonts.semibold,
                fontSize: theme.fontSizes.md,
                color: theme.colors.foreground,
                marginBottom: theme.spacing[3],
              },
            ]}
          >
            {t.auth.sponsor}
          </Text>

          <View style={styles.sponsorInputRow}>
            <View style={{ flex: 1, marginRight: theme.spacing[2] }}>
              <GlassInput
                placeholder={t.auth.sponsorId}
                value={sponsorId}
                onChangeText={setSponsorId}
                keyboardType="numeric"
                leftIcon={<Search size={18} color={theme.colors.mutedForeground} />}
              />
            </View>
            <GoldButton
              title={t.auth.findSponsor}
              onPress={handleLookupSponsor}
              loading={sponsorLookupLoading}
              size="md"
              fullWidth={false}
              style={{ width: 100 }}
            />
          </View>

          {sponsorName ? (
            <View
              style={[
                styles.sponsorInfo,
                {
                  backgroundColor: `${theme.semantic.success}20`,
                  borderRadius: theme.borderRadius.lg,
                  padding: theme.spacing[3],
                  marginTop: theme.spacing[3],
                },
              ]}
            >
              <Text
                style={[
                  {
                    fontFamily: theme.fonts.medium,
                    fontSize: theme.fontSizes.sm,
                    color: theme.semantic.success,
                  },
                ]}
              >
                {t.auth.sponsorFound}{sponsorName}
              </Text>
            </View>
          ) : null}
        </GradientCard>

        {/* Account Info */}
        <GradientCard style={{ marginBottom: theme.spacing[4] }}>
          <Text
            style={[
              styles.sectionTitle,
              {
                fontFamily: theme.fonts.semibold,
                fontSize: theme.fontSizes.md,
                color: theme.colors.foreground,
                marginBottom: theme.spacing[3],
              },
            ]}
          >
            {t.auth.accountData}
          </Text>

          {/* Тип партнёрства */}
          <Text style={{ fontFamily: theme.fonts.medium, fontSize: theme.fontSizes.sm, color: theme.colors.mutedForeground, marginBottom: theme.spacing[2] }}>
            Тип партнёрства *
          </Text>
          <View style={{ flexDirection: 'row', gap: theme.spacing[2], marginBottom: theme.spacing[3] }}>
            {([{ label: 'Лидер', value: 1 }, { label: 'Клиент', value: 0 }] as const).map(opt => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => setPartnerType(opt.value)}
                style={{
                  flex: 1,
                  paddingVertical: theme.spacing[2],
                  borderRadius: theme.borderRadius.lg,
                  borderWidth: 1,
                  borderColor: partnerType === opt.value ? theme.colors.primary : theme.colors.border,
                  backgroundColor: partnerType === opt.value ? `${theme.colors.primary}20` : 'transparent',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontFamily: theme.fonts.medium, fontSize: theme.fontSizes.sm, color: partnerType === opt.value ? theme.colors.primary : theme.colors.mutedForeground }}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <GlassInput
            label={t.auth.password}
            placeholder={t.auth.passwordHint}
            value={password}
            onChangeText={setPassword}
            isPassword
            leftIcon={<Lock size={18} color={theme.colors.mutedForeground} />}
            containerStyle={{ marginBottom: theme.spacing[3] }}
          />

          <GlassInput
            label={t.auth.confirmPassword}
            placeholder={t.auth.confirmPasswordPh}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            isPassword
            leftIcon={<Lock size={18} color={theme.colors.mutedForeground} />}
          />
        </GradientCard>

        {/* Personal Info */}
        <GradientCard style={{ marginBottom: theme.spacing[4] }}>
          <Text
            style={[
              styles.sectionTitle,
              {
                fontFamily: theme.fonts.semibold,
                fontSize: theme.fontSizes.md,
                color: theme.colors.foreground,
                marginBottom: theme.spacing[3],
              },
            ]}
          >
            {t.auth.personalData}
          </Text>

          <GlassInput
            label={t.auth.fio}
            placeholder={t.auth.fioPh}
            value={name}
            onChangeText={setName}
            leftIcon={<User size={18} color={theme.colors.mutedForeground} />}
            containerStyle={{ marginBottom: theme.spacing[3] }}
          />

          <GlassInput
            label={t.auth.phone}
            placeholder={t.auth.phonePh}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            leftIcon={<Phone size={18} color={theme.colors.mutedForeground} />}
            containerStyle={{ marginBottom: theme.spacing[3] }}
          />

          <GlassInput
            label={t.auth.emailOptional}
            placeholder={t.auth.emailPh}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<Mail size={18} color={theme.colors.mutedForeground} />}
            containerStyle={{ marginBottom: theme.spacing[3] }}
          />

          <GlassInput
            label={t.auth.cityOptional}
            placeholder={t.auth.cityPh}
            value={city}
            onChangeText={setCity}
            leftIcon={<MapPin size={18} color={theme.colors.mutedForeground} />}
            containerStyle={{ marginBottom: theme.spacing[3] }}
          />

          <Text style={{ fontFamily: theme.fonts.medium, fontSize: theme.fontSizes.sm, color: theme.colors.mutedForeground, marginBottom: theme.spacing[2] }}>
            Страна *
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing[2] }}>
            {COUNTRIES.map(opt => (
              <TouchableOpacity
                key={opt.code}
                onPress={() => setCountry(opt.code)}
                style={{
                  paddingVertical: theme.spacing[2],
                  paddingHorizontal: theme.spacing[3],
                  borderRadius: theme.borderRadius.lg,
                  borderWidth: 1,
                  borderColor: country === opt.code ? theme.colors.primary : theme.colors.border,
                  backgroundColor: country === opt.code ? `${theme.colors.primary}20` : 'transparent',
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontFamily: theme.fonts.medium, fontSize: theme.fontSizes.sm, color: country === opt.code ? theme.colors.primary : theme.colors.mutedForeground }}>
                  {opt.label}
                </Text>
                <Text style={{ fontFamily: theme.fonts.regular, fontSize: theme.fontSizes.xs, color: theme.colors.mutedForeground, marginLeft: 4 }}>
                  {opt.currency}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </GradientCard>

        {/* Age + Terms confirmation */}
        <TouchableOpacity
          onPress={() => setAgeConfirmed(!ageConfirmed)}
          style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: theme.spacing[4], gap: theme.spacing[3] }}
        >
          {ageConfirmed
            ? <CheckSquare size={22} color={theme.colors.goldForeground} />
            : <Square size={22} color={theme.colors.mutedForeground} />
          }
          <Text style={{ flex: 1, fontFamily: theme.fonts.regular, fontSize: theme.fontSizes.sm, color: theme.colors.mutedForeground, lineHeight: 20 }}>
            {'Мне исполнилось 18 лет. Я принимаю '}
            <Text
              style={{ color: theme.colors.goldForeground, textDecorationLine: 'underline' }}
              onPress={() => Linking.openURL('https://fenixinternationalcompany.kz/terms')}
            >
              условия использования
            </Text>
            {' и '}
            <Text
              style={{ color: theme.colors.goldForeground, textDecorationLine: 'underline' }}
              onPress={() => Linking.openURL('https://fenixinternationalcompany.kz/privacy')}
            >
              политику конфиденциальности
            </Text>
            .
          </Text>
        </TouchableOpacity>

        <GoldButton
          title={t.auth.register}
          onPress={handleRegister}
          loading={isLoading}
          style={{ marginBottom: theme.spacing[6] }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {},
  headerTitle: {},
  placeholder: {
    width: 40,
  },
  errorContainer: {},
  sectionTitle: {},
  sponsorInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  sponsorInfo: {},
});
