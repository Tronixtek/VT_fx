import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

import connectDB from './config/database.js';
// import { connectRedis } from './config/redis.js'; // Disabled: Redis 3.2 too old
import { initializeSocket } from './sockets/index.js';
// import { scheduleRecurringJobs } from './jobs/index.js'; // Disabled: Redis 5.0+ required
// import priceSimulator from './services/priceSimulator.js'; // Disabled: Simulator deactivated
// import simulatorEngine from './services/simulatorEngine.js'; // Disabled: Simulator deactivated

import authRoutes from './routes/authRoutes.js';
import signalRoutes from './routes/signalRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import affiliateRoutes from './routes/affiliateRoutes.js';
import mentorshipRoutes from './routes/mentorshipRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
// import simulatorRoutes from './routes/simulatorRoutes.js'; // Disabled: Simulator deactivated
import achievementRoutes from './routes/achievementRoutes.js';
import questionRoutes from './routes/questionRoutes.js';

import { errorHandler, notFound } from './middleware/error.js';

// ES Module __dirname alternative
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = createServer(app);

// Initialize Socket.IO
export const io = initializeSocket(server);

// Connect to databases (skip in test mode - tests handle their own connections)
if (process.env.NODE_ENV !== 'test') {
  connectDB();
  // connectRedis(); // Disabled: Redis 3.2 too old for BullMQ
}

// Initialize Price Simulator with assets (DISABLED)
// const assetsPath = path.join(__dirname, 'config', 'assets.json');
// const assets = JSON.parse(readFileSync(assetsPath, 'utf-8'));
// assets.forEach(asset => priceSimulator.registerAsset(asset));
// priceSimulator.start();

// Start simulator trade monitoring (DISABLED)
// simulatorEngine.startBackgroundMonitoring();

// Schedule background jobs (disabled due to Redis version < 5.0)
// scheduleRecurringJobs();

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: false, // Disable CORP to allow cross-origin resources
  crossOriginEmbedderPolicy: false, // Disable COEP to allow cross-origin embedding
}));

// CORS configuration - allow CLIENT_URL from environment + local development URLs
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000'
];

// Add CLIENT_URL from environment if it exists
if (process.env.CLIENT_URL) {
  allowedOrigins.push(process.env.CLIENT_URL);
}

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length'],
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
});
app.use('/api/', limiter);

// Serve uploaded files with proper headers for video streaming
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    
    // Enable range requests and caching for video streaming
    if (filePath.endsWith('.mp4') || filePath.endsWith('.webm') || filePath.endsWith('.ogg')) {
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }
  }
}));

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'VTfx API is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/signals', signalRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/affiliate', affiliateRoutes);
app.use('/api/mentorship', mentorshipRoutes);
app.use('/api/admin', adminRoutes);
// app.use('/api/simulator', simulatorRoutes); // Disabled: Simulator deactivated
app.use('/api/achievements', achievementRoutes);
app.use('/api', questionRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

// Only start the server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log(`🚀 VTfx Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📡 Socket.IO initialized`);
    console.log('='.repeat(50));
  });
}

// Export app for testing
export default app;
export { server };

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});
