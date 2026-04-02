import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import { ChevronLeft, User, Search, X } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { GradientCard } from '@/components/ui/GradientCard';
import { apiClient } from '@/api/client';
import { ENDPOINTS } from '@/api/config';

const PER_PAGE = 20;

const RANG_NAMES: Record<number, string> = {
  0: '—', 1: 'Партнёр', 2: 'Менеджер', 3: 'Директор',
  4: 'Серебро', 5: 'Золото', 6: 'Платина', 7: 'Бриллиант',
  8: 'Корона', 9: 'Топ', 10: 'Президент', 11: 'Вице-Президент', 12: 'Посол',
};

interface Referral {
  id: number;
  login: string;
  fio: string;
  status: number;
  rang: number;
  totalsum: number;
  reg_time?: string;
}

interface ReferralsResponse {
  items: Referral[];
  total: number;
}

interface Props {
  onBack: () => void;
  hideHeader?: boolean;
}

export function TeamScreen({ onBack, hideHeader }: Props) {
  const theme = useTheme();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [total, setTotal] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const pageRef = useRef(1);
  const loadingMoreRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search input
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  const buildUrl = (page: number, q: string) => {
    let url = `${ENDPOINTS.USERS.REFERRALS}?page=${page}&per_page=${PER_PAGE}`;
    if (q.trim()) url += `&search=${encodeURIComponent(q.trim())}`;
    return url;
  };

  const loadPage = useCallback(async (page: number, q: string, replace: boolean) => {
    const res = await apiClient.get<ReferralsResponse>(buildUrl(page, q));
    if (!res.error && res.data) {
      const items = res.data.items || [];
      const tot = res.data.total || 0;
      if (replace) {
        setReferrals(items);
        setTotal(tot);
      } else {
        setReferrals((prev) => {
          const ids = new Set(prev.map((r) => r.id));
          return [...prev, ...items.filter((r) => !ids.has(r.id))];
        });
      }
      const loaded = replace ? items.length : (page - 1) * PER_PAGE + items.length;
      setHasMore(loaded < tot);
    }
  }, []);

  // Initial load + reload when search changes
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      pageRef.current = 1;
      setLoading(true);
      setHasMore(true);
      if (!cancelled) await loadPage(1, debouncedSearch, true);
      if (!cancelled) setLoading(false);
    };
    run();
    return () => { cancelled = true; };
  }, [debouncedSearch, loadPage]);

  const onRefresh = async () => {
    setRefreshing(true);
    pageRef.current = 1;
    setHasMore(true);
    await loadPage(1, debouncedSearch, true);
    setRefreshing(false);
  };

  const onEndReached = useCallback(async () => {
    if (!hasMore || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    const nextPage = pageRef.current + 1;
    pageRef.current = nextPage;
    await loadPage(nextPage, debouncedSearch, false);
    setLoadingMore(false);
    loadingMoreRef.current = false;
  }, [hasMore, debouncedSearch, loadPage]);

  const leaders = referrals.filter((r) => r.rang > 0).length;
  const clients = referrals.filter((r) => r.rang === 0).length;

  const styles = StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 16,
    },
    backBtn: {
      padding: 8,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.muted,
    },
    title: {
      fontSize: theme.fontSizes.lg,
      fontFamily: theme.fonts.bold,
      color: theme.colors.foreground,
    },
    subtitle: {
      fontSize: theme.fontSizes.xs,
      color: theme.colors.mutedForeground,
      marginTop: 2,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: 12,
      marginBottom: 16,
      height: 44,
    },
    searchInput: {
      flex: 1,
      marginLeft: 8,
      color: theme.colors.foreground,
      fontFamily: theme.fonts.regular,
      fontSize: theme.fontSizes.sm,
    },
    summaryRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 20,
    },
    summaryCard: {
      flex: 1,
    },
    summaryValue: {
      fontSize: 24,
      fontFamily: theme.fonts.bold,
      color: theme.colors.goldForeground,
    },
    summaryLabel: {
      fontSize: theme.fontSizes.xs,
      color: theme.colors.mutedForeground,
      marginTop: 4,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      gap: 12,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.muted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    name: {
      fontSize: theme.fontSizes.sm,
      fontFamily: theme.fonts.semibold,
      color: theme.colors.foreground,
    },
    login: {
      fontSize: theme.fontSizes.xs,
      color: theme.colors.mutedForeground,
      marginTop: 2,
    },
    badge: {
      fontSize: theme.fontSizes.xs,
      color: theme.colors.goldForeground,
      fontFamily: theme.fonts.medium,
    },
    typeLabel: {
      fontSize: theme.fontSizes.xs,
      color: theme.colors.mutedForeground,
    },
    emptyText: {
      textAlign: 'center',
      color: theme.colors.mutedForeground,
      fontSize: theme.fontSizes.sm,
      marginTop: 40,
      paddingVertical: 30,
    },
  });

  return (
    <ScreenWrapper
      scrollable={false}
      padded
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.gold.primary} />
      }
    >
      {!hideHeader && (
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <ChevronLeft size={20} color={theme.colors.foreground} />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Моя команда</Text>
            <Text style={styles.subtitle}>Прямые рефералы</Text>
          </View>
        </View>
      )}

      {/* Search */}
      <View style={styles.searchContainer}>
        <Search size={16} color={theme.colors.mutedForeground} />
        <TextInput
          style={styles.searchInput}
          placeholder="Поиск по имени или ID..."
          placeholderTextColor={theme.colors.mutedForeground}
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <X size={16} color={theme.colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      {/* Summary */}
      <View style={styles.summaryRow}>
        <GradientCard variant="gold" style={styles.summaryCard}>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.summaryValue}>{total}</Text>
            <Text style={styles.summaryLabel}>Всего</Text>
          </View>
        </GradientCard>
        <GradientCard variant="default" style={styles.summaryCard}>
          <View style={{ alignItems: 'center' }}>
            <Text style={[styles.summaryValue, { color: theme.colors.foreground }]}>{leaders}</Text>
            <Text style={styles.summaryLabel}>Лидеров</Text>
          </View>
        </GradientCard>
        <GradientCard variant="default" style={styles.summaryCard}>
          <View style={{ alignItems: 'center' }}>
            <Text style={[styles.summaryValue, { color: theme.colors.foreground }]}>{clients}</Text>
            <Text style={styles.summaryLabel}>Клиентов</Text>
          </View>
        </GradientCard>
      </View>

      {/* List */}
      <GradientCard variant="default" padding={0} style={{ flex: 1 }}>
        {loading ? (
          <View style={{ alignItems: 'center', paddingVertical: 30 }}>
            <ActivityIndicator color={theme.colors.goldForeground} />
          </View>
        ) : referrals.length === 0 ? (
          <Text style={styles.emptyText}>
            {search ? 'Ничего не найдено' : 'Нет рефералов'}
          </Text>
        ) : (
          <FlatList
            data={referrals}
            keyExtractor={(item) => String(item.id)}
            scrollEnabled={true}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.3}
            ListFooterComponent={
              loadingMore ? (
                <View style={{ alignItems: 'center', paddingVertical: 12 }}>
                  <ActivityIndicator size="small" color={theme.colors.goldForeground} />
                </View>
              ) : null
            }
            renderItem={({ item }) => (
              <View style={styles.item}>
                <View style={styles.avatar}>
                  <User size={20} color={theme.colors.mutedForeground} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.fio || item.login}</Text>
                  <Text style={styles.login}>ID: {item.login}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.badge}>
                    {RANG_NAMES[item.rang] || `Ранг ${item.rang}`}
                  </Text>
                  <Text style={styles.typeLabel}>Статус {item.status}</Text>
                </View>
              </View>
            )}
          />
        )}
      </GradientCard>
    </ScreenWrapper>
  );
}
