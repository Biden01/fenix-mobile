import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { Users, Gift, Percent, Zap, Clock, ArrowDownCircle } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { CompactHeader, GradientCard, GlassSegmentedPicker } from '@/components/ui';
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
            from: item.user_login || t.finance.system,
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

  // Infinite scroll — called when end reached
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

  const renderRow = (iconEl: React.ReactNode, title: string, subtitle: string, amount: string, amountColor: string) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14 }}>
      {iconEl}
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={{ fontFamily: theme.fonts.semibold, fontSize: theme.fontSizes.sm, color: theme.colors.foreground }} numberOfLines={1}>{title}</Text>
        <Text style={{ fontSize: 11, color: theme.colors.mutedForeground, marginTop: 2 }}>{subtitle}</Text>
      </View>
      <Text style={{ fontFamily: theme.fonts.bold, fontSize: theme.fontSizes.sm, color: amountColor }}>+{amount} ₸</Text>
    </View>
  );

  const iconWrap = (color: string, Icon: any) => (
    <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: `${color}18`, alignItems: 'center', justifyContent: 'center' }}>
      <Icon size={18} color={color} />
    </View>
  );

  const renderReferralItem = ({ item }: { item: ReferralItem }) =>
    renderRow(iconWrap(theme.semantic.success, Users), item.from, `${new Date(item.date).toLocaleDateString('ru-RU')} · ${t.reports.line} ${item.level}`, item.amount.toLocaleString('ru-KZ'), theme.semantic.success);

  const renderBinaryItem = ({ item }: { item: BinaryItem }) =>
    renderRow(iconWrap(theme.semantic.info, Gift), t.reports.binaryBonus, `${new Date(item.date).toLocaleDateString('ru-RU')} · L: ${item.leftQV.toLocaleString('ru-KZ')} R: ${item.rightQV.toLocaleString('ru-KZ')} QV`, item.amount.toLocaleString('ru-KZ'), theme.semantic.info);

  const renderCashbackItem = ({ item }: { item: CashbackItem }) =>
    renderRow(iconWrap(theme.semantic.warning, Percent), item.source || t.reports.cashback, new Date(item.date).toLocaleDateString('ru-RU'), item.amount.toLocaleString('ru-KZ'), theme.semantic.warning);

  const renderBbsItem = ({ item }: { item: BbsItem }) =>
    renderRow(iconWrap(theme.colors.goldForeground, Zap), `${t.reports.bbsBonus} · ${item.partners} ${t.reports.partnersAbbr}`, new Date(item.post_time).toLocaleDateString('ru-RU'), item.amount.toLocaleString('ru-KZ'), theme.colors.goldForeground);

  const renderPassiveItem = ({ item }: { item: PassiveHistoryItem }) =>
    renderRow(iconWrap(theme.semantic.success, Clock), `${t.reports.passiveCashbackMonth} ${item.month_no}`, new Date(item.paid_at).toLocaleDateString('ru-RU'), item.amount.toLocaleString('ru-KZ'), theme.semantic.success);

  const renderUplineItem = ({ item }: { item: UplineItem }) =>
    renderRow(iconWrap(theme.colors.goldForeground, ArrowDownCircle), item.sender_login || `ID ${item.sender_id}`, `${item.sender_fio ? `${item.sender_fio} · ` : ''}${new Date(item.post_time).toLocaleDateString('ru-RU')}`, item.amount.toLocaleString('ru-KZ'), theme.colors.goldForeground);

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
        <CompactHeader onBack={onBack} title={t.reports.title} paddingBottom={theme.spacing[4]} />
      ) : null}

      <View style={{ paddingHorizontal: theme.screenPadding.horizontal, marginBottom: theme.spacing[4] }}>
        <GlassSegmentedPicker
          items={[
            { id: 'referral', label: t.reports.referral },
            { id: 'binary', label: t.reports.binary },
            { id: 'bbs', label: t.reports.bbs },
            { id: 'passive', label: t.reports.passive },
            { id: 'cashback', label: t.reports.cashback },
            { id: 'upline', label: t.reports.upline },
          ]}
          selectedId={activeTab}
          onSelect={setActiveTab}
          tint="#FFD700"
        />
      </View>

      {isTabLoading ? (
        <View style={{ alignItems: 'center', padding: 40 }}>
          <ActivityIndicator size="large" color={theme.colors.goldForeground} />
        </View>
      ) : (
        <FlatList
          data={getData()}
          renderItem={getRenderItem()}
          keyExtractor={(item: any) => item.id ?? item.post_time ?? Math.random().toString()}
          contentContainerStyle={{ paddingHorizontal: theme.screenPadding.horizontal, paddingBottom: theme.dimensions.tabBarHeight + theme.spacing[4] }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.gold.primary} />}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ItemSeparatorComponent={() => (
            <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border, marginLeft: 66 }} />
          )}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', padding: 40 }}>
              <Text style={{ color: theme.colors.mutedForeground, fontFamily: theme.fonts.medium }}>{t.reports.noData}</Text>
            </View>
          }
          ListFooterComponent={currentLoading() ? (
            <View style={{ alignItems: 'center', paddingVertical: 16 }}>
              <ActivityIndicator size="small" color={theme.colors.goldForeground} />
            </View>
          ) : null}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  reportRow: { flexDirection: 'row', alignItems: 'center' },
  reportIcon: {},
  reportMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
});
