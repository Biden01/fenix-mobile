import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { Search, ShoppingCart, Package, Plus } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme';
import { ScreenWrapper, GlassInput, GlassCard } from '@/components/ui';
import { useCartStore } from '@/store';
import { shopService, Product } from '@/api';
import { useT } from '@/i18n';

interface DisplayProduct {
  id: string;
  name: string;
  price: number;
  qv: number;
  image: string | null;
  description: string | null;
}

interface ShopScreenProps {
  onViewCart: () => void;
}

export function ShopScreen({ onViewCart }: ShopScreenProps) {
  const theme = useTheme();
  const t = useT();
  const { addItem, getItemCount } = useCartStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<DisplayProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const cartCount = getItemCount();

  const fetchProducts = useCallback(async () => {
    try {
      const result = await shopService.getProducts(1, 50, true);
      if (!('error' in result)) {
        setProducts(result.data.items.map((p: Product) => ({
          id: p.id.toString(),
          name: p.name,
          price: p.price ?? 0,
          qv: p.qv || 0,
          image: p.image || null,
          description: p.description,
        })));
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  }, [fetchProducts]);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddToCart = (product: DisplayProduct) => {
    addItem({ id: product.id, name: product.name, price: product.price, qv: product.qv, image: product.image ?? undefined });
  };

  const renderProduct = ({ item }: { item: DisplayProduct }) => (
    <View style={[styles.productCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      {/* Image / placeholder */}
      <View style={[styles.imageContainer, { backgroundColor: theme.colors.muted }]}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <LinearGradient
            colors={['rgba(255,215,0,0.08)', 'rgba(218,165,32,0.03)']}
            style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}
          >
            <Package size={36} color={theme.colors.mutedForeground} style={{ opacity: 0.4 }} />
          </LinearGradient>
        )}
        {/* QV badge */}
        <View style={[styles.qvBadge, { backgroundColor: `${theme.gold.primary}E6` }]}>
          <Text style={{ fontFamily: theme.fonts.bold, fontSize: 9, color: '#1A1000' }}>{item.qv} QV</Text>
        </View>
        {/* Add button */}
        <TouchableOpacity
          onPress={() => handleAddToCart(item)}
          activeOpacity={0.8}
          style={[styles.addBtn, { backgroundColor: theme.gold.primary }]}
        >
          <Plus size={16} color="#1A1000" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* Info */}
      <View style={{ padding: 12 }}>
        <Text style={{ fontFamily: theme.fonts.semibold, fontSize: theme.fontSizes.sm, color: theme.colors.foreground, marginBottom: 5 }} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={{ fontFamily: theme.fonts.bold, fontSize: theme.fontSizes.md, color: theme.colors.goldForeground }}>
          {item.price.toLocaleString('ru-KZ')} ₸
        </Text>
      </View>
    </View>
  );

  return (
    <ScreenWrapper padded={false}>
      {/* Sticky header + search */}
      <View style={{ paddingHorizontal: theme.screenPadding.horizontal }}>
        <View style={[styles.header, { paddingTop: theme.spacing[2] }]}>
          <Text style={{ fontFamily: theme.fonts.displayBold, fontSize: theme.fontSizes['2xl'], color: theme.colors.foreground }}>
            {t.shop.title}
          </Text>
          <TouchableOpacity onPress={onViewCart} activeOpacity={0.8} style={{ position: 'relative' }}>
            <GlassCard cornerRadius={theme.borderRadius.full} style={{ padding: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border }}>
              <ShoppingCart size={22} color={theme.colors.foreground} />
            </GlassCard>
            {cartCount > 0 && (
              <View style={[styles.cartBadge, { backgroundColor: theme.gold.primary }]}>
                <Text style={{ fontFamily: theme.fonts.bold, fontSize: 10, color: '#1A1000' }}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <GlassInput
          placeholder={t.shop.searchPlaceholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Search size={18} color={theme.colors.mutedForeground} />}
          containerStyle={{ marginTop: theme.spacing[3], marginBottom: theme.spacing[2] }}
        />
      </View>

      {loading ? (
        <View style={{ alignItems: 'center', paddingTop: 60 }}>
          <ActivityIndicator size="large" color={theme.colors.goldForeground} />
          <Text style={{ marginTop: 12, fontFamily: theme.fonts.regular, fontSize: theme.fontSizes.sm, color: theme.colors.mutedForeground }}>{t.shop.loading}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderProduct}
          keyExtractor={item => item.id}
          numColumns={2}
          contentContainerStyle={{ paddingHorizontal: theme.screenPadding.horizontal, paddingBottom: theme.dimensions.tabBarHeight + theme.spacing[4], paddingTop: theme.spacing[2] }}
          columnWrapperStyle={{ gap: 12, marginBottom: 12 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.gold.primary} />}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Package size={48} color={theme.colors.mutedForeground} style={{ opacity: 0.3, marginBottom: 12 }} />
              <Text style={{ fontFamily: theme.fonts.medium, fontSize: theme.fontSizes.sm, color: theme.colors.mutedForeground }}>
                {searchQuery ? t.shop.noProducts : t.shop.noProducts}
              </Text>
            </View>
          }
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  productCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  imageContainer: {
    height: 120,
    overflow: 'hidden',
    position: 'relative',
  },
  qvBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  addBtn: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
