const fs = require('fs');
const path = require('path');

const googleServicesFile = './google-services.json';
const hasGoogleServices = fs.existsSync(path.resolve(__dirname, googleServicesFile));

// Config plugin: writes the correct Contents.json for the App Store icon asset catalog.
// Icon PNG files at all required sizes are committed to git.
function withAllAppIconSizes(config) {
  const { withDangerousMod } = require('@expo/config-plugins');
  return withDangerousMod(config, [
    'ios',
    (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const appIconDir = path.join(
        projectRoot,
        'ios',
        'Fenix',
        'Images.xcassets',
        'AppIcon.appiconset'
      );

      const contents = {
        images: [
          { filename: 'Icon-20.png', idiom: 'iphone', scale: '1x', size: '20x20' },
          { filename: 'Icon-40.png', idiom: 'iphone', scale: '2x', size: '20x20' },
          { filename: 'Icon-60.png', idiom: 'iphone', scale: '3x', size: '20x20' },
          { filename: 'Icon-29.png', idiom: 'iphone', scale: '1x', size: '29x29' },
          { filename: 'Icon-58.png', idiom: 'iphone', scale: '2x', size: '29x29' },
          { filename: 'Icon-87.png', idiom: 'iphone', scale: '3x', size: '29x29' },
          { filename: 'Icon-40.png', idiom: 'iphone', scale: '1x', size: '40x40' },
          { filename: 'Icon-80.png', idiom: 'iphone', scale: '2x', size: '40x40' },
          { filename: 'Icon-120.png', idiom: 'iphone', scale: '3x', size: '40x40' },
          { filename: 'Icon-120.png', idiom: 'iphone', scale: '2x', size: '60x60' },
          { filename: 'Icon-180.png', idiom: 'iphone', scale: '3x', size: '60x60' },
          { filename: 'Icon-20.png', idiom: 'ipad', scale: '1x', size: '20x20' },
          { filename: 'Icon-40.png', idiom: 'ipad', scale: '2x', size: '20x20' },
          { filename: 'Icon-29.png', idiom: 'ipad', scale: '1x', size: '29x29' },
          { filename: 'Icon-58.png', idiom: 'ipad', scale: '2x', size: '29x29' },
          { filename: 'Icon-40.png', idiom: 'ipad', scale: '1x', size: '40x40' },
          { filename: 'Icon-80.png', idiom: 'ipad', scale: '2x', size: '40x40' },
          { filename: 'Icon-76.png', idiom: 'ipad', scale: '1x', size: '76x76' },
          { filename: 'Icon-152.png', idiom: 'ipad', scale: '2x', size: '76x76' },
          { filename: 'Icon-167.png', idiom: 'ipad', scale: '2x', size: '83.5x83.5' },
          {
            filename: 'App-Icon-1024x1024@1x.png',
            idiom: 'ios-marketing',
            scale: '1x',
            size: '1024x1024',
          },
        ],
        info: { version: 1, author: 'expo' },
      };

      fs.writeFileSync(
        path.join(appIconDir, 'Contents.json'),
        JSON.stringify(contents, null, 2)
      );

      return config;
    },
  ]);
}

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
    runtimeVersion: '1.0.1',
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.fenix.mobile',
      buildNumber: '7',
      minimumOsVersion: '16.0',
      infoPlist: {
        UIBackgroundModes: ['fetch', 'remote-notification'],
        NSFaceIDUsageDescription:
          'Fenix использует Face ID для быстрого и безопасного входа в приложение.',
        ITSAppUsesNonExemptEncryption: false,
        CFBundleIconName: 'AppIcon',
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
      withAllAppIconSizes,
    ],
    extra: {
      eas: {
        projectId: 'ae2ad995-7bc0-4b21-b647-3186184cb2df',
      },
    },
  },
};
