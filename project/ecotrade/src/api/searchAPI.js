import axiosInstance from './axios';

export const searchAPI = {
  // Search RFQs
  searchRFQs: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        if (Array.isArray(filters[key])) {
          filters[key].forEach(val => params.append(key, val));
        } else {
          params.append(key, filters[key]);
        }
      }
    });
    const response = await axiosInstance.get(`/api/search/rfqs?${params.toString()}`);
    return response.data;
  },

  // Search Manufacturers
  searchManufacturers: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        if (Array.isArray(filters[key])) {
          filters[key].forEach(val => params.append(key, val));
        } else {
          params.append(key, filters[key]);
        }
      }
    });
    const response = await axiosInstance.get(`/api/search/manufacturers?${params.toString()}`);
    return response.data;
  },

  // Get AI Recommendations
  getRecommendations: async () => {
    const response = await axiosInstance.get('/api/search/recommendations');
    return response.data;
  },

  // Perform AI Search
  aiSearch: async (query) => {
    const response = await axiosInstance.get(`/api/search/ai?query=${encodeURIComponent(query)}`);
    return response.data;
  }
};

