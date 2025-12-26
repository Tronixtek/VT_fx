import Mentorship from '../models/Mentorship.js';
import Booking from '../models/Booking.js';
import { validationResult } from 'express-validator';

// MENTORSHIP SERVICE CONTROLLERS
export const createMentorship = async (req, res) => {
  try {
    const { title, description, duration, price } = req.body;

    const mentorship = await Mentorship.create({
      analyst: req.user._id,
      title,
      description,
      duration,
      price,
    });

    res.status(201).json({
      success: true,
      message: 'Mentorship service created successfully',
      data: mentorship,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create mentorship service',
      error: error.message,
    });
  }
};

export const getMentorships = async (req, res) => {
  try {
    const { analystId } = req.query;

    const query = { isActive: true };
    if (analystId) query.analyst = analystId;

    const mentorships = await Mentorship.find(query).populate('analyst', 'name email avatar');

    res.json({
      success: true,
      data: mentorships,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch mentorship services',
      error: error.message,
    });
  }
};

export const updateMentorship = async (req, res) => {
  try {
    const mentorship = await Mentorship.findById(req.params.id);

    if (!mentorship) {
      return res.status(404).json({
        success: false,
        message: 'Mentorship service not found',
      });
    }

    if (mentorship.analyst.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this service',
      });
    }

    const allowedUpdates = ['title', 'description', 'duration', 'price', 'isActive'];
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        mentorship[field] = req.body[field];
      }
    });

    await mentorship.save();

    res.json({
      success: true,
      message: 'Mentorship service updated successfully',
      data: mentorship,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update mentorship service',
      error: error.message,
    });
  }
};

export const deleteMentorship = async (req, res) => {
  try {
    const mentorship = await Mentorship.findById(req.params.id);

    if (!mentorship) {
      return res.status(404).json({
        success: false,
        message: 'Mentorship service not found',
      });
    }

    if (mentorship.analyst.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this service',
      });
    }

    mentorship.isActive = false;
    await mentorship.save();

    res.json({
      success: true,
      message: 'Mentorship service deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete mentorship service',
      error: error.message,
    });
  }
};

// BOOKING CONTROLLERS
export const createBooking = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { mentorship, scheduledDate, notes } = req.body;

    const mentorshipService = await Mentorship.findById(mentorship);
    if (!mentorshipService || !mentorshipService.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Mentorship service not found or inactive',
      });
    }

    // Check if user has active subscription
    if (!req.user.hasActiveSubscription()) {
      return res.status(403).json({
        success: false,
        message: 'Active subscription required to book mentorship sessions',
      });
    }

    const booking = await Booking.create({
      user: req.user._id,
      mentorship,
      analyst: mentorshipService.analyst,
      scheduledDate,
      notes,
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate('user', 'name email')
      .populate('mentorship')
      .populate('analyst', 'name email');

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: populatedBooking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create booking',
      error: error.message,
    });
  }
};

export const getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('mentorship')
      .populate('analyst', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: error.message,
    });
  }
};

export const getAnalystBookings = async (req, res) => {
  try {
    const { status } = req.query;

    const query = { analyst: req.user._id };
    if (status) query.status = status;

    const bookings = await Booking.find(query)
      .populate('user', 'name email avatar')
      .populate('mentorship')
      .sort({ scheduledDate: 1 });

    res.json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analyst bookings',
      error: error.message,
    });
  }
};

export const updateBookingStatus = async (req, res) => {
  try {
    const { status, meetingLink, declineReason } = req.body;

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Only analyst or admin can update booking status
    if (booking.analyst.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this booking',
      });
    }

    booking.status = status;
    if (meetingLink) booking.meetingLink = meetingLink;
    if (status === 'declined' && declineReason) booking.declineReason = declineReason;
    
    if (status === 'completed') {
      booking.completedAt = new Date();
    } else if (status === 'cancelled') {
      booking.cancelledAt = new Date();
    }

    await booking.save();

    const updatedBooking = await Booking.findById(booking._id)
      .populate('user', 'name email')
      .populate('mentorship')
      .populate('analyst', 'name email');

    res.json({
      success: true,
      message: 'Booking status updated successfully',
      data: updatedBooking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update booking status',
      error: error.message,
    });
  }
};

export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // User can only cancel their own bookings
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this booking',
      });
    }

    if (booking.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel completed booking',
      });
    }

    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    await booking.save();

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking',
      error: error.message,
    });
  }
};
