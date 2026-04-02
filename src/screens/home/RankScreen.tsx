import React, { useState, useCallback } from 'react';
import { View, Text, RefreshControl, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronLeft, Trophy, Gift, Target, ArrowLeft, ArrowRight, TrendingUp } from 'lucide-react-native';
import { RankIconSvg, RANK_ICON_COLORS } from '@/components/ui/RankIconSvg';
import { RANK_REWARDS } from '@/components/ui/RankBadge';
import { useTheme } from '@/theme';
import { useAuthStore } from '@/store';
import { useT } from '@/i18n';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { GradientCard } from '@/components/ui/GradientCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { rankService, RankProgressResponse } from '@/api';
import { apiClient } from '@/api/client';
import { ENDPOINTS } from '@/api/config';

const RANG_NAMES: string[] = [
  '', 'Partner', 'Manager', 'Director',
  'Silver', 'Gold', 'Diamond', 'President',
  'Consul', 'Silver Consul', 'Gold Consul Central', 'Diamond Consul', 'Gold Diamond',
];

const RANK_MILESTONES: number[] = [0, 900, 1000, 3000, 10500, 25000, 60000, 90000, 250000, 900000, 3000000, 8000000, 24000000];

// Referral (inv) QV requirements per rank
const MILESTONE_REF: number[] = [0, 50, 100, 200, 400, 800, 1000, 2000, 4000, 8000, 16000, 32000, 0];

// Ranks 1–7: inv QV = min(leader, client); ranks 8–12: only leader QV counts
const RANK_LEADER_CLIENT_SPLIT = 7;

interface RankHistoryItem {
  rank: number;
  rank_name: string;
  achieved_at: string;
}

interface Props {
  onBack: () => void;
  hideHeader?: boolean;
}

export function RankScreen({ onBack, hideHeader }: Props) {
  const theme = useTheme();
  const t = useT();
  const { user } = useAuthStore();
  const [progress, setProgress] = useState<RankProgressResponse | null>(null);
  const [history, setHistory] = useState<RankHistoryItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const [progressRes, historyRes] = await Promise.all([
      rankService.getProgress(),
      apiClient.get<{ history: RankHistoryItem[] }>(ENDPOINTS.RANKS.HISTORY),
    ]);
    if (!('error' in progressRes)) {
      setProgress(progressRes.progress);
    }
    if (!historyRes.error && historyRes.data) {
      setHistory(historyRes.data.history || []);
    }
    setLoading(false);
  }, []);

  React.useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const fmt = (n: number) => n.toLocaleString('ru-RU');

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const currentRang = progress?.current_rank ?? user?.rank ?? 0;
  const nextRang = currentRang < 12 ? currentRang + 1 : null;
  const nextMilestone = nextRang ? RANK_MILESTONES[nextRang] : 0;
  const nextRef = nextRang ? MILESTONE_REF[nextRang] : 0;

  const leftQv = progress ? Number(progress.left_total_qv) : 0;
  const rightQv = progress ? Number(progress.right_total_qv) : 0;
  const weakLeg = Math.min(leftQv, rightQv);
  const totalQv = leftQv + rightQv;

  const getInvQv = (leaderQv: number, clientQv: number) =>
    nextRang && nextRang <= RANK_LEADER_CLIENT_SPLIT
      ? Math.min(leaderQv, clientQv)
      : leaderQv;

  const leftRef = progress
    ? getInvQv(Number(progress.left_inv_leader_qv) || 0, Number(progress.left_inv_client_qv) || 0)
    : 0;
  const rightRef = progress
    ? getInvQv(Number(progress.right_inv_leader_qv) || 0, Number(progress.right_inv_client_qv) || 0)
    : 0;
  const weakRef = Math.min(leftRef, rightRef);

  const invLabel = nextRang && nextRang <= RANK_LEADER_CLIENT_SPLIT
    ? 'Приглашения (лидер+партнёр)'
    : 'Приглашения (лидеры)';

  const qvProgress = nextMilestone > 0 ? Math.min(100, (weakLeg / nextMilestone) * 100) : 100;
  const refProgress = nextRef > 0 ? Math.min(100, (weakRef / nextRef) * 100) : 100;
  const qvRemaining = Math.max(0, nextMilestone - weakLeg);
  const refRemaining = Math.max(0, nextRef - weakRef);

  const styles = StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 20,
    },
    backBtn: {
      padding: 8,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.muted,
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
    rankCard: {
      alignItems: 'center',
      paddingVertical: 24,
      marginBottom: 16,
    },
    rankIcon: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: theme.gold.primary + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    currentRankName: {
      fontSize: 22,
      fontFamily: theme.fonts.bold,
      color: theme.colors.goldForeground,
    },
    rankNumber: {
      fontSize: theme.fontSizes.sm,
      color: theme.colors.mutedForeground,
      marginTop: 4,
    },
    twoCol: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 16,
    },
    nextRankCard: {
      flex: 1,
      padding: 14,
    },
    nextRankCardInner: {
      flexDirection: 'row',
      gap: 10,
      alignItems: 'flex-start',
    },
    nextIconBox: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: theme.colors.primary + '20',
      alignItems: 'center',
      justifyContent: 'center',
    },
    nextRankLabel: {
      fontSize: theme.fontSizes.xs,
      color: theme.colors.mutedForeground,
      marginBottom: 2,
    },
    nextRankName: {
      fontSize: theme.fontSizes.md,
      fontFamily: theme.fonts.bold,
      color: '#60a5fa',
    },
    nextRankHint: {
      fontSize: 10,
      color: theme.colors.mutedForeground,
      marginTop: 4,
    },
    maxRankBox: {
      flex: 1,
      padding: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    maxRankText: {
      fontSize: theme.fontSizes.md,
      fontFamily: theme.fonts.bold,
      color: theme.colors.goldForeground,
      marginTop: 6,
    },
    statsRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 16,
    },
    statCard: {
      flex: 1,
      padding: 12,
    },
    statLabel: {
      fontSize: 10,
      color: theme.colors.mutedForeground,
      marginBottom: 4,
    },
    statValue: {
      fontSize: theme.fontSizes.md,
      fontFamily: theme.fonts.bold,
      color: theme.colors.foreground,
    },
    statSuffix: {
      fontSize: 10,
      color: theme.colors.mutedForeground,
    },
    sectionTitle: {
      fontSize: theme.fontSizes.md,
      fontFamily: theme.fonts.semibold,
      color: theme.colors.foreground,
      marginBottom: 12,
    },
    requireCard: {
      marginBottom: 16,
    },
    reqBlock: {
      padding: 14,
      borderRadius: theme.borderRadius.lg,
      backgroundColor: theme.colors.muted + '60',
      marginBottom: 10,
    },
    reqRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    reqLabel: {
      fontSize: theme.fontSizes.sm,
      color: theme.colors.mutedForeground,
    },
    reqBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    reqBadgeDone: {
      borderColor: '#22c55e' + '60',
      backgroundColor: '#22c55e' + '20',
    },
    reqBadgeText: {
      fontSize: 11,
      color: theme.colors.foreground,
    },
    reqValue: {
      fontSize: theme.fontSizes.md,
      fontFamily: theme.fonts.bold,
      color: theme.colors.foreground,
      marginBottom: 8,
    },
    reqRemaining: {
      fontSize: 11,
      color: theme.colors.mutedForeground,
      marginTop: 4,
    },
    detailBlock: {
      padding: 14,
      borderRadius: theme.borderRadius.lg,
      backgroundColor: theme.colors.muted + '60',
      marginBottom: 10,
    },
    detailTitle: {
      fontSize: theme.fontSizes.xs,
      color: theme.colors.mutedForeground,
      marginBottom: 10,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    detailKey: {
      fontSize: theme.fontSizes.sm,
      color: theme.colors.mutedForeground,
    },
    detailVal: {
      fontSize: theme.fontSizes.sm,
      fontFamily: theme.fonts.medium,
      color: theme.colors.foreground,
    },
    detailSep: {
      height: 1,
      backgroundColor: theme.colors.border + '80',
      marginVertical: 6,
    },
    detailReq: {
      fontSize: theme.fontSizes.sm,
      fontFamily: theme.fonts.medium,
      color: '#a78bfa',
    },
    weekVal: {
      fontSize: theme.fontSizes.sm,
      fontFamily: theme.fonts.medium,
    },
    historyTitle: {
      fontSize: theme.fontSizes.md,
      fontFamily: theme.fonts.semibold,
      color: theme.colors.foreground,
      marginTop: 8,
      marginBottom: 12,
    },
    historyItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      gap: 12,
    },
    historyIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    historyRank: {
      fontSize: theme.fontSizes.sm,
      fontFamily: theme.fonts.semibold,
      color: theme.colors.goldForeground,
    },
    historyDate: {
      fontSize: theme.fontSizes.xs,
      color: theme.colors.mutedForeground,
      marginTop: 2,
    },
    emptyText: {
      textAlign: 'center',
      color: theme.colors.mutedForeground,
      fontSize: theme.fontSizes.sm,
      paddingVertical: 20,
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
      {!hideHeader && (
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <ChevronLeft size={20} color={theme.colors.foreground} />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Мой ранг</Text>
            <Text style={styles.subtitle}>Прогресс и история</Text>
          </View>
        </View>
      )}

      {/* Current rank */}
      <GradientCard variant="gold" padding={16} style={styles.rankCard}>
        <View style={styles.rankIcon}>
          <RankIconSvg rank={currentRang} size={40} color={theme.colors.goldForeground} />
        </View>
        <Text style={styles.currentRankName}>
          {progress?.current_rank_name || RANG_NAMES[currentRang] || `Ранг ${currentRang}`}
        </Text>
        <Text style={styles.rankNumber}>Уровень {currentRang} из 12</Text>
        {currentRang > 0 && RANK_REWARDS[currentRang] && (
          <Text style={{ fontSize: theme.fontSizes.xs, color: theme.colors.goldForeground, marginTop: 4, opacity: 0.8 }}>
            Награда: {RANK_REWARDS[currentRang]}
          </Text>
        )}
      </GradientCard>

      {/* Current + next rank cards */}
      <View style={styles.twoCol}>
        <GradientCard variant="gold" padding={0} style={styles.nextRankCard}>
          <View style={styles.nextRankCardInner}>
            <View style={styles.nextIconBox}>
              <Trophy size={22} color={theme.colors.goldForeground} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.nextRankLabel}>Текущий ранг</Text>
              <Text style={{ ...styles.nextRankName, color: theme.colors.goldForeground }}>
                {RANG_NAMES[currentRang] || 'Новичок'}
              </Text>
            </View>
          </View>
        </GradientCard>

        {nextRang ? (
          <GradientCard variant="default" padding={0} style={styles.nextRankCard}>
            <View style={styles.nextRankCardInner}>
              <View style={[styles.nextIconBox, { backgroundColor: '#3b82f620' }]}>
                <Gift size={22} color="#60a5fa" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.nextRankLabel}>{t.rank.reward} {RANG_NAMES[nextRang]}</Text>
                <Text style={styles.nextRankName}>{RANK_REWARDS[nextRang] || '—'}</Text>
                {qvRemaining > 0 && (
                  <Text style={styles.nextRankHint}>{t.rank.remaining}: {fmt(qvRemaining)} QV</Text>
                )}
              </View>
            </View>
          </GradientCard>
        ) : (
          <GradientCard variant="default" padding={0} style={styles.maxRankBox}>
            <Trophy size={28} color={theme.colors.goldForeground} />
            <Text style={styles.maxRankText}>{t.rank.maxRank}</Text>
            <Text style={{ fontSize: 10, color: theme.colors.mutedForeground, marginTop: 2 }}>{t.rank.maxRankAchieved}</Text>
          </GradientCard>
        )}
      </View>

      {/* Branch stats: Left / Right / Weak leg / Total */}
      <View style={styles.statsRow}>
        <GradientCard variant="default" padding={0} style={styles.statCard}>
          <ArrowLeft size={14} color="#60a5fa" style={{ marginBottom: 4 }} />
          <Text style={styles.statLabel}>Левая ветка</Text>
          <Text style={[styles.statValue, { color: '#60a5fa' }]}>{fmt(leftQv)}</Text>
          <Text style={styles.statSuffix}>QV</Text>
        </GradientCard>
        <GradientCard variant="default" padding={0} style={styles.statCard}>
          <ArrowRight size={14} color="#a78bfa" style={{ marginBottom: 4 }} />
          <Text style={styles.statLabel}>Правая ветка</Text>
          <Text style={[styles.statValue, { color: '#a78bfa' }]}>{fmt(rightQv)}</Text>
          <Text style={styles.statSuffix}>QV</Text>
        </GradientCard>
        <GradientCard variant="default" padding={0} style={styles.statCard}>
          <Target size={14} color={theme.colors.goldForeground} style={{ marginBottom: 4 }} />
          <Text style={styles.statLabel}>Слабая нога</Text>
          <Text style={[styles.statValue, { color: theme.colors.goldForeground }]}>{fmt(weakLeg)}</Text>
          <Text style={styles.statSuffix}>QV</Text>
        </GradientCard>
        <GradientCard variant="default" padding={0} style={styles.statCard}>
          <TrendingUp size={14} color="#22c55e" style={{ marginBottom: 4 }} />
          <Text style={styles.statLabel}>Общий объём</Text>
          <Text style={[styles.statValue, { color: '#22c55e' }]}>{fmt(totalQv)}</Text>
          <Text style={styles.statSuffix}>QV</Text>
        </GradientCard>
      </View>

      {/* Requirements for next rank */}
      {nextRang && (
        <>
          <Text style={styles.sectionTitle}>
            Требования для «{progress?.next_rank_name || RANG_NAMES[nextRang]}»
          </Text>
          <GradientCard variant="default" padding={14} style={styles.requireCard}>
            {/* QV progress */}
            <View style={styles.reqBlock}>
              <View style={styles.reqRow}>
                <Text style={styles.reqLabel}>Объём слабой ноги</Text>
                <View style={[styles.reqBadge, weakLeg >= nextMilestone && styles.reqBadgeDone]}>
                  <Text style={styles.reqBadgeText}>{qvProgress.toFixed(1)}%</Text>
                </View>
              </View>
              <Text style={styles.reqValue}>{fmt(weakLeg)} / {fmt(nextMilestone)} QV</Text>
              <ProgressBar value={Math.round(qvProgress)} variant="info" />
              {qvRemaining > 0 && (
                <Text style={styles.reqRemaining}>
                  Осталось: <Text style={{ color: '#60a5fa', fontFamily: theme.fonts.medium }}>{fmt(qvRemaining)} QV</Text>
                </Text>
              )}
            </View>

            {/* Inv QV progress */}
            {nextRef > 0 && (
              <View style={styles.reqBlock}>
                <View style={styles.reqRow}>
                  <Text style={styles.reqLabel}>{invLabel} (слабая нога)</Text>
                  <View style={[styles.reqBadge, weakRef >= nextRef && styles.reqBadgeDone]}>
                    <Text style={styles.reqBadgeText}>{refProgress.toFixed(1)}%</Text>
                  </View>
                </View>
                <Text style={styles.reqValue}>{fmt(weakRef)} / {fmt(nextRef)} QV</Text>
                <ProgressBar value={Math.round(refProgress)} variant="warning" />
                {refRemaining > 0 && (
                  <Text style={styles.reqRemaining}>
                    Осталось: <Text style={{ color: '#a78bfa', fontFamily: theme.fonts.medium }}>{fmt(refRemaining)} QV</Text>
                  </Text>
                )}
              </View>
            )}

            {/* Detailed leg breakdown */}
            {progress && (
              <>
                <View style={styles.detailBlock}>
                  <Text style={styles.detailTitle}>{invLabel} — детали</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailKey}>Левая нога</Text>
                    <Text style={styles.detailVal}>{fmt(leftRef)} QV</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailKey}>Правая нога</Text>
                    <Text style={styles.detailVal}>{fmt(rightRef)} QV</Text>
                  </View>
                  <View style={styles.detailSep} />
                  <View style={styles.detailRow}>
                    <Text style={styles.detailKey}>Требуется на каждой</Text>
                    <Text style={styles.detailReq}>{fmt(nextRef)} QV</Text>
                  </View>
                </View>

                {(progress.left_week_qv > 0 || progress.right_week_qv > 0) && (
                  <View style={styles.detailBlock}>
                    <Text style={styles.detailTitle}>Объём за неделю</Text>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailKey}>Левая</Text>
                      <Text style={[styles.weekVal, { color: '#60a5fa' }]}>{fmt(progress.left_week_qv)} QV</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailKey}>Правая</Text>
                      <Text style={[styles.weekVal, { color: '#a78bfa' }]}>{fmt(progress.right_week_qv)} QV</Text>
                    </View>
                  </View>
                )}
              </>
            )}
          </GradientCard>
        </>
      )}

      {/* Rank history */}
      <Text style={styles.historyTitle}>История рангов</Text>
      <GradientCard variant="default" padding={0}>
        {loading ? (
          <Text style={styles.emptyText}>Загрузка...</Text>
        ) : history.length === 0 ? (
          <Text style={styles.emptyText}>История рангов пуста</Text>
        ) : (
          <React.Fragment>
            {history.map((item, index) => (
              <View key={`rank-${index}-${item.rank}`} style={styles.historyItem}>
                <View style={[styles.historyIcon, { backgroundColor: RANK_ICON_COLORS[item.rank] + '22' }]}>
                  <RankIconSvg rank={item.rank} size={18} color={RANK_ICON_COLORS[item.rank]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.historyRank}>{item.rank_name || RANG_NAMES[item.rank]}</Text>
                  <Text style={styles.historyDate}>{formatDate(item.achieved_at)}</Text>
                  {RANK_REWARDS[item.rank] && (
                    <Text style={{ fontSize: 10, color: theme.colors.mutedForeground, marginTop: 1 }}>
                      {RANK_REWARDS[item.rank]}
                    </Text>
                  )}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: theme.fontSizes.xs, color: theme.colors.mutedForeground }}>
                    Ур. {item.rank}
                  </Text>
                </View>
              </View>
            ))}
          </React.Fragment>
        )}
      </GradientCard>
    </ScreenWrapper>
  );
}
