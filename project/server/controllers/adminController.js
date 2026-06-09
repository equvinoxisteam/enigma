const mongoose = require('mongoose');
const User = require('../models/User');
const UpgradeRequest = require('../models/UpgradeRequest');

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
      user.subscription.planType = planType;
      user.subscription.status = 'ACTIVE';
      user.subscription.startsAt = new Date();
      user.subscription.expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year
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
      user.manufacturerSettings.isVerified = req.body.isVerified;
    }

    await user.save();

    // Close any pending upgrade requests for this user/plan
    await UpgradeRequest.updateMany(
      { user: user._id, status: 'PENDING' },
      { status: 'APPROVED', processedAt: new Date() }
    );

    res.json({ message: 'User upgraded successfully', user });
  } catch (error) {
    console.error('upgradeUser error:', error);
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
    user.subscription.planType = planType;
    user.subscription.status = 'ACTIVE';
    user.subscription.startsAt = new Date();
    user.subscription.expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    if (['PRO', 'ENTERPRISE'].includes(planType)) {
      user.manufacturerSettings.isVerified = true;
    }

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
  updateStatus,
  getUpgradeRequests,
  approveUpgradeRequest,
  rejectUpgradeRequest
};