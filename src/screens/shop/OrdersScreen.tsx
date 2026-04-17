import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { Package, Clock, CheckCircle, XCircle, Truck } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { CompactHeader, GradientCard } from '@/components/ui';
import { shopService, PurchaseHistoryItem } from '@/api';
import { useT } from '@/i18n';

interface DisplayOrder {
  id: string;
  date: string;
  status: string;
  total: number;
  product: string;
}

interface OrdersScreenProps {
  onBack: () => void;
  hideHeader?: boolean;
}

export function OrdersScreen({ onBack, hideHeader }: OrdersScreenProps) {
  const theme = useTheme();
  const t = useT();
  const [orders, setOrders] = useState<DisplayOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const result = await shopService.getPurchaseHistory(1, 50);
      if (!('error' in result)) {
        setOrders(result.data.items.map((item: PurchaseHistoryItem) => ({
          id: item.id.toString(),
          date: item.date,
          status: 'delivered',
          total: item.amount,
          product: item.product,
        })));
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  }, [fetchOrders]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'delivered':  return { label: t.shop.statusDelivered,  color: theme.semantic.success, bg: `${theme.semantic.success}18`, icon: CheckCircle };
      case 'shipping':   return { label: t.shop.statusShipping,   color: theme.semantic.info,    bg: `${theme.semantic.info}18`,    icon: Truck };
      case 'processing': return { label: t.shop.statusProcessing, color: theme.semantic.warning, bg: `${theme.semantic.warning}18`, icon: Clock };
      case 'cancelled':  return { label: t.shop.statusCancelled,  color: theme.semantic.error,   bg: `${theme.semantic.error}18`,   icon: XCircle };
      default:           return { label: status,                  color: theme.colors.mutedForeground, bg: theme.colors.muted,     icon: Package };
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {!hideHeader && (
        <CompactHeader onBack={onBack} title={t.shop.orders} paddingBottom={theme.spacing[4]} />
      )}

      {loading ? (
        <View style={{ alignItems: 'center', padding: 40 }}>
          <ActivityIndicator size="large" color={theme.colors.goldForeground} />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: theme.screenPadding.horizontal, paddingBottom: theme.dimensions.tabBarHeight + theme.spacing[4] }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.gold.primary} />}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 80 }}>
              <Package size={48} color={theme.colors.mutedForeground} style={{ opacity: 0.3, marginBottom: 12 }} />
              <Text style={{ fontFamily: theme.fonts.medium, fontSize: theme.fontSizes.sm, color: theme.colors.mutedForeground }}>{t.shop.emptyOrders}</Text>
            </View>
          }
          renderItem={({ item }) => {
            const cfg = getStatusConfig(item.status);
            const Icon = cfg.icon;
            return (
              <GradientCard style={{ marginBottom: theme.spacing[3] }} padding={14}>
                {/* Row 1: Order # + date + status badge */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <View>
                    <Text style={{ fontFamily: theme.fonts.bold, fontSize: theme.fontSizes.sm, color: theme.colors.foreground }}>#{item.id}</Text>
                    <Text style={{ fontSize: 11, color: theme.colors.mutedForeground, marginTop: 2 }}>
                      {new Date(item.date).toLocaleDateString('ru-RU')}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: cfg.bg, borderRadius: 99 }}>
                    <Icon size={12} color={cfg.color} />
                    <Text style={{ fontSize: 12, fontFamily: theme.fonts.medium, color: cfg.color }}>{cfg.label}</Text>
                  </View>
                </View>

                {/* Row 2: Product + amount */}
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border, gap: 10 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: theme.colors.muted, alignItems: 'center', justifyContent: 'center' }}>
                    <Package size={18} color={theme.colors.mutedForeground} />
                  </View>
                  <Text style={{ flex: 1, fontFamily: theme.fonts.medium, fontSize: theme.fontSizes.sm, color: theme.colors.foreground }} numberOfLines={2}>
                    {item.product}
                  </Text>
                  <Text style={{ fontFamily: theme.fonts.bold, fontSize: theme.fontSizes.sm, color: theme.colors.goldForeground }}>
                    {item.total.toLocaleString('ru-KZ')} ₸
                  </Text>
                </View>
              </GradientCard>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
