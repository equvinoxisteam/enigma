import axiosInstance from './axios';

export const profileAPI = {
  // Get profile
  get: async () => {
    const response = await axiosInstance.get('/api/profile');
    return response.data;
  },

  // Update profile
  update: async (profileData) => {
    const response = await axiosInstance.put('/api/profile', profileData);
    return response.data;
  },

  // Public manufacturer profile by id
  getPublicManufacturerProfile: async (id) => {
    const response = await axiosInstance.get(`/api/users/public/${id}`);
    return response.data;
  },

  // Get settings
  getSettings: async () => {
    const response = await axiosInstance.get('/api/profile/settings');
    return response.data;
  },

  // Update settings
  updateSettings: async (settingsData) => {
    const response = await axiosInstance.put('/api/profile/settings', settingsData);
    return response.data;
  },

  // Change password
  changePassword: async (payload) => {
    const response = await axiosInstance.put('/api/profile/change-password', payload);
    return response.data;
  },

  toggleSavedManufacturer: async (manufacturerId) => {
    const response = await axiosInstance.post('/api/profile/saved-manufacturers', { manufacturerId });
    return response.data;
  }
};

