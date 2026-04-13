import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
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

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const t = useT();

  const ROUTE_LABELS: Record<string, string> = {
    '(home)': t.tabs.home,
    structure: t.tabs.structure,
    '(shop)': t.tabs.shop,
    '(finance)': t.tabs.finance,
    profile: t.tabs.profile,
  };

  const NativeTabBar = NativeLiquidGlassTabBar as React.ComponentType<any>;

  const nativeTabs: TabItem[] = state.routes.map((route) => ({
    id: route.name,
    label: ROUTE_LABELS[route.name] ?? route.name,
    icon: ROUTE_SF_ICONS[route.name] ?? SF_SYMBOLS.home,
  }));

  return (
    <View style={styles.container} pointerEvents="box-none">
      <NativeTabBar
        style={StyleSheet.absoluteFill}
        tabs={nativeTabs}
        selectedTab={state.routes[state.index].name}
        goldColor="#FFD700"
        onTabPress={(e: { nativeEvent: { tabId: string } }) => {
          const route = state.routes.find((r) => r.name === e.nativeEvent.tabId);
          if (!route) return;
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
});
