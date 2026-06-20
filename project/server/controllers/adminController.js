const mongoose = require('mongoose');
const User = require('../models/User');
const UpgradeRequest = require('../models/UpgradeRequest');
const { PLAN_TYPES } = require('../config/planFeatures');
const {
  activatePlan,
  schedulePlanDowngrade,
  isDowngrade,
  applyPendingPlanChanges
} = require('../utils/subscriptionUtils');

// @desc    Get all users for admin
// @route   GET /api/admin/users
const getUsers = async (req, res) => {
  try {
    const users = await User.find({ isAdmin: { $ne: true } }).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('getUsers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
const getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ isAdmin: { $ne: true } });
    const totalManufacturers = await User.countDocuments({ userType: 'MANUFACTURER' });
    const totalBuyers = await User.countDocuments({ userType: 'BUYER' });
    const totalHybrid = await User.countDocuments({ userType: 'HYBRID' });
    const pendingUpgradeRequests = await UpgradeRequest.countDocuments({ status: 'PENDING' });

    res.json({
      totalUsers,
      totalManufacturers,
      totalBuyers,
      totalHybrid,
      pendingUpgradeRequests
    });
  } catch (error) {
    console.error('getStats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user access/plan
// @route   PUT /api/admin/users/:id/upgrade
const upgradeUser = async (req, res) => {
  try {
    const { planType, userType, manufacturerStatus } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (planType) {
      const nextPlan = planType.toUpperCase();
      const currentPlan = user.subscription?.planType || PLAN_TYPES.FREE;

      if (isDowngrade(currentPlan, nextPlan)) {
        schedulePlanDowngrade(user, nextPlan);
      } else {
        activatePlan(user, nextPlan);
      }
    }

    if (userType) {
      user.userType = userType;
    }

    if (manufacturerStatus) {
      user.manufacturerStatus = manufacturerStatus;
      if (manufacturerStatus === 'ACTIVE') {
        user.status = 'ACTIVE';
      }
    }

    if (req.body.isVerified !== undefined) {
      user.manufacturerSettings = user.manufacturerSettings || {};
      user.manufacturerSettings.isVerified = req.body.isVerified;
    }

    await user.save();

    await UpgradeRequest.updateMany(
      { user: user._id, status: 'PENDING' },
      { status: 'APPROVED', processedAt: new Date() }
    );

    res.json({ message: 'User plan updated successfully', user });
  } catch (error) {
    console.error('upgradeUser error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Manage subscription (pause / deactivate / remove / reactivate)
// @route   PUT /api/admin/users/:id/subscription
const manageSubscription = async (req, res) => {
  try {
    const { action, planType } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await applyPendingPlanChanges(user);

    switch (action) {
      case 'approve':
      case 'activate': {
        const next = (planType || user.subscription?.planType || PLAN_TYPES.STANDARD).toUpperCase();
        activatePlan(user, next);
        if (user.userType === 'MANUFACTURER' || user.userType === 'HYBRID') {
          user.manufacturerStatus = 'ACTIVE';
          user.status = 'ACTIVE';
        }
        break;
      }
      case 'pause':
        user.subscription.status = 'PAUSED';
        user.subscription.pausedAt = new Date();
        break;
      case 'deactivate':
        user.subscription.status = 'DEACTIVATED';
        user.subscription.deactivatedAt = new Date();
        break;
      case 'remove':
      case 'downgrade':
        schedulePlanDowngrade(user, (planType || PLAN_TYPES.FREE).toUpperCase());
        break;
      case 'reactivate':
        user.subscription.status = 'ACTIVE';
        user.subscription.pausedAt = null;
        user.subscription.deactivatedAt = null;
        break;
      default:
        return res.status(400).json({ message: 'Invalid action. Use approve, pause, deactivate, remove, or reactivate.' });
    }

    await user.save();
    res.json({ message: `Subscription ${action} applied`, user });
  } catch (error) {
    console.error('manageSubscription error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user status (Suspend/Activate)
// @route   PUT /api/admin/users/:id/status
const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.status = status;
    await user.save();

    res.json({ message: 'User status updated successfully', user });
  } catch (error) {
    console.error('updateStatus error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get pending upgrade requests
// @route   GET /api/admin/upgrade-requests
const getUpgradeRequests = async (req, res) => {
  try {
    const status = req.query.status || 'PENDING';
    const requests = await UpgradeRequest.find({ status })
      .populate('user', 'fullName email companyName userType subscription')
      .sort({ requestedAt: -1 });
    res.json(requests);
  } catch (error) {
    console.error('getUpgradeRequests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Approve upgrade request and assign plan
// @route   PUT /api/admin/upgrade-requests/:id/approve
const approveUpgradeRequest = async (req, res) => {
  try {
    const request = await UpgradeRequest.findById(req.params.id).populate('user');
    if (!request) {
      return res.status(404).json({ message: 'Upgrade request not found' });
    }

    const user = await User.findById(request.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const planType = (req.body.planType || request.planName || 'STANDARD').toUpperCase();
    activatePlan(user, planType);

    if (user.userType === 'MANUFACTURER' || user.userType === 'HYBRID') {
      user.manufacturerStatus = 'ACTIVE';
      user.status = 'ACTIVE';
    }

    await user.save();

    await UpgradeRequest.updateMany(
      { user: user._id, status: 'PENDING' },
      { status: 'APPROVED', processedAt: new Date() }
    );

    res.json({ message: 'Upgrade request approved', user, request });
  } catch (error) {
    console.error('approveUpgradeRequest error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Reject upgrade request
// @route   PUT /api/admin/upgrade-requests/:id/reject
const rejectUpgradeRequest = async (req, res) => {
  try {
    const request = await UpgradeRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Upgrade request not found' });
    }
    request.status = 'REJECTED';
    request.processedAt = new Date();
    await request.save();
    res.json({ message: 'Upgrade request rejected', request });
  } catch (error) {
    console.error('rejectUpgradeRequest error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getUsers,
  getStats,
  upgradeUser,
  manageSubscription,
  updateStatus,
  getUpgradeRequests,
  approveUpgradeRequest,
  rejectUpgradeRequest
};
