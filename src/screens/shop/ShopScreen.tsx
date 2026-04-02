import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { Search, ShoppingCart, Package } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { ScreenWrapper, GlassInput, GradientCard, GoldButton, StatusBadge } from '@/components/ui';
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
        const mapped: DisplayProduct[] = result.data.items.map((p: Product) => ({
          id: p.id.toString(),
          name: p.name,
          price: p.price ?? 0,
          qv: p.qv || 0,
          image: p.image || null,
          description: p.description,
        }));
        setProducts(mapped);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  }, [fetchProducts]);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleAddToCart = (product: DisplayProduct) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      qv: product.qv,
      image: product.image ?? undefined,
    });
  };

  const renderProduct = ({ item }: { item: DisplayProduct }) => (
    <GradientCard style={{ ...styles.productCard, width: '48%' }}>
      <View
        style={[
          styles.productImage,
          {
            backgroundColor: theme.colors.muted,
            borderRadius: theme.borderRadius.lg,
            marginBottom: theme.spacing[3],
          },
        ]}
      >
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.productImageFill} />
        ) : (
          <Package size={40} color={theme.colors.mutedForeground} />
        )}
      </View>

      <Text
        style={[
          {
            fontFamily: theme.fonts.semibold,
            fontSize: theme.fontSizes.sm,
            color: theme.colors.foreground,
            marginBottom: theme.spacing[1],
          },
        ]}
        numberOfLines={2}
      >
        {item.name}
      </Text>

      <View style={styles.productMeta}>
        <Text
          style={[
            {
              fontFamily: theme.fonts.bold,
              fontSize: theme.fontSizes.md,
              color: theme.colors.goldForeground,
            },
          ]}
        >
          {item.price.toLocaleString('ru-KZ')} ₸
        </Text>
        <StatusBadge label={`${item.qv} QV`} variant="gold" size="sm" />
      </View>

      <GoldButton
        title={t.shop.addToCart}
        onPress={() => handleAddToCart(item)}
        size="sm"
        style={{ marginTop: theme.spacing[3] }}
      />
    </GradientCard>
  );

  return (
    <ScreenWrapper padded={false}>
      <View style={{ paddingHorizontal: theme.screenPadding.horizontal }}>
        {/* Header */}
        <View style={styles.header}>
          <Text
            style={[
              {
                fontFamily: theme.fonts.displayBold,
                fontSize: theme.fontSizes['2xl'],
                color: theme.colors.foreground,
              },
            ]}
          >
            {t.shop.title}
          </Text>
          <TouchableOpacity
            onPress={onViewCart}
            style={[
              styles.cartButton,
              {
                backgroundColor: theme.colors.card,
                borderRadius: theme.borderRadius.full,
                padding: theme.spacing[2],
              },
            ]}
          >
            <ShoppingCart size={24} color={theme.colors.foreground} />
            {cartCount > 0 && (
              <View
                style={[
                  styles.cartBadge,
                  {
                    backgroundColor: theme.gold.primary,
                    borderRadius: theme.borderRadius.full,
                  },
                ]}
              >
                <Text
                  style={[
                    {
                      fontFamily: theme.fonts.bold,
                      fontSize: 10,
                      color: theme.colors.primaryForeground,
                    },
                  ]}
                >
                  {cartCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Search */}
        <GlassInput
          placeholder={t.shop.searchPlaceholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Search size={18} color={theme.colors.mutedForeground} />}
          containerStyle={{ marginBottom: theme.spacing[4] }}
        />

      </View>

      {/* Products Grid */}
      {loading ? (
        <View style={{ alignItems: 'center', padding: 40 }}>
          <ActivityIndicator size="large" color={theme.colors.goldForeground} />
          <Text style={{ marginTop: 12, color: theme.colors.mutedForeground }}>
            {t.shop.loading}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={{
            paddingHorizontal: theme.screenPadding.horizontal,
            paddingBottom: theme.dimensions.tabBarHeight + theme.spacing[4],
          }}
          columnWrapperStyle={filteredProducts.length > 1 ? styles.productRow : undefined}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.gold.primary}
            />
          }
          ListEmptyComponent={
            <View style={{ alignItems: 'center', padding: 40 }}>
              <Package size={64} color={theme.colors.mutedForeground} />
              <Text style={{ marginTop: 12, color: theme.colors.mutedForeground }}>
                {t.shop.noProducts}
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
    marginBottom: 16,
  },
  cartButton: {
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  productCard: {},
  productImage: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImageFill: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  productMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
