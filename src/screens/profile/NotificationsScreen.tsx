import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { ArrowLeft, Bell, Gift, Users, TrendingUp, ShoppingBag, CheckCircle } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { GradientCard } from '@/components/ui';
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
          // Update badge from fresh page-1 data
          const newUnread = items.filter((n) => !n.read).length;
          setUnreadCount(newUnread);
        } else {
          setNotifications((prev) => {
            const existingIds = new Set(prev.map((n) => n.id));
            const fresh = items.filter((n) => !existingIds.has(n.id));
            return [...prev, ...fresh];
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

  useEffect(() => {
    initialLoad();
  }, [initialLoad]);

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

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'bonus':
        return { icon: Gift, color: theme.semantic.success };
      case 'referral':
        return { icon: Users, color: theme.semantic.info };
      case 'rank':
        return { icon: TrendingUp, color: theme.colors.goldForeground };
      case 'order':
        return { icon: ShoppingBag, color: theme.semantic.warning };
      default:
        return { icon: Bell, color: theme.colors.mutedForeground };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return t.notifications.justNow;
    if (hours < 24) return `${hours} ${t.notifications.hoursAgo}`;
    if (days < 7) return `${days} ${t.notifications.daysAgo}`;
    return date.toLocaleDateString('ru-RU');
  };

  const renderNotification = ({ item }: { item: DisplayNotification }) => {
    const { icon: Icon, color } = getNotificationIcon(item.type);

    return (
      <GradientCard
        style={{
          marginBottom: theme.spacing[2],
          ...(!item.read && {
            borderWidth: 1,
            borderColor: theme.gold.primary,
          }),
        }}
        padding={theme.spacing[3]}
      >
        <View style={styles.notificationRow}>
          <View
            style={[
              styles.notificationIcon,
              {
                backgroundColor: `${color}20`,
                borderRadius: theme.borderRadius.full,
                padding: theme.spacing[2],
              },
            ]}
          >
            <Icon size={20} color={color} />
          </View>

          <View style={{ flex: 1, marginLeft: theme.spacing[3] }}>
            <View style={styles.notificationHeader}>
              <Text
                style={{
                  fontFamily: item.read ? theme.fonts.medium : theme.fonts.bold,
                  fontSize: theme.fontSizes.sm,
                  color: theme.colors.foreground,
                  flex: 1,
                }}
              >
                {item.title}
              </Text>
              {!item.read && (
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: theme.gold.primary,
                    marginLeft: theme.spacing[2],
                  }}
                />
              )}
            </View>
            <Text
              style={{
                fontFamily: theme.fonts.regular,
                fontSize: theme.fontSizes.xs,
                color: theme.colors.mutedForeground,
                marginTop: 4,
              }}
              numberOfLines={2}
            >
              {item.message}
            </Text>
            <Text
              style={{
                fontFamily: theme.fonts.regular,
                fontSize: 10,
                color: theme.colors.mutedForeground,
                marginTop: theme.spacing[2],
              }}
            >
              {formatDate(item.date)}
            </Text>
          </View>
        </View>
      </GradientCard>
    );
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

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
            style={{
              fontFamily: theme.fonts.displayBold,
              fontSize: theme.fontSizes.xl,
              color: theme.colors.foreground,
              flex: 1,
              textAlign: 'center',
            }}
          >
            {t.notifications.title}
          </Text>
          <View style={{ width: 40 }} />
        </View>
      ) : null}

      {unreadCount > 0 && (
        <View
          style={{
            paddingHorizontal: theme.screenPadding.horizontal,
            marginBottom: theme.spacing[4],
          }}
        >
          <TouchableOpacity
            onPress={async () => {
              await notificationService.markAllRead();
              setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
              setUnreadCount(0);
            }}
            style={[
              styles.markAllRead,
              {
                backgroundColor: theme.gold.light,
                borderRadius: theme.borderRadius.lg,
                padding: theme.spacing[3],
                borderWidth: 1,
                borderColor: `${theme.gold.primary}30`,
              },
            ]}
          >
            <CheckCircle size={18} color={theme.colors.goldForeground} />
            <Text
              style={{
                fontFamily: theme.fonts.medium,
                fontSize: theme.fontSizes.sm,
                color: theme.colors.goldForeground,
                marginLeft: theme.spacing[2],
              }}
            >
              {t.notifications.markAllRead} ({unreadCount})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={{ alignItems: 'center', padding: 40 }}>
          <ActivityIndicator size="large" color={theme.colors.goldForeground} />
          <Text style={{ marginTop: 12, color: theme.colors.mutedForeground }}>
            {t.notifications.loading}
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
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
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                <ActivityIndicator size="small" color={theme.colors.goldForeground} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Bell size={64} color={theme.colors.mutedForeground} />
              <Text
                style={{
                  fontFamily: theme.fonts.medium,
                  fontSize: theme.fontSizes.md,
                  color: theme.colors.mutedForeground,
                  marginTop: theme.spacing[4],
                }}
              >
                {t.notifications.empty}
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
  markAllRead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationIcon: {},
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
});
