const express = require('express');
const router = express.Router();
const {
  getChatMessages,
  sendMessage,
  markAsRead
} = require('../controllers/chatController');
const { protect } = require('../middlewares/auth');
const { requireFeature } = require('../middlewares/accessControl');
const { FEATURE_KEYS } = require('../config/planFeatures');

router.use(protect);

router.get('/rfq/:rfqId', requireFeature(FEATURE_KEYS.CHAT_ACCESS), getChatMessages);
router.post('/rfq/:rfqId', requireFeature(FEATURE_KEYS.CHAT_ACCESS), sendMessage);
router.put('/:id/read', requireFeature(FEATURE_KEYS.CHAT_ACCESS), markAsRead);

module.exports = router;

