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
  ArrowLeft,
  ShieldCheck,
  ShieldX,
  Clock,
  Shield,
  ExternalLink,
  Calendar,
} from 'lucide-react-native';
import { useTheme } from '@/theme';
import { GradientCard } from '@/components/ui';
import { financeService, VerificationStatus } from '@/api';
import { useAuthStore } from '@/store';
import { useT } from '@/i18n';

const WEB_CABINET_URL = 'https://fenixinternationalcompany.kz/cabinet/verification';

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

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingTop: 60, paddingHorizontal: theme.screenPadding.horizontal,
        paddingBottom: theme.spacing[3],
      }}>
        <TouchableOpacity
          onPress={onBack}
          style={{ backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.full, padding: theme.spacing[2] }}
        >
          <ArrowLeft size={24} color={theme.colors.foreground} />
        </TouchableOpacity>
        <Text style={{
          fontFamily: theme.fonts.displayBold, fontSize: theme.fontSizes.xl,
          color: theme.colors.foreground, flex: 1, textAlign: 'center',
        }}>
          {t.verification.title}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: theme.screenPadding.horizontal, paddingBottom: 40 }}
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
