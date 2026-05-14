import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Platform, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Bell,
  Wallet,
  CreditCard,
  Users,
  Gift,
  TrendingUp,
  Scale,
  Award,
  Trophy,
  BarChart2,
  Ticket,
  RefreshCw,
  PiggyBank,
  Banknote,
  Lock,
  Check,
  X,
  Copy,
  CheckCircle,
  Calendar,
  AlertTriangle,
  Clock,
} from 'lucide-react-native';
import { useTheme } from '@/theme';
import {
  ScreenWrapper,
  GradientCard,
  GlassCard,
  RankBadge,
  ProgressBar,
  Avatar,
  RANKS,
  MiniStatCard,
  SectionHeader,
  StatusBadge,
} from '@/components/ui';
import { RankIconSvg } from '@/components/ui/RankIconSvg';
import { useAuthStore } from '@/store';
import { rankService, notificationService, financeService, RankProgressResponse, BalanceResponse } from '@/api';
import { MEDIA_BASE_URL } from '@/api/config';
import { useT } from '@/i18n';

interface DashboardScreenProps {
  onNotificationsPress: () => void;
  onTeamPress?: () => void;
  onRankPress?: () => void;
  onStatisticsPress?: () => void;
  onKonkursPress?: () => void;
}

export function DashboardScreen({ onNotificationsPress, onTeamPress, onRankPress, onStatisticsPress, onKonkursPress }: DashboardScreenProps) {
  const theme = useTheme();
  const t = useT();
  const { user, refreshProfile } = useAuthStore();
  const [rankProgress, setRankProgress] = useState<RankProgressResponse | null>(null);
  const [balance, setBalance] = useState<BalanceResponse | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [rankBannerDismissed, setRankBannerDismissed] = useState(false);
  const [copiedLeg, setCopiedLeg] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [progressResult, unreadResult, balanceResult] = await Promise.all([
        rankService.getProgress(),
        notificationService.getUnreadCount(),
        financeService.getBalance(),
      ]);

      if (!('error' in progressResult)) setRankProgress(progressResult.progress);
      if (!('error' in unreadResult)) setUnreadCount(unreadResult.count);
      if (!('error' in balanceResult)) setBalance(balanceResult.balance);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshProfile(), fetchData()]);
    setRefreshing(false);
  }, [refreshProfile, fetchData]);

  if (!user) return null;

  const isToday = (dateStr?: string | null) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  };

  const handleCopyLeg = async (link: string, leg: string) => {
    await Clipboard.setStringAsync(link);
    setCopiedLeg(leg);
    setTimeout(() => setCopiedLeg(null), 2000);
  };

  const showRankBanner = !rankBannerDismissed && user.rank > 0 && isToday(user.rankTime) && user.type !== 0;

  const getPlanDaysLeft = () => {
    if (!user.planExpire) return null;
    const exp = new Date(user.planExpire.includes('T') ? user.planExpire : user.planExpire + 'T00:00:00+05:00');
    const now = Date.now();
    const days = Math.ceil((exp.getTime() - now) / 86400000);
    return days;
  };

  const planDaysLeft = getPlanDaysLeft();

  const leftLegQV = rankProgress ? parseFloat(rankProgress.left_total_qv) : user.leftSum;
  const rightLegQV = rankProgress ? parseFloat(rankProgress.right_total_qv) : user.rightSum;
  const leftRefCount = rankProgress?.left_ref_count || 0;
  const rightRefCount = rankProgress?.right_ref_count || 0;

  const RANK_MILESTONES = [0, 900, 1000, 3000, 10500, 25000, 60000, 90000, 250000, 900000, 3000000, 8000000, 24000000];
  const RANK_MILESTONE_REF = [0, 50, 100, 200, 400, 800, 1000, 2000, 4000, 8000, 16000, 32000, 0];

  const currentRankId = rankProgress?.current_rank ?? user.rank;
  const nextRankId = rankProgress?.next_rank ?? (currentRankId < 12 ? currentRankId + 1 : 12);
  const requiredQV = RANK_MILESTONES[nextRankId] ?? 900;
  const requiredRefQV = RANK_MILESTONE_REF[nextRankId] ?? 0;

  const RANK_LEADER_CLIENT_SPLIT = 7;
  const getInvQv = (leaderQv: number, clientQv: number) =>
    nextRankId <= RANK_LEADER_CLIENT_SPLIT ? Math.min(leaderQv, clientQv) : leaderQv;
  const leftInvQV = rankProgress
    ? getInvQv(parseFloat(rankProgress.left_inv_leader_qv) || 0, parseFloat(rankProgress.left_inv_client_qv) || 0)
    : 0;
  const rightInvQV = rankProgress
    ? getInvQv(parseFloat(rankProgress.right_inv_leader_qv) || 0, parseFloat(rankProgress.right_inv_client_qv) || 0)
    : 0;

  const weakLeg = Math.min(leftLegQV, rightLegQV);
  // Always compute locally — backend progress_percentage is unreliable (often 0)
  const overallProgress = requiredQV > 0
    ? Math.min(100, Math.round((weakLeg / requiredQV) * 100))
    : currentRankId >= 12 ? 100 : 0;

  const nextRank = {
    current: currentRankId,
    next: nextRankId,
    leftLeg: { current: leftLegQV, required: requiredQV },
    rightLeg: { current: rightLegQV, required: requiredQV },
    leftInv: { current: leftInvQV, required: requiredRefQV },
    rightInv: { current: rightInvQV, required: requiredRefQV },
    progress: overallProgress,
  };

  const totalPartners = leftRefCount + rightRefCount;
  const achievements = [
    { icon: Users, label: t.dashboard.partner10, unlocked: totalPartners >= 10 },
    { icon: TrendingUp, label: t.dashboard.earned1M, unlocked: user.totalBonus >= 1000000 },
    { icon: Scale, label: t.dashboard.balanced, unlocked: Math.abs(leftLegQV - rightLegQV) < requiredQV * 0.1 },
    { icon: Award, label: t.dashboard.eliteRank, unlocked: user.rank >= 5 },
  ];

  const pct = (cur: number, req: number) =>
    req > 0 ? Math.min(100, Math.round((cur / req) * 100)) : 0;

  const quickNav = [
    { icon: Users,     label: t.dashboard.navTeam,       onPress: onTeamPress,       color: '#60A5FA' },
    { icon: Trophy,    label: t.dashboard.navRank,       onPress: onRankPress,       color: theme.gold.primary },
    { icon: BarChart2, label: t.dashboard.navStatistics, onPress: onStatisticsPress, color: '#A78BFA' },
    { icon: Ticket,    label: t.dashboard.navKonkurs,    onPress: onKonkursPress,    color: '#34D399' },
  ] as const;

  return (
    <ScreenWrapper
      scrollable
      padded={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.gold.primary}
        />
      }
    >
      <View style={{ paddingHorizontal: theme.screenPadding.horizontal }}>

        {/* ── Rank Achievement Banner ── */}
        {showRankBanner && (
          <View style={[styles.rankBanner, { borderColor: `${theme.gold.primary}50`, backgroundColor: `${theme.gold.primary}10` }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: `${theme.gold.primary}20`, alignItems: 'center', justifyContent: 'center' }}>
                <Award size={22} color={theme.colors.goldForeground} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: theme.fonts.bold, fontSize: theme.fontSizes.sm, color: theme.colors.goldForeground }}>
                  {t.dashboard.rankAchievedTitle}
                </Text>
                <Text style={{ fontFamily: theme.fonts.regular, fontSize: theme.fontSizes.xs, color: theme.colors.mutedForeground, marginTop: 2 }}>
                  {t.dashboard.rankAchievedMsg} <Text style={{ color: theme.colors.goldForeground, fontFamily: theme.fonts.semibold }}>{(t.team.rankNames as Record<number, string>)[user.rank] || ''}</Text>
                </Text>
              </View>
              <TouchableOpacity onPress={() => setRankBannerDismissed(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={16} color={theme.colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={{ fontFamily: theme.fonts.regular, fontSize: theme.fontSizes.sm, color: theme.colors.mutedForeground }}>
              {t.auth.sponsor}: <Text style={{ color: theme.colors.foreground }}>{user.sponsorLogin || String(user.sponsorId)}</Text>
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
              <Text style={{ fontFamily: theme.fonts.displayBold, fontSize: theme.fontSizes['2xl'], color: theme.colors.foreground }}>
                Zharqyn Life
              </Text>
              <Text style={{ fontFamily: theme.fonts.regular, fontSize: theme.fontSizes.xs, color: theme.colors.mutedForeground }}>
                {t.dashboard.qvRate}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={onNotificationsPress} activeOpacity={0.8} style={{ position: 'relative' }}>
            <GlassCard
              cornerRadius={theme.borderRadius.full}
              style={{ padding: theme.spacing[3], borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border }}
            >
              <Bell size={22} color={theme.colors.foreground} />
            </GlassCard>
            {unreadCount > 0 && (
              <View style={[styles.notificationDot, { backgroundColor: theme.semantic.error }]}>
                {unreadCount <= 9 && (
                  <Text style={{ color: '#FFF', fontSize: 8, fontWeight: 'bold' }}>{unreadCount}</Text>
                )}
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Hero: Profile + Balance ── */}
        <View style={{ marginBottom: theme.spacing[4] }}>
          {Platform.OS === 'ios' ? (
            <View style={{ borderRadius: theme.borderRadius['2xl'], overflow: 'hidden' }}>
              <LinearGradient
                colors={['rgba(255,215,0,0.18)', 'rgba(218,165,32,0.06)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.heroCard, { borderColor: 'rgba(255,215,0,0.3)', borderWidth: 1 }]}
              >
                <HeroContent user={user} balance={balance} nextRank={nextRank} achievements={achievements} overallProgress={overallProgress} />
              </LinearGradient>
            </View>
          ) : (
            <View style={[styles.heroCard, { backgroundColor: theme.colors.card, borderColor: 'rgba(255,215,0,0.3)', borderWidth: 1 }]}>
              <HeroContent user={user} balance={balance} nextRank={nextRank} achievements={achievements} overallProgress={overallProgress} />
            </View>
          )}
        </View>

        {/* ── Quick Actions ── */}
        <View style={styles.quickNav}>
          {quickNav.map(({ icon: Icon, label, onPress, color }) => (
            <TouchableOpacity key={label} onPress={onPress} activeOpacity={0.75} style={styles.quickNavItem}>
              <GlassCard
                cornerRadius={16}
                style={{ padding: theme.spacing[3], alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border }}
              >
                <View style={[styles.quickNavIcon, { backgroundColor: `${color}18` }]}>
                  <Icon size={20} color={color} />
                </View>
                <Text numberOfLines={1} style={{ fontSize: 11, color: theme.colors.mutedForeground, fontFamily: theme.fonts.medium, marginTop: 6 }}>
                  {label}
                </Text>
              </GlassCard>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Referral Links (leaders only) ── */}
        {user.type !== 0 && (
          <View style={{ marginTop: theme.spacing[4] }}>
            <SectionHeader title={t.dashboard.refLinksQuick} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {[
                { leg: 'left', label: t.profile.leftLeg, link: user.leftLegLink },
                { leg: 'right', label: t.profile.rightLeg, link: user.rightLegLink },
              ].map(({ leg, label, link }) => (
                <TouchableOpacity
                  key={leg}
                  onPress={() => handleCopyLeg(link, leg)}
                  activeOpacity={0.75}
                  style={{ flex: 1 }}
                >
                  <GlassCard style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: theme.spacing[3], borderWidth: StyleSheet.hairlineWidth, borderColor: copiedLeg === leg ? `${theme.semantic.success}60` : theme.colors.border }}>
                    <Text style={{ fontFamily: theme.fonts.medium, fontSize: theme.fontSizes.xs, color: theme.colors.foreground }}>{label}</Text>
                    {copiedLeg === leg
                      ? <CheckCircle size={15} color={theme.semantic.success} />
                      : <Copy size={15} color={theme.colors.mutedForeground} />
                    }
                  </GlassCard>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ── Wallet Stats ── */}
        <View style={{ marginTop: theme.spacing[6] }}>
          <SectionHeader title={user.type !== 0 ? t.dashboard.leaderWallet : t.finance.cashback} />

          {user.type !== 0 ? (
            <>
              {/* Total Earned — full width hero stat */}
              <GradientCard variant="default" style={{ marginBottom: theme.spacing[3] }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={[styles.statIcon, { backgroundColor: `${theme.gold.primary}20` }]}>
                      <TrendingUp size={18} color={theme.colors.goldForeground} />
                    </View>
                    <Text style={{ fontFamily: theme.fonts.medium, fontSize: theme.fontSizes.sm, color: theme.colors.mutedForeground }}>
                      {t.dashboard.totalEarned}
                    </Text>
                  </View>
                  <Text style={{ fontFamily: theme.fonts.bold, fontSize: theme.fontSizes.xl, color: theme.colors.foreground }}>
                    {(balance?.total_earned ?? 0).toLocaleString('ru-KZ')} <Text style={{ fontSize: theme.fontSizes.sm, color: theme.colors.mutedForeground }}>QV</Text>
                  </Text>
                </View>
              </GradientCard>

              {/* 2-col grid */}
              <View style={styles.statsGrid}>
                <MiniStatCard icon={<Banknote size={16} color={theme.semantic.success} />} label={t.dashboard.weeklyBonus} value={`${parseFloat(String(balance?.totalbonus ?? user.totalBonus)).toLocaleString('ru-KZ')} QV`} iconBg={`${theme.semantic.success}18`} badge={balance && !balance.weekly_bonus_can_withdraw ? t.dashboard.nextWeek : undefined} badgeColor={theme.semantic.warning} />
                <MiniStatCard icon={<Award size={16} color={theme.colors.goldForeground} />} label={t.dashboard.rankPrize} value={`${(balance?.rank_prize ?? user.rankPrize ?? 0).toLocaleString('ru-KZ')} ₸`} iconBg={`${theme.gold.primary}18`} />
              </View>
              <View style={[styles.statsGrid, { marginTop: theme.spacing[3] }]}>
                <MiniStatCard icon={<Users size={16} color='#60A5FA' />} label={t.dashboard.referralBonus} value={`${(balance?.ref_bon ?? user.referralBonus ?? 0).toLocaleString('ru-KZ')} QV`} iconBg='rgba(96,165,250,0.15)' />
                <MiniStatCard icon={<Gift size={16} color='#A855F7' />} label={t.dashboard.binaryBonus} value={`${parseFloat(String(balance?.binarybonus ?? user.binaryBonus)).toLocaleString('ru-KZ')} QV`} iconBg='rgba(168,85,247,0.15)' />
              </View>
              <View style={[styles.statsGrid, { marginTop: theme.spacing[3] }]}>
                <MiniStatCard icon={<RefreshCw size={16} color={theme.semantic.success} />} label={t.dashboard.repeatPurchaseBonus} value={`${(balance?.repeat_purchase_bonus ?? user.repeatPurchaseBonus ?? 0).toLocaleString('ru-KZ')} ₸`} iconBg={`${theme.semantic.success}15`} />
                <MiniStatCard icon={<PiggyBank size={16} color={theme.colors.mutedForeground} />} label={t.dashboard.topupsTotal} value={`${(balance?.topups_total ?? user.topupsTotal ?? 0).toLocaleString('ru-KZ')} ₸`} iconBg={`${theme.colors.mutedForeground}15`} />
              </View>
            </>
          ) : (
            <>
              <View style={styles.statsGrid}>
                <MiniStatCard icon={<PiggyBank size={16} color={theme.colors.goldForeground} />} label={t.finance.cashback} value={`${(balance?.cashback_new ?? user.cashback_new ?? 0).toLocaleString('ru-KZ')} QV`} iconBg={`${theme.gold.primary}18`} />
                <MiniStatCard icon={<Users size={16} color='#60A5FA' />} label={t.dashboard.referralBonus} value={`${(balance?.ref_bon ?? user.referralBonus ?? 0).toLocaleString('ru-KZ')} QV`} iconBg='rgba(96,165,250,0.15)' />
              </View>
              <View style={[styles.statsGrid, { marginTop: theme.spacing[3] }]}>
                <MiniStatCard icon={<RefreshCw size={16} color={theme.semantic.success} />} label={t.dashboard.repeatPurchaseBonus} value={`${(balance?.repeat_purchase_bonus ?? user.repeatPurchaseBonus ?? 0).toLocaleString('ru-KZ')} ₸`} iconBg={`${theme.semantic.success}15`} />
                <View style={{ flex: 1 }} />
              </View>
            </>
          )}
        </View>

        {/* ── Rank Progress ── */}
        <View style={{ marginTop: theme.spacing[6] }}>
          <SectionHeader title={t.dashboard.progressTo} badge={`${RANKS.find((r) => r.id === nextRank.current)?.name || '—'} → ${RANKS.find((r) => r.id === nextRank.next)?.name || 'MAX'}`} badgeColor={theme.colors.goldForeground} />

          <GradientCard>
            {/* Hero: % + rank icons */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing[4] }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: theme.fonts.displayBold, fontSize: 44, color: theme.colors.goldForeground, lineHeight: 48 }}>
                  {nextRank.progress}%
                </Text>
                <Text style={{ fontFamily: theme.fonts.regular, fontSize: theme.fontSizes.xs, color: theme.colors.mutedForeground, marginTop: 2 }}>
                  {t.dashboard.progressTo} {RANKS.find((r) => r.id === nextRank.next)?.name || 'MAX'}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <RankBadge rank={nextRank.current} size="md" showName />
                <Text style={{ color: theme.colors.mutedForeground, fontSize: 16 }}>→</Text>
                <RankBadge rank={nextRank.next} size="md" showName />
              </View>
            </View>
            <ProgressBar value={nextRank.progress} height={10} variant="gold" style={{ marginBottom: theme.spacing[5] }} />

            {/* Legs — full width stacked */}
            <View style={{ gap: theme.spacing[4] }}>
              <LegProgress label={t.dashboard.leftLeg} current={nextRank.leftLeg.current} required={nextRank.leftLeg.required} pct={pct} variant="info" />
              <LegProgress label={t.dashboard.rightLeg} current={nextRank.rightLeg.current} required={nextRank.rightLeg.required} pct={pct} variant="purple" />
              {nextRank.leftInv.required > 0 && (
                <LegProgress label={`${nextRank.next > 7 ? t.rank.invitationsLeaders : t.rank.invitationsAll} — ${t.rank.invLeft}`} current={nextRank.leftInv.current} required={nextRank.leftInv.required} pct={pct} variant="warning" />
              )}
              {nextRank.rightInv.required > 0 && (
                <LegProgress label={`${nextRank.next > 7 ? t.rank.invitationsLeaders : t.rank.invitationsAll} — ${t.rank.invRight}`} current={nextRank.rightInv.current} required={nextRank.rightInv.required} pct={pct} variant="gold" />
              )}
            </View>

            {/* Weekly QV */}
            {rankProgress && (rankProgress.left_week_qv > 0 || rankProgress.right_week_qv > 0) && (
              <View style={{ flexDirection: 'row', gap: theme.spacing[2], marginTop: theme.spacing[4] }}>
                <View style={{ flex: 1, backgroundColor: 'rgba(96,165,250,0.08)', borderRadius: theme.borderRadius.lg, padding: theme.spacing[3] }}>
                  <Text style={{ fontFamily: theme.fonts.regular, fontSize: 10, color: theme.colors.mutedForeground, marginBottom: 3 }}>
                    {t.dashboard.thisWeek} · {t.dashboard.leftLeg}
                  </Text>
                  <Text style={{ fontFamily: theme.fonts.bold, fontSize: theme.fontSizes.sm, color: '#60A5FA' }}>
                    {(rankProgress.left_week_qv ?? 0).toLocaleString('ru-KZ')} QV
                  </Text>
                </View>
                <View style={{ flex: 1, backgroundColor: 'rgba(167,139,250,0.08)', borderRadius: theme.borderRadius.lg, padding: theme.spacing[3] }}>
                  <Text style={{ fontFamily: theme.fonts.regular, fontSize: 10, color: theme.colors.mutedForeground, marginBottom: 3 }}>
                    {t.dashboard.thisWeek} · {t.dashboard.rightLeg}
                  </Text>
                  <Text style={{ fontFamily: theme.fonts.bold, fontSize: theme.fontSizes.sm, color: '#A78BFA' }}>
                    {(rankProgress.right_week_qv ?? 0).toLocaleString('ru-KZ')} QV
                  </Text>
                </View>
              </View>
            )}

            {/* Reward banner */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3], backgroundColor: `${theme.gold.primary}12`, borderRadius: theme.borderRadius.lg, borderWidth: 1, borderColor: `${theme.gold.primary}30`, padding: theme.spacing[3], marginTop: theme.spacing[4] }}>
              <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: `${theme.gold.primary}20`, alignItems: 'center', justifyContent: 'center' }}>
                <Gift size={18} color={theme.colors.goldForeground} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: theme.fonts.regular, fontSize: theme.fontSizes.xs, color: theme.colors.mutedForeground }}>
                  {t.dashboard.rankReward} {RANKS.find((r) => r.id === nextRank.next)?.name || 'Diamond'}
                </Text>
                <Text style={{ fontFamily: theme.fonts.bold, fontSize: theme.fontSizes.md, color: theme.gold.darker, marginTop: 2 }}>
                  + 50,000 ₸ {t.dashboard.rankBonus}
                </Text>
              </View>
            </View>
          </GradientCard>
        </View>

        {/* ── Rank Roadmap ── */}
        <View style={{ marginTop: theme.spacing[6], marginBottom: theme.spacing[8] }}>
          <SectionHeader title={t.dashboard.rankRoad} />
          <GradientCard padding={theme.spacing[3]}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: theme.spacing[2], paddingHorizontal: 2 }}
            >
              {RANKS.filter((r) => r.id >= 1).map((rank, index, arr) => {
                const isCompleted = rank.id < nextRank.current;
                const isCurrent = rank.id === nextRank.current;
                const isNext = rank.id === nextRank.next;
                const isLocked = !isCompleted && !isCurrent && !isNext;

                return (
                  <View key={rank.id} style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <View style={{ alignItems: 'center', width: 58 }}>
                      {/* Label above node — fixed 24px height */}
                      <View style={{ height: 24, justifyContent: 'center', marginBottom: 4 }}>
                        {isCurrent ? (
                          <View style={{ backgroundColor: theme.gold.primary, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 }}>
                            <Text style={{ fontSize: 9, color: '#000', fontFamily: theme.fonts.bold }}>{t.dashboard.yourBadge}</Text>
                          </View>
                        ) : isNext ? (
                          <View style={{ backgroundColor: `${theme.semantic.info}18`, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3, borderWidth: 1, borderColor: `${theme.semantic.info}35` }}>
                            <Text style={{ fontSize: 9, color: theme.semantic.info, fontFamily: theme.fonts.medium }}>Далее</Text>
                          </View>
                        ) : null}
                      </View>

                      {/* Circle node — 44px */}
                      <View style={{
                        width: 44, height: 44, borderRadius: 22,
                        backgroundColor: isCompleted ? `${theme.semantic.success}15`
                          : isCurrent ? `${theme.gold.primary}20`
                          : isNext ? `${theme.semantic.info}12`
                          : theme.colors.card,
                        borderWidth: isCurrent ? 2 : 1,
                        borderColor: isCompleted ? `${theme.semantic.success}50`
                          : isCurrent ? theme.gold.primary
                          : isNext ? `${theme.semantic.info}45`
                          : theme.colors.border,
                        alignItems: 'center', justifyContent: 'center',
                        opacity: isLocked ? 0.35 : 1,
                      }}>
                        {isCompleted ? (
                          <Check size={18} color={theme.semantic.success} strokeWidth={2.5} />
                        ) : isLocked ? (
                          <Lock size={14} color={theme.colors.mutedForeground} />
                        ) : (
                          <RankIconSvg rank={rank.id} size={22}
                            color={isCurrent ? theme.colors.goldForeground : theme.semantic.info}
                          />
                        )}
                      </View>

                      {/* Rank name */}
                      <Text style={{
                        fontFamily: isCurrent ? theme.fonts.semibold : theme.fonts.regular,
                        fontSize: 9,
                        color: isCompleted ? theme.semantic.success
                          : isCurrent ? theme.colors.goldForeground
                          : isNext ? theme.semantic.info
                          : theme.colors.mutedForeground,
                        marginTop: 6, textAlign: 'center', width: 58,
                        opacity: isLocked ? 0.45 : 1,
                      }} numberOfLines={2}>
                        {rank.name}
                      </Text>
                    </View>

                    {/* Connector line: marginTop = 24(label) + 4(mb) + 22(half circle) = 50 */}
                    {index < arr.length - 1 && (
                      <View style={{
                        width: 14, height: 3,
                        marginTop: 50,
                        backgroundColor: isCompleted ? theme.semantic.success : theme.colors.border,
                        borderRadius: 1.5,
                      }} />
                    )}
                  </View>
                );
              })}
            </ScrollView>
          </GradientCard>
        </View>

      </View>
    </ScreenWrapper>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function HeroContent({ user, balance, nextRank, achievements, overallProgress }: any) {
  const theme = useTheme();
  const t = useT();

  const statusName = (t.dashboard.statusNames as Record<number, string>)[user.status ?? 0] ?? '';
  const statusVariant = (() => {
    if (!user.status) return 'muted';
    if (user.status >= 5) return 'gold';
    if (user.status >= 3) return 'success';
    return 'info';
  })();

  const planExp = user.planExpire
    ? new Date(user.planExpire.includes('T') ? user.planExpire : user.planExpire + 'T00:00:00+05:00')
    : null;
  const planDays = planExp ? Math.ceil((planExp.getTime() - Date.now()) / 86400000) : null;
  const planExpired = planDays !== null && planDays <= 0;
  const planUrgent = !planExpired && planDays !== null && planDays <= 14;
  const planWarning = !planExpired && !planUrgent && planDays !== null && planDays <= 30;
  const planColor = planExpired ? theme.semantic.error : planUrgent ? theme.semantic.error : planWarning ? theme.semantic.warning : theme.semantic.success;

  return (
    <View>
      {/* Top row: avatar + info + balance */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: theme.spacing[4] }}>
        <Avatar name={user.name} source={user.avatar ? `${MEDIA_BASE_URL}${user.avatar}` : undefined} size="lg" />
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={{ fontFamily: theme.fonts.bold, fontSize: theme.fontSizes.lg, color: theme.colors.foreground, marginBottom: 4 }}>
            {user.name}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <RankBadge rank={user.rank} size="sm" showName />
            {statusName ? <StatusBadge label={statusName} variant={statusVariant as any} size="sm" /> : null}
          </View>
        </View>
      </View>

      {/* Plan expiry widget */}
      {user.status > 0 && planDays !== null && (
        <View style={[styles.planExpiry, { borderColor: `${planColor}40`, backgroundColor: `${planColor}08` }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {planExpired || planUrgent
              ? <AlertTriangle size={14} color={planColor} />
              : <Clock size={14} color={planColor} />
            }
            <Text style={{ fontFamily: theme.fonts.medium, fontSize: theme.fontSizes.xs, color: theme.colors.foreground }}>
              {`${t.dashboard.statusNames[user.status] || ''} `}
              <Text style={{ color: planColor, fontFamily: theme.fonts.bold }}>
                {planExpired
                  ? t.dashboard.planExpired
                  : `${planDays} ${t.dashboard.planDaysLeft}`
                }
              </Text>
            </Text>
            {(planExpired || planUrgent) && (
              <Text style={{ marginLeft: 'auto', fontFamily: theme.fonts.medium, fontSize: theme.fontSizes.xs, color: planColor }}>
                {t.dashboard.planRenew}
              </Text>
            )}
          </View>
        </View>
      )}


      {/* Balance row */}
      <View style={{ flexDirection: 'row', gap: theme.spacing[3], marginBottom: theme.spacing[4] }}>
        <View style={{ flex: 1, backgroundColor: theme.colors.card, borderRadius: 16, padding: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Wallet size={14} color={theme.colors.goldForeground} />
            <Text style={{ fontFamily: theme.fonts.regular, fontSize: 11, color: theme.colors.mutedForeground }}>{t.dashboard.balance}</Text>
          </View>
          <Text style={{ fontFamily: theme.fonts.bold, fontSize: theme.fontSizes['2xl'], color: theme.colors.foreground }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
            {(user.balance ?? 0).toLocaleString('ru-KZ')}
          </Text>
          <Text style={{ fontFamily: theme.fonts.medium, fontSize: 11, color: theme.colors.mutedForeground }}>₸</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: theme.colors.card, borderRadius: 16, padding: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <CreditCard size={14} color={theme.colors.goldForeground} />
            <Text style={{ fontFamily: theme.fonts.regular, fontSize: 11, color: theme.colors.mutedForeground }}>{t.dashboard.deposit}</Text>
          </View>
          <Text style={{ fontFamily: theme.fonts.bold, fontSize: theme.fontSizes['2xl'], color: theme.colors.foreground }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
            {(user.deposit ?? 0).toLocaleString('ru-KZ')}
          </Text>
          <Text style={{ fontFamily: theme.fonts.medium, fontSize: 11, color: theme.colors.mutedForeground }}>₸</Text>
        </View>
      </View>

      {/* Rank progress mini */}
      <View style={{ marginBottom: theme.spacing[3] }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <Text style={{ fontFamily: theme.fonts.medium, fontSize: 11, color: theme.colors.mutedForeground }}>
            {t.dashboard.progressTo}
          </Text>
          <Text style={{ fontFamily: theme.fonts.semibold, fontSize: 11, color: theme.colors.goldForeground }}>
            {overallProgress}%
          </Text>
        </View>
        <ProgressBar value={overallProgress} height={4} variant="gold" />
      </View>

      {/* Achievements */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {achievements.map((a: any, i: number) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, backgroundColor: a.unlocked ? theme.colors.goldSurface : `${theme.colors.mutedForeground}12`, borderRadius: 99, borderWidth: 1, borderColor: a.unlocked ? `${theme.colors.goldForeground}40` : theme.colors.border }}>
            <a.icon size={13} color={a.unlocked ? theme.colors.goldForeground : theme.colors.mutedForeground} />
            <Text numberOfLines={1} style={{ fontFamily: theme.fonts.medium, fontSize: 11, color: a.unlocked ? theme.colors.goldForeground : theme.colors.mutedForeground, marginLeft: 5 }}>
              {a.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}


const LEG_DOT_COLORS: Record<string, string> = {
  gold:   '#FFD700',
  info:   '#60A5FA',
  purple: '#A855F7',
  warning:'#F59E0B',
  success:'#10B981',
};

function LegProgress({ label, current, required, pct, variant }: { label: string; current: number; required: number; pct: (c: number, r: number) => number; variant: string }) {
  const theme = useTheme();
  const t = useT();
  const progress = pct(current, required);
  const remaining = Math.max(0, (required ?? 0) - (current ?? 0));
  const isDone = (current ?? 0) >= (required ?? 0);
  const dotColor = LEG_DOT_COLORS[variant] ?? theme.gold.primary;

  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: dotColor }} />
          <Text style={{ fontFamily: theme.fonts.medium, fontSize: theme.fontSizes.xs, color: theme.colors.mutedForeground, flex: 1 }} numberOfLines={1}>
            {label}
          </Text>
        </View>
        <Text style={{ fontFamily: theme.fonts.semibold, fontSize: theme.fontSizes.xs, color: isDone ? theme.semantic.success : theme.colors.foreground }}>
          {(current ?? 0).toLocaleString('ru-KZ')} / {(required ?? 0).toLocaleString('ru-KZ')}
        </Text>
      </View>
      <ProgressBar value={progress} height={6} variant={variant as any} />
      {remaining > 0 && (
        <Text style={{ fontFamily: theme.fonts.regular, fontSize: 10, color: theme.colors.mutedForeground, marginTop: 4 }}>
          {t.rank.remaining}:{' '}
          <Text style={{ fontFamily: theme.fonts.medium, color: dotColor }}>
            {remaining.toLocaleString('ru-KZ')} QV
          </Text>
        </Text>
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 8,
  },
  notificationDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  heroCard: {
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  quickNav: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 4,
  },
  quickNavItem: {
    flex: 1,
  },
  quickNavIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBanner: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  planExpiry: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    marginBottom: 12,
  },
});
