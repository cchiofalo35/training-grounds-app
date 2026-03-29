import type { StreakInfo, LeaderboardEntry, LeagueType, ApiResponse } from '@training-grounds/shared';
import api from './api';

export const gamificationService = {
  async getStreak(): Promise<StreakInfo> {
    const response = await api.get<ApiResponse<StreakInfo>>('/gamification/streak');
    return response.data.data;
  },

  async getLeaderboard(league: LeagueType): Promise<LeaderboardEntry[]> {
    const response = await api.get<ApiResponse<LeaderboardEntry[]>>(
      `/gamification/leaderboard?league=${league}`,
    );
    return response.data.data;
  },

  async freezeStreak(): Promise<StreakInfo> {
    const response = await api.post<ApiResponse<StreakInfo>>('/gamification/streak/freeze');
    return response.data.data;
  },
};
