import React, { createContext, useContext, useMemo, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { GymTheme } from '@training-grounds/shared';
import type { RootState } from '../redux/store';
import api from '../services/api';
import { getTenantBrand } from '../utils/tenantBranding';

/**
 * DEFAULT_THEME is the pre-auth fallback used before a gym is loaded.
 * It is tenant-aware (resolved from the build's bundle ID) so a locked
 * tenant build — e.g. CrossFit Karuna — shows its own brand color on the
 * login/register screens, not the Training Grounds default.
 * Every component must use useTheme() instead of importing colors directly.
 */
const tenantBrand = getTenantBrand();

export const DEFAULT_THEME: GymTheme = {
  primaryColor: tenantBrand.primaryColor,
  secondaryColor: tenantBrand.backgroundColor,
  surfaceColor: '#2A2A2A',   // darkGrey
  textPrimary: '#FAFAF8',    // offWhite
  textMuted: '#B0B5B8',      // steel
  headingFont: 'BebasNeue',
  bodyFont: 'Inter',
};

const ThemeContext = createContext<GymTheme>(DEFAULT_THEME);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const activeGymId = useSelector((state: RootState) => state.gym.activeGymId);
  const activeGymSlug = useSelector((state: RootState) => {
    const gym = state.gym.gyms.find((g) => g.id === state.gym.activeGymId);
    return gym?.slug;
  });

  const [fetchedTheme, setFetchedTheme] = useState<GymTheme | null>(null);

  useEffect(() => {
    if (!activeGymSlug) {
      setFetchedTheme(null);
      return;
    }

    let cancelled = false;

    const fetchTheme = async () => {
      try {
        const res = await api.get(`/gyms/${activeGymSlug}/theme`);
        if (!cancelled && res.data?.data) {
          const data = res.data.data;
          setFetchedTheme({
            primaryColor: data.primaryColor ?? DEFAULT_THEME.primaryColor,
            secondaryColor: data.secondaryColor ?? DEFAULT_THEME.secondaryColor,
            surfaceColor: data.surfaceColor ?? DEFAULT_THEME.surfaceColor,
            textPrimary: data.textPrimary ?? DEFAULT_THEME.textPrimary,
            textMuted: data.textMuted ?? DEFAULT_THEME.textMuted,
            headingFont: data.headingFont ?? DEFAULT_THEME.headingFont,
            bodyFont: data.bodyFont ?? DEFAULT_THEME.bodyFont,
            logoUrl: data.logoUrl,
          });
        }
      } catch {
        // Fall back to default theme on error
        if (!cancelled) setFetchedTheme(null);
      }
    };

    fetchTheme();
    return () => { cancelled = true; };
  }, [activeGymSlug]);

  const theme = useMemo<GymTheme>(
    () => fetchedTheme ?? DEFAULT_THEME,
    [fetchedTheme],
  );

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Returns the active gym's theme. Components use this instead of
 * importing colors from shared.
 */
export const useTheme = (): GymTheme => useContext(ThemeContext);
