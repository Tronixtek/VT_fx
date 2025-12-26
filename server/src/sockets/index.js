import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { handleMarketDataSocket } from './marketData.js';

let io;

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:3000'],
      credentials: true,
      methods: ['GET', 'POST'],
    },
  });

  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error: Token required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password -refreshToken');

      if (!user || !user.isActive) {
        return next(new Error('Authentication error: Invalid user'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.user.email} (${socket.id})`);

    // Join user-specific room
    socket.join(`user:${socket.user._id}`);
    socket.join(`user-${socket.user._id}`); // For simulator notifications

    // Join role-specific room
    socket.join(`role:${socket.user.role}`);

    // If user has active subscription, join subscribers room
    if (socket.user.hasActiveSubscription()) {
      socket.join('subscribers');
    }

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.user.email} (${socket.id})`);
    });

    // Handle custom events
    socket.on('join_signal_room', () => {
      socket.join('signals');
      socket.emit('joined_signal_room', { message: 'Successfully joined signals room' });
    });

    socket.on('leave_signal_room', () => {
      socket.leave('signals');
      socket.emit('left_signal_room', { message: 'Left signals room' });
    });
  });
// Initialize market data socket namespace
  handleMarketDataSocket(io);

  
  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};
