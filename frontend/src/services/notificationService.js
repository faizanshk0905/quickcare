import api from './api';

export const notificationService = {
  async getNotifications() {
    const res = await api.get('/notifications');
    return res.data;
  },

  async markAsRead(id) {
    const res = await api.put(`/notifications/${id}/read`);
    return res.data;
  },

  async markAllAsRead() {
    const res = await api.put('/notifications/read-all');
    return res.data;
  },

  async getUnreadCount() {
    const res = await api.get('/notifications/unread-count');
    return res.data;
  },
};
