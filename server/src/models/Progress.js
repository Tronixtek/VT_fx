import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      required: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    watchedDuration: {
      type: Number, // in seconds
      default: 0,
    },
    completedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Unique constraint: one progress entry per user per lesson
progressSchema.index({ user: 1, lesson: 1 }, { unique: true });

const Progress = mongoose.model('Progress', progressSchema);

export default Progress;
