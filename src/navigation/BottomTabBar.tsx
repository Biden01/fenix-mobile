import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Home, Users, ShoppingBag, Wallet, User } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { useT } from '@/i18n';
import { useNotificationStore } from '@/store';

const TAB_ICONS: Record<string, React.ComponentType<any>> = {
  '(home)': Home,
  'structure': Users,
  '(shop)': ShoppingBag,
  '(finance)': Wallet,
  'profile': User,
};

export function BottomTabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const theme = useTheme();
  const t = useT();
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  const TAB_LABELS: Record<string, string> = {
    '(home)': t.tabs.home,
    'structure': t.tabs.structure,
    '(shop)': t.tabs.shop,
    '(finance)': t.tabs.finance,
    'profile': t.tabs.profile,
  };

  return (
    <View
      style={[
        styles.outerContainer,
        { paddingBottom: (insets.bottom || 0) + 10 },
      ]}
    >
      <View
        style={[
          styles.pill,
          {
            // Always use app's dark theme colors (app doesn't support light mode)
            backgroundColor: theme.colors.card + 'E0',
            borderColor: theme.colors.border,
            shadowColor: '#000',
          },
        ]}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const Icon = TAB_ICONS[route.name];
          if (!Icon) return null;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({ type: 'tabLongPress', target: route.key });
          };

          const badgeCount = route.name === '(home)' ? unreadCount : 0;

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarButtonTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tab}
              activeOpacity={0.7}
            >
              {isFocused && (
                <View
                  style={[
                    styles.indicator,
                    { backgroundColor: `${theme.colors.goldForeground}22` },
                  ]}
                />
              )}
              <View style={styles.iconWrapper}>
                <Icon
                  size={20}
                  color={isFocused ? theme.colors.goldForeground : theme.colors.mutedForeground}
                  strokeWidth={isFocused ? 2.5 : 1.8}
                />
                {badgeCount > 0 && (
                  <View style={[styles.badge, { backgroundColor: theme.semantic.error }]}>
                    <Text style={styles.badgeText}>
                      {badgeCount > 99 ? '99+' : String(badgeCount)}
                    </Text>
                  </View>
                )}
              </View>
              <Text
                style={[
                  styles.label,
                  {
                    fontFamily: isFocused ? theme.fonts.semibold : theme.fonts.regular,
                    color: isFocused ? theme.colors.goldForeground : theme.colors.mutedForeground,
                  },
                ]}
              >
                {TAB_LABELS[route.name] || route.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    // Transparent so content shows through the floating pill
    backgroundColor: 'transparent',
  },
  pill: {
    flexDirection: 'row',
    width: '86%',
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
    paddingHorizontal: 6,
    // Shadow
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 22,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    top: 0,
    left: 4,
    right: 4,
    bottom: 0,
    borderRadius: 999,
  },
  label: {
    fontSize: 9,
    marginTop: 2,
    letterSpacing: 0.1,
  },
  iconWrapper: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
  },
});
