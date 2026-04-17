import React from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import {
  Home,
  ShoppingBag,
  User,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { useT } from '@/i18n';
import {
  NativeLiquidGlassTabBar,
  SF_SYMBOLS,
  type TabItem,
} from '../../../modules/liquid-glass-tabbar';

const ROUTE_SF_ICONS: Record<string, string> = {
  '(home)': SF_SYMBOLS.home,
  structure: SF_SYMBOLS.users,
  '(shop)': SF_SYMBOLS.shop,
  '(finance)': SF_SYMBOLS.wallet,
  profile: SF_SYMBOLS.profile,
};

const ROUTE_LUCIDE_ICONS: Record<string, LucideIcon> = {
  '(home)': Home,
  structure: Users,
  '(shop)': ShoppingBag,
  '(finance)': Wallet,
  profile: User,
};

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const theme = useTheme();
  const t = useT();
  const insets = useSafeAreaInsets();

  const ROUTE_LABELS: Record<string, string> = {
    '(home)': t.tabs.home,
    structure: t.tabs.structure,
    '(shop)': t.tabs.shop,
    '(finance)': t.tabs.finance,
    profile: t.tabs.profile,
  };

  const NativeTabBar = NativeLiquidGlassTabBar as React.ComponentType<any>;
  const canUseNativeTabBar = Platform.OS === 'ios' && !!NativeTabBar;

  const nativeTabs: TabItem[] = state.routes.map((route) => ({
    id: route.name,
    label: ROUTE_LABELS[route.name] ?? route.name,
    icon: ROUTE_SF_ICONS[route.name] ?? SF_SYMBOLS.home,
  }));

  const handleTabPress = (routeName: string, routeKey: string, routeParams?: object) => {
    const event = navigation.emit({
      type: 'tabPress',
      target: routeKey,
      canPreventDefault: true,
    });

    if (!event.defaultPrevented) {
      navigation.navigate(routeName, routeParams);
    }
  };

  if (canUseNativeTabBar) {
    return (
      <View
        style={[
          styles.nativeContainer,
          { height: theme.dimensions.tabBarHeight + Math.max(insets.bottom, theme.spacing[2]) },
        ]}
        pointerEvents="box-none"
      >
        <NativeTabBar
          style={StyleSheet.absoluteFill}
          tabs={nativeTabs}
          selectedTab={state.routes[state.index].name}
          goldColor={theme.gold.primary}
          onTabPress={(e: { nativeEvent: { tabId: string } }) => {
            const route = state.routes.find((r) => r.name === e.nativeEvent.tabId);
            if (!route) return;
            handleTabPress(route.name, route.key, route.params);
          }}
        />
      </View>
    );
  }

  const bottomPadding = Math.max(insets.bottom, theme.spacing[2]);

  return (
    <View
      style={[
        styles.fallbackContainer,
        {
          paddingBottom: bottomPadding,
          paddingHorizontal: theme.spacing[3],
        },
      ]}
      pointerEvents="box-none"
    >
      <View
        style={[
          styles.fallbackBar,
          {
            backgroundColor: theme.isDark ? 'rgba(15, 15, 24, 0.96)' : 'rgba(255, 255, 255, 0.96)',
            borderColor: theme.colors.border,
            shadowColor: theme.isDark ? '#000000' : '#3F2D0B',
          },
        ]}
      >
        {state.routes.map((route) => {
          const isFocused = state.routes[state.index]?.key === route.key;
          const Icon = ROUTE_LUCIDE_ICONS[route.name] ?? Home;
          const label =
            ROUTE_LABELS[route.name] ??
            descriptors[route.key]?.options.title ??
            route.name;
          const tintColor = isFocused ? theme.colors.goldForeground : theme.colors.mutedForeground;

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={{ selected: isFocused }}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
              onPress={() => handleTabPress(route.name, route.key, route.params)}
              style={[
                styles.tabButton,
                isFocused && { backgroundColor: theme.colors.goldSurface },
              ]}
            >
              <Icon color={tintColor} size={20} strokeWidth={isFocused ? 2.4 : 2} />
              <Text
                numberOfLines={1}
                style={[
                  styles.tabLabel,
                  {
                    color: tintColor,
                    fontFamily: isFocused ? theme.fonts.semibold : theme.fonts.medium,
                  },
                ]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  nativeContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  fallbackContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  fallbackBar: {
    minHeight: 58,
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 6,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 10,
  },
  tabButton: {
    minHeight: 46,
    flex: 1,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: 4,
    gap: 2,
  },
  tabLabel: {
    fontSize: 11,
  },
});
