import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { ArrowLeft, Users, Gift, Percent, Zap, Clock, ArrowDownCircle } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { GradientCard, Tabs, StatusBadge } from '@/components/ui';
import { financeService, TransferHistoryItem, BinaryBonusItem, BbsItem, PassiveHistoryItem, UplineItem } from '@/api';
import { useT } from '@/i18n';

const PER_PAGE = 20;

interface ReferralItem {
  id: string;
  date: string;
  amount: number;
  from: string;
  level: number;
}

interface BinaryItem {
  id: string;
  date: string;
  amount: number;
  leftQV: number;
  rightQV: number;
}

interface CashbackItem {
  id: string;
  date: string;
  amount: number;
  source: string;
}

interface ReportsScreenProps {
  onBack: () => void;
  hideHeader?: boolean;
  isModal?: boolean;
}

// Per-endpoint pagination state
interface EndpointState {
  page: number;
  hasMore: boolean;
  loading: boolean;
  initialized: boolean;
}

function initState(): EndpointState {
  return { page: 1, hasMore: true, loading: false, initialized: false };
}

export function ReportsScreen({ onBack, hideHeader, isModal }: ReportsScreenProps) {
  const theme = useTheme();
  const t = useT();
  const [activeTab, setActiveTab] = useState('referral');
  const [refreshing, setRefreshing] = useState(false);

  // Item arrays
  const [referralData, setReferralData] = useState<ReferralItem[]>([]);
  const [binaryData, setBinaryData] = useState<BinaryItem[]>([]);
  const [cashbackData, setCashbackData] = useState<CashbackItem[]>([]);
  const [bbsData, setBbsData] = useState<BbsItem[]>([]);
  const [passiveData, setPassiveData] = useState<PassiveHistoryItem[]>([]);
  const [uplineData, setUplineData] = useState<UplineItem[]>([]);

  // Pagination states — referral & cashback share 'transfers' endpoint
  const [transfers, setTransfers] = useState<EndpointState>(initState());
  const [binary, setBinary] = useState<EndpointState>(initState());
  const [bbs, setBbs] = useState<EndpointState>(initState());
  const [passive, setPassive] = useState<EndpointState>(initState());
  const [upline, setUpline] = useState<EndpointState>(initState());

  // Prevent double-fetches
  const loadingRefs = useRef({
    transfers: false, binary: false, bbs: false, passive: false, upline: false,
  });

  // ——————————————————————————————————————————
  // Loaders
  // ——————————————————————————————————————————

  const loadTransfers = useCallback(async (page: number, replace: boolean) => {
    if (loadingRefs.current.transfers) return;
    loadingRefs.current.transfers = true;
    setTransfers((s) => ({ ...s, loading: true }));
    const result = await financeService.getTransferHistory(page, PER_PAGE);
    if (!('error' in result)) {
      const newReferral: ReferralItem[] = [];
      const newCashback: CashbackItem[] = [];
      result.data.items.forEach((item: TransferHistoryItem) => {
        const prod = (item.product || '').toLowerCase();
        if (prod.includes('реферальн') || prod.includes('referral')) {
          newReferral.push({
            id: item.id.toString(),
            date: item.sent_time,
            amount: parseFloat(item.amount),
            from: item.user_login || 'Система',
            level: item.line,
          });
        } else {
          newCashback.push({
            id: item.id.toString(),
            date: item.sent_time,
            amount: parseFloat(item.amount),
            source: item.product || '',
          });
        }
      });
      const total: number = (result.data as any).total ?? 0;
      const loaded = replace ? result.data.items.length : (page - 1) * PER_PAGE + result.data.items.length;
      if (replace) {
        setReferralData(newReferral);
        setCashbackData(newCashback);
      } else {
        setReferralData((p) => [...p, ...newReferral]);
        setCashbackData((p) => [...p, ...newCashback]);
      }
      setTransfers({ page, hasMore: loaded < total, loading: false, initialized: true });
    } else {
      setTransfers((s) => ({ ...s, loading: false, initialized: true }));
    }
    loadingRefs.current.transfers = false;
  }, []);

  const loadBinary = useCallback(async (page: number, replace: boolean) => {
    if (loadingRefs.current.binary) return;
    loadingRefs.current.binary = true;
    setBinary((s) => ({ ...s, loading: true }));
    const result = await financeService.getBinaryHistory(page, PER_PAGE);
    if (!('error' in result)) {
      const items = result.data.items.map((item: BinaryBonusItem) => ({
        id: item.id.toString(),
        date: item.post_date,
        amount: item.amount,
        leftQV: item.left_vol,
        rightQV: item.right_vol,
      }));
      const total: number = (result.data as any).total ?? 0;
      const loaded = replace ? items.length : (page - 1) * PER_PAGE + items.length;
      if (replace) setBinaryData(items); else setBinaryData((p) => [...p, ...items]);
      setBinary({ page, hasMore: loaded < total, loading: false, initialized: true });
    } else {
      setBinary((s) => ({ ...s, loading: false, initialized: true }));
    }
    loadingRefs.current.binary = false;
  }, []);

  const loadBbs = useCallback(async (page: number, replace: boolean) => {
    if (loadingRefs.current.bbs) return;
    loadingRefs.current.bbs = true;
    setBbs((s) => ({ ...s, loading: true }));
    const result = await financeService.getBbsHistory(page, PER_PAGE);
    if (!('error' in result)) {
      const items = result.data.items;
      const total: number = (result.data as any).total ?? 0;
      const loaded = replace ? items.length : (page - 1) * PER_PAGE + items.length;
      if (replace) setBbsData(items); else setBbsData((p) => [...p, ...items]);
      setBbs({ page, hasMore: loaded < total, loading: false, initialized: true });
    } else {
      setBbs((s) => ({ ...s, loading: false, initialized: true }));
    }
    loadingRefs.current.bbs = false;
  }, []);

  const loadPassive = useCallback(async (page: number, replace: boolean) => {
    if (loadingRefs.current.passive) return;
    loadingRefs.current.passive = true;
    setPassive((s) => ({ ...s, loading: true }));
    const result = await financeService.getPassiveHistory(page, PER_PAGE);
    if (!('error' in result)) {
      const items = result.data.items;
      const total: number = result.data.total ?? 0;
      const loaded = replace ? items.length : (page - 1) * PER_PAGE + items.length;
      if (replace) setPassiveData(items); else setPassiveData((p) => [...p, ...items]);
      setPassive({ page, hasMore: loaded < total, loading: false, initialized: true });
    } else {
      setPassive((s) => ({ ...s, loading: false, initialized: true }));
    }
    loadingRefs.current.passive = false;
  }, []);

  const loadUpline = useCallback(async (page: number, replace: boolean) => {
    if (loadingRefs.current.upline) return;
    loadingRefs.current.upline = true;
    setUpline((s) => ({ ...s, loading: true }));
    const result = await financeService.getUplineHistory(page, PER_PAGE);
    if (!('error' in result)) {
      const items = result.data.items;
      const total: number = (result.data as any).total ?? 0;
      const loaded = replace ? items.length : (page - 1) * PER_PAGE + items.length;
      if (replace) setUplineData(items); else setUplineData((p) => [...p, ...items]);
      setUpline({ page, hasMore: loaded < total, loading: false, initialized: true });
    } else {
      setUpline((s) => ({ ...s, loading: false, initialized: true }));
    }
    loadingRefs.current.upline = false;
  }, []);

  // Lazy load when tab becomes active
  useEffect(() => {
    if ((activeTab === 'referral' || activeTab === 'cashback') && !transfers.initialized) {
      loadTransfers(1, true);
    } else if (activeTab === 'binary' && !binary.initialized) {
      loadBinary(1, true);
    } else if (activeTab === 'bbs' && !bbs.initialized) {
      loadBbs(1, true);
    } else if (activeTab === 'passive' && !passive.initialized) {
      loadPassive(1, true);
    } else if (activeTab === 'upline' && !upline.initialized) {
      loadUpline(1, true);
    }
  }, [activeTab, transfers.initialized, binary.initialized, bbs.initialized, passive.initialized, upline.initialized]);

  // Reset + reload all
  const resetAll = useCallback(async () => {
    setTransfers(initState());
    setBinary(initState());
    setBbs(initState());
    setPassive(initState());
    setUpline(initState());
    setReferralData([]);
    setBinaryData([]);
    setCashbackData([]);
    setBbsData([]);
    setPassiveData([]);
    setUplineData([]);
    // Only reload currently visible tab
    if (activeTab === 'referral' || activeTab === 'cashback') await loadTransfers(1, true);
    else if (activeTab === 'binary') await loadBinary(1, true);
    else if (activeTab === 'bbs') await loadBbs(1, true);
    else if (activeTab === 'passive') await loadPassive(1, true);
    else if (activeTab === 'upline') await loadUpline(1, true);
  }, [activeTab, loadTransfers, loadBinary, loadBbs, loadPassive, loadUpline]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await resetAll();
    setRefreshing(false);
  }, [resetAll]);

  // "Load More" per tab
  const handleLoadMore = useCallback(() => {
    if (activeTab === 'referral' || activeTab === 'cashback') {
      if (!transfers.hasMore || transfers.loading) return;
      loadTransfers(transfers.page + 1, false);
    } else if (activeTab === 'binary') {
      if (!binary.hasMore || binary.loading) return;
      loadBinary(binary.page + 1, false);
    } else if (activeTab === 'bbs') {
      if (!bbs.hasMore || bbs.loading) return;
      loadBbs(bbs.page + 1, false);
    } else if (activeTab === 'passive') {
      if (!passive.hasMore || passive.loading) return;
      loadPassive(passive.page + 1, false);
    } else if (activeTab === 'upline') {
      if (!upline.hasMore || upline.loading) return;
      loadUpline(upline.page + 1, false);
    }
  }, [activeTab, transfers, binary, bbs, passive, upline, loadTransfers, loadBinary, loadBbs, loadPassive, loadUpline]);

  const currentHasMore = () => {
    if (activeTab === 'referral' || activeTab === 'cashback') return transfers.hasMore;
    if (activeTab === 'binary') return binary.hasMore;
    if (activeTab === 'bbs') return bbs.hasMore;
    if (activeTab === 'passive') return passive.hasMore;
    if (activeTab === 'upline') return upline.hasMore;
    return false;
  };

  const currentLoading = () => {
    if (activeTab === 'referral' || activeTab === 'cashback') return transfers.loading;
    if (activeTab === 'binary') return binary.loading;
    if (activeTab === 'bbs') return bbs.loading;
    if (activeTab === 'passive') return passive.loading;
    if (activeTab === 'upline') return upline.loading;
    return false;
  };

  const currentInitialized = () => {
    if (activeTab === 'referral' || activeTab === 'cashback') return transfers.initialized;
    if (activeTab === 'binary') return binary.initialized;
    if (activeTab === 'bbs') return bbs.initialized;
    if (activeTab === 'passive') return passive.initialized;
    if (activeTab === 'upline') return upline.initialized;
    return false;
  };

  // ——————————————————————————————————————————
  // Render helpers
  // ——————————————————————————————————————————

  const renderReferralItem = ({ item }: { item: ReferralItem }) => (
    <GradientCard style={{ marginBottom: theme.spacing[2] }} padding={theme.spacing[3]}>
      <View style={styles.reportRow}>
        <View style={[styles.reportIcon, { backgroundColor: `${theme.semantic.success}20`, borderRadius: theme.borderRadius.full, padding: theme.spacing[2] }]}>
          <Users size={20} color={theme.semantic.success} />
        </View>
        <View style={{ flex: 1, marginLeft: theme.spacing[3] }}>
          <Text style={{ fontFamily: theme.fonts.semibold, fontSize: theme.fontSizes.sm, color: theme.colors.foreground }}>{item.from}</Text>
          <View style={styles.reportMeta}>
            <Text style={{ fontFamily: theme.fonts.regular, fontSize: theme.fontSizes.xs, color: theme.colors.mutedForeground }}>
              {new Date(item.date).toLocaleDateString('ru-RU')}
            </Text>
            <StatusBadge label={`${item.level} ${t.reports.line}`} variant="gold" size="sm" style={{ marginLeft: theme.spacing[2] }} />
          </View>
        </View>
        <Text style={{ fontFamily: theme.fonts.bold, fontSize: theme.fontSizes.sm, color: theme.semantic.success }}>
          +{item.amount.toLocaleString('ru-KZ')} ₸
        </Text>
      </View>
    </GradientCard>
  );

  const renderBinaryItem = ({ item }: { item: BinaryItem }) => (
    <GradientCard style={{ marginBottom: theme.spacing[2] }} padding={theme.spacing[3]}>
      <View style={styles.reportRow}>
        <View style={[styles.reportIcon, { backgroundColor: `${theme.semantic.info}20`, borderRadius: theme.borderRadius.full, padding: theme.spacing[2] }]}>
          <Gift size={20} color={theme.semantic.info} />
        </View>
        <View style={{ flex: 1, marginLeft: theme.spacing[3] }}>
          <Text style={{ fontFamily: theme.fonts.semibold, fontSize: theme.fontSizes.sm, color: theme.colors.foreground }}>{t.reports.binaryBonus}</Text>
          <Text style={{ fontFamily: theme.fonts.regular, fontSize: theme.fontSizes.xs, color: theme.colors.mutedForeground, marginTop: 2 }}>
            {new Date(item.date).toLocaleDateString('ru-RU')}
          </Text>
          <Text style={{ fontFamily: theme.fonts.regular, fontSize: 10, color: theme.colors.mutedForeground, marginTop: theme.spacing[1] }}>
            {t.reports.leftLeg}: {item.leftQV.toLocaleString('ru-KZ')} QV · {t.reports.rightLeg}: {item.rightQV.toLocaleString('ru-KZ')} QV
          </Text>
        </View>
        <Text style={{ fontFamily: theme.fonts.bold, fontSize: theme.fontSizes.sm, color: theme.semantic.info }}>
          +{item.amount.toLocaleString('ru-KZ')} ₸
        </Text>
      </View>
    </GradientCard>
  );

  const renderCashbackItem = ({ item }: { item: CashbackItem }) => (
    <GradientCard style={{ marginBottom: theme.spacing[2] }} padding={theme.spacing[3]}>
      <View style={styles.reportRow}>
        <View style={[styles.reportIcon, { backgroundColor: `${theme.semantic.warning}20`, borderRadius: theme.borderRadius.full, padding: theme.spacing[2] }]}>
          <Percent size={20} color={theme.semantic.warning} />
        </View>
        <View style={{ flex: 1, marginLeft: theme.spacing[3] }}>
          <Text style={{ fontFamily: theme.fonts.semibold, fontSize: theme.fontSizes.sm, color: theme.colors.foreground }}>{item.source || t.reports.cashback}</Text>
          <Text style={{ fontFamily: theme.fonts.regular, fontSize: theme.fontSizes.xs, color: theme.colors.mutedForeground, marginTop: 2 }}>
            {new Date(item.date).toLocaleDateString('ru-RU')}
          </Text>
        </View>
        <Text style={{ fontFamily: theme.fonts.bold, fontSize: theme.fontSizes.sm, color: theme.semantic.warning }}>
          +{item.amount.toLocaleString('ru-KZ')} ₸
        </Text>
      </View>
    </GradientCard>
  );

  const renderBbsItem = ({ item }: { item: BbsItem }) => (
    <GradientCard style={{ marginBottom: theme.spacing[2] }} padding={theme.spacing[3]}>
      <View style={styles.reportRow}>
        <View style={[styles.reportIcon, { backgroundColor: `${theme.gold.primary}20`, borderRadius: theme.borderRadius.full, padding: theme.spacing[2] }]}>
          <Zap size={20} color={theme.colors.goldForeground} />
        </View>
        <View style={{ flex: 1, marginLeft: theme.spacing[3] }}>
          <Text style={{ fontFamily: theme.fonts.semibold, fontSize: theme.fontSizes.sm, color: theme.colors.foreground }}>
            BBS бонус · {item.partners} партн.
          </Text>
          <Text style={{ fontFamily: theme.fonts.regular, fontSize: theme.fontSizes.xs, color: theme.colors.mutedForeground, marginTop: 2 }}>
            {new Date(item.post_time).toLocaleDateString('ru-RU')}
          </Text>
        </View>
        <Text style={{ fontFamily: theme.fonts.bold, fontSize: theme.fontSizes.sm, color: theme.colors.goldForeground }}>
          +{item.amount.toLocaleString('ru-KZ')} ₸
        </Text>
      </View>
    </GradientCard>
  );

  const renderPassiveItem = ({ item }: { item: PassiveHistoryItem }) => (
    <GradientCard style={{ marginBottom: theme.spacing[2] }} padding={theme.spacing[3]}>
      <View style={styles.reportRow}>
        <View style={[styles.reportIcon, { backgroundColor: `${theme.semantic.success}20`, borderRadius: theme.borderRadius.full, padding: theme.spacing[2] }]}>
          <Clock size={20} color={theme.semantic.success} />
        </View>
        <View style={{ flex: 1, marginLeft: theme.spacing[3] }}>
          <Text style={{ fontFamily: theme.fonts.semibold, fontSize: theme.fontSizes.sm, color: theme.colors.foreground }}>
            Пассивный кэшбэк · мес. {item.month_no}
          </Text>
          <Text style={{ fontFamily: theme.fonts.regular, fontSize: theme.fontSizes.xs, color: theme.colors.mutedForeground, marginTop: 2 }}>
            {new Date(item.paid_at).toLocaleDateString('ru-RU')}
          </Text>
        </View>
        <Text style={{ fontFamily: theme.fonts.bold, fontSize: theme.fontSizes.sm, color: theme.semantic.success }}>
          +{item.amount.toLocaleString('ru-KZ')} ₸
        </Text>
      </View>
    </GradientCard>
  );

  const renderUplineItem = ({ item }: { item: UplineItem }) => (
    <GradientCard style={{ marginBottom: theme.spacing[2] }} padding={theme.spacing[3]}>
      <View style={styles.reportRow}>
        <View style={[styles.reportIcon, { backgroundColor: `${theme.gold.primary}20`, borderRadius: theme.borderRadius.full, padding: theme.spacing[2] }]}>
          <ArrowDownCircle size={20} color={theme.colors.goldForeground} />
        </View>
        <View style={{ flex: 1, marginLeft: theme.spacing[3] }}>
          <Text style={{ fontFamily: theme.fonts.semibold, fontSize: theme.fontSizes.sm, color: theme.colors.foreground }}>
            {item.sender_login || `ID ${item.sender_id}`}
          </Text>
          <Text style={{ fontFamily: theme.fonts.regular, fontSize: theme.fontSizes.xs, color: theme.colors.mutedForeground, marginTop: 2 }}>
            {item.sender_fio ? `${item.sender_fio} · ` : ''}{new Date(item.post_time).toLocaleDateString('ru-RU')}
          </Text>
        </View>
        <Text style={{ fontFamily: theme.fonts.bold, fontSize: theme.fontSizes.sm, color: theme.colors.goldForeground }}>
          +{item.amount.toLocaleString('ru-KZ')} ₸
        </Text>
      </View>
    </GradientCard>
  );

  const getData = (): any[] => {
    switch (activeTab) {
      case 'referral': return referralData;
      case 'binary':   return binaryData;
      case 'cashback': return cashbackData;
      case 'bbs':      return bbsData;
      case 'passive':  return passiveData;
      case 'upline':   return uplineData;
      default:         return [];
    }
  };

  const getRenderItem = (): any => {
    switch (activeTab) {
      case 'referral': return renderReferralItem;
      case 'binary':   return renderBinaryItem;
      case 'cashback': return renderCashbackItem;
      case 'bbs':      return renderBbsItem;
      case 'passive':  return renderPassiveItem;
      case 'upline':   return renderUplineItem;
      default:         return renderReferralItem;
    }
  };

  const isTabLoading = !currentInitialized() && currentLoading();

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
        <View style={[styles.header, { paddingTop: 60, paddingHorizontal: theme.screenPadding.horizontal, paddingBottom: theme.spacing[4] }]}>
          <TouchableOpacity
            onPress={onBack}
            style={[styles.backButton, { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.full, padding: theme.spacing[2] }]}
          >
            <ArrowLeft size={24} color={theme.colors.foreground} />
          </TouchableOpacity>
          <Text style={{ fontFamily: theme.fonts.displayBold, fontSize: theme.fontSizes.xl, color: theme.colors.foreground, flex: 1, textAlign: 'center' }}>
            {t.reports.title}
          </Text>
          <View style={{ width: 40 }} />
        </View>
      ) : null}

      <View style={{ paddingHorizontal: theme.screenPadding.horizontal }}>
        <Tabs
          tabs={[
            { key: 'referral', label: t.reports.referral },
            { key: 'binary', label: t.reports.binary },
            { key: 'bbs', label: t.reports.bbs },
            { key: 'passive', label: t.reports.passive },
            { key: 'cashback', label: t.reports.cashback },
            { key: 'upline', label: t.reports.upline },
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          style={{ marginBottom: theme.spacing[4] }}
        />
      </View>

      {isTabLoading ? (
        <View style={{ alignItems: 'center', padding: 40 }}>
          <ActivityIndicator size="large" color={theme.colors.goldForeground} />
          <Text style={{ marginTop: 12, color: theme.colors.mutedForeground }}>{t.reports.loading}</Text>
        </View>
      ) : (
        <FlatList
          data={getData()}
          renderItem={getRenderItem()}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={{ paddingHorizontal: theme.screenPadding.horizontal, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.gold.primary} />}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', padding: 40 }}>
              <Text style={{ color: theme.colors.mutedForeground, fontFamily: theme.fonts.medium }}>{t.reports.noData}</Text>
            </View>
          }
          ListFooterComponent={
            currentInitialized() ? (
              <View style={{ paddingVertical: 12, alignItems: 'center' }}>
                {currentLoading() ? (
                  <ActivityIndicator size="small" color={theme.colors.goldForeground} />
                ) : currentHasMore() ? (
                  <TouchableOpacity
                    onPress={handleLoadMore}
                    style={{
                      paddingHorizontal: 24,
                      paddingVertical: 10,
                      borderRadius: theme.borderRadius.lg,
                      borderWidth: 1,
                      borderColor: theme.gold.primary,
                    }}
                  >
                    <Text style={{ color: theme.colors.goldForeground, fontFamily: theme.fonts.medium, fontSize: theme.fontSizes.sm }}>
                      Загрузить ещё
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center' },
  backButton: {},
  reportRow: { flexDirection: 'row', alignItems: 'center' },
  reportIcon: {},
  reportMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
});
