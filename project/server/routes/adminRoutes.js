const express = require('express');
const router = express.Router();
const {
  getUsers,
  getStats,
  upgradeUser,
  updateStatus,
  getUpgradeRequests,
  approveUpgradeRequest,
  rejectUpgradeRequest
} = require('../controllers/adminController');
const { protect, admin } = require('../middlewares/auth');

// @desc    Get all users for admin
// @route   GET /api/admin/users
router.get('/users', protect, admin, getUsers);

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
router.get('/stats', protect, admin, getStats);

// @desc    Update user access/plan
// @route   PUT /api/admin/users/:id/upgrade
router.put('/users/:id/upgrade', protect, admin, upgradeUser);

// @desc    Update user status (Suspend/Activate)
// @route   PUT /api/admin/users/:id/status
router.put('/users/:id/status', protect, admin, updateStatus);

// @route   GET /api/admin/upgrade-requests
router.get('/upgrade-requests', protect, admin, getUpgradeRequests);

// @route   PUT /api/admin/upgrade-requests/:id/approve
router.put('/upgrade-requests/:id/approve', protect, admin, approveUpgradeRequest);

// @route   PUT /api/admin/upgrade-requests/:id/reject
router.put('/upgrade-requests/:id/reject', protect, admin, rejectUpgradeRequest);

module.exports = router;
