import React, { createContext, useContext, useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { Gym } from '@training-grounds/shared';
import type { RootState } from '../redux/store';

interface GymContextValue {
  /** The active gym's full object, or null if none selected */
  gym: Gym | null;
  /** Shortcut to the active gym's ID */
  gymId: string | null;
  /** Whether the user belongs to multiple gyms */
  hasMultipleGyms: boolean;
}

const GymContext = createContext<GymContextValue>({
  gym: null,
  gymId: null,
  hasMultipleGyms: false,
});

interface GymProviderProps {
  children: React.ReactNode;
}

export const GymProvider: React.FC<GymProviderProps> = ({ children }) => {
  const activeGymId = useSelector((state: RootState) => state.gym.activeGymId);
  const gyms = useSelector((state: RootState) => state.gym.gyms);

  const value = useMemo<GymContextValue>(() => {
    const activeGym = gyms.find((g) => g.id === activeGymId) ?? null;
    return {
      gym: activeGym,
      gymId: activeGymId,
      hasMultipleGyms: gyms.length > 1,
    };
  }, [activeGymId, gyms]);

  return (
    <GymContext.Provider value={value}>
      {children}
    </GymContext.Provider>
  );
};

/**
 * Returns the active gym info (id, slug, name, config flags).
 */
export const useGym = (): GymContextValue => useContext(GymContext);
