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

  async getLeaderboard(
    period: LeaderboardPeriod = 'all-time',
    league?: LeagueType,
  ): Promise<LeaderboardEntry[]> {
    const params: Record<string, string> = { period };
    if (league) params.league = league;
    const response = await api.get<BackendApiResponse<LeaderboardEntry[]>>(
      '/gamification/leaderboard',
      { params },
    );
    return response.data.data;
  },

  async getBadges(): Promise<UserBadge[]> {
    const response = await api.get<BackendApiResponse<UserBadge[]>>('/gamification/badges');
    return response.data.data;
  },

  async getBadgeCatalog(): Promise<BadgeCatalogEntry[]> {
    const response = await api.get<BackendApiResponse<BadgeCatalogEntry[]>>(
      '/gamification/badges/catalog',
    );
    return response.data.data;
  },

  async freezeStreak(): Promise<StreakInfo> {
    const response = await api.post<BackendApiResponse<StreakInfo>>('/gamification/streak/freeze');
    return response.data.data;
  },

  async getQuests(): Promise<QuestWithProgress[]> {
    const response = await api.get<BackendApiResponse<QuestWithProgress[]>>(
      '/gamification/quests',
    );
    return response.data.data;
  },

  async getXpGuide(): Promise<XpGuide> {
    const response = await api.get<BackendApiResponse<XpGuide>>('/gamification/xp-guide');
    return response.data.data;
  },
};
