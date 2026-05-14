import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator, Linking } from 'react-native';
import {
  Wallet,
  ArrowUpRight,
  FileText,
  ExternalLink,
  Users,
  Gift,
  Percent,
  ArrowDownLeft,
  Award,
  RefreshCw,
  CreditCard,
  ArrowRight,
} from 'lucide-react-native';
import { useTheme } from '@/theme';
import { ScreenWrapper, GradientCard, GlassCard, SectionHeader, MiniStatCard } from '@/components/ui';
import { useAuthStore } from '@/store';
import { financeService, TransferHistoryItem, InternalTransferItem, BalanceResponse } from '@/api';
import { useT } from '@/i18n';

interface Transaction {
  id: string;
  type: 'referral' | 'binary' | 'withdrawal' | 'cashback' | 'transfer';
  description: string;
  amount: number;
  date: string;
  from?: string;
  to?: string;
}

interface FinanceScreenProps {
  onViewReports: () => void;
  onTransfer: () => void;
}

export function FinanceScreen({ onViewReports, onTransfer }: FinanceScreenProps) {
  const theme = useTheme();
  const t = useT();
  const { user, refreshProfile } = useAuthStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState<BalanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTransactions = useCallback(async () => {
    try {
      const [historyResult, internalResult, balanceResult] = await Promise.all([
        financeService.getTransferHistory(1, 10),
        financeService.getInternalTransfers(1, 10),
        financeService.getBalance(),
      ]);

      if (!('error' in balanceResult)) setBalance(balanceResult.balance);

      const combined: Transaction[] = [];

      if (!('error' in historyResult)) {
        historyResult.data.items.forEach((item: TransferHistoryItem) => {
          const type = item.line === 1 ? 'referral' : item.line === 2 ? 'binary' : 'cashback';
          combined.push({
            id: `hist-${item.id}`,
            type,
            description: item.product || (type === 'referral' ? t.finance.referralBonusShort : type === 'binary' ? t.finance.binaryBonusShort : t.finance.cashback),
            amount: parseFloat(item.amount),
            date: item.sent_time,
            from: item.user_login || t.finance.system,
          });
        });
      }

      if (!('error' in internalResult)) {
        internalResult.data.items.forEach((item: InternalTransferItem) => {
          combined.push({
            id: `int-${item.id}`,
            type: 'transfer',
            description: item.direction === 'in' ? t.finance.incomingTransfer : t.finance.outgoingTransfer,
            amount: item.direction === 'in' ? item.amount : -item.amount,
            date: item.sent_time,
            from: item.direction === 'in' ? item.sender : undefined,
            to: item.direction === 'out' ? item.receiver : undefined,
          });
        });
      }

      combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(combined.slice(0, 10));
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshProfile(), fetchTransactions()]);
    setRefreshing(false);
  }, [refreshProfile, fetchTransactions]);

  if (!user) return null;

  const txIconConfig: Record<string, { icon: any; color: string; bg: string }> = {
    referral:   { icon: Users,        color: theme.semantic.success, bg: `${theme.semantic.success}18` },
    binary:     { icon: Gift,         color: theme.semantic.info,    bg: `${theme.semantic.info}18` },
    withdrawal: { icon: ArrowUpRight, color: theme.semantic.error,   bg: `${theme.semantic.error}18` },
    cashback:   { icon: Percent,      color: theme.semantic.warning, bg: `${theme.semantic.warning}18` },
    transfer:   { icon: ArrowDownLeft,color: theme.semantic.success, bg: `${theme.semantic.success}18` },
  };

  const incomeSources = [
    { icon: Users,     color: theme.semantic.success,       label: t.finance.referralBonusShort, value: parseFloat(String(balance?.ref_bon ?? user.referralBonus ?? 0)) },
    { icon: Gift,      color: theme.semantic.info,          label: t.finance.binaryBonusShort,   value: parseFloat(String(balance?.binarybonus ?? user.binaryBonus ?? 0)) },
    { icon: Percent,   color: theme.semantic.warning,       label: t.finance.cashback,            value: user.cashback_new ?? 0 },
    ...(user.type !== 0 ? [
      { icon: Award,     color: theme.colors.goldForeground, label: t.dashboard.rankPrize,           value: parseFloat(String(balance?.rank_prize ?? user.rankPrize ?? 0)) },
      { icon: RefreshCw, color: theme.semantic.success,      label: t.dashboard.repeatPurchaseBonus, value: parseFloat(String(balance?.repeat_purchase_bonus ?? user.repeatPurchaseBonus ?? 0)) },
    ] : []),
  ] as { icon: any; color: string; label: string; value: number }[];

  return (
    <ScreenWrapper
      scrollable
      padded={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.gold.primary} />}
    >
      <View style={{ paddingHorizontal: theme.screenPadding.horizontal }}>

        {/* ── Header ── */}
        <Text style={{ fontFamily: theme.fonts.displayBold, fontSize: theme.fontSizes['2xl'], color: theme.colors.foreground, marginBottom: theme.spacing[5], paddingTop: theme.spacing[2] }}>
          {t.finance.title}
        </Text>

        {/* ── Hero Balance ── */}
        <GradientCard variant="gold" style={{ marginBottom: theme.spacing[4] }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: theme.spacing[2] }}>
            <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: `${theme.gold.primary}20`, alignItems: 'center', justifyContent: 'center' }}>
              <Wallet size={16} color={theme.colors.goldForeground} />
            </View>
            <Text style={{ fontFamily: theme.fonts.medium, fontSize: theme.fontSizes.sm, color: theme.colors.mutedForeground }}>
              {t.finance.totalBalance}
            </Text>
          </View>
          <Text style={{ fontFamily: theme.fonts.bold, fontSize: 36, color: theme.colors.foreground, marginBottom: theme.spacing[1] }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
            {(user.balance ?? 0).toLocaleString('ru-KZ')}
          </Text>
          <Text style={{ fontFamily: theme.fonts.medium, fontSize: theme.fontSizes.sm, color: theme.colors.mutedForeground, marginBottom: theme.spacing[4] }}>₸</Text>

          <View style={{ flexDirection: 'row', gap: theme.spacing[3] }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: theme.fonts.regular, fontSize: 11, color: theme.colors.mutedForeground }}>{t.finance.totalEarned}</Text>
              <Text style={{ fontFamily: theme.fonts.bold, fontSize: theme.fontSizes.md, color: theme.colors.foreground }}>
                {(user.totalBonus ?? 0).toLocaleString('ru-KZ')} QV
              </Text>
            </View>
            <View style={{ width: 1, backgroundColor: theme.colors.border }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: theme.fonts.regular, fontSize: 11, color: theme.colors.mutedForeground }}>{t.finance.deposit}</Text>
              <Text style={{ fontFamily: theme.fonts.bold, fontSize: theme.fontSizes.md, color: theme.colors.foreground }}>
                {(user.deposit ?? 0).toLocaleString('ru-KZ')} QV
              </Text>
            </View>
          </View>
        </GradientCard>

        {/* ── Action Row ── */}
        <View style={styles.actionRow}>
          {([
            { icon: ArrowUpRight, label: t.finance.transfer,  onPress: onTransfer,                                           color: theme.colors.goldForeground, bg: `${theme.gold.primary}18` },
            { icon: FileText,     label: t.finance.reports,   onPress: onViewReports,                                        color: '#60A5FA',                    bg: 'rgba(96,165,250,0.15)' },
            { icon: ExternalLink, label: t.finance.website,   onPress: () => Linking.openURL('https://zharqyn.life'), color: '#A78BFA', bg: 'rgba(167,139,250,0.15)' },
          ] as const).map(({ icon: Icon, label, onPress, color, bg }) => (
            <TouchableOpacity key={label} onPress={onPress} activeOpacity={0.75} style={styles.actionBtn}>
              <GlassCard cornerRadius={16} style={{ padding: 14, alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                  <Icon size={20} color={color} />
                </View>
                <Text style={{ fontFamily: theme.fonts.medium, fontSize: 11, color: theme.colors.foreground, textAlign: 'center' }}>{label}</Text>
              </GlassCard>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Income Summary ── */}
        <View style={{ marginTop: theme.spacing[6] }}>
          <SectionHeader title={t.finance.monthlyIncome} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 4 }}>
            {incomeSources.map(({ icon: Icon, color, label, value }) => (
              <View key={label} style={{ width: 130, backgroundColor: theme.colors.card, borderRadius: 16, padding: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border }}>
                <View style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: `${color}18`, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                  <Icon size={15} color={color} />
                </View>
                <Text style={{ fontFamily: theme.fonts.regular, fontSize: 10, color: theme.colors.mutedForeground, marginBottom: 3 }}>{label}</Text>
                <Text numberOfLines={1} style={{ fontFamily: theme.fonts.bold, fontSize: theme.fontSizes.md, color: theme.colors.foreground }}>
                  {(value ?? 0).toLocaleString('ru-KZ')}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* ── Recent Transactions ── */}
        <View style={{ marginTop: theme.spacing[6], marginBottom: theme.spacing[8] }}>
          <SectionHeader
            title={t.finance.latestTransactions}
            rightElement={
              <TouchableOpacity onPress={onViewReports} style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Text style={{ fontFamily: theme.fonts.medium, fontSize: theme.fontSizes.sm, color: theme.colors.goldForeground }}>{t.finance.all}</Text>
                <ArrowRight size={14} color={theme.colors.goldForeground} />
              </TouchableOpacity>
            }
          />

          {loading ? (
            <View style={{ alignItems: 'center', padding: 24 }}>
              <ActivityIndicator size="small" color={theme.colors.goldForeground} />
            </View>
          ) : transactions.length === 0 ? (
            <View style={{ alignItems: 'center', padding: 32 }}>
              <Wallet size={36} color={theme.colors.mutedForeground} style={{ marginBottom: 8, opacity: 0.4 }} />
              <Text style={{ fontFamily: theme.fonts.medium, fontSize: theme.fontSizes.sm, color: theme.colors.mutedForeground, textAlign: 'center' }}>
                {t.finance.noTransactions}
              </Text>
            </View>
          ) : (
            <GradientCard padding={0}>
              {transactions.map((tx, i) => {
                const cfg = txIconConfig[tx.type] ?? { icon: Wallet, color: theme.colors.mutedForeground, bg: theme.colors.muted };
                const Icon = cfg.icon;
                const isPositive = (tx.amount ?? 0) >= 0;
                return (
                  <View key={tx.id}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14 }}>
                      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: cfg.bg, alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={18} color={cfg.color} />
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={{ fontFamily: theme.fonts.semibold, fontSize: theme.fontSizes.sm, color: theme.colors.foreground }} numberOfLines={1}>
                          {tx.description}
                        </Text>
                        <Text style={{ fontFamily: theme.fonts.regular, fontSize: 11, color: theme.colors.mutedForeground, marginTop: 2 }}>
                          {new Date(tx.date).toLocaleDateString('ru-RU')}
                          {tx.from ? ` • ${tx.from}` : ''}
                          {tx.to ? ` • ${tx.to}` : ''}
                        </Text>
                      </View>
                      <Text style={{ fontFamily: theme.fonts.bold, fontSize: theme.fontSizes.sm, color: isPositive ? theme.semantic.success : theme.semantic.error }}>
                        {isPositive ? '+' : ''}{(tx.amount ?? 0).toLocaleString('ru-KZ')} ₸
                      </Text>
                    </View>
                    {i < transactions.length - 1 && (
                      <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border, marginLeft: 66 }} />
                    )}
                  </View>
                );
              })}
            </GradientCard>
          )}
        </View>

      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
  },
});
