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
import { User, Phone, Mail, Lock, Search, MapPin, CheckCircle, Square, CheckSquare, Check } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { CompactHeader, GoldButton, GlassInput, GlassCard, GradientCard } from '@/components/ui';
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

  const [step, setStep] = useState(0);

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

  const goNext = () => {
    setLocalError('');
    clearError();

    if (step === 0) {
      if (!sponsorId.trim()) { setLocalError(t.auth.sponsorPlaceholder); return; }
      if (!sponsorName) { setLocalError(t.auth.checkSponsorFirst); return; }
      setStep(1);
    } else if (step === 1) {
      if (partnerType === null) { setLocalError(t.auth.selectPartnerType); return; }
      if (!password.trim()) { setLocalError(t.auth.loginPasswordError); return; }
      if (password.length < 6) { setLocalError(t.auth.passwordTooShort); return; }
      if (password !== confirmPassword) { setLocalError(t.auth.passwordMismatch); return; }
      setStep(2);
    }
  };

  const handleRegister = async () => {
    setLocalError('');
    clearError();

    if (!name.trim()) { setLocalError(t.auth.enterFio); return; }
    if (!phone.trim()) { setLocalError(t.auth.enterPhone); return; }
    if (!ageConfirmed) { setLocalError(t.auth.ageConfirmRequired); return; }

    const sponsorNum = parseInt(sponsorId, 10);
    if (isNaN(sponsorNum)) { setLocalError(t.auth.sponsorInvalidFmt); return; }

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

  const STEPS = [t.auth.sponsor, t.auth.accountData, t.auth.personalData];

  if (registered) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center', padding: 32 }]}>
        <CheckCircle size={64} color={theme.semantic.success} style={{ marginBottom: 20 }} />
        <Text style={{ fontFamily: theme.fonts.displayBold, fontSize: theme.fontSizes['2xl'], color: theme.colors.foreground, textAlign: 'center', marginBottom: 12 }}>
          {t.auth.registrationSent}
        </Text>
        <Text style={{ fontFamily: theme.fonts.regular, fontSize: theme.fontSizes.md, color: theme.colors.mutedForeground, textAlign: 'center', marginBottom: 32 }}>
          {t.auth.registrationPending}
        </Text>
        <GoldButton title={t.auth.backToLogin} onPress={onBack} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: theme.screenPadding.horizontal }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <CompactHeader
          onBack={step === 0 ? onBack : () => setStep((s) => s - 1)}
          title={t.auth.registerTitle}
          paddingBottom={theme.spacing[5]}
        />

        {/* Step Indicator */}
        <View style={[styles.stepRow, { marginBottom: theme.spacing[6] }]}>
          {STEPS.map((label, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <React.Fragment key={i}>
                <View style={{ alignItems: 'center', gap: 6 }}>
                  <View style={{
                    width: 32, height: 32, borderRadius: 16,
                    backgroundColor: done ? theme.gold.primary : active ? `${theme.gold.primary}20` : theme.colors.card,
                    borderWidth: active ? 2 : done ? 0 : 1,
                    borderColor: active ? theme.gold.primary : theme.colors.border,
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    {done
                      ? <Check size={16} color="#000" />
                      : <Text style={{ fontFamily: theme.fonts.bold, fontSize: theme.fontSizes.sm, color: active ? theme.gold.primary : theme.colors.mutedForeground }}>{i + 1}</Text>
                    }
                  </View>
                  <Text style={{ fontFamily: theme.fonts.regular, fontSize: 10, color: active ? theme.gold.primary : done ? theme.colors.mutedForeground : theme.colors.mutedForeground, maxWidth: 64, textAlign: 'center' }} numberOfLines={1}>
                    {label}
                  </Text>
                </View>
                {i < STEPS.length - 1 && (
                  <View style={{ flex: 1, height: 2, backgroundColor: i < step ? theme.gold.primary : theme.colors.border, marginBottom: 22, marginHorizontal: 4 }} />
                )}
              </React.Fragment>
            );
          })}
        </View>

        {/* Error */}
        {error ? (
          <View style={{
            backgroundColor: `${theme.semantic.error}20`,
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing[3],
            marginBottom: theme.spacing[4],
          }}>
            <Text style={{ fontFamily: theme.fonts.medium, fontSize: theme.fontSizes.sm, color: theme.semantic.error }}>
              {error}
            </Text>
          </View>
        ) : null}

        {/* Step 0: Sponsor */}
        {step === 0 && (
          <GradientCard style={{ marginBottom: theme.spacing[4] }}>
            <Text style={{ fontFamily: theme.fonts.semibold, fontSize: theme.fontSizes.md, color: theme.colors.foreground, marginBottom: theme.spacing[3] }}>
              {t.auth.sponsor}
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: theme.spacing[2], marginBottom: sponsorName ? 0 : undefined }}>
              <View style={{ flex: 1 }}>
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
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: theme.spacing[2],
                backgroundColor: `${theme.semantic.success}15`,
                borderRadius: theme.borderRadius.lg,
                padding: theme.spacing[3],
                marginTop: theme.spacing[3],
              }}>
                <CheckCircle size={16} color={theme.semantic.success} />
                <Text style={{ fontFamily: theme.fonts.medium, fontSize: theme.fontSizes.sm, color: theme.semantic.success, flex: 1 }}>
                  {t.auth.sponsorFound}{sponsorName}
                </Text>
              </View>
            ) : null}
          </GradientCard>
        )}

        {/* Step 1: Account */}
        {step === 1 && (
          <GradientCard style={{ marginBottom: theme.spacing[4] }}>
            <Text style={{ fontFamily: theme.fonts.semibold, fontSize: theme.fontSizes.md, color: theme.colors.foreground, marginBottom: theme.spacing[3] }}>
              {t.auth.accountData}
            </Text>

            <Text style={{ fontFamily: theme.fonts.medium, fontSize: theme.fontSizes.sm, color: theme.colors.mutedForeground, marginBottom: theme.spacing[2] }}>
              {t.auth.partnerType} *
            </Text>
            <View style={{ flexDirection: 'row', gap: theme.spacing[2], marginBottom: theme.spacing[4] }}>
              {([{ label: t.auth.leader, value: 1 }, { label: t.auth.client, value: 0 }] as const).map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setPartnerType(opt.value)}
                  activeOpacity={0.8}
                  style={{ flex: 1 }}
                >
                  <GlassCard
                    cornerRadius={theme.borderRadius.lg}
                    tint={partnerType === opt.value ? theme.gold.primary : '#ffffff'}
                    style={{
                      paddingVertical: theme.spacing[2],
                      alignItems: 'center',
                      borderWidth: partnerType === opt.value ? 1.5 : StyleSheet.hairlineWidth,
                      borderColor: partnerType === opt.value ? theme.gold.primary : theme.colors.border,
                    }}
                  >
                    <Text style={{ fontFamily: theme.fonts.medium, fontSize: theme.fontSizes.sm, color: partnerType === opt.value ? theme.colors.goldForeground : theme.colors.mutedForeground }}>
                      {opt.label}
                    </Text>
                  </GlassCard>
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
        )}

        {/* Step 2: Personal */}
        {step === 2 && (
          <GradientCard style={{ marginBottom: theme.spacing[4] }}>
            <Text style={{ fontFamily: theme.fonts.semibold, fontSize: theme.fontSizes.md, color: theme.colors.foreground, marginBottom: theme.spacing[3] }}>
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
              {t.auth.country} *
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing[2], marginBottom: theme.spacing[4] }}>
              {COUNTRIES.map(opt => (
                <TouchableOpacity key={opt.code} onPress={() => setCountry(opt.code)} activeOpacity={0.8}>
                  <GlassCard
                    cornerRadius={theme.borderRadius.lg}
                    tint={country === opt.code ? theme.gold.primary : '#ffffff'}
                    style={{
                      paddingVertical: theme.spacing[2],
                      paddingHorizontal: theme.spacing[3],
                      flexDirection: 'row',
                      alignItems: 'center',
                      borderWidth: country === opt.code ? 1.5 : StyleSheet.hairlineWidth,
                      borderColor: country === opt.code ? theme.gold.primary : theme.colors.border,
                    }}
                  >
                    <Text style={{ fontFamily: theme.fonts.medium, fontSize: theme.fontSizes.sm, color: country === opt.code ? theme.colors.goldForeground : theme.colors.mutedForeground }}>
                      {opt.label}
                    </Text>
                    <Text style={{ fontFamily: theme.fonts.regular, fontSize: theme.fontSizes.xs, color: theme.colors.mutedForeground, marginLeft: 4 }}>
                      {opt.currency}
                    </Text>
                  </GlassCard>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={() => setAgeConfirmed(!ageConfirmed)}
              style={{ flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing[3] }}
            >
              {ageConfirmed
                ? <CheckSquare size={22} color={theme.colors.goldForeground} />
                : <Square size={22} color={theme.colors.mutedForeground} />
              }
              <Text style={{ flex: 1, fontFamily: theme.fonts.regular, fontSize: theme.fontSizes.sm, color: theme.colors.mutedForeground, lineHeight: 20 }}>
                {t.auth.ageConfirm}
                <Text
                  style={{ color: theme.colors.goldForeground, textDecorationLine: 'underline' }}
                  onPress={() => Linking.openURL('https://zharqyn.life/terms')}
                >
                  {t.auth.termsOfUse}
                </Text>
                {' и '}
                <Text
                  style={{ color: theme.colors.goldForeground, textDecorationLine: 'underline' }}
                  onPress={() => Linking.openURL('https://zharqyn.life/privacy')}
                >
                  {t.auth.privacyPolicy}
                </Text>
                .
              </Text>
            </TouchableOpacity>
          </GradientCard>
        )}

        {/* Navigation Buttons */}
        {step < 2 ? (
          <GoldButton
            title={t.common.next}
            onPress={goNext}
            style={{ marginBottom: theme.spacing[6] }}
          />
        ) : (
          <GoldButton
            title={t.auth.register}
            onPress={handleRegister}
            loading={isLoading}
            style={{ marginBottom: theme.spacing[6] }}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 40,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
