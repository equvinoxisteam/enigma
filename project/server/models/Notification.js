const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: [
      'RFQ_CREATED', 'RFQ_RECEIVED', 'RFQ_ACCEPTED', 'RFQ_REJECTED',
      'QUOTE_RECEIVED', 'QUOTE_ACCEPTED', 'QUOTE_REJECTED',
      'INVITATION_RECEIVED', 'INVITATION_ACCEPTED',
      'PRODUCTION_UPDATE', 'SHIPPING_UPDATE', 'DELIVERY_CONFIRMED',
      'MESSAGE_RECEIVED', 'SYSTEM', 'WELCOME'
    ],
    default: 'SYSTEM'
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  link: {
    type: String // e.g. '/my-rfqs/123'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed // extra data like rfqId, userId, etc.
  }
}, {
  timestamps: true
});

// Index for fast unread count queries
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
