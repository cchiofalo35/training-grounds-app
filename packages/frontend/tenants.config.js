/**
 * Tenant registry — single source of truth for build-time branding.
 *
 * Each entry describes a tenant-locked build variant. When `EXPO_PUBLIC_TENANT`
 * env var is set at build time (e.g. `EXPO_PUBLIC_TENANT=crossfit-karuna`), the
 * matching entry drives `app.config.js` to produce a fully branded iOS/Android
 * binary — unique bundle ID, name, icon, URL scheme, splash color.
 *
 * Adding a new gym is a one-liner: insert a new entry here, drop branded
 * PNGs into `app/assets/tenants/<slug>/`, and add a matching row to the
 * `BUNDLE_ID_TO_GYM_SLUG` map in `app/redux/slices/gymSlice.ts`.
 *
 * The `default` entry (`multi-tenant`) is the unlocked build that shows the
 * gym selector — useful for dev/preview + as a "master" app for admins.
 */

const TENANTS = {
  /** Multi-tenant dev build — shows the gym selector, no auto-lock */
  'multi-tenant': {
    name: 'Training Grounds',
    slug: 'training-grounds',
    scheme: 'traininggrounds',
    bundleIdentifier: 'com.traininggrounds.app',
    androidPackage: 'com.traininggrounds.app',
    icon: './app/assets/icon.png',
    adaptiveIcon: './app/assets/adaptive-icon.png',
    splashBackground: '#1E1E1E',
    splashImage: './app/assets/splash.png',
    primaryColor: '#C9A87C',
    ascAppId: '6761029689',
  },

  'training-grounds': {
    name: 'Training Grounds',
    slug: 'training-grounds',
    scheme: 'traininggrounds',
    bundleIdentifier: 'com.traininggrounds.app',
    androidPackage: 'com.traininggrounds.app',
    icon: './app/assets/tenants/training-grounds/icon.png',
    adaptiveIcon: './app/assets/tenants/training-grounds/adaptive-icon.png',
    splashBackground: '#1E1E1E',
    splashImage: './app/assets/tenants/training-grounds/splash.png',
    primaryColor: '#C9A87C',
    ascAppId: '6761029689',
  },

  'crossfit-karuna': {
    name: 'CrossFit Karuna',
    slug: 'crossfit-karuna',
    scheme: 'crossfitkaruna',
    bundleIdentifier: 'com.crossfitkaruna.app',
    androidPackage: 'com.crossfitkaruna.app',
    icon: './app/assets/tenants/crossfit-karuna/icon.png',
    adaptiveIcon: './app/assets/tenants/crossfit-karuna/adaptive-icon.png',
    splashBackground: '#1A1A1A',
    splashImage: './app/assets/tenants/crossfit-karuna/splash.png',
    primaryColor: '#8BC53F',
    // Fill this in after creating the app in App Store Connect (see README)
    ascAppId: "6762426665",
  },
};

function getActiveTenant() {
  const key = process.env.EXPO_PUBLIC_TENANT || 'multi-tenant';
  const tenant = TENANTS[key];
  if (!tenant) {
    const available = Object.keys(TENANTS).join(', ');
    throw new Error(
      `Unknown tenant "${key}". Set EXPO_PUBLIC_TENANT to one of: ${available}`,
    );
  }
  return { key, ...tenant };
}

module.exports = { TENANTS, getActiveTenant };
