import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator, Platform } from 'react-native';
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
  CheckCircle,
  Trophy,
  BarChart2,
  Ticket,
  RefreshCw,
  PiggyBank,
  Banknote,
  Lock,
  Check,
} from 'lucide-react-native';
import { useTheme } from '@/theme';
import {
  ScreenWrapper,
  GradientCard,
  GlassCard,
  RankBadge,
  StatCard,
  ProgressBar,
  Avatar,
  RANKS,
} from '@/components/ui';
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

  // Use real data from API or fallback to user data
  const leftLegQV = rankProgress ? parseFloat(rankProgress.left_total_qv) : user.leftSum;
  const rightLegQV = rankProgress ? parseFloat(rankProgress.right_total_qv) : user.rightSum;
  const leftRefCount = rankProgress?.left_ref_count || 0;
  const rightRefCount = rankProgress?.right_ref_count || 0;

  // Binary MLM rank milestones — index = rank ID, value = min QV required per leg
  const RANK_MILESTONES = [0, 900, 1000, 3000, 10500, 25000, 60000, 90000, 250000, 900000, 3000000, 8000000, 24000000];
  // Min referral inv QV required per leg per rank (0 = not checked)
  const RANK_MILESTONE_REF = [0, 50, 100, 200, 400, 800, 1000, 2000, 4000, 8000, 16000, 32000, 0];

  const currentRankId = rankProgress?.current_rank ?? user.rank;
  const nextRankId = rankProgress?.next_rank ?? (currentRankId < 12 ? currentRankId + 1 : 12);
  const requiredQV = RANK_MILESTONES[nextRankId] ?? 900;
  const requiredRefQV = RANK_MILESTONE_REF[nextRankId] ?? 0;

  // QV от прямых рефералов — для рангов 1-7 min(leader,client), для 8-12 только leader
  const RANK_LEADER_CLIENT_SPLIT = 7;
  const getInvQv = (leaderQv: number, clientQv: number) =>
    nextRankId <= RANK_LEADER_CLIENT_SPLIT ? Math.min(leaderQv, clientQv) : leaderQv;
  const leftInvQV = rankProgress
    ? getInvQv(parseFloat(rankProgress.left_inv_leader_qv) || 0, parseFloat(rankProgress.left_inv_client_qv) || 0)
    : 0;
  const rightInvQV = rankProgress
    ? getInvQv(parseFloat(rankProgress.right_inv_leader_qv) || 0, parseFloat(rankProgress.right_inv_client_qv) || 0)
    : 0;

  // Прогресс = слабая нога (обе ноги должны быть >= milestone)
  const weakLeg = Math.min(leftLegQV, rightLegQV);
  const overallProgress = rankProgress?.progress_percentage != null
    ? Math.round(rankProgress.progress_percentage)
    : requiredQV > 0 ? Math.min(100, Math.round((weakLeg / requiredQV) * 100)) : 0;

  const nextRank = {
    current: currentRankId,
    next: nextRankId,
    leftLeg: { current: leftLegQV, required: requiredQV },
    rightLeg: { current: rightLegQV, required: requiredQV },
    leftInv: { current: leftInvQV, required: requiredRefQV },
    rightInv: { current: rightInvQV, required: requiredRefQV },
    progress: overallProgress,
  };

  // Dynamic achievements based on real data
  const totalPartners = leftRefCount + rightRefCount;
  const achievements = [
    { icon: Users, label: t.dashboard.partner10, unlocked: totalPartners >= 10 },
    { icon: TrendingUp, label: t.dashboard.earned1M, unlocked: user.totalBonus >= 1000000 },
    { icon: Scale, label: t.dashboard.balanced, unlocked: Math.abs(leftLegQV - rightLegQV) < requiredQV * 0.1 },
    { icon: Award, label: t.dashboard.eliteRank, unlocked: user.rank >= 5 },
  ];

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
        {/* Header */}
        <View style={styles.header}>
          <Text
            style={[
              styles.headerTitle,
              {
                fontFamily: theme.fonts.displayBold,
                fontSize: theme.fontSizes['2xl'],
                color: theme.colors.foreground,
              },
            ]}
          >
            Fenix
          </Text>
          <TouchableOpacity
            onPress={onNotificationsPress}
            style={styles.notificationButton}
            activeOpacity={0.8}
          >
            <GlassCard
              cornerRadius={theme.borderRadius.full}
              style={{
                padding: theme.spacing[2],
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: 'rgba(255,255,255,0.15)',
              }}
            >
              <Bell size={24} color={theme.colors.foreground} />
            </GlassCard>
            {unreadCount > 0 && (
              <View
                style={[
                  styles.notificationDot,
                  {
                    backgroundColor: theme.semantic.error,
                    top: 2,
                    right: 2,
                  },
                ]}
              >
                {unreadCount <= 9 && (
                  <Text style={{ color: '#FFF', fontSize: 8, fontWeight: 'bold' }}>
                    {unreadCount}
                  </Text>
                )}
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <GradientCard variant="gold" style={{ marginBottom: theme.spacing[6] }}>
          <View style={styles.profileHeader}>
            <Avatar name={user.name} source={user.avatar ? `${MEDIA_BASE_URL}${user.avatar}` : undefined} size="lg" />
            <View style={styles.profileInfo}>
              <Text
                style={[
                  styles.profileName,
                  {
                    fontFamily: theme.fonts.bold,
                    fontSize: theme.fontSizes.lg,
                    color: theme.colors.foreground,
                  },
                ]}
              >
                {user.name}
              </Text>
              <View style={styles.rankRow}>
                <RankBadge rank={user.rank} size="sm" showName />
              </View>
              <Text
                style={[
                  styles.sponsorText,
                  {
                    fontFamily: theme.fonts.regular,
                    fontSize: theme.fontSizes.xs,
                    color: theme.colors.mutedForeground,
                  },
                ]}
              >
                {t.auth.sponsor}: {user.sponsorId}
              </Text>
            </View>
          </View>

          {/* Achievements */}
          <View style={styles.achievementsGrid}>
            {achievements.map((achievement, index) => (
              <View
                key={index}
                style={[
                  styles.achievementChip,
                  {
                    backgroundColor: achievement.unlocked
                      ? theme.colors.goldSurface
                      : `${theme.colors.mutedForeground}12`,
                    borderRadius: theme.borderRadius.full,
                    borderWidth: 1,
                    borderColor: achievement.unlocked
                      ? `${theme.colors.goldForeground}40`
                      : theme.colors.border,
                  },
                ]}
              >
                <achievement.icon
                  size={14}
                  color={
                    achievement.unlocked
                      ? theme.colors.goldForeground
                      : theme.colors.mutedForeground
                  }
                />
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: theme.fonts.medium,
                    fontSize: theme.fontSizes.xs,
                    color: achievement.unlocked
                      ? theme.colors.goldForeground
                      : theme.colors.mutedForeground,
                    marginLeft: theme.spacing[1],
                  }}
                >
                  {achievement.label}
                </Text>
              </View>
            ))}
          </View>
        </GradientCard>

        {/* Stats — базовые для всех */}
        <View style={styles.statsGrid}>
          <StatCard
            icon={<Wallet size={18} color={theme.colors.goldForeground} />}
            label={t.dashboard.balance}
            value={`${(user.balance ?? 0).toLocaleString('ru-KZ')} ₸`}
            style={{ flex: 1, marginRight: theme.spacing[2] }}
          />
          <StatCard
            icon={<CreditCard size={18} color={theme.colors.goldForeground} />}
            label={t.dashboard.deposit}
            value={`${(user.deposit ?? 0).toLocaleString('ru-KZ')} ₸`}
            style={{ flex: 1, marginLeft: theme.spacing[2] }}
          />
        </View>

        {/* Лидерский кошелёк — только для лидеров (type !== 0) */}
        {user.type !== 0 ? (
          <View style={{ marginTop: theme.spacing[3] }}>
            <Text style={{ fontFamily: theme.fonts.semibold, fontSize: theme.fontSizes.sm, color: theme.colors.mutedForeground, marginBottom: theme.spacing[2] }}>
              {t.dashboard.leaderWallet}
            </Text>

            {/* Строка 1: totalEarned широкая */}
            <View style={[styles.statsGrid, { marginBottom: theme.spacing[2] }]}>
              <StatCard
                icon={<TrendingUp size={18} color={theme.colors.goldForeground} />}
                label={t.dashboard.totalEarned}
                value={`${(balance?.total_earned ?? 0).toLocaleString('ru-KZ')} QV`}
                style={{ flex: 1 }}
              />
            </View>

            {/* Строка 2: weeklyBonus + rankPrize */}
            <View style={[styles.statsGrid, { marginBottom: theme.spacing[2] }]}>
              <View style={{ flex: 1, marginRight: theme.spacing[2] }}>
                <StatCard
                  icon={<Banknote size={18} color={theme.semantic.success} />}
                  label={t.dashboard.weeklyBonus}
                  value={`${parseFloat(String(balance?.totalbonus ?? user.totalBonus)).toLocaleString('ru-KZ')} QV`}
                  style={{ flex: 1 }}
                />
                {balance && !balance.weekly_bonus_can_withdraw && (
                  <View style={{ backgroundColor: `${theme.semantic.warning}18`, borderRadius: theme.borderRadius.md, paddingHorizontal: 6, paddingVertical: 2, marginTop: 4, alignSelf: 'flex-start' }}>
                    <Text style={{ fontFamily: theme.fonts.medium, fontSize: 9, color: theme.semantic.warning }}>{t.dashboard.nextWeek}</Text>
                  </View>
                )}
              </View>
              <StatCard
                icon={<Award size={18} color={theme.colors.goldForeground} />}
                label={t.dashboard.rankPrize}
                value={`${(balance?.rank_prize ?? user.rankPrize ?? 0).toLocaleString('ru-KZ')} ₸`}
                style={{ flex: 1, marginLeft: theme.spacing[2] }}
              />
            </View>

            {/* Строка 3: referralBonus + binaryBonus */}
            <View style={[styles.statsGrid, { marginBottom: theme.spacing[2] }]}>
              <StatCard
                icon={<Users size={18} color={theme.semantic.info} />}
                label={t.dashboard.referralBonus}
                value={`${(balance?.ref_bon ?? user.referralBonus ?? 0).toLocaleString('ru-KZ')} QV`}
                style={{ flex: 1, marginRight: theme.spacing[2] }}
              />
              <StatCard
                icon={<Gift size={18} color='#A855F7' />}
                label={t.dashboard.binaryBonus}
                value={`${parseFloat(String(balance?.binarybonus ?? user.binaryBonus)).toLocaleString('ru-KZ')} QV`}
                style={{ flex: 1, marginLeft: theme.spacing[2] }}
              />
            </View>

            {/* Строка 4: repeatPurchaseBonus + topupsTotal */}
            <View style={styles.statsGrid}>
              <StatCard
                icon={<RefreshCw size={18} color={theme.semantic.success} />}
                label={t.dashboard.repeatPurchaseBonus}
                value={`${(balance?.repeat_purchase_bonus ?? user.repeatPurchaseBonus ?? 0).toLocaleString('ru-KZ')} ₸`}
                style={{ flex: 1, marginRight: theme.spacing[2] }}
              />
              <StatCard
                icon={<PiggyBank size={18} color={theme.colors.mutedForeground} />}
                label={t.dashboard.topupsTotal}
                value={`${(balance?.topups_total ?? user.topupsTotal ?? 0).toLocaleString('ru-KZ')} ₸`}
                style={{ flex: 1, marginLeft: theme.spacing[2] }}
              />
            </View>
          </View>
        ) : (
          /* Клиент: 3 карточки как в вебе */
          <View style={{ marginTop: theme.spacing[3] }}>
            <View style={[styles.statsGrid, { marginBottom: theme.spacing[2] }]}>
              <StatCard
                icon={<PiggyBank size={18} color={theme.colors.goldForeground} />}
                label={t.finance.cashback}
                value={`${(balance?.cashback_new ?? user.cashback_new ?? 0).toLocaleString('ru-KZ')} QV`}
                style={{ flex: 1, marginRight: theme.spacing[2] }}
              />
              <StatCard
                icon={<Users size={18} color={theme.semantic.info} />}
                label={t.dashboard.referralBonus}
                value={`${(balance?.ref_bon ?? user.referralBonus ?? 0).toLocaleString('ru-KZ')} QV`}
                style={{ flex: 1, marginLeft: theme.spacing[2] }}
              />
            </View>
            <StatCard
              icon={<RefreshCw size={18} color={theme.semantic.success} />}
              label={t.dashboard.repeatPurchaseBonus}
              value={`${(balance?.repeat_purchase_bonus ?? user.repeatPurchaseBonus ?? 0).toLocaleString('ru-KZ')} ₸`}
            />
          </View>
        )}

        {/* Quick Nav */}
        <View style={{ flexDirection: 'row', gap: theme.spacing[2], marginTop: theme.spacing[4], marginBottom: theme.spacing[2] }}>
          {([
            { icon: Users,    label: t.dashboard.navTeam,       onPress: onTeamPress },
            { icon: Trophy,   label: t.dashboard.navRank,       onPress: onRankPress },
            { icon: BarChart2,label: t.dashboard.navStatistics, onPress: onStatisticsPress },
            { icon: Ticket,   label: t.dashboard.navKonkurs,    onPress: onKonkursPress },
          ] as const).map(({ icon: Icon, label, onPress }) => (
            <TouchableOpacity
              key={label}
              onPress={onPress}
              activeOpacity={0.8}
              style={{ flex: 1 }}
            >
              <GlassCard
                cornerRadius={theme.borderRadius.lg}
                style={{
                  padding: theme.spacing[3],
                  alignItems: 'center',
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: 'rgba(255,255,255,0.15)',
                }}
              >
                <View style={{
                  width: 36, height: 36, borderRadius: 18,
                  backgroundColor: `${theme.gold.primary}20`,
                  alignItems: 'center', justifyContent: 'center',
                  marginBottom: 6,
                }}>
                  <Icon size={18} color={theme.colors.goldForeground} />
                </View>
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: theme.fontSizes.xs,
                    color: theme.colors.mutedForeground,
                    fontFamily: theme.fonts.medium,
                  }}
                >
                  {label}
                </Text>
              </GlassCard>
            </TouchableOpacity>
          ))}
        </View>

        {/* Rank Roadmap */}
        <View style={{ marginTop: theme.spacing[6] }}>
          <Text
            style={[
              {
                fontFamily: theme.fonts.semibold,
                fontSize: theme.fontSizes.md,
                color: theme.colors.foreground,
                marginBottom: theme.spacing[3],
              },
            ]}
          >
            {t.dashboard.rankRoad}
          </Text>

          <GradientCard padding={theme.spacing[3]}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: theme.spacing[4], paddingHorizontal: 4 }}
            >
              {/* Ranks 1-12 (skip 0 like web) */}
              {RANKS.filter((r) => r.id >= 1).map((rank, index, arr) => {
                const isCompleted = rank.id < nextRank.current;
                const isCurrent = rank.id === nextRank.current;
                const isNext = rank.id === nextRank.next;
                const isLocked = !isCompleted && !isCurrent && !isNext;

                const circleColor = isCompleted
                  ? '#10b981'
                  : isCurrent
                  ? theme.gold.primary
                  : isNext
                  ? '#3b82f6'
                  : theme.colors.muted;

                const nameColor = isCompleted
                  ? '#10b981'
                  : isCurrent
                  ? theme.gold.primary
                  : isNext
                  ? '#3b82f6'
                  : theme.colors.mutedForeground;

                return (
                  <View key={rank.id} style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <View style={{ alignItems: 'center', width: 52 }}>
                      {/* "ВАШ" badge */}
                      {isCurrent ? (
                        <View style={{
                          position: 'absolute', top: -18, zIndex: 10,
                          backgroundColor: theme.gold.primary, borderRadius: 8,
                          paddingHorizontal: 5, paddingVertical: 2,
                        }}>
                          <Text style={{ fontSize: 8, color: '#000', fontFamily: theme.fonts.bold }}>{t.dashboard.yourBadge}</Text>
                        </View>
                      ) : <View style={{ height: 18 }} />}

                      {/* Circle */}
                      <View style={{ position: 'relative' }}>
                        {isCompleted || isCurrent || isNext ? (
                          <View style={[styles.rankCircle, { backgroundColor: circleColor }]}>
                            <Text style={{ fontFamily: theme.fonts.bold, fontSize: 13, color: '#fff' }}>{rank.id}</Text>
                          </View>
                        ) : (
                          <View style={[styles.rankCircle, { backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border }]}>
                            <Lock size={13} color={theme.colors.mutedForeground} style={{ opacity: 0.4 }} />
                          </View>
                        )}
                        {/* Checkmark badge */}
                        {isCompleted && (
                          <View style={{
                            position: 'absolute', bottom: -3, right: -3,
                            width: 16, height: 16, borderRadius: 8,
                            backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <Check size={10} color="#10b981" strokeWidth={3} />
                          </View>
                        )}
                      </View>

                      {/* Rank name */}
                      <Text style={{
                        fontFamily: theme.fonts.medium, fontSize: 8,
                        color: nameColor, marginTop: 6, textAlign: 'center', width: 52,
                        opacity: isLocked ? 0.4 : 1,
                      }} numberOfLines={2}>
                        {rank.name}
                      </Text>
                    </View>

                    {/* Connector line */}
                    {index < arr.length - 1 && (
                      <View style={{
                        width: 12, height: 2, marginTop: 22,
                        backgroundColor: isCompleted ? '#10b981' : theme.colors.border,
                        borderRadius: 1,
                      }} />
                    )}
                  </View>
                );
              })}
            </ScrollView>

            {/* Legend */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 4 }}>
              {[
                { color: '#10b981', label: t.dashboard.legendDone },
                { color: theme.gold.primary, label: t.dashboard.legendCurrent },
                { color: '#3b82f6', label: t.dashboard.legendNext },
                { color: undefined, label: t.dashboard.legendLocked },
              ].map(({ color, label }) => (
                <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <View style={{
                    width: 8, height: 8, borderRadius: 4,
                    backgroundColor: color ?? theme.colors.card,
                    borderWidth: color ? 0 : 1, borderColor: theme.colors.border,
                  }} />
                  <Text style={{ fontSize: 9, color: theme.colors.mutedForeground, fontFamily: theme.fonts.regular }}>{label}</Text>
                </View>
              ))}
            </View>
          </GradientCard>
        </View>

        {/* Next Rank Progress — layout matches web */}
        <View style={{ marginTop: theme.spacing[6] }}>
          <GradientCard>
            {/* Header: текущий → следующий ранг */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing[4] }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Trophy size={16} color={theme.colors.goldForeground} />
                <Text style={{ fontFamily: theme.fonts.semibold, fontSize: theme.fontSizes.sm, color: theme.colors.foreground }}>
                  {t.dashboard.progressTo}
                </Text>
              </View>
              <View style={{ backgroundColor: `${theme.colors.goldForeground}18`, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: `${theme.colors.goldForeground}30` }}>
                <Text style={{ fontFamily: theme.fonts.medium, fontSize: theme.fontSizes.xs, color: theme.colors.goldForeground }}>
                  {RANKS.find((r) => r.id === nextRank.current)?.name || '—'} → {RANKS.find((r) => r.id === nextRank.next)?.name || 'MAX'}
                </Text>
              </View>
            </View>

            {/* 2-column grid: левый столбец = левая нога + инв, правый = правая нога + инв */}
            {(() => {
              const pct = (cur: number, req: number) =>
                req > 0 ? Math.min(100, Math.round((cur / req) * 100)) : 0;
              const invLabel = nextRank.next > 7
                ? t.rank.invitationsLeaders
                : t.rank.invitationsAll;
              return (
                <View style={{ flexDirection: 'row', gap: theme.spacing[3] }}>
                  {/* Левый столбец */}
                  <View style={{ flex: 1, gap: theme.spacing[4] }}>
                    {/* Левая нога — gold */}
                    <View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={{ fontFamily: theme.fonts.regular, fontSize: theme.fontSizes.xs, color: theme.colors.mutedForeground }}>
                          {t.dashboard.leftLeg}
                        </Text>
                        <Text style={{ fontFamily: theme.fonts.medium, fontSize: theme.fontSizes.xs, color: theme.colors.foreground }}>
                          {(nextRank.leftLeg.current ?? 0).toLocaleString('ru-KZ')} / {(nextRank.leftLeg.required ?? 0).toLocaleString('ru-KZ')} QV
                        </Text>
                      </View>
                      <ProgressBar value={pct(nextRank.leftLeg.current, nextRank.leftLeg.required)} showPercentage height={6} variant="gold" />
                    </View>
                    {/* Левые приглашения — purple */}
                    {nextRank.leftInv.required > 0 && (
                      <View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                          <Text style={{ fontFamily: theme.fonts.regular, fontSize: theme.fontSizes.xs, color: theme.colors.mutedForeground }} numberOfLines={1}>
                            {invLabel} — {t.rank.invLeft}
                          </Text>
                          <Text style={{ fontFamily: theme.fonts.medium, fontSize: theme.fontSizes.xs, color: theme.colors.foreground }}>
                            {(nextRank.leftInv.current ?? 0).toLocaleString('ru-KZ')} / {(nextRank.leftInv.required ?? 0).toLocaleString('ru-KZ')}
                          </Text>
                        </View>
                        <ProgressBar value={pct(nextRank.leftInv.current, nextRank.leftInv.required)} showPercentage height={6} variant="purple" />
                      </View>
                    )}
                  </View>

                  {/* Правый столбец */}
                  <View style={{ flex: 1, gap: theme.spacing[4] }}>
                    {/* Правая нога — blue */}
                    <View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={{ fontFamily: theme.fonts.regular, fontSize: theme.fontSizes.xs, color: theme.colors.mutedForeground }}>
                          {t.dashboard.rightLeg}
                        </Text>
                        <Text style={{ fontFamily: theme.fonts.medium, fontSize: theme.fontSizes.xs, color: theme.colors.foreground }}>
                          {(nextRank.rightLeg.current ?? 0).toLocaleString('ru-KZ')} / {(nextRank.rightLeg.required ?? 0).toLocaleString('ru-KZ')} QV
                        </Text>
                      </View>
                      <ProgressBar value={pct(nextRank.rightLeg.current, nextRank.rightLeg.required)} showPercentage height={6} variant="info" />
                    </View>
                    {/* Правые приглашения — purple */}
                    {nextRank.rightInv.required > 0 && (
                      <View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                          <Text style={{ fontFamily: theme.fonts.regular, fontSize: theme.fontSizes.xs, color: theme.colors.mutedForeground }} numberOfLines={1}>
                            {invLabel} — {t.rank.invRight}
                          </Text>
                          <Text style={{ fontFamily: theme.fonts.medium, fontSize: theme.fontSizes.xs, color: theme.colors.foreground }}>
                            {(nextRank.rightInv.current ?? 0).toLocaleString('ru-KZ')} / {(nextRank.rightInv.required ?? 0).toLocaleString('ru-KZ')}
                          </Text>
                        </View>
                        <ProgressBar value={pct(nextRank.rightInv.current, nextRank.rightInv.required)} showPercentage height={6} variant="purple" />
                      </View>
                    )}
                  </View>
                </View>
              );
            })()}

            {/* Объём за неделю */}
            {rankProgress && (rankProgress.left_week_qv > 0 || rankProgress.right_week_qv > 0) && (
              <View style={{ backgroundColor: theme.colors.muted, borderRadius: theme.borderRadius.lg, padding: theme.spacing[3], marginTop: theme.spacing[4] }}>
                <Text style={{ fontFamily: theme.fonts.medium, fontSize: theme.fontSizes.xs, color: theme.colors.mutedForeground, marginBottom: theme.spacing[1] }}>
                  {t.dashboard.thisWeek}
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontFamily: theme.fonts.semibold, fontSize: theme.fontSizes.sm, color: '#60A5FA' }}>
                    {t.dashboard.leftLeg}: {(rankProgress.left_week_qv ?? 0).toLocaleString('ru-KZ')} QV
                  </Text>
                  <Text style={{ fontFamily: theme.fonts.semibold, fontSize: theme.fontSizes.sm, color: '#A78BFA' }}>
                    {t.dashboard.rightLeg}: {(rankProgress.right_week_qv ?? 0).toLocaleString('ru-KZ')} QV
                  </Text>
                </View>
              </View>
            )}

            <View
              style={[
                styles.rewardBanner,
                {
                  backgroundColor: theme.gold.light,
                  borderRadius: theme.borderRadius.lg,
                  borderWidth: 1,
                  borderColor: `${theme.gold.primary}30`,
                  padding: theme.spacing[3],
                  marginTop: theme.spacing[4],
                },
              ]}
            >
              <Text
                style={[
                  {
                    fontFamily: theme.fonts.medium,
                    fontSize: theme.fontSizes.xs,
                    color: theme.colors.foreground,
                  },
                ]}
              >
                {t.dashboard.rankReward}{' '}
                {RANKS.find((r) => r.id === nextRank.next)?.name || 'Diamond'}:
              </Text>
              <Text
                style={[
                  {
                    fontFamily: theme.fonts.bold,
                    fontSize: theme.fontSizes.md,
                    color: theme.gold.darker,
                    marginTop: 4,
                  },
                ]}
              >
                + 50,000 ₸ {t.dashboard.rankBonus}
              </Text>
            </View>
          </GradientCard>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {},
  notificationButton: {
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  profileHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    marginBottom: 4,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sponsorText: {},
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  achievementChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statsGrid: {
    flexDirection: 'row',
  },
  rankItem: {
    alignItems: 'center',
  },
  rankCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  rankNumber: {
    // Dark text on gold gradient — readable in both light and dark themes
    color: '#1A1000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rewardBanner: {},
});
