import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { CompactHeader, GradientCard, GoldButton } from '@/components/ui';
import { useCartStore } from '@/store';
import { shopService } from '@/api';
import { useAuthStore } from '@/store';
import { useT } from '@/i18n';

interface CartScreenProps {
  onBack: () => void;
  onSuccess: () => void;
  hideHeader?: boolean;
  isModal?: boolean;
}

export function CartScreen({ onBack, onSuccess, hideHeader, isModal }: CartScreenProps) {
  const theme = useTheme();
  const t = useT();
  const insets = useSafeAreaInsets();
  const { items, removeItem, updateQuantity, clearCart, getTotalPrice, getTotalQV } = useCartStore();
  const { refreshProfile } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (items.length === 0) return;

    Alert.alert(
      t.shop.orderConfirmTitle,
      `${t.shop.total}: ${getTotalPrice().toLocaleString('ru-KZ')} ₸ (${getTotalQV()} QV)`,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.shop.confirmCheckout,
          onPress: async () => {
            setLoading(true);
            try {
              let hasError = false;
              for (const item of items) {
                const result = await shopService.purchase(parseInt(item.id, 10), item.quantity);
                if ('error' in result) {
                  Alert.alert(t.common.error, result.error);
                  hasError = true;
                  break;
                }
              }
              if (!hasError) {
                clearCart();
                await refreshProfile();
                Alert.alert(t.shop.orderSuccess, t.shop.orderSuccessMsg, [
                  { text: t.common.ok, onPress: onSuccess },
                ]);
              }
            } catch {
              Alert.alert(t.common.error, t.shop.orderError);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: typeof items[0] }) => (
    <GradientCard style={{ marginBottom: theme.spacing[3] }}>
      <View style={styles.itemRow}>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: theme.fonts.semibold,
              fontSize: theme.fontSizes.sm,
              color: theme.colors.foreground,
              marginBottom: 4,
            }}
            numberOfLines={2}
          >
            {item.name}
          </Text>
          <Text
            style={{
              fontFamily: theme.fonts.bold,
              fontSize: theme.fontSizes.md,
              color: theme.colors.goldForeground,
            }}
          >
            {(item.price * item.quantity).toLocaleString('ru-KZ')} ₸
          </Text>
          <Text
            style={{
              fontFamily: theme.fonts.regular,
              fontSize: theme.fontSizes.xs,
              color: theme.colors.mutedForeground,
            }}
          >
            {item.qv * item.quantity} QV
          </Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity
            onPress={() => removeItem(item.id)}
            style={[styles.trashBtn, { backgroundColor: `${theme.semantic.error}15`, borderRadius: theme.borderRadius.lg }]}
          >
            <Trash2 size={16} color={theme.semantic.error} />
          </TouchableOpacity>

          <View style={[styles.qtyRow, { backgroundColor: theme.colors.muted, borderRadius: theme.borderRadius.lg }]}>
            <TouchableOpacity
              onPress={() => updateQuantity(item.id, item.quantity - 1)}
              style={styles.qtyBtn}
            >
              <Minus size={16} color={theme.colors.foreground} />
            </TouchableOpacity>
            <Text
              style={{
                fontFamily: theme.fonts.bold,
                fontSize: theme.fontSizes.sm,
                color: theme.colors.foreground,
                minWidth: 24,
                textAlign: 'center',
              }}
            >
              {item.quantity}
            </Text>
            <TouchableOpacity
              onPress={() => updateQuantity(item.id, item.quantity + 1)}
              style={styles.qtyBtn}
            >
              <Plus size={16} color={theme.colors.foreground} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </GradientCard>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      {isModal ? (
        <View style={{ paddingTop: 16, paddingHorizontal: theme.screenPadding.horizontal, paddingBottom: theme.spacing[3] }}>
          <TouchableOpacity onPress={onBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle-outline" size={30} color={theme.colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      ) : !hideHeader ? (
        <CompactHeader
          onBack={onBack}
          title={t.shop.cart}
          titleAlign="center"
          paddingBottom={theme.spacing[4]}
          right={items.length > 0 ? (
            <TouchableOpacity onPress={clearCart} style={{ padding: theme.spacing[2] }}>
              <Text style={{ fontFamily: theme.fonts.medium, fontSize: theme.fontSizes.sm, color: theme.semantic.error }}>
                {t.shop.clearCart}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40 }} />
          )}
        />
      ) : null}

      {items.length === 0 ? (
        <View style={styles.empty}>
          <ShoppingBag size={80} color={theme.colors.mutedForeground} />
          <Text
            style={{
              fontFamily: theme.fonts.medium,
              fontSize: theme.fontSizes.lg,
              color: theme.colors.mutedForeground,
              marginTop: theme.spacing[4],
              textAlign: 'center',
            }}
          >
            {t.shop.emptyCart}
          </Text>
          <Text
            style={{
              fontFamily: theme.fonts.regular,
              fontSize: theme.fontSizes.sm,
              color: theme.colors.mutedForeground,
              marginTop: theme.spacing[2],
              textAlign: 'center',
            }}
          >
            {t.shop.addFromCatalog}
          </Text>
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              paddingHorizontal: theme.screenPadding.horizontal,
              paddingBottom: theme.dimensions.tabBarHeight + insets.bottom + 104,
            }}
            showsVerticalScrollIndicator={false}
          />

          {/* Footer — positioned above the floating tab bar */}
          <View style={[styles.footer, { borderTopColor: theme.colors.border, paddingHorizontal: theme.screenPadding.horizontal, paddingBottom: theme.dimensions.tabBarHeight + Math.max(insets.bottom, theme.spacing[4]), paddingTop: theme.spacing[4], backgroundColor: theme.colors.background }]}>
            <View style={styles.totalRow}>
              <Text style={{ fontFamily: theme.fonts.regular, fontSize: theme.fontSizes.sm, color: theme.colors.mutedForeground }}>
                {t.shop.total} ({items.length} {t.shop.itemsCount})
              </Text>
              <Text style={{ fontFamily: theme.fonts.bold, fontSize: theme.fontSizes.xl, color: theme.colors.foreground }}>
                {getTotalPrice().toLocaleString('ru-KZ')} ₸
              </Text>
            </View>
            <Text
              style={{
                fontFamily: theme.fonts.regular,
                fontSize: theme.fontSizes.xs,
                color: theme.colors.mutedForeground,
                marginBottom: theme.spacing[3],
              }}
            >
              {getTotalQV()} QV
            </Text>
            <GoldButton
              title={t.shop.checkout}
              onPress={handleCheckout}
              loading={loading}
            />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  controls: { alignItems: 'flex-end', gap: 8 },
  trashBtn: { padding: 8 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 },
  qtyBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopWidth: 1 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
});
