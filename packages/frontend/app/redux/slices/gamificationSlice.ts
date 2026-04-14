import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type {
  StreakInfo,
  LeaderboardEntry,
  LeaderboardPeriod,
  LeagueType,
  UserBadge,
  BadgeCatalogEntry,
  QuestWithProgress,
  XpGuide,
} from '@training-grounds/shared';
import { gamificationService } from '../../services/gamificationService';

interface GamificationState {
  streak: StreakInfo | null;
  leaderboard: LeaderboardEntry[];
  selectedLeague: LeagueType;
  selectedPeriod: LeaderboardPeriod;
  isLoadingStreak: boolean;
  isLoadingLeaderboard: boolean;
  badges: UserBadge[];
  badgeCatalog: BadgeCatalogEntry[];
  isLoadingBadges: boolean;
  isLoadingCatalog: boolean;
  quests: QuestWithProgress[];
  isLoadingQuests: boolean;
  xpGuide: XpGuide | null;
  error: string | null;
}

const initialState: GamificationState = {
  streak: null,
  leaderboard: [],
  selectedLeague: 'bronze',
  selectedPeriod: 'all-time',
  isLoadingStreak: false,
  isLoadingLeaderboard: false,
  badges: [],
  badgeCatalog: [],
  isLoadingBadges: false,
  isLoadingCatalog: false,
  quests: [],
  isLoadingQuests: false,
  xpGuide: null,
  error: null,
};

export const fetchStreak = createAsyncThunk(
  'gamification/fetchStreak',
  async (_, { rejectWithValue }) => {
    try {
      return await gamificationService.getStreak();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load streak';
      return rejectWithValue(message);
    }
  },
);

export const fetchLeaderboard = createAsyncThunk(
  'gamification/fetchLeaderboard',
  async (
    { period, league }: { period: LeaderboardPeriod; league?: LeagueType },
    { rejectWithValue },
  ) => {
    try {
      return await gamificationService.getLeaderboard(period, league);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load leaderboard';
      return rejectWithValue(message);
    }
  },
);

export const fetchBadges = createAsyncThunk(
  'gamification/fetchBadges',
  async (_, { rejectWithValue }) => {
    try {
      return await gamificationService.getBadges();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load badges';
      return rejectWithValue(message);
    }
  },
);

export const fetchBadgeCatalog = createAsyncThunk(
  'gamification/fetchBadgeCatalog',
  async (_, { rejectWithValue }) => {
    try {
      return await gamificationService.getBadgeCatalog();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load badge catalog';
      return rejectWithValue(message);
    }
  },
);

export const fetchQuests = createAsyncThunk(
  'gamification/fetchQuests',
  async (_, { rejectWithValue }) => {
    try {
      return await gamificationService.getQuests();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load quests';
      return rejectWithValue(message);
    }
  },
);

export const fetchXpGuide = createAsyncThunk(
  'gamification/fetchXpGuide',
  async (_, { rejectWithValue }) => {
    try {
      return await gamificationService.getXpGuide();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load XP guide';
      return rejectWithValue(message);
    }
  },
);

export const freezeStreak = createAsyncThunk(
  'gamification/freezeStreak',
  async (_, { rejectWithValue }) => {
    try {
      return await gamificationService.freezeStreak();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to freeze streak';
      return rejectWithValue(message);
    }
  },
);

const gamificationSlice = createSlice({
  name: 'gamification',
  initialState,
  reducers: {
    setSelectedLeague(state, action: PayloadAction<LeagueType>) {
      state.selectedLeague = action.payload;
    },
    setSelectedPeriod(state, action: PayloadAction<LeaderboardPeriod>) {
      state.selectedPeriod = action.payload;
    },
    clearGamificationError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch streak
      .addCase(fetchStreak.pending, (state) => {
        state.isLoadingStreak = true;
      })
      .addCase(fetchStreak.fulfilled, (state, action) => {
        state.isLoadingStreak = false;
        state.streak = action.payload;
      })
      .addCase(fetchStreak.rejected, (state, action) => {
        state.isLoadingStreak = false;
        state.error = action.payload as string;
      })
      // Fetch leaderboard
      .addCase(fetchLeaderboard.pending, (state) => {
        state.isLoadingLeaderboard = true;
      })
      .addCase(fetchLeaderboard.fulfilled, (state, action) => {
        state.isLoadingLeaderboard = false;
        state.leaderboard = action.payload;
      })
      .addCase(fetchLeaderboard.rejected, (state, action) => {
        state.isLoadingLeaderboard = false;
        state.error = action.payload as string;
      })
      // Fetch badges
      .addCase(fetchBadges.pending, (state) => {
        state.isLoadingBadges = true;
      })
      .addCase(fetchBadges.fulfilled, (state, action) => {
        state.isLoadingBadges = false;
        state.badges = action.payload;
      })
      .addCase(fetchBadges.rejected, (state, action) => {
        state.isLoadingBadges = false;
        state.error = action.payload as string;
      })
      // Fetch badge catalog
      .addCase(fetchBadgeCatalog.pending, (state) => {
        state.isLoadingCatalog = true;
      })
      .addCase(fetchBadgeCatalog.fulfilled, (state, action) => {
        state.isLoadingCatalog = false;
        state.badgeCatalog = action.payload;
      })
      .addCase(fetchBadgeCatalog.rejected, (state, action) => {
        state.isLoadingCatalog = false;
        state.error = action.payload as string;
      })
      // Fetch quests
      .addCase(fetchQuests.pending, (state) => {
        state.isLoadingQuests = true;
      })
      .addCase(fetchQuests.fulfilled, (state, action) => {
        state.isLoadingQuests = false;
        state.quests = action.payload;
      })
      .addCase(fetchQuests.rejected, (state, action) => {
        state.isLoadingQuests = false;
        state.error = action.payload as string;
      })
      // Fetch XP guide
      .addCase(fetchXpGuide.fulfilled, (state, action) => {
        state.xpGuide = action.payload;
      })
      // Freeze streak
      .addCase(freezeStreak.fulfilled, (state, action) => {
        state.streak = action.payload;
      });
  },
});

export const { setSelectedLeague, setSelectedPeriod, clearGamificationError } =
  gamificationSlice.actions;
export default gamificationSlice.reducer;
