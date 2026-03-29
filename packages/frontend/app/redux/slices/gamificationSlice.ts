import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { StreakInfo, LeaderboardEntry, LeagueType } from '@training-grounds/shared';
import { gamificationService } from '../../services/gamificationService';

interface GamificationState {
  streak: StreakInfo | null;
  leaderboard: LeaderboardEntry[];
  selectedLeague: LeagueType;
  isLoadingStreak: boolean;
  isLoadingLeaderboard: boolean;
  error: string | null;
}

const initialState: GamificationState = {
  streak: null,
  leaderboard: [],
  selectedLeague: 'bronze',
  isLoadingStreak: false,
  isLoadingLeaderboard: false,
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
  async (league: LeagueType, { rejectWithValue }) => {
    try {
      return await gamificationService.getLeaderboard(league);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load leaderboard';
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
      // Freeze streak
      .addCase(freezeStreak.fulfilled, (state, action) => {
        state.streak = action.payload;
      });
  },
});

export const { setSelectedLeague, clearGamificationError } = gamificationSlice.actions;
export default gamificationSlice.reducer;
