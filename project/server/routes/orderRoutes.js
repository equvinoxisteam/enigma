const express = require('express');
const router = express.Router();
const {
  createRazorpayOrder,
  verifyPayment,
  createOrder,
  getOrderById,
  getMyOrders, 
  updateOrderToPaid,
  getOrders,
  updateOrderStatus,
  verifySubscription
} = require('../controllers/orderController');
const { protect, admin } = require('../middlewares/auth');

// Razorpay specific routes
router.post('/create-razorpay-order', protect, createRazorpayOrder);
router.post('/verify-payment', protect, verifyPayment);
router.post('/verify-subscription', protect, verifySubscription);

// Standard order routes
router.route('/')
  .post(protect, createOrder)
  .get(protect, admin, getOrders);

router.get('/myorders', protect, getMyOrders);
router.get('/:id', protect, getOrderById);
router.put('/:id/pay', protect, updateOrderToPaid);
router.put('/:id', protect, admin, updateOrderStatus);

module.exports = router;