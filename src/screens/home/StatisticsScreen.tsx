import React, { useState, useCallback } from 'react';
import { View, Text, RefreshControl, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ChevronLeft, Users, TrendingUp, BarChart3, DollarSign, UserCheck, Activity } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { useT } from '@/i18n';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { GradientCard } from '@/components/ui/GradientCard';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatCard } from '@/components/ui/StatCard';
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
    if (!res.error && res.data) {
      setStats(res.data);
    }
    setLoading(false);
  }, []);

  // Re-fetch every time the screen comes into focus
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

  const styles = StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 20,
    },
    backBtn: {
      padding: 8,
      borderRadius: theme.borderRadius.full,
    },
    title: {
      fontSize: theme.fontSizes.lg,
      fontFamily: theme.fonts.bold,
      color: theme.colors.foreground,
    },
    subtitle: {
      fontSize: theme.fontSizes.xs,
      color: theme.colors.mutedForeground,
      marginTop: 2,
    },
    sectionTitle: {
      fontSize: theme.fontSizes.md,
      fontFamily: theme.fonts.semibold,
      color: theme.colors.foreground,
      marginTop: 20,
      marginBottom: 12,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 16,
    },
    gridItem: {
      width: '47%',
    },
    loadingText: {
      textAlign: 'center',
      color: theme.colors.mutedForeground,
      fontSize: theme.fontSizes.sm,
      paddingVertical: 40,
    },
    statRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: 'rgba(255,255,255,0.08)',
    },
    statLabel: {
      fontSize: theme.fontSizes.sm,
      color: theme.colors.mutedForeground,
    },
    statValue: {
      fontSize: theme.fontSizes.sm,
      fontFamily: theme.fonts.semibold,
      color: theme.colors.foreground,
    },
    statValueGold: {
      fontSize: theme.fontSizes.sm,
      fontFamily: theme.fonts.semibold,
      color: theme.colors.goldForeground,
    },
  });

  return (
    <ScreenWrapper
      scrollable
      padded
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.gold.primary} />
      }
    >
      {/* Header */}
      {!hideHeader && (
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} activeOpacity={0.8}>
            <GlassCard cornerRadius={theme.borderRadius.full} style={styles.backBtn}>
              <ChevronLeft size={20} color={theme.colors.foreground} />
            </GlassCard>
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>{t.statistics.title}</Text>
            <Text style={styles.subtitle}>{t.statistics.subtitle}</Text>
          </View>
        </View>
      )}

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
          <ActivityIndicator size="large" color={theme.colors.goldForeground} />
        </View>
      ) : !stats ? (
        <Text style={styles.loadingText}>{t.statistics.noData}</Text>
      ) : (
        <>
          {/* Users stats */}
          <Text style={styles.sectionTitle}>{t.statistics.users}</Text>
          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <StatCard
                icon={<Users size={20} color={theme.colors.goldForeground} />}
                label={t.statistics.total}
                value={fmt(stats.total_users)}
              />
            </View>
            <View style={styles.gridItem}>
              <StatCard
                icon={<Activity size={20} color={theme.semantic?.success ?? '#10b981'} />}
                label={t.statistics.active}
                value={fmt(stats.active_users)}
              />
            </View>
            <View style={styles.gridItem}>
              <StatCard
                icon={<UserCheck size={20} color={theme.colors.foreground} />}
                label={t.statistics.leaders}
                value={fmt(stats.leaders)}
              />
            </View>
            <View style={styles.gridItem}>
              <StatCard
                icon={<Users size={20} color={theme.colors.mutedForeground} />}
                label={t.statistics.clients}
                value={fmt(stats.clients)}
              />
            </View>
          </View>

          {/* Finance stats */}
          <Text style={styles.sectionTitle}>{t.statistics.finance}</Text>
          <GradientCard variant="default" padding={16}>
            <View style={[styles.statRow, { borderTopWidth: 0 }]}>
              <Text style={styles.statLabel}>{t.statistics.newThisWeek}</Text>
              <Text style={styles.statValue}>{fmt(stats.new_users_week)}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>{t.statistics.binaryBonuses}</Text>
              <Text style={styles.statValueGold}>{fmtMoney(stats.total_binary)} ₸</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>{t.statistics.totalQv}</Text>
              <Text style={styles.statValueGold}>{fmtMoney(stats.total_qv)}</Text>
            </View>
            <View style={[styles.statRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.statLabel}>{t.statistics.passiveBonus}</Text>
              <Text style={styles.statValueGold}>{fmtMoney(stats.total_passive)} ₸</Text>
            </View>
          </GradientCard>
        </>
      )}
    </ScreenWrapper>
  );
}
