# Test Suite Documentation

This directory contains comprehensive tests for all implemented features.

## Running Tests

```bash
# Install test dependencies
npm install --save-dev jest supertest @babel/preset-env

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Test Files

### 1. `auth.test.js` - Authentication Tests
- ✅ User registration
- ✅ Email validation
- ✅ Duplicate email prevention
- ✅ User login
- ✅ Password validation
- ✅ Get current user
- ✅ Logout functionality
- ✅ Token authentication

### 2. `course.test.js` - Course & Lesson Tests
- ✅ Create course (admin/analyst only)
- ✅ Get all courses
- ✅ Get course by ID
- ✅ Update course
- ✅ Delete course
- ✅ Create lesson with video
- ✅ Update lesson
- ✅ Delete lesson
- ✅ Track lesson progress
- ✅ Get course progress
- ✅ Role-based access control

### 3. `question.test.js` - Q&A System Tests
- ✅ Ask question with timestamp
- ✅ Get all questions for lesson
- ✅ Reply to questions
- ✅ Instructor badge on replies
- ✅ Upvote questions
- ✅ Toggle upvotes
- ✅ Delete questions
- ✅ Sort questions (recent/upvotes/unanswered)

### 4. `payment.test.js` - Payment & Subscription Tests
- ✅ Initialize payment
- ✅ Verify payment reference
- ✅ Get payment history
- ✅ Plan validation
- ✅ Subscription activation

### 5. `signal.test.js` - Trading Signal Tests
- ✅ Create signal (analyst only)
- ✅ Get all signals
- ✅ Get signal by ID
- ✅ Update signal status
- ✅ Track signal performance
- ✅ Delete signal
- ✅ Filter by status

## Test Setup

Each test file:
1. Connects to test database (`MONGO_URI_TEST`)
2. Creates test server on different ports (5001-5005)
3. Creates test users with different roles
4. Cleans up after all tests

## Environment Variables

Create `.env.test` file:

```env
NODE_ENV=test
MONGO_URI_TEST=mongodb://localhost:27017/vtfx_test
JWT_SECRET=test_secret_key
JWT_REFRESH_SECRET=test_refresh_secret
PAYSTACK_SECRET_KEY=test_paystack_key
```

## Coverage Goals

- **Unit Tests**: >80% coverage
- **Integration Tests**: All API endpoints
- **E2E Tests**: Critical user flows

## Test Categories

### ✅ Completed Tests:
1. Authentication & Authorization
2. Course Management
3. Lesson Management
4. Progress Tracking
5. Q&A System
6. Payment Processing
7. Trading Signals

### 🔄 Additional Tests Needed:
1. Mentorship booking
2. Affiliate system
3. Achievements
4. File uploads (videos/thumbnails/PDFs)
5. WebSocket connections
6. Email notifications

## Best Practices

1. **Isolation**: Each test is independent
2. **Cleanup**: Database cleaned after each suite
3. **Mocking**: External services mocked
4. **Descriptive**: Clear test names
5. **Fast**: Tests complete in seconds

## Running Specific Tests

```bash
# Run specific file
npm test auth.test.js

# Run tests matching pattern
npm test -- --testNamePattern="login"

# Run with verbose output
npm test -- --verbose
```

## CI/CD Integration

Tests can be integrated into GitHub Actions:

```yaml
- name: Run Tests
  run: |
    cd server
    npm install
    npm test
```

## Troubleshooting

**Port conflicts**: Tests use ports 5001-5005
**Database**: Ensure MongoDB is running
**Timeout**: Increase timeout in jest.config.js
**Open handles**: Use `--forceExit` flag
