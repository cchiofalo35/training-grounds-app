import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { AttendanceRecord, Discipline } from '@training-grounds/shared';
import { attendanceService } from '../../services/attendanceService';

interface AttendanceState {
  records: AttendanceRecord[];
  isLoading: boolean;
  isCheckingIn: boolean;
  error: string | null;
  stats: {
    totalClasses: number;
    classesThisMonth: number;
    classesThisWeek: number;
    classesByDiscipline: Record<string, number>;
  };
}

const initialState: AttendanceState = {
  records: [],
  isLoading: false,
  isCheckingIn: false,
  error: null,
  stats: {
    totalClasses: 0,
    classesThisMonth: 0,
    classesThisWeek: 0,
    classesByDiscipline: {},
  },
};

export interface CheckInData {
  classId: string;
  className: string;
  discipline: Discipline;
  intensityRating?: 'light' | 'moderate' | 'high' | 'all-out';
}

export const checkIn = createAsyncThunk(
  'attendance/checkIn',
  async (data: CheckInData, { rejectWithValue }) => {
    try {
      const record = await attendanceService.checkIn(data);
      return record;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Check-in failed';
      return rejectWithValue(message);
    }
  },
);

export const fetchHistory = createAsyncThunk(
  'attendance/fetchHistory',
  async (_, { rejectWithValue }) => {
    try {
      return await attendanceService.getHistory();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load history';
      return rejectWithValue(message);
    }
  },
);

export const fetchStats = createAsyncThunk(
  'attendance/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      return await attendanceService.getStats();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load stats';
      return rejectWithValue(message);
    }
  },
);

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState,
  reducers: {
    clearAttendanceError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Check-in
      .addCase(checkIn.pending, (state) => {
        state.isCheckingIn = true;
        state.error = null;
      })
      .addCase(checkIn.fulfilled, (state, action) => {
        state.isCheckingIn = false;
        state.records.unshift(action.payload);
      })
      .addCase(checkIn.rejected, (state, action) => {
        state.isCheckingIn = false;
        state.error = action.payload as string;
      })
      // Fetch history
      .addCase(fetchHistory.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.records = action.payload;
      })
      .addCase(fetchHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch stats — map backend field names to frontend
      .addCase(fetchStats.fulfilled, (state, action) => {
        state.stats = {
          totalClasses: action.payload.totalClasses,
          classesThisMonth: action.payload.thisMonth,
          classesThisWeek: action.payload.thisWeek,
          classesByDiscipline: action.payload.classesByDiscipline,
        };
      });
  },
});

export const { clearAttendanceError } = attendanceSlice.actions;
export default attendanceSlice.reducer;
