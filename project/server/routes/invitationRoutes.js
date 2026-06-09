const express = require('express');
const router = express.Router();
const {
  getInvitations,
  acceptInvitation,
  declineInvitation,
  createInvitation
} = require('../controllers/invitationController');
const { protect } = require('../middlewares/auth');
const { requireUserTypes, requireFeature } = require('../middlewares/accessControl');
const { FEATURE_KEYS } = require('../config/planFeatures');

router.use(protect);

router.get('/', requireUserTypes('MANUFACTURER', 'HYBRID'), getInvitations);
router.post('/', requireUserTypes('BUYER', 'HYBRID'), requireFeature(FEATURE_KEYS.INVITATION_SEND), createInvitation);
router.post('/:id/accept', requireUserTypes('MANUFACTURER', 'HYBRID'), requireFeature(FEATURE_KEYS.INVITATION_RESPOND), acceptInvitation);
router.post('/:id/decline', requireUserTypes('MANUFACTURER', 'HYBRID'), requireFeature(FEATURE_KEYS.INVITATION_RESPOND), declineInvitation);

module.exports = router;

