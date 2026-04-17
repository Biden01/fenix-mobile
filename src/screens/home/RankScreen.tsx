import React, { useState, useCallback } from 'react';
import { View, Text, RefreshControl, StyleSheet, ScrollView } from 'react-native';
import { Trophy, Gift, Target, ArrowLeft, ArrowRight, TrendingUp, CheckCircle } from 'lucide-react-native';
import { RankIconSvg, RANK_ICON_COLORS } from '@/components/ui/RankIconSvg';
import { RANK_REWARDS } from '@/components/ui/RankBadge';
import { useTheme } from '@/theme';
import { useAuthStore } from '@/store';
import { useT } from '@/i18n';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { GradientCard } from '@/components/ui/GradientCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { CompactHeader, MiniStatCard, SectionHeader } from '@/components/ui';
import { rankService, RankProgressResponse } from '@/api';
import { apiClient } from '@/api/client';
import { ENDPOINTS } from '@/api/config';

const RANG_NAMES: string[] = [
  '', 'Partner', 'Manager', 'Director',
  'Silver', 'Gold', 'Diamond', 'President',
  'Consul', 'Silver Consul', 'Gold Consul Central', 'Diamond Consul', 'Gold Diamond',
];

const RANK_MILESTONES: number[] = [0, 900, 1000, 3000, 10500, 25000, 60000, 90000, 250000, 900000, 3000000, 8000000, 24000000];
const MILESTONE_REF: number[] = [0, 50, 100, 200, 400, 800, 1000, 2000, 4000, 8000, 16000, 32000, 0];
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
    if (!('error' in progressRes)) setProgress(progressRes.progress);
    if (!historyRes.error && historyRes.data) setHistory(historyRes.data.history || []);
    setLoading(false);
  }, []);

  React.useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const fmt = (n: number) => (n ?? 0).toLocaleString('ru-RU');

  const formatDate = (dateStr: string) => {
    try { return new Date(dateStr).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' }); }
    catch { return dateStr; }
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
    nextRang && nextRang <= RANK_LEADER_CLIENT_SPLIT ? Math.min(leaderQv, clientQv) : leaderQv;

  const leftRef = progress ? getInvQv(Number(progress.left_inv_leader_qv) || 0, Number(progress.left_inv_client_qv) || 0) : 0;
  const rightRef = progress ? getInvQv(Number(progress.right_inv_leader_qv) || 0, Number(progress.right_inv_client_qv) || 0) : 0;
  const weakRef = Math.min(leftRef, rightRef);

  const invLabel = nextRang && nextRang <= RANK_LEADER_CLIENT_SPLIT ? t.rank.invitationsAll : t.rank.invitationsLeaders;

  const qvProgress = nextMilestone > 0 ? Math.min(100, (weakLeg / nextMilestone) * 100) : 100;
  const refProgress = nextRef > 0 ? Math.min(100, (weakRef / nextRef) * 100) : 100;
  const qvRemaining = Math.max(0, nextMilestone - weakLeg);
  const refRemaining = Math.max(0, nextRef - weakRef);

  return (
    <ScreenWrapper
      scrollable
      padded
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.gold.primary} />}
    >
      {!hideHeader && (
        <>
          <CompactHeader onBack={onBack} title={t.rank.title} paddingBottom={theme.spacing[2]} />
          <Text style={{ fontSize: theme.fontSizes.xs, color: theme.colors.mutedForeground, marginBottom: 20 }}>{t.rank.subtitle}</Text>
        </>
      )}

      {/* Hero — current rank */}
      <GradientCard variant="gold" style={{ alignItems: 'center', paddingVertical: 28, marginBottom: theme.spacing[4] }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: `${theme.gold.primary}20`, alignItems: 'center', justifyContent: 'center', marginBottom: 14, borderWidth: 1.5, borderColor: `${theme.gold.primary}40` }}>
          <RankIconSvg rank={currentRang} size={48} color={theme.colors.goldForeground} />
        </View>
        <Text style={{ fontFamily: theme.fonts.displayBold, fontSize: 24, color: theme.colors.goldForeground, marginBottom: 4 }}>
          {progress?.current_rank_name || RANG_NAMES[currentRang] || `${t.rank.levelLabel} ${currentRang}`}
        </Text>
        <Text style={{ fontFamily: theme.fonts.regular, fontSize: theme.fontSizes.xs, color: theme.colors.mutedForeground }}>
          {t.rank.level} {currentRang} {t.rank.of} 12
        </Text>
        {currentRang > 0 && RANK_REWARDS[currentRang] && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10, paddingHorizontal: 12, paddingVertical: 5, backgroundColor: `${theme.gold.primary}18`, borderRadius: 99 }}>
            <Gift size={13} color={theme.colors.goldForeground} />
            <Text style={{ fontFamily: theme.fonts.medium, fontSize: 12, color: theme.colors.goldForeground }}>{t.rank.currentReward}: {RANK_REWARDS[currentRang]}</Text>
          </View>
        )}
        {/* Overall progress to next rank */}
        {nextRang && (
          <View style={{ width: '100%', marginTop: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ fontFamily: theme.fonts.regular, fontSize: 11, color: theme.colors.mutedForeground }}>{t.rank.progressTo} {RANG_NAMES[nextRang]}</Text>
              <Text style={{ fontFamily: theme.fonts.semibold, fontSize: 11, color: theme.colors.goldForeground }}>{qvProgress.toFixed(1)}%</Text>
            </View>
            <ProgressBar value={Math.round(qvProgress)} height={5} variant="gold" />
          </View>
        )}
      </GradientCard>

      {/* Branch QV stats */}
      <View style={{ marginBottom: theme.spacing[6] }}>
        <SectionHeader title={t.rank.branchVolumes} />
        <View style={styles.grid}>
          <MiniStatCard icon={<ArrowLeft size={16} color="#60A5FA" />} label={t.rank.leftBranch} value={`${fmt(leftQv)} QV`} iconBg="rgba(96,165,250,0.15)" />
          <MiniStatCard icon={<ArrowRight size={16} color="#A78BFA" />} label={t.rank.rightBranch} value={`${fmt(rightQv)} QV`} iconBg="rgba(167,139,250,0.15)" />
        </View>
        <View style={[styles.grid, { marginTop: theme.spacing[3] }]}>
          <MiniStatCard icon={<Target size={16} color={theme.colors.goldForeground} />} label={t.rank.weakLeg} value={`${fmt(weakLeg)} QV`} iconBg={`${theme.gold.primary}18`} />
          <MiniStatCard icon={<TrendingUp size={16} color={theme.semantic.success} />} label={t.rank.totalVolume} value={`${fmt(totalQv)} QV`} iconBg={`${theme.semantic.success}18`} />
        </View>
      </View>

      {/* Requirements for next rank */}
      {nextRang && (
        <View style={{ marginBottom: theme.spacing[6] }}>
          <SectionHeader title={`${t.rank.requirementsFor} «${progress?.next_rank_name || RANG_NAMES[nextRang]}»`} />

          <GradientCard padding={16}>
            {/* Weak leg QV */}
            <LegProgressBar
              label={t.rank.weakLegVolume}
              current={weakLeg}
              required={nextMilestone}
              progress={qvProgress}
              remaining={qvRemaining}
              variant="info"
            />

            {/* Inv QV */}
            {nextRef > 0 && (
              <View style={{ marginTop: 14 }}>
                <LegProgressBar
                  label={`${invLabel} (${t.rank.weakLeg})`}
                  current={weakRef}
                  required={nextRef}
                  progress={refProgress}
                  remaining={refRemaining}
                  variant="warning"
                />
              </View>
            )}

            {/* Leg detail breakdown */}
            {progress && (
              <View style={{ marginTop: 14, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border }}>
                <Text style={{ fontFamily: theme.fonts.regular, fontSize: 11, color: theme.colors.mutedForeground, marginBottom: 8 }}>
                  {invLabel} — {t.rank.details}
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontSize: theme.fontSizes.sm, color: theme.colors.mutedForeground }}>{t.rank.leftLeg}</Text>
                  <Text style={{ fontSize: theme.fontSizes.sm, fontFamily: theme.fonts.medium, color: '#60A5FA' }}>{fmt(leftRef)} QV</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontSize: theme.fontSizes.sm, color: theme.colors.mutedForeground }}>{t.rank.rightLeg}</Text>
                  <Text style={{ fontSize: theme.fontSizes.sm, fontFamily: theme.fonts.medium, color: '#A78BFA' }}>{fmt(rightRef)} QV</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border }}>
                  <Text style={{ fontSize: theme.fontSizes.sm, color: theme.colors.mutedForeground }}>{t.rank.requiredEach}</Text>
                  <Text style={{ fontSize: theme.fontSizes.sm, fontFamily: theme.fonts.medium, color: '#A78BFA' }}>{fmt(nextRef)} QV</Text>
                </View>
              </View>
            )}

            {/* Weekly volumes */}
            {progress && (progress.left_week_qv > 0 || progress.right_week_qv > 0) && (
              <View style={{ marginTop: 14, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border }}>
                <Text style={{ fontFamily: theme.fonts.regular, fontSize: 11, color: theme.colors.mutedForeground, marginBottom: 8 }}>{t.rank.weekVolume}</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1, backgroundColor: 'rgba(96,165,250,0.08)', borderRadius: 10, padding: 10 }}>
                    <Text style={{ fontSize: 10, color: theme.colors.mutedForeground, marginBottom: 3 }}>{t.rank.left}</Text>
                    <Text style={{ fontFamily: theme.fonts.bold, fontSize: theme.fontSizes.sm, color: '#60A5FA' }}>{fmt(progress.left_week_qv)} QV</Text>
                  </View>
                  <View style={{ flex: 1, backgroundColor: 'rgba(167,139,250,0.08)', borderRadius: 10, padding: 10 }}>
                    <Text style={{ fontSize: 10, color: theme.colors.mutedForeground, marginBottom: 3 }}>{t.rank.right}</Text>
                    <Text style={{ fontFamily: theme.fonts.bold, fontSize: theme.fontSizes.sm, color: '#A78BFA' }}>{fmt(progress.right_week_qv)} QV</Text>
                  </View>
                </View>
              </View>
            )}
          </GradientCard>
        </View>
      )}

      {/* Rewards roadmap — horizontal scroll */}
      <View style={{ marginBottom: theme.spacing[6] }}>
        <SectionHeader title={t.rank.rewardsRoadmap ?? t.rank.history} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 4, paddingBottom: 4 }}>
          {RANG_NAMES.slice(1).map((name, idx) => {
            const rankIdx = idx + 1;
            const achieved = rankIdx <= currentRang;
            const isCurrent = rankIdx === currentRang;
            const isNext = rankIdx === currentRang + 1;
            return (
              <View key={rankIdx} style={{
                width: 124,
                borderRadius: 18,
                overflow: 'hidden',
                borderWidth: isCurrent ? 1.5 : 1,
                borderColor: isCurrent ? `${theme.gold.primary}70`
                  : isNext ? `${theme.semantic.info}40`
                  : achieved ? `${theme.semantic.success}30`
                  : theme.colors.border,
                backgroundColor: isCurrent ? `${theme.gold.primary}12`
                  : isNext ? `${theme.semantic.info}08`
                  : achieved ? `${theme.semantic.success}08`
                  : theme.colors.card,
                padding: 14,
              }}>
                {/* Icon */}
                <View style={{
                  width: 42, height: 42, borderRadius: 21,
                  backgroundColor: achieved ? `${RANK_ICON_COLORS[rankIdx]}22` : theme.colors.muted,
                  alignItems: 'center', justifyContent: 'center', marginBottom: 10,
                }}>
                  <RankIconSvg rank={rankIdx} size={24}
                    color={achieved ? RANK_ICON_COLORS[rankIdx] : theme.colors.mutedForeground}
                  />
                </View>

                {/* Badge row */}
                {(isCurrent || isNext) && (
                  <View style={{
                    alignSelf: 'flex-start',
                    backgroundColor: isCurrent ? `${theme.gold.primary}20` : `${theme.semantic.info}15`,
                    borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, marginBottom: 6,
                  }}>
                    <Text style={{ fontSize: 9, fontFamily: theme.fonts.medium, color: isCurrent ? theme.colors.goldForeground : theme.semantic.info }}>
                      {isCurrent ? t.dashboard.yourBadge : t.dashboard.legendNext}
                    </Text>
                  </View>
                )}

                {/* Name */}
                <Text style={{
                  fontFamily: theme.fonts.semibold, fontSize: 12,
                  color: isCurrent ? theme.colors.goldForeground
                    : achieved ? theme.colors.foreground
                    : theme.colors.mutedForeground,
                  marginBottom: 5,
                }} numberOfLines={2}>{name}</Text>

                {/* Reward */}
                {RANK_REWARDS[rankIdx] ? (
                  <Text style={{
                    fontSize: 11,
                    fontFamily: theme.fonts.regular,
                    color: isCurrent ? theme.colors.goldForeground
                      : achieved ? theme.colors.mutedForeground
                      : theme.colors.mutedForeground,
                    opacity: achieved ? 1 : 0.55,
                    lineHeight: 15,
                  }} numberOfLines={2}>{RANK_REWARDS[rankIdx]}</Text>
                ) : null}

                {/* Achieved checkmark */}
                {achieved && !isCurrent && (
                  <View style={{
                    position: 'absolute', top: 10, right: 10,
                    width: 20, height: 20, borderRadius: 10,
                    backgroundColor: `${theme.semantic.success}20`,
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <CheckCircle size={14} color={theme.semantic.success} />
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* Rank history */}
      <View style={{ marginBottom: theme.spacing[8] }}>
        <SectionHeader title={t.rank.history} />
        <GradientCard padding={0}>
          {loading ? (
            <Text style={{ textAlign: 'center', color: theme.colors.mutedForeground, fontSize: theme.fontSizes.sm, paddingVertical: 20 }}>{t.common.loading}</Text>
          ) : history.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 32 }}>
              <Trophy size={36} color={theme.colors.mutedForeground} style={{ opacity: 0.3, marginBottom: 8 }} />
              <Text style={{ fontFamily: theme.fonts.medium, fontSize: theme.fontSizes.sm, color: theme.colors.mutedForeground }}>{t.rank.historyEmpty}</Text>
            </View>
          ) : (
            history.map((item, index) => (
              <View key={`rank-${index}-${item.rank}`}>
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, gap: 12 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: `${RANK_ICON_COLORS[item.rank]}22`, alignItems: 'center', justifyContent: 'center' }}>
                    <RankIconSvg rank={item.rank} size={20} color={RANK_ICON_COLORS[item.rank]} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: theme.fonts.semibold, fontSize: theme.fontSizes.sm, color: theme.colors.goldForeground }}>
                      {item.rank_name || RANG_NAMES[item.rank]}
                    </Text>
                    <Text style={{ fontSize: theme.fontSizes.xs, color: theme.colors.mutedForeground, marginTop: 2 }}>{formatDate(item.achieved_at)}</Text>
                    {RANK_REWARDS[item.rank] && (
                      <Text style={{ fontSize: 10, color: theme.colors.mutedForeground, marginTop: 1 }}>{RANK_REWARDS[item.rank]}</Text>
                    )}
                  </View>
                  <Text style={{ fontSize: theme.fontSizes.xs, color: theme.colors.mutedForeground }}>
                    {t.rank.levelLabel} {item.rank}
                  </Text>
                </View>
                {index < history.length - 1 && (
                  <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border, marginLeft: 68 }} />
                )}
              </View>
            ))
          )}
        </GradientCard>
      </View>
    </ScreenWrapper>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

const LEG_VARIANT_COLOR: Record<string, string> = {
  info:    '#60A5FA',
  warning: '#F59E0B',
  gold:    '#FFD700',
  purple:  '#A855F7',
  success: '#10B981',
};

function LegProgressBar({ label, current, required, progress, remaining, variant }: {
  label: string; current: number; required: number;
  progress: number; remaining: number; variant: string;
}) {
  const theme = useTheme();
  const t = useT();
  const fmtN = (n: number) => (n ?? 0).toLocaleString('ru-RU');
  const isDone = current >= required;
  const accentColor = LEG_VARIANT_COLOR[variant] ?? theme.gold.primary;

  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: accentColor }} />
          <Text style={{ fontFamily: theme.fonts.regular, fontSize: theme.fontSizes.sm, color: theme.colors.mutedForeground, flex: 1 }} numberOfLines={1}>{label}</Text>
        </View>
        <View style={{
          paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, borderWidth: 1,
          borderColor: isDone ? `${theme.semantic.success}60` : theme.colors.border,
          backgroundColor: isDone ? `${theme.semantic.success}20` : 'transparent',
        }}>
          <Text style={{ fontSize: 11, fontFamily: theme.fonts.medium, color: isDone ? theme.semantic.success : theme.colors.foreground }}>
            {progress.toFixed(1)}%
          </Text>
        </View>
      </View>
      <Text style={{ fontFamily: theme.fonts.bold, fontSize: theme.fontSizes.md, color: theme.colors.foreground, marginBottom: 8 }}>
        {fmtN(current)} / {fmtN(required)} QV
      </Text>
      <ProgressBar value={Math.round(progress)} variant={variant as any} />
      {remaining > 0 && (
        <Text style={{ fontSize: 11, color: theme.colors.mutedForeground, marginTop: 5 }}>
          {t.rank.remaining}:{' '}
          <Text style={{ fontFamily: theme.fonts.medium, color: accentColor }}>{fmtN(remaining)} QV</Text>
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    gap: 12,
  },
});
