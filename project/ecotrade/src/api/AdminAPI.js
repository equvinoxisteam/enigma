import axios from './axios';

const API_URL = '/api/admin';

// Get dashboard stats
const getDashboardStats = async (token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
  const response = await axios.get(`${API_URL}/stats`, config);
  return response.data;
};

// Get all users
const getUsers = async (token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
  const response = await axios.get(`${API_URL}/users`, config);
  return response.data;
};

// Upgrade user plan/access
const upgradeUser = async (userId, data, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
  const response = await axios.put(`${API_URL}/users/${userId}/upgrade`, data, config);
  return response.data;
};

// Update user status (Suspend/Activate)
const updateStatus = async (userId, status, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
  const response = await axios.put(`${API_URL}/users/${userId}/status`, { status }, config);
  return response.data;
};

const getUpgradeRequests = async (token, status = 'PENDING') => {
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const response = await axios.get(`${API_URL}/upgrade-requests?status=${status}`, config);
  return response.data;
};

const approveUpgradeRequest = async (id, token, planType) => {
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const response = await axios.put(`${API_URL}/upgrade-requests/${id}/approve`, { planType }, config);
  return response.data;
};

const rejectUpgradeRequest = async (id, token) => {
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const response = await axios.put(`${API_URL}/upgrade-requests/${id}/reject`, {}, config);
  return response.data;
};

const manageSubscription = async (userId, data, token) => {
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const response = await axios.put(`${API_URL}/users/${userId}/subscription`, data, config);
  return response.data;
};

export const adminAPI = {
  getDashboardStats,
  getUsers,
  upgradeUser,
  updateStatus,
  getUpgradeRequests,
  approveUpgradeRequest,
  rejectUpgradeRequest,
  manageSubscription
};