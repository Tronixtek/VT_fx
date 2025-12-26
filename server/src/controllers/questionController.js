import CourseQuestion from '../models/CourseQuestion.js';
import Course from '../models/Course.js';
import Lesson from '../models/Lesson.js';

/**
 * Post a question on a lesson
 */
export const postQuestion = async (req, res) => {
  try {
    const { courseId, lessonId, question, timestamp } = req.body;

    if (!question || question.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Question cannot be empty',
      });
    }

    // Verify course and lesson exist
    const course = await Course.findById(courseId);
    const lesson = await Lesson.findById(lessonId);

    if (!course || !lesson) {
      return res.status(404).json({
        success: false,
        message: 'Course or lesson not found',
      });
    }

    const newQuestion = await CourseQuestion.create({
      course: courseId,
      lesson: lessonId,
      user: req.user._id,
      question: question.trim(),
      timestamp: timestamp || 0,
    });

    await newQuestion.populate('user', 'name avatar');

    res.status(201).json({
      success: true,
      message: 'Question posted successfully',
      data: newQuestion,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to post question',
      error: error.message,
    });
  }
};

/**
 * Get all questions for a lesson
 */
export const getLessonQuestions = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { sortBy = 'recent' } = req.query;

    let sortOptions = { isPinned: -1, createdAt: -1 }; // Pinned first, then recent
    
    if (sortBy === 'upvotes') {
      sortOptions = { isPinned: -1, upvotes: -1, createdAt: -1 };
    } else if (sortBy === 'unanswered') {
      sortOptions = { isPinned: -1, isAnswered: 1, createdAt: -1 };
    }

    const questions = await CourseQuestion.find({ lesson: lessonId })
      .populate('user', 'name avatar')
      .populate('replies.user', 'name avatar role')
      .sort(sortOptions);

    res.json({
      success: true,
      data: questions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch questions',
      error: error.message,
    });
  }
};

/**
 * Reply to a question
 */
export const replyToQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { answer } = req.body;

    if (!answer || answer.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Answer cannot be empty',
      });
    }

    const question = await CourseQuestion.findById(questionId);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found',
      });
    }

    // Check if user is instructor/admin
    const course = await Course.findById(question.course);
    const isInstructor = 
      req.user.role === 'admin' || 
      req.user.role === 'analyst' || 
      course.instructor.toString() === req.user._id.toString();

    question.replies.push({
      user: req.user._id,
      answer: answer.trim(),
      isInstructor,
    });

    // Mark as answered if instructor replies
    if (isInstructor && !question.isAnswered) {
      question.isAnswered = true;
    }

    await question.save();
    await question.populate('replies.user', 'name avatar role');

    res.json({
      success: true,
      message: 'Reply posted successfully',
      data: question,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to post reply',
      error: error.message,
    });
  }
};

/**
 * Upvote a question
 */
export const upvoteQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;

    const question = await CourseQuestion.findById(questionId);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found',
      });
    }

    const hasUpvoted = question.upvotes.includes(req.user._id);

    if (hasUpvoted) {
      // Remove upvote
      question.upvotes = question.upvotes.filter(
        (id) => id.toString() !== req.user._id.toString()
      );
    } else {
      // Add upvote
      question.upvotes.push(req.user._id);
    }

    await question.save();

    res.json({
      success: true,
      message: hasUpvoted ? 'Upvote removed' : 'Question upvoted',
      data: {
        upvotes: question.upvotes.length,
        hasUpvoted: !hasUpvoted,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to upvote question',
      error: error.message,
    });
  }
};

/**
 * Delete a question (user's own question or admin/instructor)
 */
export const deleteQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;

    const question = await CourseQuestion.findById(questionId);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found',
      });
    }

    const course = await Course.findById(question.course);
    const isAuthorized =
      question.user.toString() === req.user._id.toString() ||
      req.user.role === 'admin' ||
      course.instructor.toString() === req.user._id.toString();

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this question',
      });
    }

    await question.deleteOne();

    res.json({
      success: true,
      message: 'Question deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete question',
      error: error.message,
    });
  }
};

/**
 * Upload lesson resource (PDF only - for viewing on platform)
 */
export const uploadLessonResource = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { name } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    const lesson = await Lesson.findById(lessonId);

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found',
      });
    }

    const course = await Course.findById(lesson.course);
    const isAuthorized =
      req.user.role === 'admin' ||
      course.instructor.toString() === req.user._id.toString();

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to upload resources',
      });
    }

    lesson.resources.push({
      name: name || req.file.originalname,
      url: `/uploads/documents/${req.file.filename}`,
    });

    await lesson.save();

    res.json({
      success: true,
      message: 'Resource uploaded successfully',
      data: lesson.resources,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to upload resource',
      error: error.message,
    });
  }
};

/**
 * Delete lesson resource
 */
export const deleteLessonResource = async (req, res) => {
  try {
    const { lessonId, resourceId } = req.params;

    const lesson = await Lesson.findById(lessonId);

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found',
      });
    }

    const course = await Course.findById(lesson.course);
    const isAuthorized =
      req.user.role === 'admin' ||
      course.instructor.toString() === req.user._id.toString();

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete resources',
      });
    }

    lesson.resources = lesson.resources.filter(
      (resource) => resource._id.toString() !== resourceId
    );

    await lesson.save();

    res.json({
      success: true,
      message: 'Resource deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete resource',
      error: error.message,
    });
  }
};
