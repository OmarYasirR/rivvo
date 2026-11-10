const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const registerChatEvents = require('./chatEvents');
const registerNotificationEvents = require('./notificationEvents');
const registerPresenceEvents = require('./presenceEvents');

function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_URL, credentials: true },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.userId}`);

    registerPresenceEvents(io, socket);
    registerChatEvents(io, socket);
    registerNotificationEvents(io, socket);

    socket.on('disconnect', () => {
      // presenceEvents handles offline broadcast
    });
  });

  return io;
}

module.exports = initSocket;
