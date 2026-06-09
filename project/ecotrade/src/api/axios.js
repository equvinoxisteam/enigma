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

      // Don't force redirect for expected auth failures (invalid credentials / unverified email)
      if (isAuthRequest) {
        return Promise.reject(error);
      }

      // Handle unauthorized access - clear user data
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      // Only redirect if not already on auth pages
      if (!window.location.pathname.includes('/role-selection') && 
          !window.location.pathname.includes('/login') &&
          !window.location.pathname.includes('/register') &&
          !window.location.pathname.includes('/verify-email') &&
          !window.location.pathname.includes('/forgot-password') &&
          !window.location.pathname.includes('/reset-password')) {
        window.location.href = '/role-selection';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;