import api from './api';

const NOTIFICATIONS_STORAGE_KEY = 'quickcare_shared_notifications';

const getLocalNotifications = () => {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

const saveLocalNotifications = (list) => {
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(list));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('quickcare_notifications_updated'));
    }
  } catch (e) {}
};

export const notificationService = {
  async getNotifications() {
    let remoteList = [];
    try {
      const res = await api.get('/notifications');
      if (res && res.data && Array.isArray(res.data.data || res.data)) {
        remoteList = res.data.data || res.data;
      }
    } catch (err) {}

    // Resolve current user identity
    let currentUid = null;
    let currentEmail = null;
    try {
      const rawUser = localStorage.getItem('quickcare_current_user') || localStorage.getItem('quickcare_demo_user');
      if (rawUser) {
        const u = JSON.parse(rawUser);
        currentUid = u.userId || u.uid;
        currentEmail = (u.email || '').toLowerCase().trim();
      }
    } catch (e) {}

    if (!currentUid && !currentEmail) {
      return { success: true, data: [] };
    }

    const localList = getLocalNotifications();
    const remoteIds = new Set(remoteList.map((n) => n.notificationId));
    const merged = [...localList.filter((l) => !remoteIds.has(l.notificationId)), ...remoteList];

    // Filter strictly for this recipient
    const filtered = merged.filter((n) => {
      const rUid = n.recipientUid;
      const rEmail = (n.recipientEmail || '').toLowerCase().trim();
      const matchUid = currentUid && (rUid === currentUid || rUid === `doc_${currentUid}`);
      const matchEmail = currentEmail && rEmail && rEmail === currentEmail;
      return matchUid || matchEmail;
    });

    return { success: true, data: filtered };
  },

  async markAsRead(id) {
    const list = getLocalNotifications();
    const idx = list.findIndex((n) => n.notificationId === id);
    if (idx !== -1) {
      list[idx].isRead = true;
      saveLocalNotifications(list);
    }
    try {
      const res = await api.put(`/notifications/${id}/read`);
      return res.data;
    } catch (err) {
      return { success: true, message: 'Notification marked as read' };
    }
  },

  async markAllAsRead() {
    let currentUid = null;
    let currentEmail = null;
    try {
      const rawUser = localStorage.getItem('quickcare_current_user') || localStorage.getItem('quickcare_demo_user');
      if (rawUser) {
        const u = JSON.parse(rawUser);
        currentUid = u.userId || u.uid;
        currentEmail = (u.email || '').toLowerCase().trim();
      }
    } catch (e) {}

    const list = getLocalNotifications();
    const updated = list.map((n) => {
      const match =
        (currentUid && (n.recipientUid === currentUid || n.recipientUid === `doc_${currentUid}`)) ||
        (currentEmail && n.recipientEmail?.toLowerCase().trim() === currentEmail);
      return match ? { ...n, isRead: true } : n;
    });
    saveLocalNotifications(updated);

    try {
      const res = await api.put('/notifications/read-all');
      return res.data;
    } catch (err) {
      return { success: true, message: 'All notifications marked as read' };
    }
  },

  async getUnreadCount() {
    const res = await this.getNotifications();
    const count = (res?.data || []).filter((n) => !n.isRead).length;
    return { success: true, data: { count } };
  },
};
