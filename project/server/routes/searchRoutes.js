const express = require('express');
const router = express.Router();
const { 
  searchRFQsController, 
  searchManufacturersController, 
  getRecommendationsController, 
  aiSearchController 
} = require('../controllers/searchController');
const { protect } = require('../middlewares/auth');
const { requireUserTypes, requireFeature, requireAnyFeature } = require('../middlewares/accessControl');
const { FEATURE_KEYS } = require('../config/planFeatures');

router.get('/rfqs', protect, requireUserTypes('MANUFACTURER', 'HYBRID'), requireFeature(FEATURE_KEYS.RFQ_POOL_VIEW), searchRFQsController);
router.get('/manufacturers', protect, requireUserTypes('BUYER', 'HYBRID'), requireFeature(FEATURE_KEYS.MFR_DISCOVERY), searchManufacturersController);
router.get('/recommendations', protect, requireAnyFeature(FEATURE_KEYS.AI_SEARCH, FEATURE_KEYS.AI_SEARCH_LIMITED), getRecommendationsController);
router.get('/ai', protect, requireAnyFeature(FEATURE_KEYS.AI_SEARCH, FEATURE_KEYS.AI_SEARCH_LIMITED), aiSearchController);

module.exports = router;

