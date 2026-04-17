import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Gift, Ticket } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { CompactHeader, ScreenWrapper, GradientCard } from '@/components/ui';
import { authService, KonkursInfo } from '@/api';
import { useT } from '@/i18n';

interface KonkursScreenProps {
  onBack: () => void;
  hideHeader?: boolean;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function KonkursScreen({ onBack, hideHeader }: KonkursScreenProps) {
  const theme = useTheme();
  const t = useT();
  const [info, setInfo] = useState<KonkursInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    const result = await authService.getMyKonkurs();
    if (!('error' in result)) {
      setInfo(result);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

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
        {!hideHeader && (
          <CompactHeader onBack={onBack} title={t.konkurs.title} titleAlign="center" paddingBottom={theme.spacing[2]} right={<View style={{ width: 40 }} />} />
        )}

        <Text style={{ fontFamily: theme.fonts.regular, fontSize: theme.fontSizes.sm, color: theme.colors.mutedForeground, marginBottom: theme.spacing[6] }}>
          {t.konkurs.subtitle}
        </Text>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.colors.goldForeground} />
          </View>
        ) : info?.has_code ? (
          <View>
            {/* Has code card */}
            <GradientCard variant="gold" style={{ marginBottom: theme.spacing[4] }}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: theme.borderRadius.xl }]}>
                  <Ticket size={28} color="#fff" />
                </View>
                <View style={{ flex: 1, marginLeft: theme.spacing[3] }}>
                  <Text style={{ fontFamily: theme.fonts.semibold, fontSize: theme.fontSizes.md, color: '#fff' }}>
                    {t.konkurs.participating}
                  </Text>
                  <Text style={{ fontFamily: theme.fonts.regular, fontSize: theme.fontSizes.xs, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
                    {t.konkurs.issuedOn}: {formatDate(info.post_time)}
                  </Text>
                </View>
              </View>
            </GradientCard>

            {/* Code display */}
            <LinearGradient
              colors={['#6d28d9', '#9333ea']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.codeCard, { borderRadius: theme.borderRadius['2xl'] }]}
            >
              <Text style={[styles.codeLabel, { fontFamily: theme.fonts.medium, color: 'rgba(255,255,255,0.7)' }]}>
                {t.konkurs.yourCode}
              </Text>
              <Text style={[styles.codeText, { fontFamily: theme.fonts.displayBold, color: '#fff', letterSpacing: 6 }]}>
                {info.code}
              </Text>
            </LinearGradient>

            {/* Hint */}
            <Text style={{ fontFamily: theme.fonts.regular, fontSize: theme.fontSizes.sm, color: theme.colors.mutedForeground, textAlign: 'center', marginTop: theme.spacing[4], lineHeight: 20 }}>
              {t.konkurs.hint}
            </Text>
          </View>
        ) : (
          <View style={{ alignItems: 'center', paddingVertical: theme.spacing[12] }}>
            <Gift size={48} color={theme.colors.mutedForeground} style={{ opacity: 0.3, marginBottom: 12 }} />
            <Text style={{ fontFamily: theme.fonts.semibold, fontSize: theme.fontSizes.lg, color: theme.colors.foreground, marginBottom: theme.spacing[2] }}>
              {t.konkurs.noCode}
            </Text>
            <Text style={{ fontFamily: theme.fonts.regular, fontSize: theme.fontSizes.sm, color: theme.colors.mutedForeground, textAlign: 'center', lineHeight: 20 }}>
              {t.konkurs.noCodeDesc}
            </Text>
          </View>
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    paddingTop: 80,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 52,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeCard: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 24,
  },
  codeLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 12,
  },
  codeText: {
    fontSize: 44,
  },
});
