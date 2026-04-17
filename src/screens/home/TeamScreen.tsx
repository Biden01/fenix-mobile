import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import { User, Search, X } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { useT } from '@/i18n';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { GradientCard } from '@/components/ui/GradientCard';
import { CompactHeader } from '@/components/ui';
import { apiClient } from '@/api/client';
import { ENDPOINTS } from '@/api/config';

const PER_PAGE = 20;


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
  const t = useT();
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
    subtitle: {
      fontSize: theme.fontSizes.xs,
      color: theme.colors.mutedForeground,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: theme.borderRadius.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      paddingHorizontal: 12,
      marginBottom: 16,
      height: 48,
      overflow: 'hidden',
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
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
      gap: 12,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: `${theme.gold.primary}18`,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: `${theme.gold.primary}30`,
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
        <>
          <CompactHeader onBack={onBack} title={t.team.title} paddingBottom={theme.spacing[2]} />
          <Text style={[styles.subtitle, { marginBottom: 16 }]}>{t.team.subtitle}</Text>
        </>
      )}

      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor: theme.colors.inputBackground, borderColor: theme.colors.border }]}>
        <Search size={16} color={theme.colors.mutedForeground} />
        <TextInput
          style={styles.searchInput}
          placeholder={t.team.searchPlaceholder}
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

      {/* Summary — compact single row */}
      <GradientCard variant="default" style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontFamily: theme.fonts.bold, fontSize: 20, color: theme.colors.goldForeground }}>{total}</Text>
            <Text style={{ fontSize: theme.fontSizes.xs, color: theme.colors.mutedForeground, marginTop: 2 }}>{t.team.total}</Text>
          </View>
          <View style={{ width: 1, height: 32, backgroundColor: theme.colors.border }} />
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontFamily: theme.fonts.bold, fontSize: 20, color: '#60A5FA' }}>{leaders}</Text>
            <Text style={{ fontSize: theme.fontSizes.xs, color: theme.colors.mutedForeground, marginTop: 2 }}>{t.team.leaders}</Text>
          </View>
          <View style={{ width: 1, height: 32, backgroundColor: theme.colors.border }} />
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontFamily: theme.fonts.bold, fontSize: 20, color: theme.colors.foreground }}>{clients}</Text>
            <Text style={{ fontSize: theme.fontSizes.xs, color: theme.colors.mutedForeground, marginTop: 2 }}>{t.team.clients}</Text>
          </View>
        </View>
      </GradientCard>

      {/* List — directly without extra card wrapper */}
      {loading ? (
        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
          <ActivityIndicator color={theme.colors.goldForeground} />
        </View>
      ) : referrals.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
          <User size={40} color={theme.colors.mutedForeground} style={{ opacity: 0.3, marginBottom: 8 }} />
          <Text style={{ textAlign: 'center', color: theme.colors.mutedForeground, fontSize: theme.fontSizes.sm }}>
            {search ? t.team.notFound : t.team.noReferrals}
          </Text>
        </View>
      ) : (
        <FlatList
          data={referrals}
          keyExtractor={(item) => String(item.id)}
          scrollEnabled={true}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
          contentContainerStyle={{ paddingBottom: theme.dimensions.tabBarHeight + theme.spacing[4] }}
          ListFooterComponent={loadingMore ? (
            <View style={{ alignItems: 'center', paddingVertical: 12 }}>
              <ActivityIndicator size="small" color={theme.colors.goldForeground} />
            </View>
          ) : null}
          ItemSeparatorComponent={() => (
            <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border, marginLeft: 68 }} />
          )}
          renderItem={({ item }) => (
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 4, gap: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: `${theme.gold.primary}18`, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: `${theme.gold.primary}30` }}>
                <User size={20} color={theme.colors.mutedForeground} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: theme.fontSizes.sm, fontFamily: theme.fonts.semibold, color: theme.colors.foreground }}>{item.fio || item.login}</Text>
                <Text style={{ fontSize: theme.fontSizes.xs, color: theme.colors.mutedForeground, marginTop: 2 }}>ID: {item.login}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: theme.fontSizes.xs, fontFamily: theme.fonts.medium, color: item.rang > 0 ? theme.colors.goldForeground : theme.colors.mutedForeground }}>
                  {t.team.rankNames?.[item.rang as keyof typeof t.team.rankNames] || `${t.team.rank} ${item.rang}`}
                </Text>
                {item.totalsum > 0 && (
                  <Text style={{ fontSize: theme.fontSizes.xs, color: theme.colors.mutedForeground, marginTop: 2 }}>
                    {item.totalsum.toLocaleString('ru-RU')} QV
                  </Text>
                )}
              </View>
            </View>
          )}
        />
      )}
    </ScreenWrapper>
  );
}
