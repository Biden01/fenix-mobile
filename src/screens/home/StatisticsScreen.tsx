import React, { useState, useCallback } from 'react';
import { View, Text, RefreshControl, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Users, TrendingUp, BarChart3, DollarSign, UserCheck, Activity, ArrowRight } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { useT } from '@/i18n';
import { CompactHeader, ScreenWrapper, GradientCard, MiniStatCard, SectionHeader } from '@/components/ui';
import { apiClient } from '@/api/client';
import { ENDPOINTS } from '@/api/config';

interface CompanyStats {
  total_users: number;
  active_users: number;
  leaders: number;
  clients: number;
  new_users_week: number;
  total_binary: number;
  total_qv: number;
  total_passive: number;
}

interface Props {
  onBack: () => void;
  hideHeader?: boolean;
}

export function StatisticsScreen({ onBack, hideHeader }: Props) {
  const theme = useTheme();
  const t = useT();
  const [stats, setStats] = useState<CompanyStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    const res = await apiClient.get<CompanyStats>(ENDPOINTS.USERS.COMPANY_STATS);
    if (!res.error && res.data) setStats(res.data);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    fetchStats();
  }, [fetchStats]));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  const fmt = (n: number) => n?.toLocaleString('ru-RU') ?? '—';
  const fmtMoney = (n: number) => (n ?? 0).toLocaleString('ru-RU', { maximumFractionDigits: 0 });

  return (
    <ScreenWrapper
      scrollable
      padded
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.gold.primary} />}
    >
      {!hideHeader && (
        <>
          <CompactHeader onBack={onBack} title={t.statistics.title} paddingBottom={theme.spacing[2]} />
          <Text style={{ fontSize: theme.fontSizes.xs, color: theme.colors.mutedForeground, marginBottom: 20 }}>{t.statistics.subtitle}</Text>
        </>
      )}

      {loading ? (
        <View style={{ alignItems: 'center', paddingVertical: 60 }}>
          <ActivityIndicator size="large" color={theme.colors.goldForeground} />
        </View>
      ) : !stats ? (
        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
          <BarChart3 size={40} color={theme.colors.mutedForeground} style={{ opacity: 0.3, marginBottom: 8 }} />
          <Text style={{ fontFamily: theme.fonts.medium, fontSize: theme.fontSizes.sm, color: theme.colors.mutedForeground }}>{t.statistics.noData}</Text>
        </View>
      ) : (
        <>
          {/* Hero metric */}
          <GradientCard variant="gold" style={{ marginBottom: theme.spacing[6] }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: theme.spacing[2] }}>
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: `${theme.gold.primary}20`, alignItems: 'center', justifyContent: 'center' }}>
                <Users size={16} color={theme.colors.goldForeground} />
              </View>
              <Text style={{ fontFamily: theme.fonts.medium, fontSize: theme.fontSizes.sm, color: theme.colors.mutedForeground }}>{t.statistics.total}</Text>
            </View>
            <Text style={{ fontFamily: theme.fonts.bold, fontSize: 36, color: theme.colors.foreground }}>{fmt(stats.total_users)}</Text>
            <Text style={{ fontFamily: theme.fonts.regular, fontSize: 11, color: theme.colors.mutedForeground, marginTop: 4 }}>
              +{fmt(stats.new_users_week)} {t.statistics.newThisWeek}
            </Text>
          </GradientCard>

          {/* Users */}
          <View style={{ marginBottom: theme.spacing[6] }}>
            <SectionHeader title={t.statistics.users} />
            <View style={styles.grid}>
              <MiniStatCard icon={<Activity size={16} color={theme.semantic.success} />} label={t.statistics.active} value={fmt(stats.active_users)} iconBg={`${theme.semantic.success}18`} />
              <MiniStatCard icon={<UserCheck size={16} color='#60A5FA' />} label={t.statistics.leaders} value={fmt(stats.leaders)} iconBg='rgba(96,165,250,0.15)' />
            </View>
            <View style={[styles.grid, { marginTop: theme.spacing[3] }]}>
              <MiniStatCard icon={<Users size={16} color={theme.colors.mutedForeground} />} label={t.statistics.clients} value={fmt(stats.clients)} iconBg={`${theme.colors.mutedForeground}18`} />
              <View style={{ flex: 1 }} />
            </View>
          </View>

          {/* Finance */}
          <View style={{ marginBottom: theme.spacing[6] }}>
            <SectionHeader title={t.statistics.finance} />
            <View style={styles.grid}>
              <MiniStatCard icon={<TrendingUp size={16} color={theme.colors.goldForeground} />} label={t.statistics.totalQv} value={fmtMoney(stats.total_qv)} iconBg={`${theme.gold.primary}18`} />
              <MiniStatCard icon={<DollarSign size={16} color='#A78BFA' />} label={t.statistics.binaryBonuses} value={`${fmtMoney(stats.total_binary)} ₸`} iconBg='rgba(167,139,250,0.15)' />
            </View>
            <View style={[styles.grid, { marginTop: theme.spacing[3] }]}>
              <MiniStatCard icon={<BarChart3 size={16} color={theme.semantic.success} />} label={t.statistics.passiveBonus} value={`${fmtMoney(stats.total_passive)} ₸`} iconBg={`${theme.semantic.success}15`} />
              <View style={{ flex: 1 }} />
            </View>
          </View>
        </>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    gap: 12,
  },
});
