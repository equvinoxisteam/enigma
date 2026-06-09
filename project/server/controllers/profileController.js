const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @desc    Get user profile
// @route   GET /api/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -emailVerificationToken -passwordResetToken');

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const {
      companyName,
      website,
      companyLogo,
      companyBanner,
      industryVertical,
      buyerSettings,
      manufacturerSettings,
      primaryMaterials,
      certifications,
      maxDimensions,
      regionsServed,
      languages,
      country,
      companySize
    } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update company info
    if (companyName !== undefined) user.companyName = companyName;
    if (website !== undefined) user.website = website;
    if (companyLogo !== undefined) user.companyLogo = companyLogo;
    if (companyBanner !== undefined) user.companyBanner = companyBanner;
    if (industryVertical !== undefined) user.industryVertical = industryVertical;
    if (country !== undefined) user.country = country;
    if (companySize !== undefined) user.companySize = companySize;

    // Update buyer settings
    if (buyerSettings) {
      user.buyerSettings = { ...user.buyerSettings, ...buyerSettings };
    }

    // Update manufacturer settings
    if (manufacturerSettings) {
      user.manufacturerSettings = { ...user.manufacturerSettings, ...manufacturerSettings };
    }

    // Update manufacturer profile fields
    if (primaryMaterials !== undefined) user.primaryMaterials = primaryMaterials;
    if (certifications !== undefined) user.certifications = certifications;
    if (maxDimensions !== undefined) user.maxDimensions = maxDimensions;

    // Calculate profile completeness
    let completeness = 0;
    const fields = [
      user.companyName,
      user.address,
      user.city,
      user.state,
      user.zipCode,
      user.country
    ];
    completeness += fields.filter(f => f).length * 5;

    if (user.userType === 'BUYER' || user.userType === 'HYBRID') {
      if (user.buyerSettings?.preferredCurrency) completeness += 5;
      if (user.buyerSettings?.defaultCountry) completeness += 5;
    }

    if (user.userType === 'MANUFACTURER' || user.userType === 'HYBRID') {
      if (user.manufacturingTypes?.length > 0) completeness += 10;
      if (user.primaryMaterials?.length > 0) completeness += 10;
      if (user.certifications?.length > 0) completeness += 10;
      if (user.maxDimensions?.length > 0 || user.maxDimensions?.width > 0) completeness += 10;
    }

    user.profileCompleteness = Math.min(completeness, 100);

    await user.save();

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// @desc    Get public manufacturer profile
// @route   GET /api/users/public/:id
// @access  Private
const getPublicManufacturerProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      'userType manufacturerStatus companyName companyLogo companyBanner fullName country region companySize description manufacturingTypes certifications manufacturerSettings primaryMaterials profileCompleteness'
    );

    if (!user) {
      return res.status(404).json({ message: 'Manufacturer not found' });
    }

    if (!(user.userType === 'MANUFACTURER' || user.userType === 'HYBRID')) {
      return res.status(400).json({ message: 'Requested profile is not a manufacturer' });
    }

    if (user.manufacturerStatus !== 'ACTIVE') {
      return res.status(403).json({ message: 'Manufacturer profile is not active' });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get public manufacturer profile error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// @desc    Get user settings
// @route   GET /api/profile/settings
// @access  Private
const getSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      'twoFactorEnabled notificationSettings preferences buyerSettings'
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      data: {
        twoFactorEnabled: user.twoFactorEnabled || false,
        emailNotifications: user.notificationSettings?.email || {},
        inAppNotifications: user.notificationSettings?.inApp || {},
        preferences: {
          currency: user.preferences?.currency || user.buyerSettings?.preferredCurrency || 'USD',
          language: user.preferences?.language || 'English',
          timezone: user.preferences?.timezone || 'UTC',
          theme: user.preferences?.theme || 'light'
        }
      }
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// @desc    Update user settings
// @route   PUT /api/profile/settings
// @access  Private
const updateSettings = async (req, res) => {
  try {
    const { twoFactorEnabled, emailNotifications, inAppNotifications, preferences } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (twoFactorEnabled !== undefined) {
      user.twoFactorEnabled = Boolean(twoFactorEnabled);
    }

    if (emailNotifications) {
      user.notificationSettings.email = {
        ...user.notificationSettings?.email,
        ...emailNotifications
      };
    }

    if (inAppNotifications) {
      user.notificationSettings.inApp = {
        ...user.notificationSettings?.inApp,
        ...inAppNotifications
      };
    }

    if (preferences) {
      user.preferences = {
        ...user.preferences,
        ...preferences
      };
      if (preferences.currency) {
        user.buyerSettings.preferredCurrency = preferences.currency;
      }
    }

    await user.save();

    res.json({
      success: true,
      data: {
        twoFactorEnabled: user.twoFactorEnabled,
        emailNotifications: user.notificationSettings?.email || {},
        inAppNotifications: user.notificationSettings?.inApp || {},
        preferences: user.preferences || {}
      }
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// @desc    Change password
// @route   PUT /api/profile/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'All password fields are required' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }
    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/\d/.test(newPassword) || !/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      return res.status(400).json({ message: 'New password must include uppercase, lowercase, number, and special character' });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getPublicManufacturerProfile,
  getSettings,
  updateSettings,
  changePassword
};

