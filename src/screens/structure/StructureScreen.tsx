import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import {
  Search,
  Users,
  TrendingUp,
  ChevronRight,
  ChevronDown,
  UserPlus,
  GitBranch,
} from 'lucide-react-native';
import { useTheme } from '@/theme';
import {
  ScreenWrapper,
  GlassInput,
  RankBadge,
  Tabs,
  Avatar,
  MiniStatCard,
} from '@/components/ui';
import { useAuthStore } from '@/store';
import { treeService, TreeNode as TreeNodeType, VolumeResponse, ReferralChild } from '@/api';
import { useT } from '@/i18n';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const EXPAND_ANIMATION = {
  duration: 220,
  create: { type: 'easeInEaseOut', property: 'opacity' },
  update: { type: 'easeInEaseOut' },
  delete: { type: 'easeInEaseOut', property: 'opacity' },
};

// ─── Skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRow({ theme }: { theme: ReturnType<typeof useTheme> }) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 650 }),
        withTiming(0.3, { duration: 650 }),
      ),
      -1,
      false,
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        animStyle,
        {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 12,
          paddingHorizontal: 16,
          gap: 10,
        },
      ]}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: theme.colors.muted,
        }}
      />
      <View style={{ flex: 1, gap: 6 }}>
        <View
          style={{
            height: 13,
            borderRadius: 7,
            backgroundColor: theme.colors.muted,
            width: '55%',
          }}
        />
        <View
          style={{
            height: 10,
            borderRadius: 5,
            backgroundColor: theme.colors.muted,
            width: '35%',
          }}
        />
      </View>
      <View
        style={{
          width: 50,
          height: 20,
          borderRadius: 10,
          backgroundColor: theme.colors.muted,
        }}
      />
    </Animated.View>
  );
}

function StructureSkeleton({ theme }: { theme: ReturnType<typeof useTheme> }) {
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius['2xl'],
        overflow: 'hidden',
        marginBottom: theme.spacing[6],
      }}
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <SkeletonRow key={i} theme={theme} />
      ))}
    </View>
  );
}

// ─── Empty binary tree slot ───────────────────────────────────────────────────

interface EmptySlotProps {
  theme: ReturnType<typeof useTheme>;
  onPress?: () => void;
}

function EmptySlot({ theme, onPress }: EmptySlotProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={[
        styles.emptyNode,
        {
          borderColor: `${theme.colors.border}80`,
          borderRadius: theme.borderRadius.full,
        },
      ]}
    >
      <UserPlus size={20} color={theme.colors.mutedForeground} strokeWidth={1.5} />
    </TouchableOpacity>
  );
}

// ─── Zoomable tree wrapper ────────────────────────────────────────────────────

function ZoomableTree({ children }: { children: React.ReactNode }) {
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedScale = useSharedValue(1);
  const savedTX = useSharedValue(0);
  const savedTY = useSharedValue(0);

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.max(0.4, Math.min(2.5, savedScale.value * e.scale));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const pan = Gesture.Pan()
    .minDistance(8)
    .onUpdate((e) => {
      translateX.value = savedTX.value + e.translationX;
      translateY.value = savedTY.value + e.translationY;
    })
    .onEnd(() => {
      savedTX.value = translateX.value;
      savedTY.value = translateY.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      scale.value = withSpring(1, { damping: 15 });
      translateX.value = withSpring(0, { damping: 15 });
      translateY.value = withSpring(0, { damping: 15 });
      savedScale.value = 1;
      savedTX.value = 0;
      savedTY.value = 0;
    });

  const composed = Gesture.Race(doubleTap, Gesture.Simultaneous(pinch, pan));

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={composed}>
      <View style={styles.zoomContainer}>
        <Animated.View style={[animStyle, { padding: 20 }]}>
          {children}
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

// ─── Binary tree node ─────────────────────────────────────────────────────────

interface DisplayTreeNode {
  id: string;
  name: string;
  rank: number;
  qv: number;
  left: DisplayTreeNode | null;
  right: DisplayTreeNode | null;
}

const transformTreeNode = (node: TreeNodeType | null): DisplayTreeNode | null => {
  if (!node) return null;
  return {
    id: String(node.id ?? node.user_id ?? 0),
    name: node.user?.fio || node.user?.login || `ID ${node.user_id}`,
    rank: node.user?.rang || 0,
    qv: node.amount_qv || 0,
    left: transformTreeNode(node.left),
    right: transformTreeNode(node.right),
  };
};

interface TreeNodeComponentProps {
  node: DisplayTreeNode;
  theme: ReturnType<typeof useTheme>;
  expanded: Set<string>;
  toggleExpanded: (id: string) => void;
}

function TreeNodeComponent({ node, theme, expanded, toggleExpanded }: TreeNodeComponentProps) {
  const hasChildren = node.left || node.right;
  const isExpanded = expanded.has(node.id);

  const handlePress = () => {
    if (!hasChildren) return;
    LayoutAnimation.configureNext(EXPAND_ANIMATION);
    toggleExpanded(node.id);
  };

  return (
    <View style={styles.treeNodeContainer}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={hasChildren ? 0.7 : 1}
        style={[
          styles.treeNode,
          {
            backgroundColor: theme.colors.card,
            borderRadius: theme.borderRadius.xl,
            borderWidth: 1.5,
            borderColor: hasChildren
              ? `${theme.gold.primary}50`
              : theme.colors.border,
            padding: theme.spacing[3],
            minWidth: 110,
            minHeight: 44,
          },
          theme.shadows.md,
        ]}
      >
        <Avatar name={node.name} size="sm" showBorder={false} />
        <Text
          style={{
            fontFamily: theme.fonts.semibold,
            fontSize: theme.fontSizes.xs,
            color: theme.colors.foreground,
            marginTop: theme.spacing[1],
            textAlign: 'center',
          }}
          numberOfLines={1}
        >
          {node.name}
        </Text>
        <RankBadge rank={node.rank} size="sm" style={{ marginTop: 4 }} />
        <Text
          style={{
            fontFamily: theme.fonts.regular,
            fontSize: 10,
            color: theme.colors.mutedForeground,
            marginTop: 2,
          }}
        >
          {(node.qv ?? 0).toLocaleString()} QV
        </Text>
        {hasChildren && (
          <ChevronDown
            size={12}
            color={theme.colors.mutedForeground}
            style={{
              marginTop: 4,
              transform: [{ rotate: isExpanded ? '180deg' : '0deg' }],
            }}
          />
        )}
      </TouchableOpacity>

      {hasChildren && isExpanded && (
        <View style={styles.childrenContainer}>
          <View
            style={[
              styles.connectorVertical,
              { backgroundColor: `${theme.gold.primary}40` },
            ]}
          />
          <View style={styles.childrenRow}>
            {node.left ? (
              <TreeNodeComponent
                node={node.left}
                theme={theme}
                expanded={expanded}
                toggleExpanded={toggleExpanded}
              />
            ) : (
              <EmptySlot theme={theme} />
            )}
            {node.right ? (
              <TreeNodeComponent
                node={node.right}
                theme={theme}
                expanded={expanded}
                toggleExpanded={toggleExpanded}
              />
            ) : (
              <EmptySlot theme={theme} />
            )}
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Referral / linear node ───────────────────────────────────────────────────

interface ReferralNodeProps {
  node: ReferralChild;
  theme: ReturnType<typeof useTheme>;
  depth?: number;
}

function ReferralNode({ node, theme, depth = 0 }: ReferralNodeProps) {
  const [expanded, setExpanded] = useState(false);
  const [children, setChildren] = useState<ReferralChild[] | null>(null);
  const [loading, setLoading] = useState(false);
  const t = useT();

  const rotation = useSharedValue(0);
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const hasChildren = node.children_count > 0;

  // Depth colour: gold → white → muted
  const depthColor =
    depth === 0
      ? theme.gold.primary
      : depth === 1
      ? theme.colors.foreground
      : theme.colors.mutedForeground;

  const toggle = async () => {
    LayoutAnimation.configureNext(EXPAND_ANIMATION);

    if (!expanded && children === null) {
      setLoading(true);
      const res = await treeService.getReferralChildren(node.id);
      setChildren('error' in res ? [] : res.items);
      setLoading(false);
    }

    const next = !expanded;
    rotation.value = withTiming(next ? 90 : 0, {
      duration: 200,
      easing: Easing.out(Easing.quad),
    });
    setExpanded(next);
  };

  return (
    <View>
      <TouchableOpacity
        onPress={hasChildren ? toggle : undefined}
        activeOpacity={hasChildren ? 0.7 : 1}
        style={[
          styles.referralRow,
          {
            paddingVertical: theme.spacing[2],
            paddingHorizontal: theme.spacing[3],
            borderRadius: theme.borderRadius.xl,
            minHeight: 44,
          },
        ]}
      >
        {/* Depth colour strip */}
        <View
          style={{
            width: 3,
            height: 26,
            borderRadius: 2,
            backgroundColor: depthColor,
            opacity: 0.55,
            marginRight: 4,
            flexShrink: 0,
          }}
        />

        {/* Chevron / spinner */}
        <View style={[styles.chevronWrap, { opacity: hasChildren ? 1 : 0.2 }]}>
          {loading ? (
            <ActivityIndicator size="small" color={theme.colors.goldForeground} />
          ) : (
            <Animated.View style={chevronStyle}>
              <ChevronRight
                size={16}
                color={
                  hasChildren
                    ? theme.colors.goldForeground
                    : theme.colors.mutedForeground
                }
              />
            </Animated.View>
          )}
        </View>

        {/* Avatar */}
        <View
          style={[
            styles.avatar,
            {
              backgroundColor:
                depth === 0
                  ? `${theme.gold.primary}25`
                  : theme.colors.muted,
              borderRadius: theme.borderRadius.full,
            },
          ]}
        >
          <Text
            style={{
              fontFamily: theme.fonts.bold,
              fontSize: 12,
              color:
                depth === 0
                  ? theme.colors.goldForeground
                  : theme.colors.mutedForeground,
            }}
          >
            {(node.login || node.fio || '?').charAt(0).toUpperCase()}
          </Text>
        </View>

        {/* Name + login */}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            style={{
              fontFamily: theme.fonts.semibold,
              fontSize: theme.fontSizes.sm,
              color: theme.colors.foreground,
            }}
            numberOfLines={1}
          >
            {node.fio || node.login}
          </Text>
          <Text
            style={{
              fontFamily: theme.fonts.regular,
              fontSize: theme.fontSizes.xs,
              color: theme.colors.mutedForeground,
            }}
          >
            #{node.login}
          </Text>
        </View>

        {/* Badges */}
        <View style={styles.badges}>
          {node.rang > 0 && <RankBadge rank={node.rang} size="sm" />}
          {depth < 2 && (
            <View
              style={{
                backgroundColor:
                  node.type === 1
                    ? `${theme.semantic.success}20`
                    : theme.colors.muted,
                paddingHorizontal: theme.spacing[2],
                paddingVertical: 2,
                borderRadius: theme.borderRadius.full,
              }}
            >
              <Text
                style={{
                  fontFamily: theme.fonts.medium,
                  fontSize: 10,
                  color:
                    node.type === 1
                      ? theme.semantic.success
                      : theme.colors.mutedForeground,
                }}
              >
                {node.type === 1 ? t.structure.leader : t.structure.client}
              </Text>
            </View>
          )}
          {hasChildren && (
            <View
              style={{
                backgroundColor: theme.colors.muted,
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: theme.borderRadius.md,
              }}
            >
              <Text
                style={{
                  fontFamily: theme.fonts.medium,
                  fontSize: 10,
                  color: theme.colors.mutedForeground,
                }}
              >
                {node.children_count}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Children */}
      {expanded && children !== null && (
        <View
          style={{
            paddingLeft: 20,
            marginLeft: 16,
            borderLeftWidth: 1.5,
            borderLeftColor: `${depthColor}35`,
          }}
        >
          {children.length === 0 ? (
            <Text
              style={{
                fontFamily: theme.fonts.regular,
                fontSize: theme.fontSizes.xs,
                color: theme.colors.mutedForeground,
                paddingVertical: theme.spacing[2],
                paddingHorizontal: theme.spacing[3],
              }}
            >
              {t.structure.noPartners}
            </Text>
          ) : (
            children.map((child) => (
              <ReferralNode
                key={child.id}
                node={child}
                theme={theme}
                depth={depth + 1}
              />
            ))
          )}
        </View>
      )}
    </View>
  );
}

// ─── Balance bar ──────────────────────────────────────────────────────────────

interface BalanceBarProps {
  leftVol: number;
  rightVol: number;
  theme: ReturnType<typeof useTheme>;
}

function BalanceBar({ leftVol, rightVol, theme }: BalanceBarProps) {
  const t = useT();
  const total = leftVol + rightVol;
  const leftPct = total > 0 ? leftVol / total : 0.5;
  const weakIsLeft = leftVol <= rightVol;

  const formatVol = (v: number) => {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
    return String(v);
  };

  return (
    <View
      style={{
        backgroundColor: theme.colors.card,
        borderRadius: theme.borderRadius.xl,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.colors.border,
        padding: 14,
        marginBottom: theme.spacing[4],
        gap: 10,
      }}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            backgroundColor: `${theme.gold.primary}18`,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <GitBranch size={14} color={theme.colors.goldForeground} />
        </View>
        <Text
          style={{
            fontFamily: theme.fonts.medium,
            fontSize: theme.fontSizes.sm,
            color: theme.colors.foreground,
          }}
        >
          {t.structure.balance}
        </Text>
      </View>

      {/* Values */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View>
          <Text
            style={{
              fontFamily: theme.fonts.regular,
              fontSize: 10,
              color: theme.colors.mutedForeground,
              marginBottom: 2,
            }}
          >
            {t.structure.leftVol}
          </Text>
          <Text
            style={{
              fontFamily: theme.fonts.bold,
              fontSize: theme.fontSizes.base,
              color: weakIsLeft ? theme.colors.mutedForeground : theme.colors.goldForeground,
            }}
          >
            {formatVol(leftVol)} QV
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text
            style={{
              fontFamily: theme.fonts.regular,
              fontSize: 10,
              color: theme.colors.mutedForeground,
              marginBottom: 2,
            }}
          >
            {t.structure.rightVol}
          </Text>
          <Text
            style={{
              fontFamily: theme.fonts.bold,
              fontSize: theme.fontSizes.base,
              color: !weakIsLeft ? theme.colors.mutedForeground : theme.colors.goldForeground,
            }}
          >
            {formatVol(rightVol)} QV
          </Text>
        </View>
      </View>

      {/* Bar */}
      <View
        style={{
          height: 6,
          borderRadius: 3,
          backgroundColor: theme.colors.muted,
          overflow: 'hidden',
          flexDirection: 'row',
        }}
      >
        <View
          style={{
            width: `${leftPct * 100}%`,
            backgroundColor: weakIsLeft
              ? theme.colors.mutedForeground
              : theme.gold.primary,
            borderRadius: 3,
          }}
        />
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function StructureScreen() {
  const theme = useTheme();
  const t = useT();
  const { user } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('tree');
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['root']));
  const [treeData, setTreeData] = useState<DisplayTreeNode | null>(null);
  const [volumeData, setVolumeData] = useState<VolumeResponse | null>(null);
  const [rootChildren, setRootChildren] = useState<ReferralChild[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const [treeResult, volumeResult, referralResult] = await Promise.all([
        treeService.getTree(user.id, 10),
        treeService.getVolumes(user.id),
        treeService.getReferralChildren(user.id),
      ]);

      if (!('error' in treeResult)) {
        setTreeData(transformTreeNode(treeResult.tree));
      }
      if (!('error' in volumeResult)) {
        setVolumeData(volumeResult.volumes);
      }
      if (!('error' in referralResult)) {
        setRootChildren(referralResult.items);
      } else {
        setRootChildren([]);
      }
    } catch {
      setRootChildren([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setRootChildren(null);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const toggleExpanded = (id: string) => {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpanded(next);
  };

  const formatVolume = (v: number) => {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
    return String(v);
  };

  const totalPartners = volumeData?.total_members ?? 0;
  const totalVolume = volumeData?.total_volume ?? 0;
  const leftVolume = volumeData?.left_volume ?? 0;
  const rightVolume = volumeData?.right_volume ?? 0;

  const filteredChildren = searchQuery.trim()
    ? (rootChildren ?? []).filter((item) => {
        const q = searchQuery.toLowerCase();
        return (
          (item.fio || '').toLowerCase().includes(q) ||
          (item.login || '').toLowerCase().includes(q)
        );
      })
    : rootChildren;

  return (
    <ScreenWrapper
      scrollable
      padded={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.gold.primary}
        />
      }
    >
      <View style={{ paddingHorizontal: theme.screenPadding.horizontal }}>
        {/* Title */}
        <Text
          style={{
            fontFamily: theme.fonts.displayBold,
            fontSize: theme.fontSizes['2xl'],
            color: theme.colors.foreground,
            marginBottom: theme.spacing[4],
            paddingTop: theme.spacing[2],
          }}
        >
          {t.structure.title}
        </Text>

        {/* Search */}
        <GlassInput
          placeholder={t.structure.searchPlaceholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Search size={18} color={theme.colors.mutedForeground} />}
          containerStyle={{ marginBottom: theme.spacing[4] }}
        />

        {/* Stats row */}
        <View
          style={{ flexDirection: 'row', gap: 12, marginBottom: theme.spacing[3] }}
        >
          <MiniStatCard
            icon={<Users size={16} color={theme.colors.goldForeground} />}
            label={t.structure.totalPartners}
            value={String(totalPartners)}
            iconBg={`${theme.gold.primary}18`}
          />
          <MiniStatCard
            icon={<TrendingUp size={16} color={theme.semantic.success} />}
            label={t.structure.totalVolume}
            value={`${formatVolume(totalVolume)} QV`}
            iconBg={`${theme.semantic.success}18`}
          />
        </View>

        {/* Balance bar — only when we have volume data */}
        {volumeData && (leftVolume > 0 || rightVolume > 0) && (
          <BalanceBar
            leftVol={leftVolume}
            rightVol={rightVolume}
            theme={theme}
          />
        )}

        {/* Tabs */}
        <Tabs
          tabs={[
            { key: 'tree', label: t.structure.binaryTree },
            { key: 'linear', label: t.structure.linear },
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          style={{ marginBottom: theme.spacing[4] }}
        />

        {/* Content */}
        {loading ? (
          <StructureSkeleton theme={theme} />
        ) : activeTab === 'tree' ? (
          // ── Binary tree ───────────────────────────────────────────────────────
          <View style={{ marginBottom: theme.spacing[6] }}>
            {treeData ? (
              <ZoomableTree>
                <TreeNodeComponent
                  node={treeData}
                  theme={theme}
                  expanded={expanded}
                  toggleExpanded={toggleExpanded}
                />
              </ZoomableTree>
            ) : (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <Text style={{ color: theme.colors.mutedForeground }}>
                  {t.structure.noData}
                </Text>
              </View>
            )}
          </View>
        ) : (
          // ── Linear / referral ─────────────────────────────────────────────────
          <View
            style={{
              borderWidth: 1,
              borderColor: theme.colors.border,
              borderRadius: theme.borderRadius['2xl'],
              overflow: 'hidden',
              marginBottom: theme.spacing[6],
            }}
          >
            {/* Current user header */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.spacing[3],
                paddingHorizontal: theme.spacing[4],
                paddingVertical: theme.spacing[4],
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.border,
                backgroundColor: `${theme.colors.card}80`,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: `${theme.gold.primary}25`,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1.5,
                  borderColor: `${theme.gold.primary}60`,
                }}
              >
                <Text
                  style={{
                    fontFamily: theme.fonts.bold,
                    fontSize: 14,
                    color: theme.colors.goldForeground,
                  }}
                >
                  {(user?.login || user?.name || '?').charAt(0).toUpperCase()}
                </Text>
              </View>

              <View style={{ flex: 1 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: theme.spacing[2],
                  }}
                >
                  <Text
                    style={{
                      fontFamily: theme.fonts.bold,
                      fontSize: theme.fontSizes.sm,
                      color: theme.colors.foreground,
                    }}
                  >
                    {user?.name || user?.login}
                  </Text>
                  <View
                    style={{
                      backgroundColor: `${theme.gold.primary}25`,
                      paddingHorizontal: theme.spacing[2],
                      paddingVertical: 2,
                      borderRadius: theme.borderRadius.full,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: theme.fonts.medium,
                        fontSize: 10,
                        color: theme.colors.goldForeground,
                      }}
                    >
                      {t.structure.you}
                    </Text>
                  </View>
                </View>
                <Text
                  style={{
                    fontFamily: theme.fonts.regular,
                    fontSize: theme.fontSizes.xs,
                    color: theme.colors.mutedForeground,
                  }}
                >
                  #{user?.login}
                </Text>
              </View>

              {filteredChildren !== null && (
                <Text
                  style={{
                    fontFamily: theme.fonts.regular,
                    fontSize: theme.fontSizes.xs,
                    color: theme.colors.mutedForeground,
                  }}
                >
                  {filteredChildren.length} {t.structure.partners}
                </Text>
              )}
            </View>

            {/* Tree list */}
            <View style={{ padding: theme.spacing[2] }}>
              {filteredChildren === null ? (
                <StructureSkeleton theme={theme} />
              ) : filteredChildren.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 48 }}>
                  <Users
                    size={32}
                    color={theme.colors.mutedForeground}
                    style={{ opacity: 0.3 }}
                  />
                  <Text
                    style={{
                      fontFamily: theme.fonts.regular,
                      fontSize: theme.fontSizes.sm,
                      color: theme.colors.mutedForeground,
                      marginTop: theme.spacing[2],
                    }}
                  >
                    {t.structure.noPartners}
                  </Text>
                </View>
              ) : (
                filteredChildren.map((child) => (
                  <ReferralNode
                    key={child.id}
                    node={child}
                    theme={theme}
                    depth={0}
                  />
                ))
              )}
            </View>
          </View>
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  treeNodeContainer: { alignItems: 'center' },
  treeNode: { alignItems: 'center' },
  connectorVertical: { width: 2, height: 16, marginVertical: 4 },
  childrenContainer: { alignItems: 'center' },
  childrenRow: { flexDirection: 'row', gap: 32 },
  emptyNode: {
    width: 80,
    height: 80,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  referralRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chevronWrap: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatar: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  zoomContainer: {
    minHeight: 280,
    overflow: 'hidden',
    borderRadius: 16,
  },
});
