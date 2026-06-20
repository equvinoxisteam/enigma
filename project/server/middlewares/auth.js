const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { applyPendingPlanChanges } = require('../utils/subscriptionUtils');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      if (!token || token === 'undefined' || token === 'null') {
        return res.status(401).json({ message: 'Not authorized, invalid token' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      try {
        await applyPendingPlanChanges(user);
      } catch (planError) {
        console.warn('Pending plan apply skipped:', planError.message);
      }

      if (!user.isAdmin && !user.isEmailVerified) {
        return res.status(401).json({
          message: 'Email not verified. Please verify your email to access this resource.',
          requiresVerification: true
        });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('Token verification error:', error.message);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin === true) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as admin' });
  }
};

module.exports = { protect, admin };