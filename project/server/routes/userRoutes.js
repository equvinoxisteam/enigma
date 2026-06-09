const express = require('express');
const router = express.Router();
const { getUsers, getStats } = require('../controllers/adminController');
const { getProfile, updateProfile, getPublicManufacturerProfile } = require('../controllers/profileController');
const { protect, admin } = require('../middlewares/auth');

// Profile routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.get('/public/:id', protect, getPublicManufacturerProfile);

// Admin routes
router.get('/', protect, admin, getUsers);
router.get('/dashboard', protect, admin, getStats);

module.exports = router;