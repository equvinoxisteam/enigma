import axios from './axios';

const API_URL = '/api/orders';

// Create Razorpay order
const createRazorpayOrder = async (amount, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
  const response = await axios.post(`${API_URL}/create-razorpay-order`, { amount }, config);
  return response.data;
};

// Create new order with payment verification
const createOrder = async (orderData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
  const response = await axios.post(API_URL, orderData, config);
  return response.data;
};

// Verify payment and complete order
const verifyPayment = async (paymentData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
  const response = await axios.post(`${API_URL}/verify-payment`, paymentData, config);
  return response.data;
};

// Verify subscription payment
const verifySubscription = async (paymentData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
  const response = await axios.post(`${API_URL}/verify-subscription`, paymentData, config);
  return response.data;
};

const getOrderById = async (id, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
  const response = await axios.get(`${API_URL}/${id}`, config);
  return response.data;
};

// Get logged in user orders
const getMyOrders = async (token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
  const response = await axios.get(`${API_URL}/myorders`, config);
  return response.data;
};

// Update order to paid
const updateOrderToPaid = async (id, paymentResult, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
  const response = await axios.put(`${API_URL}/${id}/pay`, paymentResult, config);
  return response.data;
};

// Get all orders (Admin)
const getOrders = async (token, { page = 1, limit = 5, search, status }) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    },
    params: { page, limit, search, status } 
  };
  const response = await axios.get(API_URL, config);
  return response.data;
};



// Update order status (Admin)
const updateOrderStatus = async (id, status, token, adminNotes) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
  const payload = { status };
  if (adminNotes) {
    payload.adminNotes = adminNotes;
  }
  const response = await axios.put(`${API_URL}/${id}`, payload, config);
  return response.data;
};

export const orderAPI = {
  createRazorpayOrder,
  createOrder,
  verifyPayment,
  verifySubscription,
  getOrderById,
  getMyOrders,
  updateOrderToPaid,
  getOrders,
  updateOrderStatus
};