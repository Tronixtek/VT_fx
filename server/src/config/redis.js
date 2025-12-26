import Redis from 'ioredis';

// Create Redis client for general use
const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: null, // Required for BullMQ
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redisClient.on('error', (err) => {
  console.error('❌ Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('✅ Redis Connected');
});

export const connectRedis = async () => {
  try {
    // Connection is automatic with ioredis
  } catch (error) {
    console.error('❌ Redis Connection Failed:', error.message);
  }
};

export default redisClient;
