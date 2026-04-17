/**
 * Expo dynamic config — resolves branding per tenant at build time.
 *
 * Run as:
 *   EXPO_PUBLIC_TENANT=crossfit-karuna eas build --platform ios
 *   EXPO_PUBLIC_TENANT=training-grounds eas build --platform ios
 *
 * Without `EXPO_PUBLIC_TENANT` set, defaults to the `multi-tenant` entry (the
 * gym-selector build). See tenants.config.js for the full registry.
 */

const { getActiveTenant } = require('./tenants.config');

module.exports = () => {
  const tenant = getActiveTenant();

  return {
    expo: {
      name: tenant.name,
      slug: tenant.slug,
      version: '1.0.0',
      orientation: 'portrait',
      icon: tenant.icon,
      scheme: tenant.scheme,
      userInterfaceStyle: 'dark',
      splash: {
        image: tenant.splashImage,
        resizeMode: 'contain',
        backgroundColor: tenant.splashBackground,
      },
      assetBundlePatterns: ['**/*'],
      ios: {
        supportsTablet: false,
        bundleIdentifier: tenant.bundleIdentifier,
        infoPlist: {
          NSCameraUsageDescription:
            `${tenant.name} uses your camera to scan QR codes for class check-in.`,
          UIBackgroundModes: ['remote-notification'],
        },
      },
      android: {
        adaptiveIcon: {
          foregroundImage: tenant.adaptiveIcon,
          backgroundColor: tenant.splashBackground,
        },
        package: tenant.androidPackage,
        permissions: ['CAMERA'],
      },
      plugins: [
        'expo-camera',
        'expo-notifications',
        'expo-secure-store',
        'expo-apple-authentication',
      ],
      extra: {
        // Exposed to the JS bundle via Constants.expoConfig.extra
        tenantKey: tenant.key,
        tenantSlug: tenant.slug,
        primaryColor: tenant.primaryColor,
      },
    },
  };
};
