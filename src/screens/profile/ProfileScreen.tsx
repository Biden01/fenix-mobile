import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert, Share, Linking, Modal, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as LocalAuthentication from 'expo-local-authentication';
import {
  User,
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
} from 'lucide-react-native';
import Constants from 'expo-constants';
import { useTheme } from '@/theme';
import { ScreenWrapper, GradientCard, GlassCard, Avatar, RankBadge, GoldButton, GlassButton } from '@/components/ui';
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
      await Share.share({
        message: `${isLeft ? t.profile.shareLeft : t.profile.shareRight} ${link}`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      t.auth.logoutConfirmTitle,
      t.auth.logoutConfirmMsg,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.auth.logout,
          style: 'destructive',
          onPress: onLogout,
        },
      ]
    );
  };

  const handleLanguagePress = () => {
    Alert.alert(
      t.profile.selectLanguage,
      undefined,
      [
        {
          text: t.profile.langRu,
          onPress: () => setLanguage('ru' as Language),
          style: language === 'ru' ? 'default' : 'default',
        },
        {
          text: t.profile.langKz,
          onPress: () => setLanguage('kz' as Language),
        },
        { text: t.common.cancel, style: 'cancel' },
      ]
    );
  };

  const handlePinPress = () => {
    if (isPinSet) {
      Alert.alert(
        t.profile.pinTitle,
        t.profile.pinWhat,
        [
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
        ]
      );
    } else {
      setShowSetupPin(true);
    }
  };

  const handleHelpPress = () => {
    Alert.alert(t.profile.help, t.profile.helpMsg, [{ text: t.common.ok }]);
  };

  const handleChangePasswordSubmit = async () => {
    if (newPassword.length < 4) {
      Alert.alert(t.common.error, t.profile.changePasswordShort);
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert(t.common.error, t.profile.changePasswordMismatch);
      return;
    }
    setChangingPassword(true);
    const result = await authService.changePassword(oldPassword, newPassword);
    setChangingPassword(false);
    if ('error' in result) {
      Alert.alert(t.common.error, result.error);
    } else {
      Alert.alert(t.common.success, t.profile.changePasswordSuccess);
      setShowChangePassword(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const COUNTRIES = [
    { code: 'KZ', label: 'Казахстан 🇰🇿', currency: '₸' },
    { code: 'KG', label: 'Кыргызстан 🇰🇬', currency: 'сом' },
    { code: 'UZ', label: 'Өзбекстан 🇺🇿', currency: 'сўм' },
    { code: 'RU', label: 'Россия 🇷🇺', currency: '₽' },
  ];

  const handleCountryPress = () => {
    Alert.alert(
      t.auth.country,
      t.auth.selectCountry,
      [
        ...COUNTRIES.map(c => ({
          text: `${c.label} (${c.currency})`,
          onPress: async () => {
            const res = await apiClient.put<{ country: string }>('/users/me', { country: c.code });
            if (!res.error) {
              useAuthStore.getState().updateUser({ country: c.code });
            }
          },
        })),
        { text: t.common.cancel, style: 'cancel' as const },
      ]
    );
  };

  const handlePrivacyPolicy = () => {
    Linking.openURL('https://fenixinternationalcompany.kz/privacy');
  };

  const handleTerms = () => {
    Linking.openURL('https://fenixinternationalcompany.kz/terms');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t.profile.deleteAccount,
      t.profile.deleteAccountMsg,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.common.delete,
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              t.profile.deleteAccountConfirm,
              t.profile.deleteAccountFinal,
              [
                { text: t.common.cancel, style: 'cancel' },
                {
                  text: t.profile.deleteAccountYes,
                  style: 'destructive',
                  onPress: async () => {
                    const success = await deleteAccount();
                    if (!success) {
                      Alert.alert(t.common.error, t.profile.deleteAccountError);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const MenuItem = ({
    icon: Icon,
    label,
    value,
    onPress,
    rightElement,
    danger,
  }: {
    icon: any;
    label: string;
    value?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    danger?: boolean;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress && !rightElement}
      style={[
        styles.menuItem,
        {
          paddingVertical: theme.spacing[4],
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: 'rgba(255,255,255,0.08)',
        },
      ]}
    >
      <GlassCard
        cornerRadius={theme.borderRadius.lg}
        tint={danger ? theme.semantic.error : '#ffffff'}
        style={[
          styles.menuIcon,
          {
            padding: theme.spacing[2],
            backgroundColor: danger ? `${theme.semantic.error}15` : 'transparent',
          },
        ]}
      >
        <Icon size={20} color={danger ? theme.semantic.error : theme.colors.mutedForeground} />
      </GlassCard>
      <View style={{ flex: 1, marginLeft: theme.spacing[3] }}>
        <Text
          style={[
            {
              fontFamily: theme.fonts.medium,
              fontSize: theme.fontSizes.sm,
              color: danger ? theme.semantic.error : theme.colors.foreground,
            },
          ]}
        >
          {label}
        </Text>
        {value && (
          <Text
            style={[
              {
                fontFamily: theme.fonts.regular,
                fontSize: theme.fontSizes.xs,
                color: theme.colors.mutedForeground,
                marginTop: 2,
              },
            ]}
          >
            {value}
          </Text>
        )}
      </View>
      {rightElement || (onPress && <ChevronRight size={20} color={theme.colors.mutedForeground} />)}
    </TouchableOpacity>
  );

  return (
    <>
    <ScreenWrapper scrollable padded={false}>
      <View style={{ paddingHorizontal: theme.screenPadding.horizontal }}>
        <Text
          style={[
            {
              fontFamily: theme.fonts.displayBold,
              fontSize: theme.fontSizes['2xl'],
              color: theme.colors.foreground,
              marginBottom: theme.spacing[4],
            },
          ]}
        >
          {t.profile.title}
        </Text>

        {/* Profile Card */}
        <GradientCard variant="gold" style={{ marginBottom: theme.spacing[6] }}>
          <View style={styles.profileHeader}>
            <Avatar name={user.name} source={user.avatar ? `${MEDIA_BASE_URL}${user.avatar}` : undefined} size="xl" />
            <View style={styles.profileInfo}>
              <Text
                style={[
                  {
                    fontFamily: theme.fonts.bold,
                    fontSize: theme.fontSizes.xl,
                    color: theme.colors.foreground,
                    marginBottom: theme.spacing[1],
                  },
                ]}
              >
                {user.name}
              </Text>
              <RankBadge rank={user.rank} size="md" showName />
              <Text
                style={[
                  {
                    fontFamily: theme.fonts.regular,
                    fontSize: theme.fontSizes.xs,
                    color: theme.colors.mutedForeground,
                    marginTop: theme.spacing[2],
                  },
                ]}
              >
                ID: {user.id}
              </Text>
            </View>
          </View>

          <View style={[styles.profileDetails, { marginTop: theme.spacing[4] }]}>
            <View style={styles.profileDetailRow}>
              <Phone size={16} color={theme.colors.mutedForeground} />
              <Text
                style={[
                  {
                    fontFamily: theme.fonts.regular,
                    fontSize: theme.fontSizes.sm,
                    color: theme.colors.foreground,
                    marginLeft: theme.spacing[2],
                  },
                ]}
              >
                {user.phone}
              </Text>
            </View>
            <View style={[styles.profileDetailRow, { marginTop: theme.spacing[2] }]}>
              <Mail size={16} color={theme.colors.mutedForeground} />
              <Text
                style={[
                  {
                    fontFamily: theme.fonts.regular,
                    fontSize: theme.fontSizes.sm,
                    color: theme.colors.foreground,
                    marginLeft: theme.spacing[2],
                  },
                ]}
              >
                {user.email}
              </Text>
            </View>
          </View>
        </GradientCard>

        {/* Referral Links */}
        <GradientCard style={{ marginBottom: theme.spacing[6] }}>
          <Text
            style={[
              {
                fontFamily: theme.fonts.semibold,
                fontSize: theme.fontSizes.md,
                color: theme.colors.foreground,
                marginBottom: theme.spacing[4],
              },
            ]}
          >
            {t.profile.referralLinks}
          </Text>

          <View style={styles.linkCard}>
            <View style={styles.linkHeader}>
              <Link size={16} color={theme.colors.goldForeground} />
              <Text
                style={[
                  {
                    fontFamily: theme.fonts.medium,
                    fontSize: theme.fontSizes.sm,
                    color: theme.colors.foreground,
                    marginLeft: theme.spacing[2],
                  },
                ]}
              >
                {t.profile.leftLeg}
              </Text>
            </View>
            <View style={styles.linkActions}>
              <TouchableOpacity
                onPress={() => handleCopyLink(user.leftLegLink, true)}
                style={[
                  styles.linkButton,
                  {
                    backgroundColor: theme.colors.muted,
                    borderRadius: theme.borderRadius.lg,
                    padding: theme.spacing[2],
                  },
                ]}
              >
                <Copy size={18} color={theme.colors.foreground} />
              </TouchableOpacity>
              <GlassButton
                label={t.profile.share}
                icon="square.and.arrow.up"
                tint="#FFD700"
                onPress={() => handleShareLink(user.leftLegLink, true)}
                style={{ marginLeft: theme.spacing[2] }}
              />
            </View>
          </View>

          <View style={[styles.linkCard, { marginTop: theme.spacing[3] }]}>
            <View style={styles.linkHeader}>
              <Link size={16} color={theme.colors.goldForeground} />
              <Text
                style={[
                  {
                    fontFamily: theme.fonts.medium,
                    fontSize: theme.fontSizes.sm,
                    color: theme.colors.foreground,
                    marginLeft: theme.spacing[2],
                  },
                ]}
              >
                {t.profile.rightLeg}
              </Text>
            </View>
            <View style={styles.linkActions}>
              <TouchableOpacity
                onPress={() => handleCopyLink(user.rightLegLink, false)}
                style={[
                  styles.linkButton,
                  {
                    backgroundColor: theme.colors.muted,
                    borderRadius: theme.borderRadius.lg,
                    padding: theme.spacing[2],
                  },
                ]}
              >
                <Copy size={18} color={theme.colors.foreground} />
              </TouchableOpacity>
              <GlassButton
                label={t.profile.share}
                icon="square.and.arrow.up"
                tint="#FFD700"
                onPress={() => handleShareLink(user.rightLegLink, false)}
                style={{ marginLeft: theme.spacing[2] }}
              />
            </View>
          </View>
        </GradientCard>

        {/* Верификация */}
        <GradientCard style={{ marginBottom: theme.spacing[4] }} padding={0}>
          <View style={{ paddingHorizontal: theme.spacing[4] }}>
            <MenuItem
              icon={
                user.verified === 1 ? ShieldCheck
                : user.verified === 2 ? ShieldX
                : user.verified === 0 && user.status ? Clock
                : Shield
              }
              label={t.verification.title}
              value={
                user.verified === 1 ? t.verification.statusApproved
                : user.verified === 2 ? t.verification.statusRejected
                : t.verification.statusUnverified
              }
              onPress={() => setShowVerification(true)}
              rightElement={
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{
                    width: 8, height: 8, borderRadius: 4,
                    backgroundColor: user.verified === 1 ? theme.semantic.success
                      : user.verified === 2 ? theme.semantic.error
                      : theme.semantic.warning,
                  }} />
                  <ChevronRight size={20} color={theme.colors.mutedForeground} />
                </View>
              }
            />
          </View>
        </GradientCard>

        {/* Settings */}
        <GradientCard style={{ marginBottom: theme.spacing[6] }} padding={0}>
          <View style={{ paddingHorizontal: theme.spacing[4], paddingTop: theme.spacing[4] }}>
            <Text
              style={[
                {
                  fontFamily: theme.fonts.semibold,
                  fontSize: theme.fontSizes.md,
                  color: theme.colors.foreground,
                  marginBottom: theme.spacing[2],
                },
              ]}
            >
              {t.profile.settings}
            </Text>
          </View>

          <View style={{ paddingHorizontal: theme.spacing[4] }}>
            <MenuItem
              icon={Moon}
              label={t.profile.darkTheme}
              rightElement={
                <Switch
                  value={colorScheme === 'dark'}
                  onValueChange={toggleColorScheme}
                  trackColor={{
                    false: theme.colors.muted,
                    true: theme.gold.primary,
                  }}
                  thumbColor="#FFF"
                />
              }
            />
            <MenuItem
              icon={Bell}
              label={t.profile.notifications}
              value={t.profile.notificationsEnabled}
            />
            <MenuItem
              icon={Globe}
              label={t.profile.language}
              value={t.profile.currentLang}
              onPress={handleLanguagePress}
            />
            <MenuItem
              icon={Globe}
              label={t.auth.country}
              value={COUNTRIES.find(c => c.code === (user.country || 'KZ'))?.label || 'Казахстан 🇰🇿'}
              onPress={handleCountryPress}
            />
            <MenuItem
              icon={Lock}
              label={isPinSet ? t.profile.pinEnabled : t.profile.pinSet}
              onPress={handlePinPress}
            />
            <MenuItem
              icon={KeyRound}
              label={t.profile.changePassword}
              onPress={() => setShowChangePassword(true)}
            />
            {isPinSet && hasBiometric && (
              <MenuItem
                icon={Fingerprint}
                label={t.profile.biometric}
                rightElement={
                  <Switch
                    value={biometricEnabled}
                    onValueChange={setBiometricEnabled}
                    trackColor={{ false: theme.colors.muted, true: `${theme.gold.primary}60` }}
                    thumbColor={biometricEnabled ? theme.colors.goldForeground : theme.colors.mutedForeground}
                  />
                }
              />
            )}
            <MenuItem
              icon={HelpCircle}
              label={t.profile.help}
              onPress={handleHelpPress}
            />
            <MenuItem
              icon={FileText}
              label={t.profile.privacy}
              onPress={handlePrivacyPolicy}
            />
            <MenuItem
              icon={ScrollText}
              label={t.profile.terms}
              onPress={handleTerms}
            />
          </View>
        </GradientCard>

        {/* Logout + Delete Account */}
        <GradientCard padding={0} style={{ marginBottom: theme.spacing[6] }}>
          <View style={{ paddingHorizontal: theme.spacing[4] }}>
            <MenuItem
              icon={LogOut}
              label={t.profile.logout}
              onPress={handleLogout}
              danger
            />
            <MenuItem
              icon={Trash2}
              label={t.profile.deleteAccount}
              onPress={handleDeleteAccount}
              danger
            />
          </View>
        </GradientCard>

        {/* Version */}
        <Text
          style={[
            {
              fontFamily: theme.fonts.regular,
              fontSize: theme.fontSizes.xs,
              color: theme.colors.mutedForeground,
              textAlign: 'center',
              marginBottom: theme.spacing[4],
            },
          ]}
        >
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
    <Modal
      visible={showChangePassword}
      transparent
      animationType="fade"
      onRequestClose={() => setShowChangePassword(false)}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <GlassCard cornerRadius={20} style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.colors.foreground, fontFamily: theme.fonts.bold }]}>
              {t.profile.changePassword}
            </Text>
            <TouchableOpacity onPress={() => setShowChangePassword(false)}>
              <X size={22} color={theme.colors.mutedForeground} />
            </TouchableOpacity>
          </View>
          <TextInput
            style={[styles.modalInput, { backgroundColor: theme.colors.muted, color: theme.colors.foreground, borderColor: theme.colors.border }]}
            placeholder={t.profile.changePasswordOld}
            placeholderTextColor={theme.colors.mutedForeground}
            secureTextEntry
            value={oldPassword}
            onChangeText={setOldPassword}
          />
          <TextInput
            style={[styles.modalInput, { backgroundColor: theme.colors.muted, color: theme.colors.foreground, borderColor: theme.colors.border }]}
            placeholder={t.profile.changePasswordNew}
            placeholderTextColor={theme.colors.mutedForeground}
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <TextInput
            style={[styles.modalInput, { backgroundColor: theme.colors.muted, color: theme.colors.foreground, borderColor: theme.colors.border }]}
            placeholder={t.profile.changePasswordConfirm}
            placeholderTextColor={theme.colors.mutedForeground}
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <GoldButton
            title={changingPassword ? t.common.loading : t.common.save}
            onPress={handleChangePasswordSubmit}
            loading={changingPassword}
            style={{ marginTop: 8 }}
          />
        </GlassCard>
      </KeyboardAvoidingView>
    </Modal>

    {/* PIN setup overlay */}
    {showSetupPin && (
      <View style={StyleSheet.absoluteFill}>
        <SetupPinScreen
          onDone={() => setShowSetupPin(false)}
          onCancel={() => setShowSetupPin(false)}
        />
      </View>
    )}
    </>
  );
}

const styles = StyleSheet.create({
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileDetails: {},
  profileDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  linkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkButton: {},
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {},
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
