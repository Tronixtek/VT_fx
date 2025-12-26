import express from 'express';
import {
  postQuestion,
  getLessonQuestions,
  replyToQuestion,
  upvoteQuestion,
  deleteQuestion,
  uploadLessonResource,
  deleteLessonResource,
} from '../controllers/questionController.js';
import { protect, authorize } from '../middleware/auth.js';
import upload from '../config/multer.js';

const router = express.Router();

// Question routes
router.post('/questions', protect, postQuestion);
router.get('/lessons/:lessonId/questions', protect, getLessonQuestions);
router.post('/questions/:questionId/reply', protect, replyToQuestion);
router.post('/questions/:questionId/upvote', protect, upvoteQuestion);
router.delete('/questions/:questionId', protect, deleteQuestion);

// Resource upload routes (Analyst/Admin only)
router.post(
  '/lessons/:lessonId/resources',
  protect,
  authorize('analyst', 'admin'),
  upload.single('resource'),
  uploadLessonResource
);

router.delete(
  '/lessons/:lessonId/resources/:resourceId',
  protect,
  authorize('analyst', 'admin'),
  deleteLessonResource
);

export default router;
