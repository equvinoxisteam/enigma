const express = require('express');
const router = express.Router();
const {
  createRFQ,
  getRFQById,
  updateRFQ,
  deleteRFQ,
  getRFQPool,
  requestRFQ,
  acceptManufacturer,
  rejectManufacturer,
  updateRFQStatus,
  getAcceptedRFQs,
  getMyRFQs
} = require('../controllers/rfqController');
const { protect } = require('../middlewares/auth');
const { requireUserTypes, requireFeature } = require('../middlewares/accessControl');
const { FEATURE_KEYS } = require('../config/planFeatures');

// All routes require authentication
router.use(protect);

// RFQ CRUD
router.post('/', requireUserTypes('BUYER', 'HYBRID'), requireFeature(FEATURE_KEYS.RFQ_CREATE), createRFQ);
router.get('/my-rfqs', getMyRFQs);
router.get('/pool', requireUserTypes('MANUFACTURER', 'HYBRID'), requireFeature(FEATURE_KEYS.RFQ_POOL_VIEW), getRFQPool);
router.get('/accepted', requireUserTypes('MANUFACTURER', 'HYBRID'), getAcceptedRFQs);
router.get('/:id', getRFQById);
router.put('/:id', requireUserTypes('BUYER', 'HYBRID'), updateRFQ);
router.delete('/:id', requireUserTypes('BUYER', 'HYBRID'), deleteRFQ);

// RFQ Actions
router.post('/:id/request', requireUserTypes('MANUFACTURER', 'HYBRID'), requireFeature(FEATURE_KEYS.RFQ_RESPOND), requestRFQ);
router.post('/:id/accept-manufacturer', requireUserTypes('BUYER', 'HYBRID'), acceptManufacturer);
router.post('/:id/reject-manufacturer', requireUserTypes('BUYER', 'HYBRID'), rejectManufacturer);
router.put('/:id/status', updateRFQStatus);

module.exports = router;

