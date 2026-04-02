import React, { useEffect, useRef, useCallback } from 'react';
import { View, Text, Image, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme';
import { useT } from '@/i18n';

interface SplashScreenProps {
  onAnimationComplete?: () => void;
}

export function SplashScreen({ onAnimationComplete }: SplashScreenProps) {
  const theme = useTheme();
  const t = useT();
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const navigated = useRef(false);

  const navigate = useCallback(() => {
    if (!navigated.current && onAnimationComplete) {
      navigated.current = true;
      onAnimationComplete();
    }
  }, [onAnimationComplete]);

  useEffect(() => {
    // Safety net: always navigate after 2 seconds regardless of animation state
    const safetyTimer = setTimeout(navigate, 2000);

    // Initial entrance animation
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Start pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Navigate after animation completes
      setTimeout(navigate, 1000);
    });

    return () => clearTimeout(safetyTimer);
  }, []);

  const SPLASH_BG = theme.isDark ? '#0A0A0A' : '#FFFFFF';
  const SPLASH_FG = theme.isDark ? 'rgba(255,255,255,0.95)' : 'rgba(10,10,10,0.9)';
  const SPLASH_MUTED = theme.isDark ? 'rgba(255,255,255,0.45)' : 'rgba(10,10,10,0.45)';

  return (
    <View style={[styles.container, { backgroundColor: SPLASH_BG }]}>
      {/* Background gradient glow */}
      <View style={styles.glowContainer}>
        <LinearGradient
          colors={['rgba(255, 215, 0, 0.25)', 'transparent']}
          style={styles.glow}
        />
      </View>

      <Animated.View
        style={[
          styles.logoContainer,
          {
            transform: [
              { scale: Animated.multiply(scaleAnim, pulseAnim) },
            ],
            opacity: opacityAnim,
          },
        ]}
      >
        <Image
          source={require('../../../assets/fenix_fav.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </Animated.View>

      <Animated.View style={{ opacity: opacityAnim }}>
        <Text
          style={[
            styles.title,
            {
              fontFamily: theme.fonts.displayBold,
              fontSize: theme.fontSizes['4xl'],
              color: SPLASH_FG,
            },
          ]}
        >
          Fenix
        </Text>
        <Text
          style={[
            styles.subtitle,
            {
              fontFamily: theme.fonts.regular,
              fontSize: theme.fontSizes.sm,
              color: SPLASH_MUTED,
            },
          ]}
        >
          International Company
        </Text>
      </Animated.View>

      <View style={styles.footer}>
        <Text
          style={[
            styles.footerText,
            {
              fontFamily: theme.fonts.regular,
              fontSize: theme.fontSizes.xs,
              color: SPLASH_MUTED,
            },
          ]}
        >
          {t.auth.copyright}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoImage: {
    width: 120,
    height: 120,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 48,
  },
  footerText: {
    textAlign: 'center',
  },
});
