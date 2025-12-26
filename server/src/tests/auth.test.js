import dotenv from 'dotenv';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server.js';
import User from '../models/User.js';

dotenv.config({ path: '.env.test' });

describe('Authentication Tests', () => {
  let server;
  let adminToken;
  let userToken;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI_TEST);
    server = app.listen(5001);
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
    server.close();
  });

  describe('POST /api/auth/register', () => {
    test('Should register a new user successfully', async () => {
      const res = await request(server)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
      expect(res.body.data.user.email).toBe('test@example.com');
    });

    test('Should fail with existing email', async () => {
      await request(server)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'duplicate@example.com',
          password: 'password123',
        });

      const res = await request(server)
        .post('/api/auth/register')
        .send({
          name: 'Another User',
          email: 'duplicate@example.com',
          password: 'password456',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('Should fail with invalid email', async () => {
      const res = await request(server)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'invalidemail',
          password: 'password123',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeAll(async () => {
      await User.create({
        name: 'Login Test User',
        email: 'login@example.com',
        password: 'password123',
        role: 'user',
      });
    });

    test('Should login successfully with correct credentials', async () => {
      const res = await request(server)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      userToken = res.body.data.accessToken;
    });

    test('Should fail with wrong password', async () => {
      const res = await request(server)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'wrongpassword',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('Should fail with non-existent email', async () => {
      const res = await request(server)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    test('Should get current user with valid token', async () => {
      const res = await request(server)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('login@example.com');
    });

    test('Should fail without token', async () => {
      const res = await request(server).get('/api/auth/me');

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    test('Should logout successfully', async () => {
      const res = await request(server)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
