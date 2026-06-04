/**
 * Tenant branding for the coach/admin portal.
 *
 * Mirrors the mobile app's approach (one codebase, tenant-differentiated — not
 * forked). The brand is chosen at build time via VITE_BRAND (defaults to
 * 'karuna'), and the gym it manages via VITE_GYM_ID (defaults to the brand's
 * gym). The accent color is applied as an RGB triplet CSS variable so Tailwind
 * opacity modifiers (e.g. bg-warm-accent/10) keep working.
 */
export interface AdminBrand {
  /** Top line of the wordmark, e.g. "CROSSFIT" */
  line1: string;
  /** Accent (second) line of the wordmark, e.g. "KARUNA" */
  line2: string;
  /** Single-line wordmark for compact spots */
  wordmark: string;
  /** Sub-label under the wordmark */
  subtitle: string;
  tagline: string;
  /** Accent hex (for non-Tailwind spots like chart strokes) */
  accentHex: string;
  /** Accent as "R G B" for the --brand-accent-rgb CSS variable */
  accentRgb: string;
  /** Default gym this portal manages (X-Gym-Id) */
  gymId: string;
  /** Example email shown on the login screen */
  loginHint: string;
}

const KARUNA: AdminBrand = {
  line1: 'CROSSFIT',
  line2: 'KARUNA',
  wordmark: 'CROSSFIT KARUNA',
  subtitle: 'Coach Portal',
  tagline: 'Fitter. Stronger. Happier.',
  accentHex: '#8BC53F',
  accentRgb: '139 197 63',
  gymId: 'b2673cbe-8c0f-4a55-8945-4935a6b45d5b',
  loginHint: 'coach@crossfitkaruna.app',
};

const TRAINING_GROUNDS: AdminBrand = {
  line1: 'TRAINING',
  line2: 'GROUNDS',
  wordmark: 'TRAINING GROUNDS',
  subtitle: 'Admin Dashboard',
  tagline: 'Track. Train. Dominate.',
  accentHex: '#C9A87C',
  accentRgb: '201 168 124',
  gymId: '2e26e180-a8c0-4e9e-9e4a-7bbfc427613f',
  loginHint: 'coach@traininggrounds.app',
};

const BRANDS: Record<string, AdminBrand> = {
  karuna: KARUNA,
  'crossfit-karuna': KARUNA,
  'training-grounds': TRAINING_GROUNDS,
};

const BRAND_KEY = ((import.meta as any).env?.VITE_BRAND as string) || 'karuna';

export const BRAND: AdminBrand = BRANDS[BRAND_KEY] ?? KARUNA;

/** The gym this portal manages — sent as X-Gym-Id on every request. */
export const GYM_ID: string =
  ((import.meta as any).env?.VITE_GYM_ID as string) || BRAND.gymId;
