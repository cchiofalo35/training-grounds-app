import type { JournalEntry } from '@training-grounds/shared';
import api from './api';

interface BackendApiResponse<T> {
  success: boolean;
  data: T;
}

export interface CreateJournalData {
  attendanceId?: string;
  className?: string;
  discipline?: string;
  exploration: string;
  challenge: string;
  worked: string;
  takeaways: string;
  nextSession: string;
  isSharedWithCoach?: boolean;
}

export const journalService = {
  async getEntries(): Promise<JournalEntry[]> {
    const response = await api.get<BackendApiResponse<JournalEntry[]>>('/journal');
    return response.data.data;
  },

  async getEntry(id: string): Promise<JournalEntry> {
    const response = await api.get<BackendApiResponse<JournalEntry>>(`/journal/${id}`);
    return response.data.data;
  },

  async createEntry(data: CreateJournalData): Promise<JournalEntry> {
    const response = await api.post<BackendApiResponse<JournalEntry>>('/journal', data);
    return response.data.data;
  },

  async updateEntry(id: string, data: Partial<CreateJournalData>): Promise<JournalEntry> {
    const response = await api.patch<BackendApiResponse<JournalEntry>>(`/journal/${id}`, data);
    return response.data.data;
  },

  async deleteEntry(id: string): Promise<void> {
    await api.delete(`/journal/${id}`);
  },
};
