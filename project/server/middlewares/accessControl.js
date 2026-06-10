const { hasFeature } = require('../config/planFeatures');

const requireUserTypes = (...allowedTypes) => (req, res, next) => {
  if (!req.user || !allowedTypes.includes(req.user.userType)) {
    return res.status(403).json({
      message: `Access denied. Allowed roles: ${allowedTypes.join(', ')}`
    });
  }
  next();
};

const requireFeature = (featureKey) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  if (!hasFeature(req.user, featureKey)) {
    return res.status(403).json({
      message: `Your current plan does not include ${featureKey}`
    });
  }

  next();
};

const requireAnyFeature = (...featureKeys) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  const allowed = featureKeys.some((key) => hasFeature(req.user, key));
  if (!allowed) {
    return res.status(403).json({
      message: 'Your current plan does not include this feature'
    });
  }

  next();
};

module.exports = {
  requireUserTypes,
  requireFeature,
  requireAnyFeature
};
