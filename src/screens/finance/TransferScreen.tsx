import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Search, Send, Wallet } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { CompactHeader, GradientCard, GlassInput, GoldButton, Avatar, RankBadge } from '@/components/ui';
import { useAuthStore } from '@/store';
import { authService, financeService } from '@/api';
import { useT } from '@/i18n';

interface TransferScreenProps {
  onBack: () => void;
}

export function TransferScreen({ onBack }: TransferScreenProps) {
  const theme = useTheme();
  const t = useT();
  const { user } = useAuthStore();
  const [recipientId, setRecipientId] = useState('');
  const [recipientInfo, setRecipientInfo] = useState<{
    name: string;
    rank: number;
  } | null>(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  const handleSearchRecipient = async () => {
    if (!recipientId.trim()) {
      Alert.alert(t.common.error, t.finance.recipientIdPlaceholder);
      return;
    }

    setSearching(true);
    try {
      const result = await authService.checkUser(recipientId.trim());
      if ('error' in result) {
        Alert.alert(t.common.error, result.error);
        setRecipientInfo(null);
      } else if (!result.exists) {
        Alert.alert(t.common.error, t.finance.recipientNotFound);
        setRecipientInfo(null);
      } else {
        setRecipientInfo({
          name: result.user!.fio,
          rank: result.user!.rang,
        });
      }
    } catch (error) {
      Alert.alert(t.common.error, t.finance.recipientNotFound);
      setRecipientInfo(null);
    } finally {
      setSearching(false);
    }
  };

  const handleTransfer = async () => {
    if (!recipientInfo) {
      Alert.alert(t.common.error, t.finance.recipient);
      return;
    }

    const numAmount = parseFloat(amount);

    if (!numAmount || numAmount <= 0) {
      Alert.alert(t.common.error, t.finance.amount);
      return;
    }

    if (numAmount > (user?.balance || 0)) {
      Alert.alert(t.common.error, t.shop.insufficientFunds);
      return;
    }

    setLoading(true);
    try {
      const result = await financeService.transfer(recipientId.trim(), numAmount);
      if ('error' in result) {
        Alert.alert(t.common.error, result.error);
      } else {
        // Refresh user profile to update balance
        const { refreshProfile } = useAuthStore.getState();
        await refreshProfile();

        Alert.alert(
          t.finance.transferSuccess,
          `${numAmount.toLocaleString('ru-KZ')} ₸ ${t.finance.transferTo} ${recipientInfo.name}`,
          [{ text: t.common.ok, onPress: onBack }]
        );
      }
    } catch (error) {
      Alert.alert(t.common.error, t.finance.transfer);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <CompactHeader
        onBack={onBack}
        title={t.finance.transfer}
        paddingBottom={theme.spacing[4]}
        right={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: `${theme.gold.primary}12`, borderRadius: 99 }}>
            <Wallet size={13} color={theme.colors.goldForeground} />
            <Text style={{ fontFamily: theme.fonts.bold, fontSize: 13, color: theme.colors.goldForeground }}>
              {(user?.balance || 0).toLocaleString('ru-KZ')} ₸
            </Text>
          </View>
        }
      />

      <View style={{ paddingHorizontal: theme.screenPadding.horizontal }}>

        {/* Recipient Search */}
        <GradientCard style={{ marginBottom: theme.spacing[4] }}>
          <Text style={{ fontFamily: theme.fonts.semibold, fontSize: theme.fontSizes.sm, color: theme.colors.mutedForeground, marginBottom: theme.spacing[3] }}>
            {t.finance.recipient}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <GlassInput
                placeholder={t.finance.recipientIdPlaceholder}
                value={recipientId}
                onChangeText={(text) => { setRecipientId(text); setRecipientInfo(null); }}
                leftIcon={<Search size={18} color={theme.colors.mutedForeground} />}
              />
            </View>
            <GoldButton title={t.finance.find} onPress={handleSearchRecipient} loading={searching} size="md" fullWidth={false} style={{ width: 90 }} />
          </View>

          {recipientInfo && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: `${theme.semantic.success}10`, borderRadius: 12, borderWidth: 1, borderColor: `${theme.semantic.success}30`, padding: 12, marginTop: 12 }}>
              <Avatar name={recipientInfo.name} size="sm" showBorder={false} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: theme.fonts.semibold, fontSize: theme.fontSizes.sm, color: theme.colors.foreground }}>{recipientInfo.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 8 }}>
                  <RankBadge rank={recipientInfo.rank} size="sm" />
                  <Text style={{ fontSize: theme.fontSizes.xs, color: theme.colors.mutedForeground }}>{recipientId}</Text>
                </View>
              </View>
            </View>
          )}
        </GradientCard>

        {/* Amount */}
        <GradientCard>
          <Text style={{ fontFamily: theme.fonts.semibold, fontSize: theme.fontSizes.sm, color: theme.colors.mutedForeground, marginBottom: theme.spacing[3] }}>
            {t.finance.amount}
          </Text>
          <GlassInput
            placeholder="0"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            leftIcon={<Text style={{ color: theme.colors.mutedForeground }}>₸</Text>}
          />
          <Text style={{ fontFamily: theme.fonts.regular, fontSize: 11, color: theme.colors.mutedForeground, marginTop: 8 }}>
            {t.finance.commission}: 0% · {t.finance.minAmount}: 1,000 ₸ · {t.finance.instantTransfer}
          </Text>
          <GoldButton
            title={t.finance.send}
            onPress={handleTransfer}
            loading={loading}
            disabled={!recipientInfo}
            style={{ marginTop: theme.spacing[4] }}
            icon={<Send size={20} color={theme.colors.primaryForeground} />}
          />
        </GradientCard>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {},
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  recipientCard: {},
  recipientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recipientMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  feeInfo: {},
});
