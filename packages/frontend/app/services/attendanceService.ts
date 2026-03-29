import type { AttendanceRecord, Discipline } from '@training-grounds/shared';
import api from './api';

interface BackendApiResponse<T> {
  success: boolean;
  data: T;
}

interface AttendanceStats {
  totalClasses: number;
  thisMonth: number;
  thisWeek: number;
  classesByDiscipline: Record<string, number>;
  averagePerWeek: number;
}

interface CheckInParams {
  classId: string;
  className: string;
  discipline: Discipline;
  intensityRating?: 'light' | 'moderate' | 'high' | 'all-out';
}

export const attendanceService = {
  async checkIn(params: CheckInParams): Promise<AttendanceRecord> {
    const response = await api.post<BackendApiResponse<AttendanceRecord>>('/attendance/checkin', params);
    return response.data.data;
  },

  async getHistory(): Promise<AttendanceRecord[]> {
    const response = await api.get<BackendApiResponse<AttendanceRecord[]>>('/attendance/history');
    return response.data.data;
  },

  async getStats(): Promise<AttendanceStats> {
    const response = await api.get<BackendApiResponse<AttendanceStats>>('/attendance/stats');
    return response.data.data;
  },
};
