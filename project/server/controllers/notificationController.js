const Notification = require('../models/Notification');
const User = require('../models/User');
const emailService = require('../emailService/EmailService');

// Get all notifications for the logged-in user
exports.getNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Notification.countDocuments({ userId: req.user._id });

    res.json({
      success: true,
      data: notifications,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
};

// Get unread notification count
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ userId: req.user._id, isRead: false });
    res.json({ success: true, count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ message: 'Failed to fetch unread count' });
  }
};

// Mark a notification as read
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.json({ success: true, data: notification });
  } catch (error) {
    console.error('Error marking notification:', error);
    res.status(500).json({ message: 'Failed to update notification' });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { isRead: true }
    );
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications:', error);
    res.status(500).json({ message: 'Failed to update notifications' });
  }
};

// Helper: create a notification (used by other controllers)
exports.createNotification = async ({ userId, type, title, message, link, metadata }) => {
  try {
    const notification = await Notification.create({ userId, type, title, message, link, metadata });
    
    // Send email notification
    try {
      const user = await User.findById(userId);
      if (user && user.email) {
        const mailOptions = {
          from: `"${process.env.APP_NAME || 'Enigma'}" <${process.env.GMAIL_USER}>`,
          to: user.email,
          subject: title,
          html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
                  <h2 style="color: #4881F8;">${title}</h2>
                  <p style="color: #333; font-size: 16px; line-height: 1.5;">${message}</p>
                  ${link ? `<a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}${link.startsWith('/') ? link : '/' + link}" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background-color: #4881F8; color: #fff; text-decoration: none; border-radius: 4px;">View Details</a>` : ''}
                  <p style="color: #999; font-size: 12px; margin-top: 30px;">This is an automated notification from ${process.env.APP_NAME || 'Enigma'}.</p>
                 </div>`
        };
        await emailService.sendMail(mailOptions);
        console.log(`Email notification sent to ${user.email}`);
      }
    } catch (emailErr) {
      console.error('Error sending notification email:', emailErr);
    }
    
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};
