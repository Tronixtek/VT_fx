import dotenv from 'dotenv';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server.js';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Lesson from '../models/Lesson.js';
import CourseQuestion from '../models/CourseQuestion.js';

dotenv.config({ path: '.env.test' });

describe('Q&A System Tests', () => {
  let server;
  let analystToken;
  let userToken;
  let courseId;
  let lessonId;
  let questionId;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI_TEST);
    server = app.listen(5003);

    // Create analyst and user
    const analyst = await User.create({
      name: 'Instructor',
      email: 'instructor@test.com',
      password: 'instructor123',
      role: 'analyst',
    });

    const user = await User.create({
      name: 'Student',
      email: 'student@test.com',
      password: 'student123',
      role: 'user',
    });

    // Login
    const analystRes = await request(server)
      .post('/api/auth/login')
      .send({ email: 'instructor@test.com', password: 'instructor123' });
    analystToken = analystRes.body.data.accessToken;

    const userRes = await request(server)
      .post('/api/auth/login')
      .send({ email: 'student@test.com', password: 'student123' });
    userToken = userRes.body.data.accessToken;

    // Create course and lesson
    const course = await Course.create({
      title: 'Q&A Test Course',
      description: 'Test',
      level: 'beginner',
      category: 'forex',
      requiredPlan: 'basic',
      instructor: analyst._id,
      isPublished: true,
    });
    courseId = course._id;

    const lesson = await Lesson.create({
      course: courseId,
      title: 'Test Lesson',
      content: 'Test content',
      duration: 600,
      order: 1,
      isPublished: true,
    });
    lessonId = lesson._id;
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Course.deleteMany({});
    await Lesson.deleteMany({});
    await CourseQuestion.deleteMany({});
    await mongoose.connection.close();
    server.close();
  });

  describe('POST /api/questions - Ask Question', () => {
    test('Student should ask question successfully', async () => {
      const res = await request(server)
        .post('/api/questions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          courseId: courseId,
          lessonId: lessonId,
          question: 'What is the difference between forex and stocks?',
          timestamp: 120,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.question).toBe('What is the difference between forex and stocks?');
      questionId = res.body.data._id;
    });

    test('Should fail without authentication', async () => {
      const res = await request(server)
        .post('/api/questions')
        .send({
          courseId: courseId,
          lessonId: lessonId,
          question: 'Test question',
        });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/lessons/:lessonId/questions - Get Questions', () => {
    test('Should get all questions for a lesson', async () => {
      const res = await request(server)
        .get(`/api/lessons/${lessonId}/questions`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    test('Should filter by sortBy parameter', async () => {
      const res = await request(server)
        .get(`/api/lessons/${lessonId}/questions?sortBy=recent`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /api/questions/:id/reply - Reply to Question', () => {
    test('Instructor should reply to question', async () => {
      const res = await request(server)
        .post(`/api/questions/${questionId}/reply`)
        .set('Authorization', `Bearer ${analystToken}`)
        .send({
          answer: 'Forex trades currencies while stocks trade company shares.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.replies.length).toBeGreaterThan(0);
    });

    test('Reply should have instructor badge', async () => {
      const res = await request(server)
        .get(`/api/lessons/${lessonId}/questions`)
        .set('Authorization', `Bearer ${userToken}`);

      const question = res.body.data.find(q => q._id === questionId);
      expect(question.replies[0].isInstructor).toBe(true);
    });
  });

  describe('POST /api/questions/:id/upvote - Upvote Question', () => {
    test('User should upvote question', async () => {
      const res = await request(server)
        .post(`/api/questions/${questionId}/upvote`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('Should toggle upvote on second call', async () => {
      const res = await request(server)
        .post(`/api/questions/${questionId}/upvote`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('DELETE /api/questions/:id - Delete Question', () => {
    test('Question owner should delete question', async () => {
      const res = await request(server)
        .delete(`/api/questions/${questionId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('Should fail to delete non-existent question', async () => {
      const res = await request(server)
        .delete(`/api/questions/${questionId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(404);
    });
  });
});
