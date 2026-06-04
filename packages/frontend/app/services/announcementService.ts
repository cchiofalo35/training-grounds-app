import api from './api';

export interface Announcement {
  id: string;
  gymId: string;
  title: string;
  body: string;
  createdBy: string | null;
  createdByName: string | null;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const announcementService = {
  /** Active, non-expired announcements for the current gym (home banner). */
  async getActive(): Promise<Announcement[]> {
    const res = await api.get('/announcements/active');
    return res.data?.data ?? [];
  },
};
