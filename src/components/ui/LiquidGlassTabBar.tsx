import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import {
  NativeLiquidGlassTabBar,
  SF_SYMBOLS,
  isLiquidGlassAvailable,
  type TabItem,
} from '../../../modules/liquid-glass-tabbar';
import { BottomTabBar as FallbackTabBar } from '@/navigation/BottomTabBar';
import { useT } from '@/i18n';

// Map route names to SF Symbols
const ROUTE_ICONS: Record<string, string> = {
  '(home)': SF_SYMBOLS.home,
  'structure': SF_SYMBOLS.users,
  '(shop)': SF_SYMBOLS.shop,
  '(finance)': SF_SYMBOLS.wallet,
  'profile': SF_SYMBOLS.profile,
};

export function LiquidGlassTabBarWrapper(props: BottomTabBarProps) {
  const { state, navigation, descriptors, insets } = props;
  const t = useT();

  const ROUTE_LABELS: Record<string, string> = {
    '(home)': t.tabs.home,
    'structure': t.tabs.structure,
    '(shop)': t.tabs.shop,
    '(finance)': t.tabs.finance,
    'profile': t.tabs.profile,
  };

  const useNative = Platform.OS === 'ios' && !!NativeLiquidGlassTabBar;
  if (!useNative) {
    return <FallbackTabBar state={state} navigation={navigation} descriptors={descriptors} insets={insets} />;
  }

  const NativeTabBar = NativeLiquidGlassTabBar as React.ComponentType<any>;

  const tabs: TabItem[] = state.routes.map((route) => ({
    id: route.name,
    label: ROUTE_LABELS[route.name] || route.name,
    icon: ROUTE_ICONS[route.name] || SF_SYMBOLS.home,
  }));

  const selectedTab = state.routes[state.index].name;

  const handleTabPress = (event: { nativeEvent: { tabId: string } }) => {
    const tabId = event.nativeEvent.tabId;
    const route = state.routes.find((r) => r.name === tabId);

    if (route) {
      const tabPressEvent = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });

      if (!tabPressEvent.defaultPrevented) {
        navigation.navigate(route.name, route.params);
      }
    }
  };

  return (
    <View style={styles.container}>
      <NativeTabBar
        style={styles.tabBar}
        tabs={tabs}
        selectedTab={selectedTab}
        goldColor="#FFD700"
        onTabPress={handleTabPress}
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
  },
  tabBar: {
    // Pill content (~54pt) + safe area (up to 34pt) + float gap (10pt) = 98pt
    height: 100,
  },
});

export default LiquidGlassTabBarWrapper;
