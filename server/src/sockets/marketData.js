import priceSimulator from '../services/priceSimulator.js';
import simulatorEngine from '../services/simulatorEngine.js';

/**
 * Handle market data socket events
 */
export const handleMarketDataSocket = (io) => {
  const marketNamespace = io.of('/market');

  // Market namespace authentication (simplified - optional token)
  marketNamespace.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      // Allow connection without strict auth for market data
      // You can add authentication later if needed
      console.log(`📡 Market socket connection attempt: ${socket.id}, has token: ${!!token}`);
      next();
    } catch (error) {
      console.error('Market socket auth error:', error);
      next(error);
    }
  });

  marketNamespace.on('connection', (socket) => {
    console.log(`📡 Client connected to market data: ${socket.id}`);

    // Subscribe to a symbol
    socket.on('subscribe', (symbol) => {
      try {
        // Join room for this symbol
        socket.join(symbol);

        // Subscribe to price simulator
        priceSimulator.subscribeTo(symbol);

        // Send current price if available
        const currentPrice = priceSimulator.getLatestPrice(symbol);
        if (currentPrice) {
          socket.emit('price-update', {
            symbol,
            price: currentPrice,
            timestamp: new Date(),
          });
        }

        console.log(`✅ ${socket.id} subscribed to ${symbol}`);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Unsubscribe from a symbol
    socket.on('unsubscribe', (symbol) => {
      socket.leave(symbol);
      console.log(`🔕 ${socket.id} unsubscribed from ${symbol}`);
    });

    // Get candle data
    socket.on('get-candles', async ({ symbol, granularity, count }, callback) => {
      try {
        const candles = priceSimulator.getCandles(symbol, granularity, count);
        callback({ success: true, data: candles });
      } catch (error) {
        callback({ success: false, error: error.message });
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔴 Client disconnected from market data: ${socket.id}`);
    });
  });

  // Listen to price simulator updates and broadcast
  priceSimulator.on('price-update', (data) => {
    marketNamespace.to(data.symbol).emit('price-update', {
      symbol: data.symbol,
      price: data.price,
      timestamp: new Date(data.timestamp),
    });
  });

  return marketNamespace;
};

/**
 * Emit trade closure event to user
 */
export const emitTradeClosed = (io, userId, trade) => {
  io.to(`user-${userId}`).emit('trade:closed', {
    trade,
    result: trade.result,
    profitLoss: trade.profitLoss,
    closeReason: trade.closeReason,
  });
};

/**
 * Emit achievement unlocked event
 */
export const emitAchievementUnlocked = (io, userId, achievement) => {
  io.to(`user-${userId}`).emit('achievement:unlocked', {
    achievement,
    title: achievement.title,
    description: achievement.description,
  });
};

/**
 * Emit rule violation event
 */
export const emitRuleViolation = (io, userId, violation) => {
  io.to(`user-${userId}`).emit('rule:violation', {
    type: violation.type,
    message: violation.message,
  });
};
