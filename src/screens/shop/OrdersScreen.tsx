import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { ArrowLeft, Package, Clock, CheckCircle, XCircle, Truck } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { GradientCard, StatusBadge } from '@/components/ui';
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
        const mapped: DisplayOrder[] = result.data.items.map((item: PurchaseHistoryItem) => ({
          id: item.id.toString(),
          date: item.date,
          status: 'delivered', // API doesn't return status, default to delivered
          total: item.amount,
          product: item.product,
        }));
        setOrders(mapped);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  }, [fetchOrders]);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'delivered':
        return {
          label: t.shop.statusDelivered,
          variant: 'success' as const,
          icon: CheckCircle,
          color: theme.semantic.success,
        };
      case 'shipping':
        return {
          label: t.shop.statusShipping,
          variant: 'info' as const,
          icon: Truck,
          color: theme.semantic.info,
        };
      case 'processing':
        return {
          label: t.shop.statusProcessing,
          variant: 'warning' as const,
          icon: Clock,
          color: theme.semantic.warning,
        };
      case 'cancelled':
        return {
          label: t.shop.statusCancelled,
          variant: 'error' as const,
          icon: XCircle,
          color: theme.semantic.error,
        };
      default:
        return {
          label: status,
          variant: 'muted' as const,
          icon: Package,
          color: theme.colors.mutedForeground,
        };
    }
  };

  const renderOrder = ({ item }: { item: DisplayOrder }) => {
    const statusInfo = getStatusInfo(item.status);
    const StatusIcon = statusInfo.icon;

    return (
      <GradientCard style={{ marginBottom: theme.spacing[3] }}>
        <View style={styles.orderHeader}>
          <View style={styles.orderInfo}>
            <Text
              style={[
                {
                  fontFamily: theme.fonts.bold,
                  fontSize: theme.fontSizes.md,
                  color: theme.colors.foreground,
                },
              ]}
            >
              #{item.id}
            </Text>
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
              {new Date(item.date).toLocaleDateString('ru-RU')}
            </Text>
          </View>
          <StatusBadge label={statusInfo.label} variant={statusInfo.variant} />
        </View>

        <View
          style={[
            styles.orderItems,
            {
              marginTop: theme.spacing[3],
              paddingTop: theme.spacing[3],
              borderTopWidth: 1,
              borderTopColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.orderItemRow}>
            <View
              style={[
                {
                  backgroundColor: theme.colors.muted,
                  borderRadius: theme.borderRadius.lg,
                  padding: theme.spacing[2],
                  marginRight: theme.spacing[3],
                },
              ]}
            >
              <Package size={20} color={theme.colors.mutedForeground} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  {
                    fontFamily: theme.fonts.medium,
                    fontSize: theme.fontSizes.sm,
                    color: theme.colors.foreground,
                  },
                ]}
                numberOfLines={1}
              >
                {item.product}
              </Text>
            </View>
          </View>
        </View>

        <View
          style={[
            styles.orderFooter,
            {
              marginTop: theme.spacing[3],
              paddingTop: theme.spacing[3],
              borderTopWidth: 1,
              borderTopColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.orderStatusRow}>
            <StatusIcon size={16} color={statusInfo.color} />
            <Text
              style={[
                {
                  fontFamily: theme.fonts.medium,
                  fontSize: theme.fontSizes.xs,
                  color: statusInfo.color,
                  marginLeft: theme.spacing[1],
                },
              ]}
            >
              {statusInfo.label}
            </Text>
          </View>
          <Text
            style={[
              {
                fontFamily: theme.fonts.bold,
                fontSize: theme.fontSizes.md,
                color: theme.colors.goldForeground,
              },
            ]}
          >
            {item.total.toLocaleString('ru-KZ')} ₸
          </Text>
        </View>
      </GradientCard>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      {!hideHeader && (
        <View
          style={[
            styles.header,
            {
              paddingTop: 60,
              paddingHorizontal: theme.screenPadding.horizontal,
              paddingBottom: theme.spacing[4],
            },
          ]}
        >
          <TouchableOpacity
            onPress={onBack}
            style={[
              styles.backButton,
              {
                backgroundColor: theme.colors.card,
                borderRadius: theme.borderRadius.full,
                padding: theme.spacing[2],
              },
            ]}
          >
            <ArrowLeft size={24} color={theme.colors.foreground} />
          </TouchableOpacity>
          <Text
            style={[
              {
                fontFamily: theme.fonts.displayBold,
                fontSize: theme.fontSizes.xl,
                color: theme.colors.foreground,
                flex: 1,
                textAlign: 'center',
              },
            ]}
          >
            {t.shop.orders}
          </Text>
          <View style={{ width: 40 }} />
        </View>
      )}

      {loading ? (
        <View style={{ alignItems: 'center', padding: 40 }}>
          <ActivityIndicator size="large" color={theme.colors.goldForeground} />
          <Text style={{ marginTop: 12, color: theme.colors.mutedForeground }}>
            {t.shop.loadingOrders}
          </Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrder}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: theme.screenPadding.horizontal,
            paddingBottom: 40,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.gold.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Package size={64} color={theme.colors.mutedForeground} />
              <Text
                style={[
                  {
                    fontFamily: theme.fonts.medium,
                    fontSize: theme.fontSizes.md,
                    color: theme.colors.mutedForeground,
                    marginTop: theme.spacing[4],
                  },
                ]}
              >
                {t.shop.emptyOrders}
              </Text>
            </View>
          }
        />
      )}
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
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderInfo: {},
  orderItems: {},
  orderItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
});
