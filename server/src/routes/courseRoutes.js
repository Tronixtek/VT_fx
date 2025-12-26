import express from 'express';
import {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  createLesson,
  getLessonById,
  updateLesson,
  deleteLesson,
  updateProgress,
  getUserProgress,
} from '../controllers/courseController.js';
import { protect, authorize, checkSubscription } from '../middleware/auth.js';
import { courseValidation, lessonValidation, idValidation } from '../middleware/validation.js';
import upload from '../config/multer.js';

const router = express.Router();

// Course routes (no /courses prefix - already in server.js)
router.get('/', getCourses);
router.get('/:id', protect, getCourseById);
router.post(
  '/',
  protect,
  authorize('analyst', 'admin'),
  upload.single('thumbnail'),
  courseValidation,
  createCourse
);
router.put(
  '/:id',
  protect,
  authorize('analyst', 'admin'),
  upload.single('thumbnail'),
  idValidation,
  updateCourse
);
router.delete('/:id', protect, authorize('analyst', 'admin'), idValidation, deleteCourse);

// Lesson routes
router.get('/lessons/:id', protect, checkSubscription, idValidation, getLessonById);
router.post(
  '/lessons',
  protect,
  authorize('analyst', 'admin'),
  upload.single('video'),
  lessonValidation,
  createLesson
);
router.put('/lessons/:id', protect, authorize('analyst', 'admin'), idValidation, updateLesson);
router.delete('/lessons/:id', protect, authorize('analyst', 'admin'), idValidation, deleteLesson);

// Progress routes
router.post('/progress', protect, updateProgress);
router.get('/progress/:courseId', protect, getUserProgress);

export default router;
