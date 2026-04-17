import { View, Text, TouchableOpacity, StyleSheet, Linking, Alert } from 'react-native';
import { Tabs } from 'expo-router';
import { Home, Users, ShoppingBag, Wallet, User, Shield, ExternalLink, LogOut } from 'lucide-react-native';
import { useT } from '@/i18n';
import { useTheme } from '@/theme';
import { TabBar } from '@/components/ui/TabBar';
import { GlassCard } from '@/components/ui/GlassCard';
import { NotificationPoller } from '@/components/NotificationPoller';
import { useAuthStore } from '@/store';

const WEB_CABINET_URL = 'https://fenixinternationalcompany.kz/cabinet/verification';

function VerificationGate() {
  const theme = useTheme();
  const t = useT();
  const { logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert(t.auth.logoutConfirmTitle, t.auth.logoutConfirmMsg, [
      { text: t.common.cancel, style: 'cancel' },
      { text: t.auth.logout, style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={[styles.gate, { backgroundColor: theme.colors.background }]}>
      <GlassCard cornerRadius={20} style={styles.gateCard}>
        <View style={[styles.gateIconWrap, { backgroundColor: `${theme.colors.goldForeground}15`, borderColor: `${theme.colors.goldForeground}40` }]}>
          <Shield size={40} color={theme.colors.goldForeground} />
        </View>
        <Text style={[styles.gateTitle, { color: theme.colors.foreground, fontFamily: theme.fonts.bold }]}>
          {t.verification.title}
        </Text>
        <Text style={[styles.gateDesc, { color: theme.colors.mutedForeground, fontFamily: theme.fonts.regular }]}>
          {t.verification.description}
        </Text>
        <Text style={[styles.gateHint, { color: theme.colors.mutedForeground, fontFamily: theme.fonts.regular }]}>
          {t.verification.uploadOnWeb}
        </Text>
        <TouchableOpacity
          onPress={() => Linking.openURL(WEB_CABINET_URL)}
          style={[styles.gateBtn, { backgroundColor: theme.gold.primary }]}
        >
          <ExternalLink size={16} color="#000" />
          <Text style={[styles.gateBtnText, { fontFamily: theme.fonts.bold }]}>{t.verification.openWebBtn}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleLogout} style={styles.gateLogout}>
          <LogOut size={14} color={theme.colors.mutedForeground} />
          <Text style={[styles.gateLogoutText, { color: theme.colors.mutedForeground, fontFamily: theme.fonts.regular }]}>
            {t.auth.logout}
          </Text>
        </TouchableOpacity>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  gate: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  gateCard: { width: '100%', maxWidth: 360, padding: 28, alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.15)' },
  gateIconWrap: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  gateTitle: { fontSize: 20, marginBottom: 10, textAlign: 'center' },
  gateDesc: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 8 },
  gateHint: { fontSize: 12, textAlign: 'center', lineHeight: 18, marginBottom: 24 },
  gateBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 20, marginBottom: 16 },
  gateBtnText: { fontSize: 14, color: '#000' },
  gateLogout: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  gateLogoutText: { fontSize: 13 },
});

export default function TabsLayout() {
  const t = useT();
  const { user } = useAuthStore();

  // Block all tabs for unverified users (same as web CabinetLayout)
  const isAdmin = user?.id === 1;
  const isVerified = user?.verified === 1;
  if (user && !isAdmin && !isVerified) {
    return (
      <>
        <NotificationPoller />
        <VerificationGate />
      </>
    );
  }

  return (
    <>
      <NotificationPoller />
      <Tabs
        tabBar={(props) => <TabBar {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' },
        }}
      >
        <Tabs.Screen
          name="(home)"
          options={{
            title: t.tabs.home,
            tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="structure"
          options={{
            title: t.tabs.structure,
            tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="(shop)"
          options={{
            title: t.tabs.shop,
            tabBarIcon: ({ color, size }) => <ShoppingBag size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="(finance)"
          options={{
            title: t.tabs.finance,
            tabBarIcon: ({ color, size }) => <Wallet size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t.tabs.profile,
            tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
          }}
        />
      </Tabs>
    </>
  );
}
