import axios from 'axios';

// Default to localhost:5005 if env variable is not set
const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5005';

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 300000, // 5 minutes — needed for large STL file uploads
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // console.log(`Making ${config.method.toUpperCase()} request to: ${config.baseURL}${config.url}`);
    
    // Try to get token from multiple sources
    const storedToken = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Use token from either dedicated storage or user object
    const token = storedToken || user.token;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('Response interceptor error:', error.response || error);
    
    if (error.response && error.response.status === 401) {
      const requestUrl = error.config?.url || '';
      const isAuthRequest = requestUrl.includes('/api/auth/login') || requestUrl.includes('/api/auth/register');
      const message = error.response?.data?.message || '';

      if (isAuthRequest) {
        return Promise.reject(error);
      }

      // Don't wipe session on verification/feature edge cases during dashboard load
      const keepSession =
        message.includes('Email not verified') ||
        message.includes('plan does not include') ||
        requestUrl.includes('/api/search/recommendations');

      if (!keepSession) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        if (!window.location.pathname.includes('/role-selection') &&
            !window.location.pathname.includes('/login') &&
            !window.location.pathname.includes('/register') &&
            !window.location.pathname.includes('/verify-email') &&
            !window.location.pathname.includes('/forgot-password') &&
            !window.location.pathname.includes('/reset-password')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;