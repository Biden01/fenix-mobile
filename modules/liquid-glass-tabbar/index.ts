import { requireNativeViewManager } from 'expo-modules-core';
import { ViewProps, Platform } from 'react-native';

export interface TabItem {
  id: string;
  label: string;
  icon: string; // SF Symbol name
}

export interface LiquidGlassTabBarProps extends ViewProps {
  tabs: TabItem[];
  selectedTab: string;
  goldColor?: string;
  onTabPress: (event: { nativeEvent: { tabId: string } }) => void;
}

// Native view only available on iOS
const NativeLiquidGlassTabBar = Platform.OS === 'ios'
  ? requireNativeViewManager('LiquidGlassTabBar')
  : null;

const NativeLiquidGlassView = Platform.OS === 'ios'
  ? requireNativeViewManager('LiquidGlassView')
  : null;

export { NativeLiquidGlassTabBar, NativeLiquidGlassView };

// SF Symbol mapping for common icons
export const SF_SYMBOLS = {
  home: 'house.fill',
  users: 'person.3.fill',
  shop: 'bag.fill',
  wallet: 'creditcard.fill',
  profile: 'person.fill',
  settings: 'gearshape.fill',
  bell: 'bell.fill',
  chart: 'chart.bar.fill',
  search: 'magnifyingglass',
  plus: 'plus',
  heart: 'heart.fill',
  star: 'star.fill',
} as const;

// Check if Liquid Glass is available (iOS 26+)
export const isLiquidGlassAvailable = (): boolean => {
  if (Platform.OS !== 'ios') return false;
  const version = parseInt(Platform.Version as string, 10);
  return version >= 26;
};
