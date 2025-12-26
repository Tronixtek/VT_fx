import dotenv from 'dotenv';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server.js';
import User from '../models/User.js';
import Signal from '../models/Signal.js';

dotenv.config({ path: '.env.test' });

describe('Trading Signal Tests', () => {
  let server;
  let analystToken;
  let userToken;
  let signalId;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI_TEST);
    server = app.listen(5005);

    const analyst = await User.create({
      name: 'Analyst',
      email: 'analyst.signal@test.com',
      password: 'analyst123',
      role: 'analyst',
    });

    const user = await User.create({
      name: 'User',
      email: 'user.signal@test.com',
      password: 'user123',
      role: 'user',
      subscription: {
        status: 'active',
        plan: 'basic',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    const analystRes = await request(server)
      .post('/api/auth/login')
      .send({ email: 'analyst.signal@test.com', password: 'analyst123' });
    analystToken = analystRes.body.data.accessToken;

    const userRes = await request(server)
      .post('/api/auth/login')
      .send({ email: 'user.signal@test.com', password: 'user123' });
    userToken = userRes.body.data.accessToken;
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Signal.deleteMany({});
    await mongoose.connection.close();
    server.close();
  });

  describe('POST /api/signals - Create Signal', () => {
    test('Analyst should create signal', async () => {
      const res = await request(server)
        .post('/api/signals')
        .set('Authorization', `Bearer ${analystToken}`)
        .send({
          symbol: 'EUR/USD',
          type: 'BUY',
          entryPrice: 1.0850,
          stopLoss: 1.0800,
          takeProfit: 1.0950,
          timeframe: '4h',
          description: 'Strong bullish momentum',
          requiredPlan: 'basic',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.symbol).toBe('EUR/USD');
      signalId = res.body.data._id;
    });

    test('User should not create signal', async () => {
      const res = await request(server)
        .post('/api/signals')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          symbol: 'GBP/USD',
          type: 'SELL',
          entryPrice: 1.2650,
          stopLoss: 1.2700,
          takeProfit: 1.2550,
        });

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/signals - Get Signals', () => {
    test('Should get all active signals', async () => {
      const res = await request(server)
        .get('/api/signals')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('Should filter signals by status', async () => {
      const res = await request(server)
        .get('/api/signals?status=active')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every(s => s.status === 'active')).toBe(true);
    });
  });

  describe('GET /api/signals/:id - Get Signal By ID', () => {
    test('Should get signal details', async () => {
      const res = await request(server)
        .get(`/api/signals/${signalId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.symbol).toBe('EUR/USD');
    });
  });

  describe('PUT /api/signals/:id - Update Signal', () => {
    test('Analyst should update signal', async () => {
      const res = await request(server)
        .put(`/api/signals/${signalId}`)
        .set('Authorization', `Bearer ${analystToken}`)
        .send({
          status: 'hit_tp',
          performance: {
            result: 'profit',
            profitLossPercentage: 0.93,
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('hit_tp');
    });
  });

  describe('DELETE /api/signals/:id - Delete Signal', () => {
    test('Analyst should delete signal', async () => {
      const res = await request(server)
        .delete(`/api/signals/${signalId}`)
        .set('Authorization', `Bearer ${analystToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
