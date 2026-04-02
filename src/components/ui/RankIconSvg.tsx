/**
 * Unique SVG icons for each rank 0–12.
 * Uses react-native-svg. Pass `color` and `size` props.
 */
import React from 'react';
import Svg, { Path, Circle, Rect, Line, Ellipse } from 'react-native-svg';

interface Props {
  color?: string;
  size?: number;
}

// Rank 0 — no rank: dashed circle with dash
function Rank0Svg({ color = '#9CA3AF', size = 24 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" strokeDasharray="3.5 2.5" />
      <Line x1="7.5" y1="12" x2="16.5" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// Rank 1 — Partner: 5-point star
function Rank1Svg({ color = '#94A3B8', size = 24 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 2.5L14.3 8.9H21L15.7 12.8L17.9 19.2L12 15.4L6.1 19.2L8.3 12.8L3 8.9H9.7Z"
        fill={color}
        strokeWidth="0.5"
        stroke={color}
      />
    </Svg>
  );
}

// Rank 2 — Manager: 3 ascending bars + trend line
function Rank2Svg({ color = '#64748B', size = 24 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x="2.5" y="14.5" width="5" height="7" rx="1.5" fill={color} />
      <Rect x="9.5" y="9.5" width="5" height="12" rx="1.5" fill={color} />
      <Rect x="16.5" y="4.5" width="5" height="17" rx="1.5" fill={color} />
      <Path
        d="M5 13.5L12 8.5L19 3.5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity={0.45}
        fill="none"
      />
    </Svg>
  );
}

// Rank 3 — Director: medal with ribbon
function Rank3Svg({ color = '#475569', size = 24 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M10.5 2L8 8.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M13.5 2L16 8.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Rect x="9" y="1.5" width="6" height="2.5" rx="1" fill={color} />
      <Circle cx="12" cy="15.5" r="7" fill={color} />
      <Circle cx="12" cy="15.5" r="4.5" stroke="white" strokeWidth="1" opacity={0.5} />
      <Path
        d="M12 12.5l.9 1.9 2.1.3-1.5 1.5.35 2.1L12 17.4l-1.85 1-.35-2.1-1.5-1.5 2.1-.3z"
        fill="white"
        opacity={0.9}
      />
    </Svg>
  );
}

// Rank 4 — Silver: shield with "S" curve
function Rank4Svg({ color = '#C0C0C0', size = 24 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2.5L4.5 6V12.5C4.5 17.2 7.8 21.2 12 22.5C16.2 21.2 19.5 17.2 19.5 12.5V6L12 2.5Z"
        fill={color}
      />
      <Path
        d="M12 5.5L7.5 8V12.5C7.5 15.8 9.5 18.5 12 19.7C14.5 18.5 16.5 15.8 16.5 12.5V8L12 5.5Z"
        fill="white"
        opacity={0.18}
      />
      <Path
        d="M10 10.5C10 9.5 11 9 12 9C13 9 14 9.5 14 10.5C14 11.5 13 12 12 12C11 12 10 12.5 10 13.5C10 14.5 11 15 12 15C13 15 14 14.5 14 13.5"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity={0.75}
      />
    </Svg>
  );
}

// Rank 5 — Gold: crown with 3 spikes + orbs
function Rank5Svg({ color = '#FFD700', size = 24 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x="3" y="18.5" width="18" height="3" rx="1" fill={color} />
      <Path d="M3.5 9.5L7 17.5H17L20.5 9.5L16 12.5L12 3.5L8 12.5L3.5 9.5Z" fill={color} />
      <Circle cx="12" cy="5" r="1.8" fill={color} />
      <Circle cx="4.5" cy="10.5" r="1.5" fill={color} />
      <Circle cx="19.5" cy="10.5" r="1.5" fill={color} />
    </Svg>
  );
}

// Rank 6 — Diamond: gem with facets
function Rank6Svg({ color = '#B9F2FF', size = 24 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M7.5 3H16.5L20 8H4L7.5 3Z" fill={color} opacity={0.8} />
      <Path d="M4 8L12 21.5L20 8H4Z" fill={color} />
      <Path d="M12 8L9.5 8L12 17L14.5 8H12Z" fill="white" opacity={0.2} />
      <Path d="M4 8L9 10" stroke="white" strokeWidth="0.6" opacity={0.4} />
      <Path d="M20 8L15 10" stroke="white" strokeWidth="0.6" opacity={0.4} />
    </Svg>
  );
}

// Rank 7 — President: ornate 5-point crown with 5 orbs
function Rank7Svg({ color = '#8B5CF6', size = 24 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x="2" y="18.5" width="20" height="3" rx="1" fill={color} />
      <Path d="M2 10L5 17.5H19L22 10L18 13L15 5.5L12 9L9 5.5L6 13L2 10Z" fill={color} />
      <Circle cx="12" cy="7.5" r="1.8" fill={color} />
      <Circle cx="7.5" cy="6.5" r="1.3" fill={color} />
      <Circle cx="16.5" cy="6.5" r="1.3" fill={color} />
      <Circle cx="3.5" cy="11" r="1.5" fill={color} />
      <Circle cx="20.5" cy="11" r="1.5" fill={color} />
    </Svg>
  );
}

// Rank 8 — Consul: laurel wreath with dot center
function Rank8Svg({ color = '#EC4899', size = 24 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M8 19C6 17 4.5 14.5 4.5 12C4.5 9.5 6 7 8 5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Ellipse cx="5.5" cy="17.5" rx="2.2" ry="1.1" transform="rotate(-40 5.5 17.5)" fill={color} opacity={0.85} />
      <Ellipse cx="4.8" cy="13.5" rx="2.2" ry="1.1" transform="rotate(-60 4.8 13.5)" fill={color} opacity={0.85} />
      <Ellipse cx="5.5" cy="9.5" rx="2.2" ry="1.1" transform="rotate(-75 5.5 9.5)" fill={color} opacity={0.85} />
      <Path d="M16 19C18 17 19.5 14.5 19.5 12C19.5 9.5 18 7 16 5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Ellipse cx="18.5" cy="17.5" rx="2.2" ry="1.1" transform="rotate(40 18.5 17.5)" fill={color} opacity={0.85} />
      <Ellipse cx="19.2" cy="13.5" rx="2.2" ry="1.1" transform="rotate(60 19.2 13.5)" fill={color} opacity={0.85} />
      <Ellipse cx="18.5" cy="9.5" rx="2.2" ry="1.1" transform="rotate(75 18.5 9.5)" fill={color} opacity={0.85} />
      <Path d="M9 20Q12 22 15 20" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Circle cx="12" cy="12" r="2.8" fill={color} />
      <Circle cx="12" cy="12" r="1.3" fill="white" opacity={0.7} />
    </Svg>
  );
}

// Rank 9 — Silver Consul: laurel wreath with star center
function Rank9Svg({ color = '#E2E8F0', size = 24 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M8 19C6 17 4.5 14.5 4.5 12C4.5 9.5 6 7 8 5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Ellipse cx="5.5" cy="17.5" rx="2.2" ry="1.1" transform="rotate(-40 5.5 17.5)" fill={color} opacity={0.85} />
      <Ellipse cx="4.8" cy="13.5" rx="2.2" ry="1.1" transform="rotate(-60 4.8 13.5)" fill={color} opacity={0.85} />
      <Ellipse cx="5.5" cy="9.5" rx="2.2" ry="1.1" transform="rotate(-75 5.5 9.5)" fill={color} opacity={0.85} />
      <Path d="M16 19C18 17 19.5 14.5 19.5 12C19.5 9.5 18 7 16 5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Ellipse cx="18.5" cy="17.5" rx="2.2" ry="1.1" transform="rotate(40 18.5 17.5)" fill={color} opacity={0.85} />
      <Ellipse cx="19.2" cy="13.5" rx="2.2" ry="1.1" transform="rotate(60 19.2 13.5)" fill={color} opacity={0.85} />
      <Ellipse cx="18.5" cy="9.5" rx="2.2" ry="1.1" transform="rotate(75 18.5 9.5)" fill={color} opacity={0.85} />
      <Path d="M9 20Q12 22 15 20" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Path
        d="M12 9.2L12.8 11.5H15.2L13.3 12.9L14 15.2L12 13.9L10 15.2L10.7 12.9L8.8 11.5H11.2Z"
        fill={color}
      />
    </Svg>
  );
}

// Rank 10 — Gold Consul Central: laurel wreath with sun rays
function Rank10Svg({ color = '#FDE047', size = 24 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M8 19C6 17 4.5 14.5 4.5 12C4.5 9.5 6 7 8 5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Ellipse cx="5.5" cy="17.5" rx="2.2" ry="1.1" transform="rotate(-40 5.5 17.5)" fill={color} opacity={0.85} />
      <Ellipse cx="4.8" cy="13.5" rx="2.2" ry="1.1" transform="rotate(-60 4.8 13.5)" fill={color} opacity={0.85} />
      <Ellipse cx="5.5" cy="9.5" rx="2.2" ry="1.1" transform="rotate(-75 5.5 9.5)" fill={color} opacity={0.85} />
      <Path d="M16 19C18 17 19.5 14.5 19.5 12C19.5 9.5 18 7 16 5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Ellipse cx="18.5" cy="17.5" rx="2.2" ry="1.1" transform="rotate(40 18.5 17.5)" fill={color} opacity={0.85} />
      <Ellipse cx="19.2" cy="13.5" rx="2.2" ry="1.1" transform="rotate(60 19.2 13.5)" fill={color} opacity={0.85} />
      <Ellipse cx="18.5" cy="9.5" rx="2.2" ry="1.1" transform="rotate(75 18.5 9.5)" fill={color} opacity={0.85} />
      <Path d="M9 20Q12 22 15 20" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Circle cx="12" cy="12" r="2.5" fill={color} />
      <Line x1="12" y1="8" x2="12" y2="7" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="12" y1="16" x2="12" y2="17" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="8" y1="12" x2="7" y2="12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="16" y1="12" x2="17" y2="12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="9.17" y1="9.17" x2="8.46" y2="8.46" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
      <Line x1="14.83" y1="14.83" x2="15.54" y2="15.54" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
      <Line x1="14.83" y1="9.17" x2="15.54" y2="8.46" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
      <Line x1="9.17" y1="14.83" x2="8.46" y2="15.54" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    </Svg>
  );
}

// Rank 11 — Diamond Consul: laurel wreath with diamond center
function Rank11Svg({ color = '#67E8F9', size = 24 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M8 19C6 17 4.5 14.5 4.5 12C4.5 9.5 6 7 8 5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Ellipse cx="5.5" cy="17.5" rx="2.2" ry="1.1" transform="rotate(-40 5.5 17.5)" fill={color} opacity={0.85} />
      <Ellipse cx="4.8" cy="13.5" rx="2.2" ry="1.1" transform="rotate(-60 4.8 13.5)" fill={color} opacity={0.85} />
      <Ellipse cx="5.5" cy="9.5" rx="2.2" ry="1.1" transform="rotate(-75 5.5 9.5)" fill={color} opacity={0.85} />
      <Path d="M16 19C18 17 19.5 14.5 19.5 12C19.5 9.5 18 7 16 5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Ellipse cx="18.5" cy="17.5" rx="2.2" ry="1.1" transform="rotate(40 18.5 17.5)" fill={color} opacity={0.85} />
      <Ellipse cx="19.2" cy="13.5" rx="2.2" ry="1.1" transform="rotate(60 19.2 13.5)" fill={color} opacity={0.85} />
      <Ellipse cx="18.5" cy="9.5" rx="2.2" ry="1.1" transform="rotate(75 18.5 9.5)" fill={color} opacity={0.85} />
      <Path d="M9 20Q12 22 15 20" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M12 8.5L14.5 11L12 15.5L9.5 11Z" fill={color} />
      <Path d="M12 8.5L14.5 11H9.5Z" fill="white" opacity={0.25} />
    </Svg>
  );
}

// Rank 12 — Gold Diamond: imperial crown + diamond below
function Rank12Svg({ color = '#F59E0B', size = 24 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="13.5" width="16" height="2.5" rx="1" fill={color} />
      <Path d="M4 13.5L6.5 7.5L10 11.5L12 5.5L14 11.5L17.5 7.5L20 13.5H4Z" fill={color} />
      <Circle cx="12" cy="5" r="1.6" fill={color} />
      <Circle cx="6" cy="7" r="1.3" fill={color} />
      <Circle cx="18" cy="7" r="1.3" fill={color} />
      <Path d="M9 17L12 22.5L15 17H9Z" fill={color} />
      <Path d="M9 17H15L12 18.5L9 17Z" fill="white" opacity={0.3} />
      <Path d="M7 10.5L9 12" stroke="white" strokeWidth="0.7" strokeLinecap="round" opacity={0.5} />
      <Path d="M17 10.5L15 12" stroke="white" strokeWidth="0.7" strokeLinecap="round" opacity={0.5} />
    </Svg>
  );
}

const RANK_SVG_COMPONENTS: Record<number, React.FC<Props>> = {
  0:  Rank0Svg,
  1:  Rank1Svg,
  2:  Rank2Svg,
  3:  Rank3Svg,
  4:  Rank4Svg,
  5:  Rank5Svg,
  6:  Rank6Svg,
  7:  Rank7Svg,
  8:  Rank8Svg,
  9:  Rank9Svg,
  10: Rank10Svg,
  11: Rank11Svg,
  12: Rank12Svg,
};

// Default colors for each rank (used when no color prop is passed)
export const RANK_ICON_COLORS: Record<number, string> = {
  0:  '#9CA3AF',
  1:  '#94A3B8',
  2:  '#64748B',
  3:  '#475569',
  4:  '#C0C0C0',
  5:  '#FFD700',
  6:  '#B9F2FF',
  7:  '#8B5CF6',
  8:  '#EC4899',
  9:  '#E2E8F0',
  10: '#FDE047',
  11: '#67E8F9',
  12: '#F59E0B',
};

export interface RankIconSvgProps {
  rank: number;
  size?: number;
  /** Override icon color. If omitted uses default rank color. */
  color?: string;
}

/** Renders the unique SVG icon for a given rank (0–12). */
export function RankIconSvg({ rank, size = 24, color }: RankIconSvgProps) {
  const Component = RANK_SVG_COMPONENTS[rank] ?? Rank0Svg;
  const iconColor = color ?? RANK_ICON_COLORS[rank] ?? '#9CA3AF';
  return <Component color={iconColor} size={size} />;
}
