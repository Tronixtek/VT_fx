import mongoose from 'mongoose';

const courseQuestionSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    question: {
      type: String,
      required: [true, 'Question is required'],
      trim: true,
    },
    timestamp: {
      type: Number, // Video timestamp in seconds when question was asked
      default: 0,
    },
    replies: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        answer: {
          type: String,
          required: true,
        },
        isInstructor: {
          type: Boolean,
          default: false,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isAnswered: {
      type: Boolean,
      default: false,
    },
    upvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isPinned: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
courseQuestionSchema.index({ course: 1, lesson: 1, createdAt: -1 });
courseQuestionSchema.index({ user: 1, createdAt: -1 });

const CourseQuestion = mongoose.model('CourseQuestion', courseQuestionSchema);

export default CourseQuestion;
