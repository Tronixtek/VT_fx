import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    mentorship: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mentorship',
      required: true,
    },
    analyst: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    scheduledDate: {
      type: Date,
      required: [true, 'Scheduled date is required'],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'declined', 'completed', 'cancelled'],
      default: 'pending',
    },
    notes: {
      type: String,
    },
    meetingLink: {
      type: String,
    },
    declineReason: {
      type: String,
    },
    completedAt: Date,
    cancelledAt: Date,
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ analyst: 1, scheduledDate: 1 });

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
