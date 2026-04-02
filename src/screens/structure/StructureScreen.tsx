import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Search, Users, TrendingUp, ChevronRight, ChevronDown } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { ScreenWrapper, GradientCard, GlassInput, RankBadge, Tabs, Avatar } from '@/components/ui';
import { useAuthStore } from '@/store';
import { treeService, TreeNode as TreeNodeType, VolumeResponse, ReferralChild } from '@/api';
import { useT } from '@/i18n';

// ─── Binary tree ─────────────────────────────────────────────────────────────

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
  theme: any;
  expanded: Set<string>;
  toggleExpanded: (id: string) => void;
}

function TreeNodeComponent({ node, theme, expanded, toggleExpanded }: TreeNodeComponentProps) {
  const hasChildren = node.left || node.right;
  const isExpanded = expanded.has(node.id);

  return (
    <View style={styles.treeNodeContainer}>
      <TouchableOpacity
        onPress={() => hasChildren && toggleExpanded(node.id)}
        style={[
          styles.treeNode,
          {
            backgroundColor: theme.colors.card,
            borderRadius: theme.borderRadius.xl,
            borderWidth: 2,
            borderColor: theme.colors.border,
            padding: theme.spacing[3],
            minWidth: 120,
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
      </TouchableOpacity>

      {hasChildren && isExpanded && (
        <View style={styles.childrenContainer}>
          <View style={[styles.connectorLine, { backgroundColor: theme.colors.border }]} />
          <View style={styles.childrenRow}>
            {node.left ? (
              <TreeNodeComponent node={node.left} theme={theme} expanded={expanded} toggleExpanded={toggleExpanded} />
            ) : (
              <View style={[styles.emptyNode, { borderColor: theme.colors.border, borderRadius: theme.borderRadius.full }]}>
                <Text style={{ color: theme.colors.mutedForeground, fontSize: 24 }}>+</Text>
              </View>
            )}
            {node.right ? (
              <TreeNodeComponent node={node.right} theme={theme} expanded={expanded} toggleExpanded={toggleExpanded} />
            ) : (
              <View style={[styles.emptyNode, { borderColor: theme.colors.border, borderRadius: theme.borderRadius.full }]}>
                <Text style={{ color: theme.colors.mutedForeground, fontSize: 24 }}>+</Text>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Linear node (lazy load children on expand, like fenix-web) ──────────────

interface ReferralNodeProps {
  node: ReferralChild;
  theme: any;
  depth?: number;
}

function ReferralNode({ node, theme, depth = 0 }: ReferralNodeProps) {
  const [expanded, setExpanded] = useState(false);
  const [children, setChildren] = useState<ReferralChild[] | null>(null);
  const [loading, setLoading] = useState(false);
  const t = useT();

  const hasChildren = node.children_count > 0;

  const toggle = async () => {
    if (!expanded && children === null) {
      setLoading(true);
      const res = await treeService.getReferralChildren(node.id);
      setChildren('error' in res ? [] : res.items);
      setLoading(false);
    }
    setExpanded((v) => !v);
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
            paddingHorizontal: depth > 1 ? theme.spacing[1] : theme.spacing[3],
            borderRadius: theme.borderRadius.xl,
          },
        ]}
      >
        {/* Chevron / spinner */}
        <View style={[styles.chevronWrap, { opacity: hasChildren ? 1 : 0.2 }]}>
          {loading ? (
            <ActivityIndicator size="small" color={theme.colors.goldForeground} />
          ) : (
            <ChevronRight
              size={16}
              color={hasChildren ? theme.colors.goldForeground : theme.colors.mutedForeground}
              style={{ transform: [{ rotate: expanded ? '90deg' : '0deg' }] }}
            />
          )}
        </View>

        {/* Avatar */}
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: depth === 0
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
              color: depth === 0 ? theme.colors.goldForeground : theme.colors.mutedForeground,
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

        {/* Badges — hide type badge on deep levels to save horizontal space */}
        <View style={styles.badges}>
          {node.rang > 0 && <RankBadge rank={node.rang} size="sm" />}
          {depth < 2 && (
            <View
              style={{
                backgroundColor: node.type === 1
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
                  color: node.type === 1 ? theme.semantic.success : theme.colors.mutedForeground,
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
            marginLeft: 14,
            borderLeftWidth: 1,
            borderLeftColor: `${theme.colors.border}80`,
            paddingLeft: theme.spacing[1],
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
              <ReferralNode key={child.id} node={child} theme={theme} depth={depth + 1} />
            ))
          )}
        </View>
      )}
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

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
    } catch (error) {
      console.error('Error fetching structure data:', error);
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
    const newExpanded = new Set(expanded);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpanded(newExpanded);
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) return `${(volume / 1000000).toFixed(1)}M`;
    if (volume >= 1000) return `${(volume / 1000).toFixed(0)}K`;
    return volume.toString();
  };

  const totalPartners = volumeData?.total_members ?? 0;
  const totalVolume = volumeData?.total_volume ?? 0;

  // Filter for search — flat search over loaded tree snapshot
  const filteredChildren = searchQuery.trim()
    ? (rootChildren ?? []).filter((item) => {
        const q = searchQuery.toLowerCase();
        return (item.fio || '').toLowerCase().includes(q) || (item.login || '').toLowerCase().includes(q);
      })
    : rootChildren;

  return (
    <ScreenWrapper
      scrollable
      padded={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.gold.primary} />
      }
    >
      <View style={{ paddingHorizontal: theme.screenPadding.horizontal }}>
        <Text
          style={{
            fontFamily: theme.fonts.displayBold,
            fontSize: theme.fontSizes['2xl'],
            color: theme.colors.foreground,
            marginBottom: theme.spacing[4],
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

        {/* Stats */}
        <View style={styles.statsRow}>
          <GradientCard style={{ flex: 1, marginRight: theme.spacing[2] }}>
            <View style={styles.statContent}>
              <Users size={18} color={theme.colors.goldForeground} />
              <Text style={{ fontFamily: theme.fonts.regular, fontSize: theme.fontSizes.xs, color: theme.colors.mutedForeground, marginLeft: theme.spacing[2] }}>
                {t.structure.totalPartners}
              </Text>
            </View>
            <Text style={{ fontFamily: theme.fonts.bold, fontSize: theme.fontSizes['2xl'], color: theme.colors.foreground, marginTop: theme.spacing[2] }}>
              {totalPartners}
            </Text>
          </GradientCard>

          <GradientCard style={{ flex: 1, marginLeft: theme.spacing[2] }}>
            <View style={styles.statContent}>
              <TrendingUp size={18} color={theme.semantic.success} />
              <Text style={{ fontFamily: theme.fonts.regular, fontSize: theme.fontSizes.xs, color: theme.colors.mutedForeground, marginLeft: theme.spacing[2] }}>
                {t.structure.totalVolume}
              </Text>
            </View>
            <Text style={{ fontFamily: theme.fonts.bold, fontSize: theme.fontSizes['2xl'], color: theme.colors.foreground, marginTop: theme.spacing[2] }}>
              {formatVolume(totalVolume)}
            </Text>
            <Text style={{ fontFamily: theme.fonts.regular, fontSize: 10, color: theme.colors.mutedForeground }}>QV</Text>
          </GradientCard>
        </View>

        {/* Tabs */}
        <Tabs
          tabs={[
            { key: 'tree', label: t.structure.binaryTree },
            { key: 'linear', label: t.structure.linear },
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          style={{ marginVertical: theme.spacing[4] }}
        />

        {/* Content */}
        {loading ? (
          <View style={{ alignItems: 'center', padding: 40 }}>
            <ActivityIndicator size="large" color={theme.colors.goldForeground} />
            <Text style={{ marginTop: 12, color: theme.colors.mutedForeground }}>{t.structure.loading}</Text>
          </View>
        ) : activeTab === 'tree' ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: theme.spacing[4] }}
          >
            {treeData ? (
              <TreeNodeComponent node={treeData} theme={theme} expanded={expanded} toggleExpanded={toggleExpanded} />
            ) : (
              <View style={{ padding: 20 }}>
                <Text style={{ color: theme.colors.mutedForeground }}>{t.structure.noData}</Text>
              </View>
            )}
          </ScrollView>
        ) : (
          // Linear tab — same approach as fenix-web
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
                }}
              >
                <Text style={{ fontFamily: theme.fonts.bold, fontSize: 14, color: theme.colors.goldForeground }}>
                  {(user?.login || user?.name || '?').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[2] }}>
                  <Text style={{ fontFamily: theme.fonts.bold, fontSize: theme.fontSizes.sm, color: theme.colors.foreground }}>
                    {user?.name || user?.login}
                  </Text>
                  <View style={{ backgroundColor: `${theme.gold.primary}25`, paddingHorizontal: theme.spacing[2], paddingVertical: 2, borderRadius: theme.borderRadius.full }}>
                    <Text style={{ fontFamily: theme.fonts.medium, fontSize: 10, color: theme.colors.goldForeground }}>Вы</Text>
                  </View>
                </View>
                <Text style={{ fontFamily: theme.fonts.regular, fontSize: theme.fontSizes.xs, color: theme.colors.mutedForeground }}>
                  #{user?.login}
                </Text>
              </View>
              {filteredChildren !== null && (
                <Text style={{ fontFamily: theme.fonts.regular, fontSize: theme.fontSizes.xs, color: theme.colors.mutedForeground }}>
                  {filteredChildren.length} {t.structure.partners}
                </Text>
              )}
            </View>

            {/* Tree */}
            <View style={{ padding: theme.spacing[2] }}>
              {filteredChildren === null ? (
                <View style={{ alignItems: 'center', padding: 40 }}>
                  <ActivityIndicator size="large" color={theme.colors.goldForeground} />
                </View>
              ) : filteredChildren.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 48 }}>
                  <Users size={32} color={theme.colors.mutedForeground} style={{ opacity: 0.3 }} />
                  <Text style={{ fontFamily: theme.fonts.regular, fontSize: theme.fontSizes.sm, color: theme.colors.mutedForeground, marginTop: theme.spacing[2] }}>
                    {t.structure.noPartners}
                  </Text>
                </View>
              ) : (
                filteredChildren.map((child) => (
                  <ReferralNode key={child.id} node={child} theme={theme} depth={0} />
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
  statsRow: { flexDirection: 'row' },
  statContent: { flexDirection: 'row', alignItems: 'center' },
  treeNodeContainer: { alignItems: 'center' },
  treeNode: { alignItems: 'center' },
  connectorLine: { width: 2, height: 16, marginVertical: 4 },
  childrenContainer: { alignItems: 'center' },
  childrenRow: { flexDirection: 'row', gap: 32 },
  emptyNode: {
    width: 80,
    height: 80,
    borderWidth: 2,
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
});
