import type { AttendanceRecord, ApiResponse } from '@training-grounds/shared';
import api from './api';

interface AttendanceStats {
  totalClasses: number;
  classesThisMonth: number;
  classesThisWeek: number;
}

export const attendanceService = {
  async checkIn(classId: string, qrCode?: string): Promise<AttendanceRecord> {
    const response = await api.post<ApiResponse<AttendanceRecord>>('/attendance/check-in', {
      classId,
      qrCode,
    });
    return response.data.data;
  },

  async getHistory(): Promise<AttendanceRecord[]> {
    const response = await api.get<ApiResponse<AttendanceRecord[]>>('/attendance/history');
    return response.data.data;
  },

  async getStats(): Promise<AttendanceStats> {
    const response = await api.get<ApiResponse<AttendanceStats>>('/attendance/stats');
    return response.data.data;
  },
};
