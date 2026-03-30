import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { JournalEntry } from '@training-grounds/shared';
import { journalService, type CreateJournalData } from '../../services/journalService';

interface JournalState {
  entries: JournalEntry[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
}

const initialState: JournalState = {
  entries: [],
  isLoading: false,
  isSaving: false,
  error: null,
};

export const fetchJournalEntries = createAsyncThunk(
  'journal/fetchEntries',
  async (_, { rejectWithValue }) => {
    try {
      return await journalService.getEntries();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load journal';
      return rejectWithValue(message);
    }
  },
);

export const createJournalEntry = createAsyncThunk(
  'journal/createEntry',
  async (data: CreateJournalData, { rejectWithValue }) => {
    try {
      return await journalService.createEntry(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to save entry';
      return rejectWithValue(message);
    }
  },
);

export const deleteJournalEntry = createAsyncThunk(
  'journal/deleteEntry',
  async (id: string, { rejectWithValue }) => {
    try {
      await journalService.deleteEntry(id);
      return id;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete entry';
      return rejectWithValue(message);
    }
  },
);

const journalSlice = createSlice({
  name: 'journal',
  initialState,
  reducers: {
    clearJournalError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchJournalEntries.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchJournalEntries.fulfilled, (state, action) => {
        state.isLoading = false;
        state.entries = action.payload;
      })
      .addCase(fetchJournalEntries.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createJournalEntry.pending, (state) => {
        state.isSaving = true;
      })
      .addCase(createJournalEntry.fulfilled, (state, action) => {
        state.isSaving = false;
        state.entries.unshift(action.payload);
      })
      .addCase(createJournalEntry.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload as string;
      })
      .addCase(deleteJournalEntry.fulfilled, (state, action) => {
        state.entries = state.entries.filter((e) => e.id !== action.payload);
      });
  },
});

export const { clearJournalError } = journalSlice.actions;
export default journalSlice.reducer;
