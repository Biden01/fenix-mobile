import { requireNativeViewManager } from 'expo-modules-core';
import { ViewProps, Platform } from 'react-native';

// MARK: - Tab Bar

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

// MARK: - Glass Button

export interface GlassButtonNativeProps extends ViewProps {
  label: string;
  icon?: string;
  tint?: string;
  onButtonPress: (event: { nativeEvent: Record<string, never> }) => void;
}

// MARK: - Glass Card (background surface для карточек)

export interface GlassCardNativeProps extends ViewProps {
  cornerRadius?: number;
  tint?: string;
}

// MARK: - Glass Segmented Picker

export interface PickerItemData {
  id: string;
  label: string;
}

export interface GlassSegmentedPickerNativeProps extends ViewProps {
  items: PickerItemData[];
  selectedId: string;
  tint?: string;
  onSelect: (event: { nativeEvent: { id: string } }) => void;
}

// MARK: - Native view managers (iOS only)

function loadNativeView(name: string) {
  if (Platform.OS !== 'ios') return null;
  try {
    const v = requireNativeViewManager(name);
    console.log(`[LiquidGlass] ✅ ${name} loaded`);
    return v;
  } catch (e) {
    console.warn(`[LiquidGlass] ❌ ${name} not available:`, e);
    return null;
  }
}

const NativeLiquidGlassTabBar = loadNativeView('LiquidGlassTabBar');
const NativeLiquidGlassView    = loadNativeView('LiquidGlassView');
const NativeGlassButton        = loadNativeView('GlassButton');
const NativeGlassCard          = loadNativeView('GlassCard');
const NativeGlassSegmentedPicker = loadNativeView('GlassSegmentedPicker');

export {
  NativeLiquidGlassTabBar,
  NativeLiquidGlassView,
  NativeGlassButton,
  NativeGlassCard,
  NativeGlassSegmentedPicker,
};

// MARK: - SF Symbol mapping

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
  trophy: 'trophy.fill',
  medal: 'medal.fill',
  percent: 'percent',
  arrowUp: 'arrow.up.right',
  people: 'person.2.fill',
} as const;

// MARK: - iOS 26 detection

export const isLiquidGlassAvailable = (): boolean => {
  if (Platform.OS !== 'ios') return false;
  const version = parseInt(Platform.Version as string, 10);
  return version >= 26;
};
