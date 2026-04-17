import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, FlatList, ActivityIndicator } from 'react-native';
import { CreditCard, Building2, Wallet, X } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { CompactHeader, GradientCard, GlassInput, GoldButton, GlassSegmentedPicker, SectionHeader } from '@/components/ui';
import { useAuthStore } from '@/store';
import { financeService, WithdrawHistoryItem } from '@/api';
import { useT } from '@/i18n';

interface WithdrawalScreenProps {
  onBack: () => void;
}

type WalletType = 'akwa' | 'bonus' | 'cashback';

export function WithdrawalScreen({ onBack }: WithdrawalScreenProps) {
  const theme = useTheme();
  const t = useT();
  const { user, refreshProfile } = useAuthStore();

  const [walletTab, setWalletTab] = useState<WalletType>('akwa');
  const [amount, setAmount] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [method, setMethod] = useState<'card' | 'bank'>('card');
  const [loading, setLoading] = useState(false);

  const [history, setHistory] = useState<WithdrawHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const walletTabs = [
    { key: 'akwa', label: t.finance.walletAkwa },
    { key: 'bonus', label: t.finance.walletBonus },
    { key: 'cashback', label: t.finance.walletCashback },
  ];

  const getBalance = () => {
    if (walletTab === 'akwa') return user?.balance ?? 0;
    if (walletTab === 'bonus') return parseFloat(String(user?.totalBonus ?? 0));
    return user?.cashback_new ?? 0;
  };

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      let result;
      if (walletTab === 'akwa') result = await financeService.getWithdrawHistory(1, 20);
      else if (walletTab === 'bonus') result = await financeService.getWithdrawBonusHistory(1, 20);
      else result = await financeService.getWithdrawCashbackHistory(1, 20);

      if (!('error' in result)) setHistory(result.data.items);
      else setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [walletTab]);

  useEffect(() => {
    fetchHistory();
    setAmount('');
  }, [walletTab]);

  const handleWithdraw = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) { Alert.alert(t.common.error, t.finance.invalidAmount); return; }
    if (numAmount > getBalance()) { Alert.alert(t.common.error, t.shop.insufficientFunds); return; }
    if (!cardNumber.trim()) { Alert.alert(t.common.error, t.finance.noCardOrIban); return; }

    setLoading(true);
    try {
      let result;
      if (walletTab === 'akwa') result = await financeService.withdraw(numAmount, method, cardNumber.trim());
      else if (walletTab === 'bonus') result = await financeService.withdrawBonus(numAmount, method, cardNumber.trim());
      else result = await financeService.withdrawCashback(numAmount, method, cardNumber.trim());

      if ('error' in result) {
        Alert.alert(t.common.error, result.error);
      } else {
        await refreshProfile();
        await fetchHistory();
        setAmount('');
        setCardNumber('');
        Alert.alert(t.finance.withdrawRequestSent, result.data.message || `${numAmount.toLocaleString('ru-KZ')} ₸`);
      }
    } catch {
      Alert.alert(t.common.error, t.finance.withdrawRequestError);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: number) => {
    Alert.alert(t.finance.cancelWithdrawTitle, t.finance.cancelWithdrawMsg, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.finance.cancelWithdrawBtn, style: 'destructive',
        onPress: async () => {
          let result;
          if (walletTab === 'akwa') result = await financeService.cancelWithdraw(id);
          else if (walletTab === 'bonus') result = await financeService.cancelWithdrawBonus(id);
          else result = await financeService.cancelWithdrawCashback(id);

          if ('error' in result) Alert.alert(t.common.error, result.error);
          else {
            await refreshProfile();
            await fetchHistory();
          }
        },
      },
    ]);
  };

  const statusLabel = (s: number) => {
    if (s === 0) return { text: t.finance.statusPending, color: theme.semantic.warning };
    if (s === 1) return { text: t.finance.statusApproved, color: theme.semantic.success };
    return { text: t.finance.statusRejected, color: theme.semantic.error };
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <CompactHeader onBack={onBack} title={t.finance.withdrawTitle} />

      <FlatList
        data={history}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: theme.screenPadding.horizontal, paddingBottom: theme.dimensions.tabBarHeight + theme.spacing[4] }}
        ListHeaderComponent={
          <View>
            {/* Wallet Tabs */}
            <GlassSegmentedPicker
              items={walletTabs.map((t) => ({ id: t.key, label: t.label }))}
              selectedId={walletTab}
              onSelect={(id) => setWalletTab(id as WalletType)}
              tint="#FFD700"
              style={{ marginBottom: theme.spacing[4] }}
            />

            {/* Balance */}
            <GradientCard variant="gold" style={{ marginBottom: theme.spacing[4] }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Wallet size={24} color={theme.colors.goldForeground} />
                <View style={{ marginLeft: theme.spacing[3] }}>
                  <Text style={{ fontFamily: theme.fonts.regular, fontSize: theme.fontSizes.sm, color: theme.colors.mutedForeground }}>
                    {t.finance.availableForWithdraw}
                  </Text>
                  <Text style={{ fontFamily: theme.fonts.bold, fontSize: theme.fontSizes['2xl'], color: theme.colors.foreground }}>
                    {getBalance().toLocaleString('ru-KZ')} ₸
                  </Text>
                </View>
              </View>
            </GradientCard>

            {/* Method */}
            <Text style={{ fontFamily: theme.fonts.semibold, fontSize: theme.fontSizes.md, color: theme.colors.foreground, marginBottom: theme.spacing[3] }}>
              {t.finance.withdrawMethod}
            </Text>
            <GlassSegmentedPicker
              items={[
                { id: 'card', label: t.finance.cardMethod },
                { id: 'bank', label: t.finance.ibanMethod },
              ]}
              selectedId={method}
              onSelect={(id) => setMethod(id as 'card' | 'bank')}
              tint="#FFD700"
              style={{ marginBottom: theme.spacing[4] }}
            />

            {/* Form */}
            <GradientCard style={{ marginBottom: theme.spacing[6] }}>
              <GlassInput
                label={t.finance.withdrawAmount}
                placeholder="0"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                leftIcon={<Text style={{ color: theme.colors.mutedForeground }}>₸</Text>}
                containerStyle={{ marginBottom: theme.spacing[3] }}
              />
              <GlassInput
                label={method === 'card' ? t.finance.cardNumber : 'IBAN'}
                placeholder={method === 'card' ? '**** **** **** ****' : 'KZ...'}
                value={cardNumber}
                onChangeText={setCardNumber}
                leftIcon={method === 'card' ? <CreditCard size={18} color={theme.colors.mutedForeground} /> : <Building2 size={18} color={theme.colors.mutedForeground} />}
                containerStyle={{ marginBottom: theme.spacing[3] }}
              />
              <View style={{ backgroundColor: theme.colors.muted, borderRadius: theme.borderRadius.lg, padding: theme.spacing[3], marginBottom: theme.spacing[3] }}>
                <Text style={{ fontFamily: theme.fonts.regular, fontSize: theme.fontSizes.xs, color: theme.colors.mutedForeground }}>
                  {t.finance.commission}: 0%{'\n'}{t.finance.minAmount}: 5,000 ₸{'\n'}{t.finance.withdrawProcessing}
                </Text>
              </View>
              <GoldButton title={t.finance.submitWithdraw} onPress={handleWithdraw} loading={loading} />
            </GradientCard>

            {/* History header */}
            <SectionHeader title={t.finance.historyTitle} />
            {historyLoading && <ActivityIndicator color={theme.colors.goldForeground} style={{ marginVertical: 16 }} />}
          </View>
        }
        renderItem={({ item }) => {
          const st = statusLabel(item.status);
          return (
            <GradientCard style={{ marginBottom: theme.spacing[2] }} padding={theme.spacing[3]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: theme.fonts.bold, fontSize: theme.fontSizes.md, color: theme.colors.foreground }}>
                    {item.amount.toLocaleString('ru-KZ')} ₸
                  </Text>
                  <Text style={{ fontFamily: theme.fonts.regular, fontSize: theme.fontSizes.xs, color: theme.colors.mutedForeground, marginTop: 2 }}>
                    {new Date(item.post_time).toLocaleDateString('ru-RU')} · {item.iban || item.phone || '—'}
                  </Text>
                  <Text style={{ fontFamily: theme.fonts.medium, fontSize: theme.fontSizes.xs, color: st.color, marginTop: 2 }}>{st.text}</Text>
                </View>
                {item.status === 0 && (
                  <TouchableOpacity onPress={() => handleCancel(item.id)} style={{ padding: theme.spacing[2] }}>
                    <X size={18} color={theme.semantic.error} />
                  </TouchableOpacity>
                )}
              </View>
            </GradientCard>
          );
        }}
        ListEmptyComponent={
          !historyLoading ? (
            <Text style={{ color: theme.colors.mutedForeground, textAlign: 'center', fontFamily: theme.fonts.medium, paddingVertical: 16 }}>
              {t.finance.noWithdrawRequests}
            </Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center' },
});
