import api from './api';

export type PrCategory = 'lift' | 'benchmark_wod' | 'gymnastics';
export type PrValueUnit = 'kg' | 'lbs' | 'seconds' | 'reps';

export interface PersonalRecord {
  id: string;
  gymId: string;
  userId: string;
  category: PrCategory;
  movementName: string;
  valueNumeric: string; // decimal stored as string
  valueUnit: PrValueUnit;
  previousBest: string | null;
  improvementAmount: string | null;
  isAllTimePr: boolean;
  isBodyweight: boolean;
  bodyweightAtLog: string | null;
  loggedAt: string;
  notes: string | null;
  videoUrl: string | null;
  verifiedByCoachId: string | null;
  verifiedAt: string | null;
  createdAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string | null;
  valueNumeric: number;
  valueUnit: PrValueUnit;
  loggedAt: string;
}

export interface CreatePrInput {
  category: PrCategory;
  movementName: string;
  valueNumeric: number;
  valueUnit: PrValueUnit;
  isBodyweight?: boolean;
  bodyweightAtLog?: number;
  loggedAt?: string;
  notes?: string;
  videoUrl?: string;
}

export const personalRecordService = {
  async listMyPrs(options: { category?: PrCategory; movement?: string } = {}): Promise<PersonalRecord[]> {
    const res = await api.get('/personal-records', { params: options });
    return res.data.data;
  },

  async getHistory(movementName: string): Promise<PersonalRecord[]> {
    const res = await api.get(`/personal-records/history/${encodeURIComponent(movementName)}`);
    return res.data.data;
  },

  async getLeaderboard(movementName: string): Promise<LeaderboardEntry[]> {
    const res = await api.get(`/personal-records/leaderboard/${encodeURIComponent(movementName)}`);
    return res.data.data;
  },

  async createPr(input: CreatePrInput): Promise<{
    pr: PersonalRecord;
    isNewPr: boolean;
    xpAwarded: number;
  }> {
    const res = await api.post('/personal-records', input);
    return res.data.data;
  },

  async deletePr(id: string): Promise<void> {
    await api.delete(`/personal-records/${id}`);
  },
};

/** Return the best (all-time PR) record for each movement from a list. */
export function groupByBestPr(records: PersonalRecord[]): Record<string, PersonalRecord> {
  const out: Record<string, PersonalRecord> = {};
  for (const r of records) {
    const existing = out[r.movementName];
    if (!existing) {
      out[r.movementName] = r;
      continue;
    }
    const isBenchmark = r.category === 'benchmark_wod';
    const rVal = Number(r.valueNumeric);
    const eVal = Number(existing.valueNumeric);
    if (isBenchmark ? rVal < eVal : rVal > eVal) {
      out[r.movementName] = r;
    }
  }
  return out;
}

/** Calculate % of a user's all-time PR for a given movement. */
export function calculatePercentageOfPr(prValue: number, percent: number): number {
  return Math.round(prValue * (percent / 100));
}

/** Round to nearest 2.5 kg/lbs for barbell plate math. */
export function roundToPlate(weight: number): number {
  return Math.round(weight / 2.5) * 2.5;
}

/** Standard percentage weights used by CrossFit / Olympic lifting programs. */
export const STANDARD_PERCENTAGES = [50, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105] as const;

/** Movements we expose in the weightlifting tracker UI. */
export const TRACKED_LIFTS = [
  { name: 'Back Squat', category: 'lift' as const },
  { name: 'Front Squat', category: 'lift' as const },
  { name: 'Overhead Squat', category: 'lift' as const },
  { name: 'Deadlift', category: 'lift' as const },
  { name: 'Clean & Jerk', category: 'lift' as const },
  { name: 'Power Clean', category: 'lift' as const },
  { name: 'Snatch', category: 'lift' as const },
  { name: 'Power Snatch', category: 'lift' as const },
  { name: 'Push Press', category: 'lift' as const },
  { name: 'Strict Press', category: 'lift' as const },
  { name: 'Bench Press', category: 'lift' as const },
  { name: 'Thruster', category: 'lift' as const },
];
