import type { StreakInfo, LeaderboardEntry, LeagueType, UserBadge } from '@training-grounds/shared';
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

  async getLeaderboard(_league?: LeagueType): Promise<LeaderboardEntry[]> {
    // Backend returns all users sorted by XP; league filtering done client-side
    const response = await api.get<BackendApiResponse<LeaderboardEntry[]>>(
      '/gamification/leaderboard',
    );
    return response.data.data;
  },

  async getBadges(): Promise<UserBadge[]> {
    const response = await api.get<BackendApiResponse<UserBadge[]>>('/gamification/badges');
    return response.data.data;
  },

  async freezeStreak(): Promise<StreakInfo> {
    const response = await api.post<BackendApiResponse<StreakInfo>>('/gamification/streak/freeze');
    return response.data.data;
  },
};
