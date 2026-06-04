import * as Application from 'expo-application';

/**
 * Pre-auth (login / register) branding.
 *
 * The native tenant builds share ONE JS bundle and are distinguished at
 * runtime by their bundle ID (the same seam gymSlice uses to lock the gym).
 * Before sign-in there's no active gym yet, so the gym theme isn't loaded —
 * without this, every tenant's login screen would fall back to the default
 * (Training Grounds) branding. This maps the locked bundle ID to the correct
 * brand so e.g. the CrossFit Karuna build shows Karuna branding on launch.
 */
export interface TenantBrand {
  /** Top line of the wordmark, e.g. "CROSSFIT" */
  line1: string;
  /** Accent (second) line of the wordmark, e.g. "KARUNA" */
  line2: string;
  tagline: string;
  /** Accent / primary color for the pre-auth screens */
  primaryColor: string;
  /** Splash / pre-auth background color */
  backgroundColor: string;
}

const BUNDLE_ID_TO_SLUG: Record<string, string> = {
  'com.crossfitkaruna.app': 'crossfit-karuna',
  'com.traininggrounds.app': 'training-grounds',
};

const TENANT_BRANDS: Record<string, TenantBrand> = {
  'training-grounds': {
    line1: 'TRAINING',
    line2: 'GROUNDS',
    tagline: 'Track. Train. Dominate.',
    primaryColor: '#C9A87C',
    backgroundColor: '#1E1E1E',
  },
  'crossfit-karuna': {
    line1: 'CROSSFIT',
    line2: 'KARUNA',
    tagline: 'Fitter. Stronger. Happier.',
    primaryColor: '#8BC53F',
    backgroundColor: '#1A1A1A',
  },
};

const DEFAULT_SLUG = 'training-grounds';

/** Resolve the brand for the current locked tenant build (by bundle ID). */
export function getTenantBrand(): TenantBrand {
  const bundleId = Application.applicationId ?? '';
  const slug = BUNDLE_ID_TO_SLUG[bundleId] ?? DEFAULT_SLUG;
  return TENANT_BRANDS[slug] ?? TENANT_BRANDS[DEFAULT_SLUG];
}
