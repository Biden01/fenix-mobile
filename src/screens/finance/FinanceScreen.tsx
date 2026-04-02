import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
} from 'lucide-react-native';
import { useTheme } from '@/theme';
import { ScreenWrapper, GradientCard, StatusBadge } from '@/components/ui';
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
      // Fetch balance, transfer history, internal transfers in parallel
      const [historyResult, internalResult, balanceResult] = await Promise.all([
        financeService.getTransferHistory(1, 10),
        financeService.getInternalTransfers(1, 10),
        financeService.getBalance(),
      ]);

      if (!('error' in balanceResult)) setBalance(balanceResult.balance);

      const combined: Transaction[] = [];

      // Map transfer history to transactions
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

      // Map internal transfers
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

      // Sort by date
      combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(combined.slice(0, 10));
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshProfile(), fetchTransactions()]);
    setRefreshing(false);
  }, [refreshProfile, fetchTransactions]);

  if (!user) return null;

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'referral':
        return <Users size={20} color={theme.semantic.success} />;
      case 'binary':
        return <Gift size={20} color={theme.semantic.info} />;
      case 'withdrawal':
        return <ArrowUpRight size={20} color={theme.semantic.error} />;
      case 'cashback':
        return <Percent size={20} color={theme.semantic.warning} />;
      case 'transfer':
        return <ArrowDownLeft size={20} color={theme.semantic.success} />;
      default:
        return <Wallet size={20} color={theme.colors.mutedForeground} />;
    }
  };

  const getTransactionBadge = (type: string) => {
    switch (type) {
      case 'referral':
        return <StatusBadge label={t.finance.referralBonusShort} variant="success" size="sm" />;
      case 'binary':
        return <StatusBadge label={t.finance.binaryBonusShort} variant="info" size="sm" />;
      case 'withdrawal':
        return <StatusBadge label={t.finance.withdraw} variant="error" size="sm" />;
      case 'cashback':
        return <StatusBadge label={t.finance.cashback} variant="warning" size="sm" />;
      case 'transfer':
        return <StatusBadge label={t.finance.transfer} variant="gold" size="sm" />;
      default:
        return null;
    }
  };

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
          {t.finance.title}
        </Text>

        {/* Balance Card */}
        <LinearGradient
          colors={[theme.gold.primary, theme.gold.dark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.balanceCard,
            {
              borderRadius: theme.borderRadius['2xl'],
              padding: theme.spacing[5],
              marginBottom: theme.spacing[4],
            },
            theme.shadows.xl,
          ]}
        >
          <View style={styles.balanceHeader}>
            <Wallet size={24} color="rgba(0,0,0,0.5)" />
            <Text
              style={[
                {
                  fontFamily: theme.fonts.medium,
                  fontSize: theme.fontSizes.sm,
                  color: 'rgba(0,0,0,0.7)',
                  marginLeft: theme.spacing[2],
                },
              ]}
            >
              {t.finance.totalBalance}
            </Text>
          </View>

          <Text
            style={[
              {
                fontFamily: theme.fonts.bold,
                fontSize: theme.fontSizes['4xl'],
                color: theme.colors.primaryForeground,
                marginTop: theme.spacing[2],
              },
            ]}
          >
            {(user.balance ?? 0).toLocaleString('ru-KZ')} ₸
          </Text>

          <View style={[styles.balanceStats, { marginTop: theme.spacing[4] }]}>
            <View style={{ flex: 1 }}>
              <Text style={[{ fontSize: theme.fontSizes.xs, color: 'rgba(0,0,0,0.6)' }]}>
                {t.finance.totalEarned}
              </Text>
              <Text
                style={[
                  {
                    fontFamily: theme.fonts.bold,
                    fontSize: theme.fontSizes.md,
                    color: theme.colors.primaryForeground,
                  },
                ]}
              >
                {(user.totalBonus ?? 0).toLocaleString('ru-KZ')} QV
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[{ fontSize: theme.fontSizes.xs, color: 'rgba(0,0,0,0.6)' }]}>
                {t.finance.deposit}
              </Text>
              <Text
                style={[
                  {
                    fontFamily: theme.fonts.bold,
                    fontSize: theme.fontSizes.md,
                    color: theme.colors.primaryForeground,
                  },
                ]}
              >
                {(user.deposit ?? 0).toLocaleString('ru-KZ')} QV
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Action Buttons */}
        <View style={[styles.actionsRow, { marginBottom: theme.spacing[3] }]}>
          <TouchableOpacity
            onPress={onTransfer}
            style={[styles.actionButton, { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.xl, borderWidth: 1, borderColor: theme.colors.border, padding: theme.spacing[4] }]}
          >
            <View style={[styles.actionIcon, { backgroundColor: theme.gold.light, borderRadius: theme.borderRadius.full, padding: theme.spacing[3] }]}>
              <ArrowUpRight size={24} color={theme.colors.goldForeground} />
            </View>
            <Text style={{ fontFamily: theme.fonts.semibold, fontSize: theme.fontSizes.sm, color: theme.colors.foreground, marginTop: theme.spacing[2] }}>
              {t.finance.transfer}
            </Text>
          </TouchableOpacity>

        </View>

        <View style={[styles.actionsRow, { marginBottom: theme.spacing[6] }]}>
          <TouchableOpacity
            onPress={onViewReports}
            style={[
              styles.actionButton,
              {
                backgroundColor: theme.colors.card,
                borderRadius: theme.borderRadius.xl,
                borderWidth: 1,
                borderColor: theme.colors.border,
                padding: theme.spacing[4],
              },
            ]}
          >
            <View
              style={[
                styles.actionIcon,
                {
                  backgroundColor: theme.gold.light,
                  borderRadius: theme.borderRadius.full,
                  padding: theme.spacing[3],
                },
              ]}
            >
              <FileText size={24} color={theme.colors.goldForeground} />
            </View>
            <Text
              style={[
                {
                  fontFamily: theme.fonts.semibold,
                  fontSize: theme.fontSizes.sm,
                  color: theme.colors.foreground,
                  marginTop: theme.spacing[2],
                },
              ]}
            >
              {t.finance.reports}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => Linking.openURL('https://fenixinternationalcompany.kz')}
            style={[
              styles.actionButton,
              {
                backgroundColor: theme.colors.card,
                borderRadius: theme.borderRadius.xl,
                borderWidth: 1,
                borderColor: theme.colors.border,
                padding: theme.spacing[4],
              },
            ]}
          >
            <View
              style={[
                styles.actionIcon,
                {
                  backgroundColor: `${theme.semantic.info}20`,
                  borderRadius: theme.borderRadius.full,
                  padding: theme.spacing[3],
                },
              ]}
            >
              <ExternalLink size={24} color={theme.semantic.info} />
            </View>
            <Text
              style={[
                {
                  fontFamily: theme.fonts.semibold,
                  fontSize: theme.fontSizes.sm,
                  color: theme.colors.foreground,
                  marginTop: theme.spacing[2],
                  textAlign: 'center',
                },
              ]}
            >
              {t.finance.website}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Income Summary */}
        <GradientCard style={{ marginBottom: theme.spacing[6] }}>
          <Text style={{ fontFamily: theme.fonts.semibold, fontSize: theme.fontSizes.md, color: theme.colors.foreground, marginBottom: theme.spacing[4] }}>
            {t.finance.monthlyIncome}
          </Text>

          {([
            { icon: Users,     color: theme.semantic.success, label: t.finance.referralBonusShort, value: parseFloat(String(balance?.ref_bon ?? user.referralBonus ?? 0)) },
            { icon: Gift,      color: theme.semantic.info,    label: t.finance.binaryBonusShort,   value: parseFloat(String(balance?.binarybonus ?? user.binaryBonus ?? 0)) },
            { icon: Percent,   color: theme.semantic.warning, label: t.finance.cashback,            value: user.cashback_new ?? 0 },
            ...(user.type !== 0 ? [
              { icon: Award,     color: theme.colors.goldForeground, label: t.dashboard.rankPrize,            value: parseFloat(String(balance?.rank_prize ?? user.rankPrize ?? 0)) },
              { icon: RefreshCw, color: theme.semantic.success,      label: t.dashboard.repeatPurchaseBonus,  value: parseFloat(String(balance?.repeat_purchase_bonus ?? user.repeatPurchaseBonus ?? 0)) },
            ] : []),
          ] as { icon: any; color: string; label: string; value: number }[]).map(({ icon: Icon, color, label, value }, i) => (
            <View key={label} style={[styles.incomeRow, i > 0 && { marginTop: theme.spacing[3] }]}>
              <View style={styles.incomeItem}>
                <Icon size={16} color={color} />
                <Text style={{ fontFamily: theme.fonts.regular, fontSize: theme.fontSizes.xs, color: theme.colors.mutedForeground, marginLeft: theme.spacing[2] }}>
                  {label}
                </Text>
              </View>
              <Text style={{ fontFamily: theme.fonts.bold, fontSize: theme.fontSizes.sm, color }}>
                +{(value ?? 0).toLocaleString('ru-KZ')} ₸
              </Text>
            </View>
          ))}
        </GradientCard>

        {/* Recent Transactions */}
        <View style={styles.transactionsHeader}>
          <Text
            style={[
              {
                fontFamily: theme.fonts.semibold,
                fontSize: theme.fontSizes.md,
                color: theme.colors.foreground,
              },
            ]}
          >
            {t.finance.latestTransactions}
          </Text>
          <TouchableOpacity onPress={onViewReports}>
            <Text
              style={[
                {
                  fontFamily: theme.fonts.medium,
                  fontSize: theme.fontSizes.sm,
                  color: theme.colors.goldForeground,
                },
              ]}
            >
              {t.finance.all}
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={{ alignItems: 'center', padding: 20 }}>
            <ActivityIndicator size="small" color={theme.colors.goldForeground} />
          </View>
        ) : transactions.length === 0 ? (
          <GradientCard padding={theme.spacing[4]}>
            <Text
              style={{
                fontFamily: theme.fonts.medium,
                fontSize: theme.fontSizes.sm,
                color: theme.colors.mutedForeground,
                textAlign: 'center',
              }}
            >
              {t.finance.noTransactions}
            </Text>
          </GradientCard>
        ) : (
          transactions.map((transaction) => (
            <GradientCard
              key={transaction.id}
              style={{ marginBottom: theme.spacing[2] }}
              padding={theme.spacing[3]}
            >
              <View style={styles.transactionRow}>
                <View
                  style={[
                    styles.transactionIcon,
                    {
                      backgroundColor: theme.colors.muted,
                      borderRadius: theme.borderRadius.full,
                      padding: theme.spacing[2],
                    },
                  ]}
                >
                  {getTransactionIcon(transaction.type)}
                </View>

                <View style={{ flex: 1, marginLeft: theme.spacing[3] }}>
                  <View style={styles.transactionHeader}>
                    <Text
                      style={[
                        {
                          fontFamily: theme.fonts.semibold,
                          fontSize: theme.fontSizes.sm,
                          color: theme.colors.foreground,
                        },
                      ]}
                    >
                      {transaction.description}
                    </Text>
                    {getTransactionBadge(transaction.type)}
                  </View>
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
                    {new Date(transaction.date).toLocaleDateString('ru-RU')}
                    {transaction.from && ` • ${transaction.from}`}
                    {transaction.to && ` • ${transaction.to}`}
                  </Text>
                </View>

                <Text
                  style={[
                    {
                      fontFamily: theme.fonts.bold,
                      fontSize: theme.fontSizes.sm,
                      color:
                        (transaction.amount ?? 0) >= 0
                          ? theme.semantic.success
                          : theme.semantic.error,
                    },
                  ]}
                >
                  {(transaction.amount ?? 0) >= 0 ? '+' : ''}
                  {(transaction.amount ?? 0).toLocaleString('ru-KZ')} ₸
                </Text>
              </View>
            </GradientCard>
          ))
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  balanceCard: {},
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceStats: {
    flexDirection: 'row',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  actionIcon: {},
  incomeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  incomeItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionIcon: {},
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
