import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert, Share, Linking, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as LocalAuthentication from 'expo-local-authentication';
import {
  Phone,
  Mail,
  Link,
  Copy,
  Moon,
  Bell,
  Globe,
  LogOut,
  ChevronRight,
  Shield,
  ShieldCheck,
  ShieldX,
  Clock,
  HelpCircle,
  Lock,
  Fingerprint,
  Trash2,
  FileText,
  ScrollText,
  KeyRound,
  X,
  Share2,
  AlertTriangle,
} from 'lucide-react-native';
import Constants from 'expo-constants';
import { useTheme } from '@/theme';
import { ScreenWrapper, GradientCard, GlassCard, Avatar, RankBadge, GoldButton, SectionHeader } from '@/components/ui';
import { useAuthStore, useThemeStore, useLanguageStore } from '@/store';
import { useLockStore } from '@/store/lockStore';
import { MEDIA_BASE_URL } from '@/api/config';
import { authService, apiClient } from '@/api';
import { useT } from '@/i18n';
import { Language } from '@/i18n/translations';
import { SetupPinScreen } from './SetupPinScreen';
import { VerificationScreen } from './VerificationScreen';

interface ProfileScreenProps {
  onLogout: () => void;
}

export function ProfileScreen({ onLogout }: ProfileScreenProps) {
  const theme = useTheme();
  const { user } = useAuthStore();
  const { colorScheme, toggleColorScheme } = useThemeStore();
  const { language, setLanguage } = useLanguageStore();
  const { isPinSet, biometricEnabled, removePin, setBiometricEnabled } = useLockStore();
  const { deleteAccount } = useAuthStore();
  const t = useT();
  const [showSetupPin, setShowSetupPin] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [hasBiometric, setHasBiometric] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    LocalAuthentication.hasHardwareAsync().then(async (has) => {
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setHasBiometric(has && enrolled);
    });
  }, []);

  if (!user) return null;

  const handleCopyLink = async (link: string, isLeft: boolean) => {
    await Clipboard.setStringAsync(link);
    Alert.alert(t.profile.copied, isLeft ? t.profile.copiedLeft : t.profile.copiedRight);
  };

  const handleShareLink = async (link: string, isLeft: boolean) => {
    try {
      await Share.share({ message: `${isLeft ? t.profile.shareLeft : t.profile.shareRight} ${link}` });
    } catch {}
  };

  const handleLogout = () => {
    Alert.alert(t.auth.logoutConfirmTitle, t.auth.logoutConfirmMsg, [
      { text: t.common.cancel, style: 'cancel' },
      { text: t.auth.logout, style: 'destructive', onPress: onLogout },
    ]);
  };

  const handleLanguagePress = () => {
    Alert.alert(t.profile.selectLanguage, undefined, [
      { text: t.profile.langRu, onPress: () => setLanguage('ru' as Language) },
      { text: t.profile.langKz, onPress: () => setLanguage('kz' as Language) },
      { text: t.common.cancel, style: 'cancel' },
    ]);
  };

  const handlePinPress = () => {
    if (isPinSet) {
      Alert.alert(t.profile.pinTitle, t.profile.pinWhat, [
        { text: t.common.cancel, style: 'cancel' },
        { text: t.profile.pinChange, onPress: () => setShowSetupPin(true) },
        {
          text: t.profile.pinRemove,
          style: 'destructive',
          onPress: () =>
            Alert.alert(t.profile.pinRemoveConfirm, t.profile.pinRemoveMsg, [
              { text: t.common.cancel, style: 'cancel' },
              { text: t.profile.pinRemove, style: 'destructive', onPress: removePin },
            ]),
        },
      ]);
    } else {
      setShowSetupPin(true);
    }
  };

  const COUNTRIES = [
    { code: 'KZ', label: 'Казахстан 🇰🇿', currency: '₸' },
    { code: 'KG', label: 'Кыргызстан 🇰🇬', currency: 'сом' },
    { code: 'UZ', label: 'Өзбекстан 🇺🇿', currency: 'сўм' },
    { code: 'RU', label: 'Россия 🇷🇺', currency: '₽' },
  ];

  const handleCountryPress = () => {
    Alert.alert(t.auth.country, t.auth.selectCountry, [
      ...COUNTRIES.map(c => ({
        text: `${c.label} (${c.currency})`,
        onPress: async () => {
          const res = await apiClient.put<{ country: string }>('/users/me', { country: c.code });
          if (!res.error) useAuthStore.getState().updateUser({ country: c.code });
        },
      })),
      { text: t.common.cancel, style: 'cancel' as const },
    ]);
  };

  const handleChangePasswordSubmit = async () => {
    if (newPassword.length < 4) { Alert.alert(t.common.error, t.profile.changePasswordShort); return; }
    if (newPassword !== confirmPassword) { Alert.alert(t.common.error, t.profile.changePasswordMismatch); return; }
    setChangingPassword(true);
    const result = await authService.changePassword(oldPassword, newPassword);
    setChangingPassword(false);
    if ('error' in result) {
      Alert.alert(t.common.error, result.error);
    } else {
      Alert.alert(t.common.success, t.profile.changePasswordSuccess);
      setShowChangePassword(false);
      setOldPassword(''); setNewPassword(''); setConfirmPassword('');
    }
  };

  const handleDeleteAccount = () => {
    setDeleteConfirmText('');
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    setDeleteLoading(true);
    const success = await deleteAccount();
    setDeleteLoading(false);
    if (!success) {
      Alert.alert(t.common.error, t.profile.deleteAccountError);
    }
    setShowDeleteModal(false);
  };

  // Verification status
  const verificationStatus = user.verified === 1
    ? { label: t.verification.statusApproved, color: theme.semantic.success, icon: ShieldCheck }
    : user.verified === 2
    ? { label: t.verification.statusRejected, color: theme.semantic.error, icon: ShieldX }
    : user.status
    ? { label: t.verification.statusPending ?? 'На проверке', color: theme.semantic.warning, icon: Clock }
    : { label: t.verification.statusUnverified, color: theme.semantic.warning, icon: Shield };

  const VerifIcon = verificationStatus.icon;

  return (
    <>
      <ScreenWrapper scrollable padded={false}>
        <View style={{ paddingHorizontal: theme.screenPadding.horizontal }}>

          {/* ── Header ── */}
          <Text style={{ fontFamily: theme.fonts.displayBold, fontSize: theme.fontSizes['2xl'], color: theme.colors.foreground, marginBottom: theme.spacing[5], paddingTop: theme.spacing[2] }}>
            {t.profile.title}
          </Text>

          {/* ── Profile Hero Card ── */}
          <GradientCard variant="gold" style={{ marginBottom: theme.spacing[4] }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing[4] }}>
              <Avatar name={user.name} source={user.avatar ? `${MEDIA_BASE_URL}${user.avatar}` : undefined} size="xl" />
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={{ fontFamily: theme.fonts.bold, fontSize: theme.fontSizes.xl, color: theme.colors.foreground, marginBottom: 6 }}>
                  {user.name}
                </Text>
                <RankBadge rank={user.rank} size="sm" showName />
                <Text style={{ fontFamily: theme.fonts.regular, fontSize: theme.fontSizes.xs, color: theme.colors.mutedForeground, marginTop: 6 }}>
                  ID: {user.id}
                </Text>
              </View>
            </View>

            <View style={{ gap: 8 }}>
              {user.phone ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Phone size={14} color={theme.colors.mutedForeground} />
                  <Text style={{ fontFamily: theme.fonts.regular, fontSize: theme.fontSizes.sm, color: theme.colors.foreground }}>{user.phone}</Text>
                </View>
              ) : null}
              {user.email ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Mail size={14} color={theme.colors.mutedForeground} />
                  <Text style={{ fontFamily: theme.fonts.regular, fontSize: theme.fontSizes.sm, color: theme.colors.foreground }}>{user.email}</Text>
                </View>
              ) : null}
            </View>
          </GradientCard>

          {/* ── Verification Banner (if not verified) ── */}
          {user.verified !== 1 && (
            <TouchableOpacity onPress={() => setShowVerification(true)} activeOpacity={0.85} style={{ marginBottom: theme.spacing[4] }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: `${verificationStatus.color}12`, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: `${verificationStatus.color}30` }}>
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${verificationStatus.color}20`, alignItems: 'center', justifyContent: 'center' }}>
                  <VerifIcon size={18} color={verificationStatus.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: theme.fonts.semibold, fontSize: theme.fontSizes.sm, color: theme.colors.foreground }}>{t.verification.title}</Text>
                  <Text style={{ fontFamily: theme.fonts.regular, fontSize: 11, color: verificationStatus.color, marginTop: 2 }}>{verificationStatus.label}</Text>
                </View>
                <ChevronRight size={18} color={theme.colors.mutedForeground} />
              </View>
            </TouchableOpacity>
          )}

          {/* ── Referral Links ── */}
          <View style={{ marginBottom: theme.spacing[4] }}>
            <SectionHeader title={t.profile.referralLinks} />
            <GradientCard padding={0}>
              {[
                { label: t.profile.leftLeg, link: user.leftLegLink, isLeft: true },
                { label: t.profile.rightLeg, link: user.rightLegLink, isLeft: false },
              ].map(({ label, link, isLeft }, i) => (
                <View key={label}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14 }}>
                    <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: `${theme.gold.primary}18`, alignItems: 'center', justifyContent: 'center' }}>
                      <Link size={15} color={theme.colors.goldForeground} />
                    </View>
                    <Text style={{ flex: 1, fontFamily: theme.fonts.medium, fontSize: theme.fontSizes.sm, color: theme.colors.foreground, marginLeft: 12 }}>{label}</Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity onPress={() => handleCopyLink(link, isLeft)} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: theme.colors.muted, alignItems: 'center', justifyContent: 'center' }}>
                        <Copy size={16} color={theme.colors.foreground} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleShareLink(link, isLeft)} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${theme.gold.primary}18`, alignItems: 'center', justifyContent: 'center' }}>
                        <Share2 size={16} color={theme.colors.goldForeground} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  {i === 0 && <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border, marginLeft: 58 }} />}
                </View>
              ))}
            </GradientCard>
          </View>

          {/* ── Security ── */}
          <View style={{ marginBottom: theme.spacing[4] }}>
            <SectionHeader title={t.profile.security ?? 'Безопасность'} />
            <GradientCard padding={0}>
              <MenuItem icon={Lock} label={isPinSet ? t.profile.pinEnabled : t.profile.pinSet} onPress={handlePinPress} theme={theme} />
              <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border, marginLeft: 58 }} />
              <MenuItem icon={KeyRound} label={t.profile.changePassword} onPress={() => setShowChangePassword(true)} theme={theme} />
              {isPinSet && hasBiometric && (
                <>
                  <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border, marginLeft: 58 }} />
                  <MenuItem
                    icon={Fingerprint}
                    label={t.profile.biometric}
                    theme={theme}
                    rightElement={
                      <Switch value={biometricEnabled} onValueChange={setBiometricEnabled}
                        trackColor={{ false: theme.colors.muted, true: `${theme.gold.primary}60` }}
                        thumbColor={biometricEnabled ? theme.colors.goldForeground : theme.colors.mutedForeground}
                      />
                    }
                  />
                </>
              )}
              {user.verified !== 1 && (
                <>
                  <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border, marginLeft: 58 }} />
                  <MenuItem icon={VerifIcon} label={t.verification.title} value={verificationStatus.label} onPress={() => setShowVerification(true)} theme={theme} />
                </>
              )}
            </GradientCard>
          </View>

          {/* ── Settings ── */}
          <View style={{ marginBottom: theme.spacing[4] }}>
            <SectionHeader title={t.profile.settings} />
            <GradientCard padding={0}>
              <MenuItem icon={Moon} label={t.profile.darkTheme} theme={theme} rightElement={
                <Switch value={colorScheme === 'dark'} onValueChange={toggleColorScheme}
                  trackColor={{ false: theme.colors.muted, true: theme.gold.primary }}
                  thumbColor="#FFF"
                />
              } />
              <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border, marginLeft: 58 }} />
              <MenuItem icon={Globe} label={t.profile.language} value={t.profile.currentLang} onPress={handleLanguagePress} theme={theme} />
              <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border, marginLeft: 58 }} />
              <MenuItem icon={Globe} label={t.auth.country} value={COUNTRIES.find(c => c.code === (user.country || 'KZ'))?.label || 'Казахстан 🇰🇿'} onPress={handleCountryPress} theme={theme} />
              <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border, marginLeft: 58 }} />
              <MenuItem icon={Bell} label={t.profile.notifications} value={t.profile.notificationsEnabled} theme={theme} />
            </GradientCard>
          </View>

          {/* ── Info ── */}
          <View style={{ marginBottom: theme.spacing[4] }}>
            <SectionHeader title={t.profile.information ?? 'Информация'} />
            <GradientCard padding={0}>
              <MenuItem icon={HelpCircle} label={t.profile.help} onPress={() => Alert.alert(t.profile.help, t.profile.helpMsg, [{ text: t.common.ok }])} theme={theme} />
              <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border, marginLeft: 58 }} />
              <MenuItem icon={FileText} label={t.profile.privacy} onPress={() => Linking.openURL('https://fenixinternationalcompany.kz/privacy')} theme={theme} />
              <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border, marginLeft: 58 }} />
              <MenuItem icon={ScrollText} label={t.profile.terms} onPress={() => Linking.openURL('https://fenixinternationalcompany.kz/terms')} theme={theme} />
            </GradientCard>
          </View>

          {/* ── Logout ── */}
          <View style={{ marginBottom: theme.spacing[4] }}>
            <GradientCard padding={0}>
              <MenuItem icon={LogOut} label={t.profile.logout} onPress={handleLogout} danger theme={theme} />
            </GradientCard>
          </View>

          {/* ── Delete Account — Danger Zone ── */}
          <View style={{ marginBottom: theme.spacing[4] }}>
            <SectionHeader title={t.profile.deleteAccountDangerTitle} badgeColor={theme.semantic.error} />
            <View style={{
              borderRadius: theme.borderRadius['2xl'],
              borderWidth: 1,
              borderColor: `${theme.semantic.error}35`,
              backgroundColor: `${theme.semantic.error}08`,
              padding: theme.spacing[4],
            }}>
              <View style={{ flexDirection: 'row', gap: theme.spacing[3], marginBottom: theme.spacing[4] }}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: `${theme.semantic.error}15`, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <AlertTriangle size={22} color={theme.semantic.error} />
                </View>
                <Text style={{ flex: 1, fontFamily: theme.fonts.regular, fontSize: theme.fontSizes.sm, color: theme.colors.mutedForeground, lineHeight: 20 }}>
                  {t.profile.deleteAccountWarning}
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleDeleteAccount}
                activeOpacity={0.7}
                style={{
                  borderWidth: 1,
                  borderColor: `${theme.semantic.error}60`,
                  borderRadius: theme.borderRadius.xl,
                  paddingVertical: theme.spacing[3],
                  alignItems: 'center',
                  backgroundColor: `${theme.semantic.error}10`,
                }}
              >
                <Text style={{ fontFamily: theme.fonts.semibold, fontSize: theme.fontSizes.sm, color: theme.semantic.error }}>
                  {t.profile.deleteAccount}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Version */}
          <Text style={{ fontFamily: theme.fonts.regular, fontSize: theme.fontSizes.xs, color: theme.colors.mutedForeground, textAlign: 'center', marginBottom: theme.spacing[8] }}>
            Fenix International Company v{Constants.expoConfig?.version ?? '1.0.0'}
          </Text>

        </View>
      </ScreenWrapper>

      {/* Verification overlay */}
      {showVerification && (
        <View style={StyleSheet.absoluteFill}>
          <VerificationScreen onBack={() => setShowVerification(false)} />
        </View>
      )}

      {/* Change password modal */}
      <Modal visible={showChangePassword} transparent animationType="fade" onRequestClose={() => setShowChangePassword(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <GlassCard cornerRadius={20} style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.foreground, fontFamily: theme.fonts.bold }]}>
                {t.profile.changePassword}
              </Text>
              <TouchableOpacity onPress={() => setShowChangePassword(false)}>
                <X size={22} color={theme.colors.mutedForeground} />
              </TouchableOpacity>
            </View>
            {([
              { placeholder: t.profile.changePasswordOld, value: oldPassword, onChange: setOldPassword },
              { placeholder: t.profile.changePasswordNew, value: newPassword, onChange: setNewPassword },
              { placeholder: t.profile.changePasswordConfirm, value: confirmPassword, onChange: setConfirmPassword },
            ] as const).map(({ placeholder, value, onChange }) => (
              <TextInput key={placeholder}
                style={[styles.modalInput, { backgroundColor: theme.colors.muted, color: theme.colors.foreground, borderColor: theme.colors.border }]}
                placeholder={placeholder}
                placeholderTextColor={theme.colors.mutedForeground}
                secureTextEntry
                value={value}
                onChangeText={onChange as any}
              />
            ))}
            <GoldButton title={changingPassword ? t.common.loading : t.common.save} onPress={handleChangePasswordSubmit} loading={changingPassword} style={{ marginTop: 8 }} />
          </GlassCard>
        </KeyboardAvoidingView>
      </Modal>

      {/* Delete account confirmation modal */}
      <Modal visible={showDeleteModal} transparent animationType="fade" onRequestClose={() => setShowDeleteModal(false)}>
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={{ backgroundColor: theme.colors.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, gap: 16 }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: `${theme.semantic.error}15`, alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={22} color={theme.semantic.error} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: theme.fonts.bold, fontSize: theme.fontSizes.lg, color: theme.semantic.error }}>
                  {t.profile.deleteAccount}
                </Text>
                <Text style={{ fontFamily: theme.fonts.regular, fontSize: theme.fontSizes.xs, color: theme.colors.mutedForeground, marginTop: 2 }}>
                  {t.profile.deleteAccountDangerTitle}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowDeleteModal(false)} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.muted, alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} color={theme.colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            {/* Warning */}
            <View style={{ backgroundColor: `${theme.semantic.error}0C`, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: `${theme.semantic.error}25` }}>
              <Text style={{ fontFamily: theme.fonts.regular, fontSize: theme.fontSizes.sm, color: theme.colors.mutedForeground, lineHeight: 20 }}>
                {t.profile.deleteAccountWarning}
              </Text>
            </View>

            {/* Confirm input */}
            <View style={{ gap: 8 }}>
              <Text style={{ fontFamily: theme.fonts.medium, fontSize: theme.fontSizes.sm, color: theme.colors.foreground }}>
                {t.profile.deleteAccountTypeConfirm}{' '}
                <Text style={{ fontFamily: theme.fonts.bold, color: theme.semantic.error }}>{t.profile.deleteAccountConfirmWord}</Text>
              </Text>
              <TextInput
                style={{
                  height: 48,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: deleteConfirmText === t.profile.deleteAccountConfirmWord
                    ? `${theme.semantic.error}60`
                    : theme.colors.border,
                  backgroundColor: theme.colors.muted,
                  paddingHorizontal: 16,
                  fontFamily: theme.fonts.medium,
                  fontSize: theme.fontSizes.base,
                  color: theme.semantic.error,
                  letterSpacing: 2,
                }}
                placeholder={t.profile.deleteAccountConfirmWord}
                placeholderTextColor={theme.colors.mutedForeground}
                value={deleteConfirmText}
                onChangeText={setDeleteConfirmText}
                autoCapitalize="characters"
                autoCorrect={false}
              />
            </View>

            {/* Actions */}
            <View style={{ gap: 10 }}>
              <TouchableOpacity
                onPress={handleConfirmDelete}
                disabled={deleteConfirmText !== t.profile.deleteAccountConfirmWord || deleteLoading}
                activeOpacity={0.75}
                style={{
                  height: 50,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: deleteConfirmText === t.profile.deleteAccountConfirmWord
                    ? theme.semantic.error
                    : `${theme.semantic.error}25`,
                }}
              >
                <Text style={{
                  fontFamily: theme.fonts.bold,
                  fontSize: theme.fontSizes.base,
                  color: deleteConfirmText === t.profile.deleteAccountConfirmWord ? '#FFF' : `${theme.semantic.error}60`,
                }}>
                  {deleteLoading ? t.common.loading : t.profile.deleteAccount}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowDeleteModal(false)}
                style={{ height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.muted }}
              >
                <Text style={{ fontFamily: theme.fonts.medium, fontSize: theme.fontSizes.base, color: theme.colors.foreground }}>
                  {t.common.cancel}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* PIN setup overlay */}
      {showSetupPin && (
        <View style={StyleSheet.absoluteFill}>
          <SetupPinScreen onDone={() => setShowSetupPin(false)} onCancel={() => setShowSetupPin(false)} />
        </View>
      )}
    </>
  );
}

// ── MenuItem ──────────────────────────────────────────────────────────────────

function MenuItem({ icon: Icon, label, value, onPress, rightElement, danger, theme }: {
  icon: any; label: string; value?: string; onPress?: () => void;
  rightElement?: React.ReactNode; danger?: boolean; theme: any;
}) {
  return (
    <TouchableOpacity onPress={onPress} disabled={!onPress && !rightElement} activeOpacity={0.7}
      style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 14 }}
    >
      <View style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: danger ? `${theme.semantic.error}15` : `${theme.colors.mutedForeground}15`, alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={16} color={danger ? theme.semantic.error : theme.colors.mutedForeground} />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={{ fontFamily: theme.fonts.medium, fontSize: theme.fontSizes.sm, color: danger ? theme.semantic.error : theme.colors.foreground }}>
          {label}
        </Text>
        {value && (
          <Text style={{ fontFamily: theme.fonts.regular, fontSize: 11, color: theme.colors.mutedForeground, marginTop: 2 }}>{value}</Text>
        )}
      </View>
      {rightElement ?? (onPress && <ChevronRight size={18} color={theme.colors.mutedForeground} />)}
    </TouchableOpacity>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 18,
  },
  modalInput: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
  },
});
