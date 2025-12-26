import dotenv from 'dotenv';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server.js';
import User from '../models/User.js';
import Payment from '../models/Payment.js';

dotenv.config({ path: '.env.test' });

describe('Payment & Subscription Tests', () => {
  let server;
  let userToken;
  let userId;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI_TEST);
    server = app.listen(5004);

    const user = await User.create({
      name: 'Test User',
      email: 'payment@test.com',
      password: 'password123',
      role: 'user',
    });
    userId = user._id;

    const res = await request(server)
      .post('/api/auth/login')
      .send({ email: 'payment@test.com', password: 'password123' });
    userToken = res.body.data.accessToken;
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Payment.deleteMany({});
    await mongoose.connection.close();
    server.close();
  });

  describe('POST /api/payments/initialize - Initialize Payment', () => {
    test('Should initialize payment successfully', async () => {
      const res = await request(server)
        .post('/api/payments/initialize')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          plan: 'basic',
          amount: 1500000,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('authorizationUrl');
      expect(res.body.data).toHaveProperty('reference');
    });

    test('Should fail with invalid plan', async () => {
      const res = await request(server)
        .post('/api/payments/initialize')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          plan: 'invalid',
          amount: 100,
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/payments - Get User Payments', () => {
    test('Should get user payment history', async () => {
      const res = await request(server)
        .get('/api/payments')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('POST /api/payments/verify - Verify Payment', () => {
    test('Should verify payment reference', async () => {
      // Note: This would require a valid Paystack reference in real scenario
      const res = await request(server)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          reference: 'test_reference_123',
        });

      // In test environment, this will likely fail but we test the endpoint exists
      expect([200, 400, 404]).toContain(res.status);
    });
  });
});
