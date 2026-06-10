const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { getProfile, updateProfile, getSettings, updateSettings, changePassword, toggleSavedManufacturer } = require('../controllers/profileController');

// GET /api/profile - Get user profile
router.get('/', protect, getProfile);

// PUT /api/profile - Update user profile
router.put('/', protect, updateProfile);
router.get('/settings', protect, getSettings);
router.put('/settings', protect, updateSettings);
router.put('/change-password', protect, changePassword);
router.post('/saved-manufacturers', protect, toggleSavedManufacturer);

module.exports = router;
