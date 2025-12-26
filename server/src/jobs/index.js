import { Queue, Worker } from 'bullmq';
import redisClient from '../config/redis.js';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import Lesson from '../models/Lesson.js';
import User from '../models/User.js';
import { addMonths } from 'date-fns';

// Create queues
export const videoProcessingQueue = new Queue('video-processing', {
  connection: redisClient,
});

export const subscriptionExpiryQueue = new Queue('subscription-expiry', {
  connection: redisClient,
});

// Video processing worker
const videoProcessingWorker = new Worker(
  'video-processing',
  async (job) => {
    const { lessonId, videoPath } = job.data;

    try {
      console.log(`Processing video for lesson: ${lessonId}`);

      // Get video metadata
      const metadata = await new Promise((resolve, reject) => {
        ffmpeg.ffprobe(videoPath, (err, metadata) => {
          if (err) reject(err);
          else resolve(metadata);
        });
      });

      const duration = Math.floor(metadata.format.duration);

      // Update lesson with duration
      await Lesson.findByIdAndUpdate(lessonId, { duration });

      console.log(`✅ Video processed for lesson: ${lessonId}, duration: ${duration}s`);

      return { duration };
    } catch (error) {
      console.error(`❌ Video processing failed for lesson: ${lessonId}`, error);
      throw error;
    }
  },
  {
    connection: redisClient,
    concurrency: 3,
  }
);

// Subscription expiry worker
const subscriptionExpiryWorker = new Worker(
  'subscription-expiry',
  async (job) => {
    try {
      console.log('Checking for expired subscriptions...');

      const expiredUsers = await User.find({
        'subscription.status': 'active',
        'subscription.endDate': { $lte: new Date() },
      });

      for (const user of expiredUsers) {
        user.subscription.status = 'expired';
        await user.save();
        console.log(`Expired subscription for user: ${user.email}`);
      }

      console.log(`✅ Processed ${expiredUsers.length} expired subscriptions`);

      return { processed: expiredUsers.length };
    } catch (error) {
      console.error('❌ Subscription expiry check failed', error);
      throw error;
    }
  },
  {
    connection: redisClient,
  }
);

// Add job listeners
videoProcessingWorker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

videoProcessingWorker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err);
});

subscriptionExpiryWorker.on('completed', (job) => {
  console.log(`Subscription expiry check completed`);
});

// Schedule recurring jobs
export const scheduleRecurringJobs = async () => {
  // Check for expired subscriptions daily at midnight
  await subscriptionExpiryQueue.add(
    'check-expiry',
    {},
    {
      repeat: {
        pattern: '0 0 * * *', // Every day at midnight
      },
    }
  );

  console.log('✅ Recurring jobs scheduled');
};

export { videoProcessingWorker, subscriptionExpiryWorker };
