import axios from './axios';

const API_URL = '/api/notifications';

export const notificationAPI = {
  // Get all notifications (paginated)
  getAll: async (page = 1, limit = 20) => {
    const response = await axios.get(`${API_URL}?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Get unread count
  getUnreadCount: async () => {
    const response = await axios.get(`${API_URL}/unread-count`);
    return response.data;
  },

  // Mark one notification as read
  markAsRead: async (id) => {
    const response = await axios.put(`${API_URL}/${id}/read`);
    return response.data;
  },

  // Mark all as read
  markAllAsRead: async () => {
    const response = await axios.put(`${API_URL}/read-all`);
    return response.data;
  }
};
