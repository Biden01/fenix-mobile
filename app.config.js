const fs = require('fs');
const path = require('path');

const googleServicesFile = './google-services.json';
const hasGoogleServices = fs.existsSync(path.resolve(__dirname, googleServicesFile));

module.exports = {
  expo: {
    name: 'Fenix',
    slug: 'fenix-mobile',
    owner: 'detronix',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    scheme: 'fenixapp',
    userInterfaceStyle: 'dark',
    newArchEnabled: true,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#FFFFFF',
      dark: {
        image: './assets/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#0A0A0A',
      },
    },
    updates: {
      url: 'https://u.expo.dev/ae2ad995-7bc0-4b21-b647-3186184cb2df',
    },
    runtimeVersion: {
      policy: 'appVersion',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.fenix.mobile',
      minimumOsVersion: '16.0',
      infoPlist: {
        UIBackgroundModes: ['fetch', 'remote-notification'],
        NSFaceIDUsageDescription: 'Fenix использует Face ID для быстрого и безопасного входа в приложение.',
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#0A0A0A',
      },
      package: 'com.fenix.mobile',
      versionCode: 8,
      permissions: ['INTERNET', 'RECEIVE_BOOT_COMPLETED', 'VIBRATE'],
      // Only include googleServicesFile when the file actually exists
      // (not needed in Expo Go; required for development builds and production)
      ...(hasGoogleServices && { googleServicesFile }),
    },
    web: {
      bundler: 'metro',
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-router',
      'expo-font',
      'expo-secure-store',
      [
        'expo-notifications',
        {
          icon: './assets/notification-icon.png',
          color: '#FFD700',
          defaultChannel: 'default',
        },
      ],
      [
        'expo-build-properties',
        {
          android: {
            usesCleartextTraffic: false,
          },
        },
      ],
    ],
    extra: {
      eas: {
        projectId: 'ae2ad995-7bc0-4b21-b647-3186184cb2df',
      },
    },
  },
};
