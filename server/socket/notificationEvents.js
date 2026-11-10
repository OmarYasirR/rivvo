module.exports = function registerNotificationEvents(io, socket) {
  // Notifications are primarily emitted server-side via notificationService.createNotification
  // This file is a hook for any client-initiated notification events (e.g. mark-read broadcasts).
  socket.on('notification:read', ({ notificationId }) => {
    io.to(`user:${socket.userId}`).emit('notification:read', { notificationId });
  });
};
