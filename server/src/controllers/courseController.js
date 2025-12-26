import Course from '../models/Course.js';
import Lesson from '../models/Lesson.js';
import Progress from '../models/Progress.js';
import { validationResult } from 'express-validator';

// COURSE CONTROLLERS
export const createCourse = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { title, description, level, category, requiredPlan } = req.body;

    const course = await Course.create({
      title,
      description,
      level,
      category,
      requiredPlan,
      instructor: req.user._id,
      thumbnail: req.file ? `/uploads/thumbnails/${req.file.filename}` : null,
    });

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: course,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create course',
      error: error.message,
    });
  }
};

export const getCourses = async (req, res) => {
  try {
    const { level, category, isPublished } = req.query;

    const query = { isActive: true };
    
    if (level) query.level = level;
    if (category) query.category = category;
    if (isPublished !== undefined) query.isPublished = isPublished === 'true';

    const courses = await Course.find(query)
      .populate('instructor', 'name email avatar')
      .sort({ order: 1, createdAt: -1 });

    res.json({
      success: true,
      data: courses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch courses',
      error: error.message,
    });
  }
};

export const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate('instructor', 'name email avatar');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // Get lessons for this course
    // Admin/Analyst can see all lessons, users only see published ones
    const isAdminOrAnalyst = req.user && (req.user.role === 'admin' || req.user.role === 'analyst');
    const lessonQuery = { course: course._id };
    if (!isAdminOrAnalyst) {
      lessonQuery.isPublished = true;
    }
    const lessons = await Lesson.find(lessonQuery).sort({ order: 1 });

    // Get user progress if logged in
    let progress = [];
    if (req.user) {
      progress = await Progress.find({
        user: req.user._id,
        course: course._id,
      });
    }

    res.json({
      success: true,
      data: {
        course,
        lessons,
        progress,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch course',
      error: error.message,
    });
  }
};

export const updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this course',
      });
    }

    const allowedUpdates = ['title', 'description', 'level', 'category', 'requiredPlan', 'isPublished', 'order'];
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        course[field] = req.body[field];
      }
    });

    if (req.file) {
      course.thumbnail = `/uploads/thumbnails/${req.file.filename}`;
    }

    await course.save();

    res.json({
      success: true,
      message: 'Course updated successfully',
      data: course,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update course',
      error: error.message,
    });
  }
};

export const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this course',
      });
    }

    course.isActive = false;
    await course.save();

    res.json({
      success: true,
      message: 'Course deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete course',
      error: error.message,
    });
  }
};

// LESSON CONTROLLERS
export const createLesson = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { course, title, description, order, isFree } = req.body;

    const courseExists = await Course.findById(course);
    if (!courseExists) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Video file is required',
      });
    }

    const lesson = await Lesson.create({
      course,
      title,
      description,
      videoUrl: `/uploads/videos/${req.file.filename}`,
      videoFilename: req.file.filename,
      order,
      isFree: isFree === 'true',
    });

    // Update course duration
    const lessons = await Lesson.find({ course });
    const totalDuration = lessons.reduce((sum, l) => sum + (l.duration || 0), 0);
    courseExists.duration = Math.floor(totalDuration / 60);
    await courseExists.save();

    res.status(201).json({
      success: true,
      message: 'Lesson created successfully',
      data: lesson,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create lesson',
      error: error.message,
    });
  }
};

export const getLessonById = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id).populate('course');

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found',
      });
    }

    // Check access: free lesson OR user has required subscription OR admin/analyst
    const hasAccess =
      lesson.isFree ||
      req.user.role === 'admin' ||
      req.user.role === 'analyst' ||
      (req.user.hasActiveSubscription() &&
        ['basic', 'pro', 'premium'].indexOf(req.user.subscription.plan) >=
          ['basic', 'pro', 'premium'].indexOf(lesson.course.requiredPlan));

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Subscription required to access this lesson',
        requiredPlan: lesson.course.requiredPlan,
      });
    }

    res.json({
      success: true,
      data: lesson,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lesson',
      error: error.message,
    });
  }
};

export const updateLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id).populate('course');

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found',
      });
    }

    if (lesson.course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this lesson',
      });
    }

    const allowedUpdates = ['title', 'description', 'order', 'isPublished', 'isFree', 'duration'];
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        lesson[field] = req.body[field];
      }
    });

    await lesson.save();

    res.json({
      success: true,
      message: 'Lesson updated successfully',
      data: lesson,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update lesson',
      error: error.message,
    });
  }
};

export const deleteLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id).populate('course');

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found',
      });
    }

    if (lesson.course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this lesson',
      });
    }

    await lesson.deleteOne();

    res.json({
      success: true,
      message: 'Lesson deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete lesson',
      error: error.message,
    });
  }
};

// PROGRESS CONTROLLERS
export const updateProgress = async (req, res) => {
  try {
    const { lessonId, watchedDuration, completed } = req.body;

    const lesson = await Lesson.findById(lessonId).populate('course');
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found',
      });
    }

    let progress = await Progress.findOne({
      user: req.user._id,
      lesson: lessonId,
    });

    if (progress) {
      progress.watchedDuration = watchedDuration;
      if (completed && !progress.completed) {
        progress.completed = true;
        progress.completedAt = new Date();
      }
      await progress.save();
    } else {
      progress = await Progress.create({
        user: req.user._id,
        course: lesson.course._id,
        lesson: lessonId,
        watchedDuration,
        completed: completed || false,
        completedAt: completed ? new Date() : null,
      });
    }

    res.json({
      success: true,
      message: 'Progress updated successfully',
      data: progress,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update progress',
      error: error.message,
    });
  }
};

export const getUserProgress = async (req, res) => {
  try {
    const { courseId } = req.params;

    const progress = await Progress.find({
      user: req.user._id,
      course: courseId,
    }).populate('lesson');

    const lessons = await Lesson.find({ course: courseId });
    const completedCount = progress.filter((p) => p.completed).length;
    const totalCount = lessons.length;
    const completionPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    res.json({
      success: true,
      data: {
        progress,
        stats: {
          completed: completedCount,
          total: totalCount,
          percentage: completionPercentage.toFixed(2),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch progress',
      error: error.message,
    });
  }
};
