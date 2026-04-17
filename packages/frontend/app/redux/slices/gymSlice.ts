import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import * as SecureStore from 'expo-secure-store';
import * as Application from 'expo-application';
import type { Gym, GymMembership } from '@training-grounds/shared';
import api from '../../services/api';

/**
 * Map iOS bundle IDs / Android package names to a gym slug.
 *
 * When the app is installed as a tenant-specific build (e.g. `CrossFitKaruna.app`),
 * the bundle ID tells us which gym to auto-lock to. The gym selector is bypassed.
 *
 * For the default multi-tenant build (`com.traininggrounds.app`) the user picks
 * a gym from the selector as before.
 */
const BUNDLE_ID_TO_GYM_SLUG: Record<string, string> = {
  'com.crossfitkaruna.app': 'crossfit-karuna',
  'com.traininggrounds.app': 'training-grounds',
};

function getLockedGymSlug(): string | null {
  const bundleId = Application.applicationId;
  if (!bundleId) return null;
  return BUNDLE_ID_TO_GYM_SLUG[bundleId] ?? null;
}

interface GymState {
  activeGymId: string | null;
  gyms: Gym[];
  memberships: GymMembership[];
  isLoading: boolean;
  error: string | null;
}

const initialState: GymState = {
  activeGymId: null,
  gyms: [],
  memberships: [],
  isLoading: false,
  error: null,
};

/** Fetch gyms the current user belongs to */
export const fetchUserGyms = createAsyncThunk(
  'gym/fetchUserGyms',
  async () => {
    const res = await api.get('/gyms');
    // API returns { success, data: Gym[], meta } — extract the array
    const gyms = (Array.isArray(res.data.data) ? res.data.data : res.data.data?.gyms ?? []) as Gym[];
    const memberships = (res.data.data?.memberships ?? []) as GymMembership[];
    // Try to restore previously selected gym
    const savedGymId = await SecureStore.getItemAsync('active_gym_id');
    return { gyms, memberships, savedGymId };
  },
);

/** Switch the active gym and persist the selection */
export const switchGym = createAsyncThunk(
  'gym/switchGym',
  async (gymId: string) => {
    await SecureStore.setItemAsync('active_gym_id', gymId);
    return gymId;
  },
);

/** Clear persisted gym selection (used on logout) */
export const clearPersistedGym = createAsyncThunk(
  'gym/clearPersisted',
  async () => {
    await SecureStore.deleteItemAsync('active_gym_id');
  },
);

const gymSlice = createSlice({
  name: 'gym',
  initialState,
  reducers: {
    setActiveGym(state, action: PayloadAction<string>) {
      state.activeGymId = action.payload;
    },
    clearGymState(state) {
      state.activeGymId = null;
      state.gyms = [];
      state.memberships = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserGyms.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserGyms.fulfilled, (state, action) => {
        state.isLoading = false;
        state.gyms = action.payload.gyms;
        state.memberships = action.payload.memberships;
        const { savedGymId, gyms } = action.payload;

        // Tenant-locked build? Always select the gym matching this bundle ID,
        // ignoring any saved selection or selector UI.
        const lockedSlug = getLockedGymSlug();
        if (lockedSlug) {
          const locked = gyms.find((g) => g.slug === lockedSlug);
          if (locked) {
            state.activeGymId = locked.id;
            return;
          }
        }

        if (!state.activeGymId && gyms.length > 0) {
          const savedExists = savedGymId && gyms.some((g) => g.id === savedGymId);
          if (savedExists) {
            state.activeGymId = savedGymId;
          } else if (gyms.length === 1) {
            state.activeGymId = gyms[0].id;
          }
          // If multiple gyms and no saved selection, leave null so GymGate shows selector
        }
      })
      .addCase(fetchUserGyms.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message ?? 'Failed to fetch gyms';
      })
      .addCase(switchGym.fulfilled, (state, action) => {
        state.activeGymId = action.payload;
      })
      .addCase(clearPersistedGym.fulfilled, (state) => {
        state.activeGymId = null;
        state.gyms = [];
        state.memberships = [];
        state.error = null;
      });
  },
});

export const { setActiveGym, clearGymState } = gymSlice.actions;
export default gymSlice.reducer;
