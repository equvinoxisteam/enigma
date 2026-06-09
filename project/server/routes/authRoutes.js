const express = require('express');
const router = express.Router();
const { 
  loginUser, 
  registerUser, 
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
  getMe, 
  updateProfile,
  requestUpgrade
} = require('../controllers/authController');
const { protect } = require('../middlewares/auth');

// Authentication routes
router.post('/login', loginUser);
router.post('/register', registerUser);

// Email verification routes - Accept both GET and POST for verification
router.get('/verify-email', verifyEmail);  // For clicking links
router.post('/verify-email', verifyEmail); // For form submissions
router.post('/resend-verification', resendVerificationEmail);

// Password reset routes
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/upgrade-request', protect, requestUpgrade);

module.exports = router;