import axios from './axios';

const API_URL = '/api/auth';

export const login = async (userData) => {
  const response = await axios.post(`${API_URL}/login`, userData);
  if (response.data && response.data.token) {
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data));
  }
  return response.data;
};

export const register = async (userData) => {
  const response = await axios.post(`${API_URL}/register`, userData);
  return response.data;
};

export const verifyEmail = async (token) => {
  const response = await axios.get(`${API_URL}/verify-email?token=${token}`);
  return response.data;
};

export const resendVerificationEmail = async (email) => {
  const response = await axios.post(`${API_URL}/resend-verification`, { email });
  return response.data;
};

export const forgotPassword = async (emailData) => {
  // Accept either string or object
  const email = typeof emailData === 'string' ? emailData : emailData.email;
  const response = await axios.post(`${API_URL}/forgot-password`, { email });
  return response.data;
};

export const resetPassword = async (token, newPassword, confirmPassword) => {
  const response = await axios.post(`${API_URL}/reset-password`, { token, newPassword, confirmPassword });
  return response.data;
};

export const getMe = async () => {
  // Token will be automatically added by axios interceptor from localStorage
  const response = await axios.get(`${API_URL}/me`);
  return response.data;
};

export const updateProfile = async (userData, token) => {
  const config = {
    headers: { Authorization: `Bearer ${token}` }
  };
  const response = await axios.put(`${API_URL}/profile`, userData, config);
  if (response.data) {
    localStorage.setItem('user', JSON.stringify(response.data));
  }
  return response.data;
};

export const requestUpgrade = async (planData) => {
  const response = await axios.post(`${API_URL}/upgrade-request`, planData);
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
};

export const authAPI = {
  login,
  register,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
  logout,
  requestUpgrade
};