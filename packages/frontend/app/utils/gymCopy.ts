/**
 * Gym-specific copy — maps active gym slug to user-facing strings that differ
 * by tenant (martial arts vs CrossFit, etc.).
 *
 * Use this whenever a screen would otherwise hardcode "Black Belt", "BJJ", etc.
 *
 *   const copy = useGymCopy();
 *   <Text>{copy.disciplineLabel('crossfit')}</Text>
 *   <Text>{copy.eliteLeagueName}</Text>
 */
import { useSelector } from 'react-redux';
import type { RootState } from '../redux/store';

export interface GymCopy {
  /** Tagline shown on gym selector / header */
  tagline: string;
  /** Name of the top-tier league (e.g. "Black Belt Elite" vs "Games League") */
  eliteLeagueName: string;
  /** Label used in profile header where belt+stripes normally appears */
  rankLabel: (beltRank: string, stripes: number) => string;
  /** Whether to render the belt picker in register/profile UI */
  showBeltPicker: boolean;
  /** Map backend discipline IDs to user-friendly labels */
  disciplineLabel: (discipline: string) => string;
  /** The 5 league-ladder names (low → high) */
  leagueLadder: Array<{ key: string; label: string }>;
  /** Placeholder shown in the "journal class name" input */
  classPlaceholder: string;
  /** Label for the "disciplines" community channel group */
  disciplineGroupLabel: string;
}

const MMA_COPY: GymCopy = {
  tagline: 'Multi-Discipline MMA',
  eliteLeagueName: 'Black Belt Elite',
  rankLabel: (belt, stripes) =>
    `${belt.charAt(0).toUpperCase() + belt.slice(1)} Belt${stripes ? ` (${stripes} stripe${stripes === 1 ? '' : 's'})` : ''}`,
  showBeltPicker: true,
  disciplineLabel: (d) =>
    ({
      bjj_gi: 'BJJ Gi',
      bjj_nogi: 'BJJ No-Gi',
      muay_thai: 'Muay Thai',
      wrestling: 'Wrestling',
      mma: 'MMA',
    }[d] ?? d),
  leagueLadder: [
    { key: 'bronze', label: 'White Belt' },
    { key: 'silver', label: 'Blue Belt' },
    { key: 'gold', label: 'Purple Belt' },
    { key: 'platinum', label: 'Brown Belt' },
    { key: 'diamond', label: 'Black Belt' },
    { key: 'black-belt-elite', label: 'Black Belt Elite' },
  ],
  classPlaceholder: 'e.g. Morning BJJ Fundamentals',
  disciplineGroupLabel: 'Disciplines',
};

const CROSSFIT_COPY: GymCopy = {
  tagline: 'Fitter. Stronger. Happier.',
  eliteLeagueName: 'Games League',
  rankLabel: (_belt, _stripes) => 'Member',
  showBeltPicker: false,
  disciplineLabel: (d) =>
    ({
      crossfit: 'CrossFit',
      weightlifting: 'Weightlifting',
      hyrox: 'HYROX',
      gymnastics: 'Gymnastics',
      open_gym: 'Open Gym',
      crossfit_kids: 'CrossFit Kids',
    }[d] ?? d),
  leagueLadder: [
    { key: 'bronze', label: 'Scaled' },
    { key: 'silver', label: 'RX' },
    { key: 'gold', label: 'Competition' },
    { key: 'platinum', label: 'Elite' },
    { key: 'diamond', label: 'Games' },
    { key: 'black-belt-elite', label: 'Games League' },
  ],
  classPlaceholder: 'e.g. 6am Metcon',
  disciplineGroupLabel: 'Programs',
};

const SLUG_TO_COPY: Record<string, GymCopy> = {
  'training-grounds': MMA_COPY,
  'crossfit-karuna': CROSSFIT_COPY,
  // Legacy slug mapping for backward compat
  'karuna-crossfit': CROSSFIT_COPY,
};

export function getGymCopyForSlug(slug: string | null | undefined): GymCopy {
  if (!slug) return MMA_COPY;
  return SLUG_TO_COPY[slug] ?? MMA_COPY;
}

/** React hook: returns gym-specific copy based on the active gym. */
export function useGymCopy(): GymCopy {
  const activeGymId = useSelector((state: RootState) => state.gym.activeGymId);
  const gyms = useSelector((state: RootState) => state.gym.gyms);
  const activeGym = gyms.find((g) => g.id === activeGymId) ?? null;
  return getGymCopyForSlug(activeGym?.slug);
}
