/**
 * Schedule Service
 * Manages API calls for schedule management
 */

import axios from 'axios';
import { WeekSchedule } from '../types/schedule';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const scheduleService = {
  /**
   * Get schedule for a week
   * @param weekStart - Week start date (ISO string)
   */
  getWeekSchedule: async (weekStart: string): Promise<WeekSchedule> => {
    try {
      const response = await axios.get(`${API_URL}/schedules/week`, {
        params: { weekStart }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching week schedule:', error);
      throw error;
    }
  },

  /**
   * Assign staff to a time slot
   * @param date - Schedule date
   * @param timeSlotId - Time slot ID
   * @param staffId - Staff ID
   * @param role - Staff role for this shift
   */
  assignStaff: async (date: string, timeSlotId: string, staffId: string, role: string): Promise<void> => {
    try {
      await axios.post(`${API_URL}/schedules/assign`, {
        date,
        timeSlotId,
        staffId,
        role
      });
    } catch (error) {
      console.error('Error assigning staff:', error);
      throw error;
    }
  },

  /**
   * Remove staff assignment
   * @param assignmentId - Assignment ID to remove
   */
  removeStaffAssignment: async (assignmentId: string): Promise<void> => {
    try {
      await axios.delete(`${API_URL}/schedules/assignments/${assignmentId}`);
    } catch (error) {
      console.error('Error removing staff assignment:', error);
      throw error;
    }
  },

  /**
   * Export schedule to Excel/PDF file
   * @param weekStart - Week start date
   * @param format - Export format ('excel' or 'pdf')
   */
  exportSchedule: async (weekStart: string, format: 'excel' | 'pdf' = 'excel'): Promise<Blob> => {
    try {
      const response = await axios.get(`${API_URL}/schedules/export`, {
        params: { weekStart, format },
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting schedule:', error);
      throw error;
    }
  },

  /**
   * Copy schedule từ tuần này sang tuần khác
   */
  copyWeekSchedule: async (sourceWeek: string, targetWeek: string): Promise<WeekSchedule> => {
    try {
      const response = await axios.post(`${API_URL}/schedules/copy`, {
        sourceWeek,
        targetWeek
      });
      return response.data;
    } catch (error) {
      console.error('Error copying schedule:', error);
      throw error;
    }
  }
};