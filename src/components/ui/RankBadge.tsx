import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme';
import { RankIconSvg } from './RankIconSvg';

// Rank definitions (id 0-12), matching backend RANK_NAMES
const RANKS = [
  { id: 0,  name: '',                    color: '#9CA3AF' },
  { id: 1,  name: 'Partner',             color: '#94A3B8' },
  { id: 2,  name: 'Manager',             color: '#64748B' },
  { id: 3,  name: 'Director',            color: '#475569' },
  { id: 4,  name: 'Silver',              color: '#C0C0C0' },
  { id: 5,  name: 'Gold',                color: '#FFD700' },
  { id: 6,  name: 'Diamond',             color: '#B9F2FF' },
  { id: 7,  name: 'President',           color: '#8B5CF6' },
  { id: 8,  name: 'Consul',              color: '#EC4899' },
  { id: 9,  name: 'Silver Consul',       color: '#E2E8F0' },
  { id: 10, name: 'Gold Consul Central', color: '#FDE047' },
  { id: 11, name: 'Diamond Consul',      color: '#67E8F9' },
  { id: 12, name: 'Gold Diamond',        color: '#F59E0B' },
] as const;

// Rank rewards, matching backend RANK_REWARDS
export const RANK_REWARDS: Record<number, string> = {
  1:  '1 товар',
  2:  '3 товара',
  3:  '2 товара + 70 000 ₸',
  4:  '2 товара + 250 000 ₸',
  5:  '600 000 ₸',
  6:  'Путешествие на 1-го',
  7:  'Путешествие на 2-х',
  8:  'Авто с салона',
  9:  '2-комн. квартира',
  10: '120 000 QV бонус',
  11: '300 000 QV бонус',
  12: '350 000 QV бонус',
};

interface RankBadgeProps {
  rank: number;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  style?: ViewStyle;
}

export function RankBadge({ rank, size = 'md', showName = false, style }: RankBadgeProps) {
  const theme = useTheme();
  const rankData = RANKS.find((r) => r.id === rank) || RANKS[0];

  const getDimensions = () => {
    switch (size) {
      case 'sm': return { circle: 24, icon: 13 };
      case 'lg': return { circle: 48, icon: 28 };
      default:   return { circle: 32, icon: 18 };
    }
  };

  const dims = getDimensions();
  const isGold = rank >= 5;

  const iconColorOnBg = isGold ? '#1A1000' : (rank <= 1 || rank === 4 ? '#444444' : '#FFFFFF');

  return (
    <View style={[styles.container, style]}>
      {isGold ? (
        <LinearGradient
          colors={[theme.gold.primary, theme.gold.dark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.badge,
            { width: dims.circle, height: dims.circle, borderRadius: dims.circle / 2 },
          ]}
        >
          <RankIconSvg rank={rank} size={dims.icon} color={iconColorOnBg} />
        </LinearGradient>
      ) : (
        <View
          style={[
            styles.badge,
            {
              width: dims.circle,
              height: dims.circle,
              borderRadius: dims.circle / 2,
              backgroundColor: rankData.color,
            },
          ]}
        >
          <RankIconSvg rank={rank} size={dims.icon} color={iconColorOnBg} />
        </View>
      )}

      {showName && (
        <Text
          style={[
            styles.name,
            {
              fontFamily: theme.fonts.medium,
              fontSize: theme.fontSizes.xs,
              color: theme.colors.mutedForeground,
              marginLeft: theme.spacing[2],
            },
          ]}
        >
          {rankData.name || '—'}
        </Text>
      )}
    </View>
  );
}

export { RANKS };

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {},
});
