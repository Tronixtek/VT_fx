import express from 'express';
import {
  createMentorship,
  getMentorships,
  updateMentorship,
  deleteMentorship,
  createBooking,
  getUserBookings,
  getAnalystBookings,
  updateBookingStatus,
  cancelBooking,
} from '../controllers/mentorshipController.js';
import { protect, authorize, checkSubscription } from '../middleware/auth.js';
import { bookingValidation, idValidation } from '../middleware/validation.js';

const router = express.Router();

// Mentorship service routes
router.get('/services', getMentorships);
router.post('/services', protect, authorize('analyst', 'admin'), createMentorship);
router.put('/services/:id', protect, authorize('analyst', 'admin'), idValidation, updateMentorship);
router.delete('/services/:id', protect, authorize('analyst', 'admin'), idValidation, deleteMentorship);

// Booking routes
router.post('/bookings', protect, checkSubscription, bookingValidation, createBooking);
router.get('/bookings/my-bookings', protect, getUserBookings);
router.get('/bookings/analyst', protect, authorize('analyst', 'admin'), getAnalystBookings);
router.put('/bookings/:id/status', protect, authorize('analyst', 'admin'), idValidation, updateBookingStatus);
router.put('/bookings/:id/cancel', protect, idValidation, cancelBooking);

export default router;
