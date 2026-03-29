import type { StreakInfo, LeaderboardEntry, LeagueType } from '@training-grounds/shared';
import api from './api';

interface BackendApiResponse<T> {
  success: boolean;
  data: T;
}

export const gamificationService = {
  async getStreak(): Promise<StreakInfo> {
    const response = await api.get<BackendApiResponse<StreakInfo>>('/gamification/streak');
    return response.data.data;
  },

  async getLeaderboard(league: LeagueType): Promise<LeaderboardEntry[]> {
    const response = await api.get<BackendApiResponse<LeaderboardEntry[]>>(
      `/gamification/leaderboard?league=${league}`,
    );
    return response.data.data;
  },

  async freezeStreak(): Promise<StreakInfo> {
    const response = await api.post<BackendApiResponse<StreakInfo>>('/gamification/streak/freeze');
    return response.data.data;
  },
};
