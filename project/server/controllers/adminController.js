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

module.exports = {
  getUsers,
  getStats,
  upgradeUser,
  updateStatus
};