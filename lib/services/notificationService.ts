import axiosInstance from "./axiosInstance";

export interface NotificationItem {
  id: string;
  recipientId: string | null;
  notificationType: string;
  isBroadcast: boolean;
  title: string;
  message: string;
  imageUrl: string | null;
  priority: string;
  isPublished: boolean;
  expiryDate: string | null;
  createdDate: string | null;
  modifiedDate: string | null;
}

const notificationService = {
  requestTable: async (tableId: string, message: string): Promise<void> => {
    await axiosInstance.post(
      `/notifications/request/table/${tableId}?title=${encodeURIComponent(message)}`,
    );
  },

  getMyNotifications: async (): Promise<NotificationItem[]> => {
    const res = await axiosInstance.get<NotificationItem[]>(
      "/notifications/recipient",
    );
    return res.data;
  },
};

export default notificationService;
