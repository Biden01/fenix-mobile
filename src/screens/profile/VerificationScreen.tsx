import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  ScrollView,
} from 'react-native';
import {
  ShieldCheck,
  ShieldX,
  Clock,
  Shield,
  ExternalLink,
  Calendar,
} from 'lucide-react-native';
import { useTheme } from '@/theme';
import { CompactHeader, GradientCard } from '@/components/ui';
import { financeService, VerificationStatus } from '@/api';
import { useAuthStore } from '@/store';
import { useT } from '@/i18n';

const WEB_CABINET_URL = 'https://zharqyn.life/cabinet/verification';

interface VerificationScreenProps {
  onBack: () => void;
}

export function VerificationScreen({ onBack }: VerificationScreenProps) {
  const theme = useTheme();
  const t = useT();
  const { user } = useAuthStore();
  const [data, setData] = useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    const result = await financeService.getVerificationStatus();
    if (!('error' in result)) setData(result.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const verifiedVal = data?.verified ?? user?.verified ?? 0;
  const verif = data?.verification ?? null;

  const statusConfig = (() => {
    if (verifiedVal === 1) return {
      icon: ShieldCheck,
      color: theme.semantic.success,
      bg: `${theme.semantic.success}15`,
      border: `${theme.semantic.success}40`,
      label: t.verification.statusApproved,
      desc: t.verification.approvedDesc,
    };
    if (verif?.status === 'pending') return {
      icon: Clock,
      color: theme.semantic.warning,
      bg: `${theme.semantic.warning}15`,
      border: `${theme.semantic.warning}40`,
      label: t.verification.statusPending,
      desc: t.verification.pendingDesc,
    };
    if (verifiedVal === 2 || verif?.status === 'rejected') return {
      icon: ShieldX,
      color: theme.semantic.error,
      bg: `${theme.semantic.error}15`,
      border: `${theme.semantic.error}40`,
      label: t.verification.statusRejected,
      desc: t.verification.rejectedDesc,
    };
    return {
      icon: Shield,
      color: theme.colors.mutedForeground,
      bg: `${theme.colors.mutedForeground}10`,
      border: theme.colors.border,
      label: t.verification.statusUnverified,
      desc: t.verification.description,
    };
  })();

  const StatusIcon = statusConfig.icon;
  const showWebButton = verifiedVal !== 1;

  const formatDate = (s: string | null) => {
    if (!s) return '—';
    return new Date(s).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const isUnverified = verifiedVal !== 1 && verif?.status !== 'pending' && verif?.status !== 'rejected';
  const steps = [t.verification.verifyStep1, t.verification.verifyStep2, t.verification.verifyStep3];

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <CompactHeader onBack={onBack} title={t.verification.title} />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: theme.screenPadding.horizontal, paddingBottom: theme.dimensions.tabBarHeight + theme.spacing[4] }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator color={theme.colors.goldForeground} style={{ marginTop: 60 }} />
        ) : (
          <>
            {/* Status Card */}
            <GradientCard style={{
              marginBottom: theme.spacing[4],
              borderWidth: 1,
              borderColor: statusConfig.border,
              backgroundColor: statusConfig.bg,
            }}>
              <View style={{ alignItems: 'center', paddingVertical: theme.spacing[4] }}>
                <View style={{
                  width: 72, height: 72, borderRadius: 36,
                  backgroundColor: statusConfig.bg,
                  borderWidth: 2, borderColor: statusConfig.border,
                  alignItems: 'center', justifyContent: 'center',
                  marginBottom: theme.spacing[3],
                }}>
                  <StatusIcon size={36} color={statusConfig.color} />
                </View>
                <Text style={{
                  fontFamily: theme.fonts.bold, fontSize: theme.fontSizes.xl,
                  color: statusConfig.color, marginBottom: theme.spacing[1],
                }}>
                  {statusConfig.label}
                </Text>
                <Text style={{
                  fontFamily: theme.fonts.regular, fontSize: theme.fontSizes.sm,
                  color: theme.colors.mutedForeground, textAlign: 'center',
                  paddingHorizontal: theme.spacing[4],
                }}>
                  {statusConfig.desc}
                </Text>
              </View>
            </GradientCard>

            {/* Даты подачи/рассмотрения */}
            {verif && (
              <GradientCard style={{ marginBottom: theme.spacing[4] }}>
                {verif.created_at && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing[3] }}>
                    <Calendar size={16} color={theme.colors.mutedForeground} />
                    <View style={{ marginLeft: theme.spacing[2] }}>
                      <Text style={{ fontFamily: theme.fonts.regular, fontSize: theme.fontSizes.xs, color: theme.colors.mutedForeground }}>
                        {t.verification.submittedOn}
                      </Text>
                      <Text style={{ fontFamily: theme.fonts.semibold, fontSize: theme.fontSizes.sm, color: theme.colors.foreground }}>
                        {formatDate(verif.created_at)}
                      </Text>
                    </View>
                  </View>
                )}
                {verif.reviewed_at && (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Calendar size={16} color={theme.colors.mutedForeground} />
                    <View style={{ marginLeft: theme.spacing[2] }}>
                      <Text style={{ fontFamily: theme.fonts.regular, fontSize: theme.fontSizes.xs, color: theme.colors.mutedForeground }}>
                        {t.verification.reviewedOn}
                      </Text>
                      <Text style={{ fontFamily: theme.fonts.semibold, fontSize: theme.fontSizes.sm, color: theme.colors.foreground }}>
                        {formatDate(verif.reviewed_at)}
                      </Text>
                    </View>
                  </View>
                )}
              </GradientCard>
            )}

            {/* Комментарий администратора при отклонении */}
            {verif?.admin_comment && (verifiedVal === 2 || verif.status === 'rejected') && (
              <GradientCard style={{
                marginBottom: theme.spacing[4],
                borderWidth: 1,
                borderColor: `${theme.semantic.error}30`,
                backgroundColor: `${theme.semantic.error}08`,
              }}>
                <Text style={{ fontFamily: theme.fonts.semibold, fontSize: theme.fontSizes.sm, color: theme.semantic.error, marginBottom: theme.spacing[2] }}>
                  {t.verification.adminComment}
                </Text>
                <Text style={{ fontFamily: theme.fonts.regular, fontSize: theme.fontSizes.sm, color: theme.colors.foreground }}>
                  {verif.admin_comment}
                </Text>
              </GradientCard>
            )}

            {/* Инструкции для неверифицированных */}
            {isUnverified && (
              <GradientCard style={{ marginBottom: theme.spacing[4] }}>
                <Text style={{ fontFamily: theme.fonts.semibold, fontSize: theme.fontSizes.sm, color: theme.colors.foreground, marginBottom: theme.spacing[3] }}>
                  {t.verification.howToVerify}
                </Text>
                {steps.map((step, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: i < steps.length - 1 ? theme.spacing[3] : 0 }}>
                    <View style={{
                      width: 28, height: 28, borderRadius: 14,
                      backgroundColor: `${theme.gold.primary}20`,
                      alignItems: 'center', justifyContent: 'center',
                      marginRight: theme.spacing[3], flexShrink: 0,
                    }}>
                      <Text style={{ fontFamily: theme.fonts.bold, fontSize: theme.fontSizes.sm, color: theme.gold.primary }}>
                        {i + 1}
                      </Text>
                    </View>
                    <Text style={{ flex: 1, fontFamily: theme.fonts.regular, fontSize: theme.fontSizes.sm, color: theme.colors.mutedForeground, lineHeight: 20, paddingTop: 4 }}>
                      {step}
                    </Text>
                  </View>
                ))}
              </GradientCard>
            )}

            {/* Кнопка открыть веб */}
            {showWebButton && (
              <GradientCard style={{ marginBottom: theme.spacing[4] }}>
                <Text style={{ fontFamily: theme.fonts.regular, fontSize: theme.fontSizes.sm, color: theme.colors.mutedForeground, marginBottom: theme.spacing[4] }}>
                  {t.verification.uploadOnWeb}
                </Text>
                <TouchableOpacity
                  onPress={() => Linking.openURL(WEB_CABINET_URL)}
                  style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: theme.gold.primary, borderRadius: theme.borderRadius.xl,
                    paddingVertical: theme.spacing[3], paddingHorizontal: theme.spacing[4],
                    gap: theme.spacing[2],
                  }}
                >
                  <ExternalLink size={18} color="#000" />
                  <Text style={{ fontFamily: theme.fonts.bold, fontSize: theme.fontSizes.sm, color: '#000' }}>
                    {t.verification.openWebBtn}
                  </Text>
                </TouchableOpacity>
              </GradientCard>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
