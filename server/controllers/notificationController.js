const Notification = require('../models/Notification');

// @desc Get notifications for current user
// @route GET /api/notifications
exports.getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .populate('sender', 'username avatar')
      .sort('-createdAt');
    res.json(notifications);
  } catch (err) {
    next(err);
  }
};

// @desc Mark a notification as read
// @route PUT /api/notifications/:id/read
exports.markAsRead = async (req, res, next) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ message: req.t('markedRead') });
  } catch (err) {
    next(err);
  }
};
