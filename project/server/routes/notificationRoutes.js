const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead
} = require('../controllers/notificationController');

// GET /api/notifications - Get user notifications
router.get('/', protect, getNotifications);

// GET /api/notifications/unread-count - Get unread count
router.get('/unread-count', protect, getUnreadCount);

// PUT /api/notifications/:id/read - Mark one as read
router.put('/:id/read', protect, markAsRead);

// PUT /api/notifications/read-all - Mark all as read
router.put('/read-all', protect, markAllAsRead);

module.exports = router;
