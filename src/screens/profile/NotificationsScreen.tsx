import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { Bell, Gift, Users, TrendingUp, ShoppingBag, CheckCheck } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { CompactHeader, GradientCard, SectionHeader } from '@/components/ui';
import { notificationService, NotificationItem } from '@/api';
import { useT } from '@/i18n';
import { useNotificationStore } from '@/store';

const PER_PAGE = 20;

interface DisplayNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
}

type ListItem =
  | { kind: 'header'; label: string }
  | { kind: 'notification'; data: DisplayNotification };

interface NotificationsScreenProps {
  onBack: () => void;
  hideHeader?: boolean;
  isModal?: boolean;
}

export function NotificationsScreen({ onBack, hideHeader, isModal }: NotificationsScreenProps) {
  const theme = useTheme();
  const t = useT();
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);
  const [notifications, setNotifications] = useState<DisplayNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(1);
  const loadingMoreRef = useRef(false);

  const mapItem = (n: NotificationItem): DisplayNotification => ({
    id: n.id.toString(),
    type: n.category || 'system',
    title: n.title,
    message: n.title,
    date: n.post_time,
    read: n.is_read === 1,
  });

  const loadPage = useCallback(async (page: number, replace: boolean) => {
    try {
      const result = await notificationService.getNotifications(page, PER_PAGE);
      if (!('error' in result)) {
        const items = result.data.items.map(mapItem);
        const total: number = result.data.total ?? 0;
        if (replace) {
          setNotifications(items);
          setUnreadCount(items.filter((n) => !n.read).length);
        } else {
          setNotifications((prev) => {
            const existingIds = new Set(prev.map((n) => n.id));
            return [...prev, ...items.filter((n) => !existingIds.has(n.id))];
          });
        }
        const loaded = replace ? items.length : (page - 1) * PER_PAGE + items.length;
        setHasMore(loaded < total);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [setUnreadCount]);

  const initialLoad = useCallback(async () => {
    pageRef.current = 1;
    setLoading(true);
    await loadPage(1, true);
    setLoading(false);
  }, [loadPage]);

  useEffect(() => { initialLoad(); }, [initialLoad]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    pageRef.current = 1;
    setHasMore(true);
    await loadPage(1, true);
    setRefreshing(false);
  }, [loadPage]);

  const onEndReached = useCallback(async () => {
    if (!hasMore || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    const nextPage = pageRef.current + 1;
    pageRef.current = nextPage;
    await loadPage(nextPage, false);
    setLoadingMore(false);
    loadingMoreRef.current = false;
  }, [hasMore, loadPage]);

  const getIconConfig = (type: string) => {
    switch (type) {
      case 'bonus':    return { icon: Gift,        color: theme.semantic.success };
      case 'referral': return { icon: Users,       color: theme.semantic.info };
      case 'rank':     return { icon: TrendingUp,  color: theme.colors.goldForeground };
      case 'order':    return { icon: ShoppingBag, color: theme.semantic.warning };
      default:         return { icon: Bell,        color: theme.colors.mutedForeground };
    }
  };

  const getDateGroup = (dateString: string): string => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return t.notifications.earlier ?? 'Earlier';
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return t.notifications.today ?? 'Today';
    if (diffDays === 1) return t.notifications.yesterday ?? 'Yesterday';
    if (diffDays < 7)  return t.notifications.thisWeek ?? 'This Week';
    return t.notifications.earlier ?? 'Earlier';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (hours < 1)  return t.notifications.justNow;
    if (hours < 24) return `${hours} ${t.notifications.hoursAgo}`;
    if (days < 7)   return `${days} ${t.notifications.daysAgo}`;
    return date.toLocaleDateString('ru-RU');
  };

  // Build grouped list items
  const buildListItems = (): ListItem[] => {
    const groups: { [key: string]: DisplayNotification[] } = {};
    const order: string[] = [];
    for (const n of notifications) {
      const group = getDateGroup(n.date);
      if (!groups[group]) { groups[group] = []; order.push(group); }
      groups[group].push(n);
    }
    const items: ListItem[] = [];
    for (const label of order) {
      items.push({ kind: 'header', label });
      for (const n of groups[label]) items.push({ kind: 'notification', data: n });
    }
    return items;
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const listItems = buildListItems();

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
          title={t.notifications.title}
          paddingBottom={theme.spacing[4]}
          right={unreadCount > 0 ? (
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={async () => {
                await notificationService.markAllRead();
                setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
                setUnreadCount(0);
              }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: `${theme.gold.primary}18`, borderRadius: 99 }}
            >
              <CheckCheck size={14} color={theme.colors.goldForeground} />
              <Text style={{ fontFamily: theme.fonts.medium, fontSize: 12, color: theme.colors.goldForeground }}>{t.notifications.markAllRead}</Text>
            </TouchableOpacity>
          ) : undefined}
        />
      ) : null}

      {loading ? (
        <View style={{ alignItems: 'center', padding: 40 }}>
          <ActivityIndicator size="large" color={theme.colors.goldForeground} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={{ alignItems: 'center', paddingTop: 80 }}>
          <Bell size={48} color={theme.colors.mutedForeground} style={{ opacity: 0.3, marginBottom: 12 }} />
          <Text style={{ fontFamily: theme.fonts.medium, fontSize: theme.fontSizes.sm, color: theme.colors.mutedForeground }}>{t.notifications.empty}</Text>
        </View>
      ) : (
        <FlatList
          data={listItems}
          keyExtractor={(item) => item.kind === 'header' ? `h-${item.label}` : `n-${item.data.id}`}
          contentContainerStyle={{ paddingHorizontal: theme.screenPadding.horizontal, paddingBottom: theme.dimensions.tabBarHeight + theme.spacing[4] }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.gold.primary} />}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
          ListFooterComponent={loadingMore ? (
            <View style={{ alignItems: 'center', paddingVertical: 16 }}>
              <ActivityIndicator size="small" color={theme.colors.goldForeground} />
            </View>
          ) : null}
          renderItem={({ item, index }) => {
            if (item.kind === 'header') {
              return <SectionHeader title={item.label} />;
            }

            const n = item.data;
            const { icon: Icon, color } = getIconConfig(n.type);

            // Check if this is the last in its group
            const next = listItems[index + 1];
            const isLast = !next || next.kind === 'header';

            return (
              <View style={{ backgroundColor: theme.colors.card, borderRadius: isLast ? undefined : 0, overflow: 'hidden' }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', padding: 14 }}>
                  {/* Unread indicator strip */}
                  {!n.read && (
                    <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: theme.gold.primary, borderRadius: 2 }} />
                  )}
                  {/* Icon */}
                  <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: `${color}18`, alignItems: 'center', justifyContent: 'center', marginLeft: !n.read ? 10 : 0 }}>
                    <Icon size={18} color={color} />
                  </View>
                  {/* Content */}
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ fontFamily: n.read ? theme.fonts.medium : theme.fonts.semibold, fontSize: theme.fontSizes.sm, color: theme.colors.foreground }} numberOfLines={2}>
                      {n.title}
                    </Text>
                    <Text style={{ fontFamily: theme.fonts.regular, fontSize: 11, color: theme.colors.mutedForeground, marginTop: 3 }}>
                      {formatDate(n.date)}
                    </Text>
                  </View>
                  {/* Unread dot */}
                  {!n.read && (
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.gold.primary, marginTop: 6 }} />
                  )}
                </View>
                {!isLast && (
                  <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border, marginLeft: 66 }} />
                )}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
