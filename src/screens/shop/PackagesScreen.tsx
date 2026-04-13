import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal } from 'react-native';
import { ArrowLeft, Package, Star, Zap, Crown, CheckCircle, CreditCard, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';
import { useTheme } from '@/theme';
import { GoldButton, GlassCard, StatusBadge } from '@/components/ui';
import { shopService } from '@/api';
import { apiClient } from '@/api/client';
import { useAuthStore } from '@/store';
import { useT } from '@/i18n';

const TIPTOP_PUBLIC_ID = 'pk_dd94d728cd436960df4ddb13935f6';

const PLAN_AMOUNTS = [0, 9450, 25200, 50400, 100800, 201600];

function buildTipTopHtml(params: {
  publicId: string;
  description: string;
  amount: number;
  accountId: string;
  email: string;
}): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0f0f0f; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .msg { color: #aaa; font-family: sans-serif; font-size: 14px; text-align: center; }
  </style>
</head>
<body>
  <div class="msg" id="msg">Загрузка платёжной формы...</div>
  <script src="https://widget.tiptoppay.kz/bundles/widget.js"></script>
  <script>
    window.onload = function() {
      try {
        document.getElementById('msg').style.display = 'none';
        var widget = new tiptop.Widget();
        widget.pay('auth', {
          publicId: '${params.publicId}',
          description: '${params.description}',
          amount: ${params.amount},
          currency: 'KZT',
          accountId: '${params.accountId}',
          email: '${params.email}',
          skin: 'mini',
          autoClose: 3
        }, {
          onSuccess: function() {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'success' }));
          },
          onFail: function() {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'fail' }));
          }
        });
      } catch(e) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: e.message }));
      }
    };
  </script>
</body>
</html>`;
}

// Static plan data (prices from backend: AMOUNTS=[0,9450,25200,50400,100800,201600], QV=[0,20,50,100,200,400])
const STATIC_PLANS = [
  {
    id: 0,
    name: 'Basic',
    planLevel: 1,
    price: 9450,
    qv: 20,
  },
  {
    id: 1,
    name: 'Start',
    planLevel: 2,
    price: 25200,
    qv: 50,
  },
  {
    id: 2,
    name: 'Standard',
    planLevel: 3,
    price: 50400,
    qv: 100,
  },
  {
    id: 3,
    name: 'Business',
    planLevel: 4,
    price: 100800,
    qv: 200,
  },
  {
    id: 4,
    name: 'VIP',
    planLevel: 5,
    price: 201600,
    qv: 400,
  },
];

// Static metadata per plan level (1–5) — features come from translations
const PLAN_META_STATIC: Record<number, {
  icon: typeof Package;
  color: string;
  recommended: boolean;
}> = {
  1: { icon: Package, color: '#6B7280', recommended: false },
  2: { icon: Package, color: '#94A3B8', recommended: false },
  3: { icon: Star,    color: '#64748B', recommended: false },
  4: { icon: Zap,     color: '#DAA520', recommended: true  },
  5: { icon: Crown,   color: '#FFD700', recommended: false },
};

interface PackagesScreenProps {
  onBack: () => void;
  onPurchaseSuccess?: () => void;
}

export function PackagesScreen({ onBack, onPurchaseSuccess }: PackagesScreenProps) {
  const theme = useTheme();
  const t = useT();
  const { refreshProfile, user } = useAuthStore();
  const packages = STATIC_PLANS;
  const [purchasing, setPurchasing] = useState<number | null>(null);
  const [cardPayPlan, setCardPayPlan] = useState<{ level: number; name: string; amount: number } | null>(null);
  const [cardPayLoading, setCardPayLoading] = useState(false);
  const planFeaturesMap: Record<number, string[]> = {
    1: t.shop.planFeatures.basic,
    2: t.shop.planFeatures.start,
    3: t.shop.planFeatures.standard,
    4: t.shop.planFeatures.business,
    5: t.shop.planFeatures.vip,
  };

  const getEffectiveCost = (planLevel: number, price: number) => {
    const currentStatus = user?.status ?? 0;
    if (currentStatus > 0 && planLevel > currentStatus) {
      return PLAN_AMOUNTS[planLevel] - PLAN_AMOUNTS[currentStatus];
    }
    return price;
  };

  const canPurchase = (planLevel: number) => planLevel > (user?.status ?? 0);

  const handleCardPayment = (planLevel: number, planName: string, price: number) => {
    if (!canPurchase(planLevel)) return;
    const amount = getEffectiveCost(planLevel, price);
    setCardPayPlan({ level: planLevel, name: planName, amount });
  };

  const handleCardPayMessage = async (data: string) => {
    try {
      const msg = JSON.parse(data);
      if (msg.type === 'success') {
        setCardPayPlan(null);
        setCardPayLoading(true);
        const result = await apiClient.post<{ message: string }>('/shop/purchase-plan-card', {
          plan_level: cardPayPlan?.level,
        });
        setCardPayLoading(false);
        if (result.error) {
          Alert.alert(t.common.error, result.error || t.shop.activationError);
        } else {
          await refreshProfile();
          Alert.alert(t.common.success, `${t.shop.packagePrefix} ${cardPayPlan?.name} ${t.shop.packageActivatedSuffix}`, [
            { text: t.common.ok, onPress: onPurchaseSuccess ?? onBack },
          ]);
        }
      } else if (msg.type === 'fail') {
        setCardPayPlan(null);
        Alert.alert(t.common.error, t.shop.paymentFailed);
      } else if (msg.type === 'error') {
        setCardPayPlan(null);
        Alert.alert(t.common.error, msg.message || t.shop.paymentFormError);
      }
    } catch {
      // ignore parse errors
    }
  };

  const handlePurchase = async (planLevel: number, planName: string, price: number) => {
    Alert.alert(
      t.shop.confirmPurchase,
      `${t.shop.confirmPurchaseMsg} ${planName} ${t.shop.for} ${price.toLocaleString('ru-KZ')} ₸?`,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.shop.buy,
          onPress: async () => {
            setPurchasing(planLevel);
            try {
              const result = await shopService.purchasePlan(planLevel);
              if ('error' in result) {
                Alert.alert(t.common.error, result.error);
              } else {
                await refreshProfile();
                Alert.alert(
                  t.common.success,
                  result.data.message || `${planName}`,
                  [{ text: t.common.ok, onPress: onPurchaseSuccess ?? onBack }]
                );
              }
            } catch {
              Alert.alert(t.common.error, t.shop.purchaseError);
            } finally {
              setPurchasing(null);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: 60,
            paddingHorizontal: theme.screenPadding.horizontal,
            paddingBottom: theme.spacing[4],
          },
        ]}
      >
        <TouchableOpacity onPress={onBack} activeOpacity={0.8}>
          <GlassCard
            cornerRadius={theme.borderRadius.full}
            style={[styles.backButton, { padding: theme.spacing[2] }]}
          >
            <ArrowLeft size={24} color={theme.colors.foreground} />
          </GlassCard>
        </TouchableOpacity>
        <Text
          style={[
            {
              fontFamily: theme.fonts.displayBold,
              fontSize: theme.fontSizes.xl,
              color: theme.colors.foreground,
              flex: 1,
              textAlign: 'center',
            },
          ]}
        >
          {t.shop.starterPackages}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: theme.screenPadding.horizontal,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={[
            {
              fontFamily: theme.fonts.regular,
              fontSize: theme.fontSizes.sm,
              color: theme.colors.mutedForeground,
              textAlign: 'center',
              marginBottom: theme.spacing[6],
            },
          ]}
        >
          {t.shop.packagesSubtitle}
        </Text>

        {packages.map((pkg) => {
          const meta = PLAN_META_STATIC[pkg.planLevel];
          if (!meta) return null;
          const Icon = meta.icon;
          const features = planFeaturesMap[pkg.planLevel] ?? [];
          const isGold = pkg.planLevel >= 3;
          const isPurchasing = purchasing === pkg.planLevel;

          return (
            <GlassCard
              key={pkg.id}
              cornerRadius={theme.borderRadius['2xl']}
              tint={meta.recommended ? theme.gold.primary : '#ffffff'}
              style={[
                styles.packageCard,
                {
                  borderWidth: meta.recommended ? 2 : StyleSheet.hairlineWidth,
                  borderColor: meta.recommended ? theme.gold.primary : 'rgba(255,255,255,0.12)',
                  padding: theme.spacing[5],
                  marginBottom: theme.spacing[4],
                },
                theme.shadows.lg,
              ]}
            >
              {meta.recommended && (
                <View
                  style={[
                    styles.recommendedBadge,
                    {
                      position: 'absolute',
                      top: -12,
                      right: theme.spacing[4],
                    },
                  ]}
                >
                  <LinearGradient
                    colors={[theme.gold.primary, theme.gold.dark]}
                    style={[
                      {
                        paddingHorizontal: theme.spacing[3],
                        paddingVertical: theme.spacing[1],
                        borderRadius: theme.borderRadius.full,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        {
                          fontFamily: theme.fonts.bold,
                          fontSize: theme.fontSizes.xs,
                          color: theme.colors.primaryForeground,
                        },
                      ]}
                    >
                      {t.shop.recommended}
                    </Text>
                  </LinearGradient>
                </View>
              )}

              <View style={styles.packageHeader}>
                {isGold ? (
                  <LinearGradient
                    colors={[theme.gold.primary, theme.gold.dark]}
                    style={[
                      styles.packageIcon,
                      { borderRadius: theme.borderRadius.xl, padding: theme.spacing[3] },
                    ]}
                  >
                    <Icon size={28} color={theme.colors.primaryForeground} />
                  </LinearGradient>
                ) : (
                  <View
                    style={[
                      styles.packageIcon,
                      {
                        backgroundColor: `${meta.color}20`,
                        borderRadius: theme.borderRadius.xl,
                        padding: theme.spacing[3],
                      },
                    ]}
                  >
                    <Icon size={28} color={meta.color} />
                  </View>
                )}

                <View style={{ marginLeft: theme.spacing[3], flex: 1 }}>
                  <Text
                    style={[
                      {
                        fontFamily: theme.fonts.bold,
                        fontSize: theme.fontSizes.xl,
                        color: theme.colors.foreground,
                      },
                    ]}
                  >
                    {pkg.name}
                  </Text>
                  <StatusBadge
                    label={`${pkg.qv.toLocaleString()} QV`}
                    variant="gold"
                    size="sm"
                    style={{ marginTop: 4 }}
                  />
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text
                    style={[
                      {
                        fontFamily: theme.fonts.bold,
                        fontSize: theme.fontSizes.xl,
                        color: isGold ? theme.colors.goldForeground : theme.colors.foreground,
                      },
                    ]}
                  >
                    {pkg.price.toLocaleString('ru-KZ')}
                  </Text>
                  <Text
                    style={[
                      {
                        fontFamily: theme.fonts.regular,
                        fontSize: theme.fontSizes.sm,
                        color: theme.colors.mutedForeground,
                      },
                    ]}
                  >
                    ₸
                  </Text>
                </View>
              </View>

              <View style={[styles.featuresContainer, { marginTop: theme.spacing[4] }]}>
                {features.map((feature, index) => (
                  <View key={index} style={styles.featureRow}>
                    <CheckCircle
                      size={16}
                      color={isGold ? theme.colors.goldForeground : theme.semantic.success}
                    />
                    <Text
                      style={[
                        {
                          fontFamily: theme.fonts.regular,
                          fontSize: theme.fontSizes.sm,
                          color: theme.colors.foreground,
                          marginLeft: theme.spacing[2],
                        },
                      ]}
                    >
                      {feature}
                    </Text>
                  </View>
                ))}
              </View>

              <GoldButton
                title={isPurchasing ? t.shop.processing : t.shop.selectPackage}
                onPress={() => handlePurchase(pkg.planLevel, pkg.name, pkg.price)}
                variant={meta.recommended ? 'primary' : 'outline'}
                loading={isPurchasing}
                disabled={!canPurchase(pkg.planLevel)}
                style={{ marginTop: theme.spacing[4] }}
              />
              {canPurchase(pkg.planLevel) && (
                <TouchableOpacity
                  style={[styles.cardPayBtn, { borderColor: theme.colors.border, marginTop: theme.spacing[2] }]}
                  onPress={() => handleCardPayment(pkg.planLevel, pkg.name, pkg.price)}
                >
                  <CreditCard size={15} color={theme.colors.mutedForeground} />
                  <Text style={[styles.cardPayText, { color: theme.colors.mutedForeground, fontFamily: theme.fonts.medium }]}>
                    {t.shop.payByCard}
                  </Text>
                </TouchableOpacity>
              )}
            </GlassCard>
          );
        })}
      </ScrollView>

      {/* TipTop Pay WebView Modal */}
      <Modal
        visible={!!cardPayPlan}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setCardPayPlan(null)}
      >
        <View style={[styles.webViewContainer, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.webViewHeader, { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.webViewTitle, { color: theme.colors.foreground, fontFamily: theme.fonts.bold }]}>
              {t.shop.cardPaymentTitle} — {cardPayPlan?.name}
            </Text>
            <TouchableOpacity onPress={() => setCardPayPlan(null)} style={styles.webViewClose}>
              <X size={22} color={theme.colors.foreground} />
            </TouchableOpacity>
          </View>
          {cardPayPlan && user && (
            <WebView
              source={{
                html: buildTipTopHtml({
                  publicId: TIPTOP_PUBLIC_ID,
                  description: `${t.shop.packagePrefix} ${cardPayPlan.name} ${t.shop.inFenix}`,
                  amount: cardPayPlan.amount,
                  accountId: String(user.user_id),
                  email: user.email || '',
                }),
              }}
              onMessage={(e) => handleCardPayMessage(e.nativeEvent.data)}
              javaScriptEnabled
              domStorageEnabled
              style={{ flex: 1, backgroundColor: theme.colors.background }}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {},
  packageCard: {},
  recommendedBadge: {},
  packageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  packageIcon: {},
  featuresContainer: {},
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardPayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
  },
  cardPayText: {
    fontSize: 13,
  },
  webViewContainer: {
    flex: 1,
  },
  webViewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  webViewTitle: {
    fontSize: 16,
  },
  webViewClose: {
    padding: 4,
  },
});
