import dotenv from 'dotenv';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server.js';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Lesson from '../models/Lesson.js';

dotenv.config({ path: '.env.test' });
import path from 'path';

describe('Course & Lesson Tests', () => {
  let server;
  let adminToken;
  let analystToken;
  let userToken;
  let courseId;
  let lessonId;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI_TEST);
    server = app.listen(5002);

    // Create test users
    const admin = await User.create({
      name: 'Admin',
      email: 'admin@test.com',
      password: 'admin123',
      role: 'admin',
    });

    const analyst = await User.create({
      name: 'Analyst',
      email: 'analyst@test.com',
      password: 'analyst123',
      role: 'analyst',
    });

    const user = await User.create({
      name: 'User',
      email: 'user@test.com',
      password: 'user123',
      role: 'user',
      subscription: {
        status: 'active',
        plan: 'basic',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    // Login to get tokens
    const adminRes = await request(server)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'admin123' });
    adminToken = adminRes.body.data.accessToken;

    const analystRes = await request(server)
      .post('/api/auth/login')
      .send({ email: 'analyst@test.com', password: 'analyst123' });
    analystToken = analystRes.body.data.accessToken;

    const userRes = await request(server)
      .post('/api/auth/login')
      .send({ email: 'user@test.com', password: 'user123' });
    userToken = userRes.body.data.accessToken;
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Course.deleteMany({});
    await Lesson.deleteMany({});
    await mongoose.connection.close();
    server.close();
  });

  describe('POST /api/courses - Create Course', () => {
    test('Admin should create course successfully', async () => {
      const res = await request(server)
        .post('/api/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('title', 'Test Course')
        .field('description', 'Test Description')
        .field('level', 'beginner')
        .field('category', 'forex')
        .field('requiredPlan', 'basic');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Test Course');
      courseId = res.body.data._id;
    });

    test('User should not create course', async () => {
      const res = await request(server)
        .post('/api/courses')
        .set('Authorization', `Bearer ${userToken}`)
        .field('title', 'Unauthorized Course')
        .field('description', 'Test')
        .field('level', 'beginner')
        .field('category', 'forex')
        .field('requiredPlan', 'basic');

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/courses - Get All Courses', () => {
    test('Should get all courses', async () => {
      const res = await request(server).get('/api/courses');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/courses/:id - Get Course By ID', () => {
    test('Should get course details with lessons', async () => {
      const res = await request(server)
        .get(`/api/courses/${courseId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.course.title).toBe('Test Course');
    });
  });

  describe('PUT /api/courses/:id - Update Course', () => {
    test('Admin should update course', async () => {
      const res = await request(server)
        .put(`/api/courses/${courseId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .field('title', 'Updated Course Title')
        .field('level', 'intermediate');

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Updated Course Title');
    });
  });

  describe('POST /api/courses/lessons - Create Lesson', () => {
    test('Admin should create lesson with video', async () => {
      const res = await request(server)
        .post('/api/courses/lessons')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('courseId', courseId)
        .field('title', 'Test Lesson')
        .field('content', 'Lesson content')
        .field('duration', 600)
        .field('order', 1);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      lessonId = res.body.data._id;
    });
  });

  describe('PUT /api/courses/lessons/:id - Update Lesson', () => {
    test('Admin should update lesson', async () => {
      const res = await request(server)
        .put(`/api/courses/lessons/${lessonId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Updated Lesson',
          isPublished: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Updated Lesson');
    });
  });

  describe('POST /api/courses/progress - Track Progress', () => {
    test('User should update lesson progress', async () => {
      const res = await request(server)
        .post('/api/courses/progress')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          lessonId: lessonId,
          watchedDuration: 300,
          completed: false,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/courses/progress/:courseId - Get Progress', () => {
    test('User should get course progress', async () => {
      const res = await request(server)
        .get(`/api/courses/progress/${courseId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('progress');
      expect(res.body.data).toHaveProperty('stats');
    });
  });

  describe('DELETE /api/courses/lessons/:id - Delete Lesson', () => {
    test('Admin should delete lesson', async () => {
      const res = await request(server)
        .delete(`/api/courses/lessons/${lessonId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('DELETE /api/courses/:id - Delete Course', () => {
    test('Admin should delete course', async () => {
      const res = await request(server)
        .delete(`/api/courses/${courseId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
