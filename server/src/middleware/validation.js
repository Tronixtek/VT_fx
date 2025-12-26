import { body, param, query } from 'express-validator';

export const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

export const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

export const signalValidation = [
  body('symbol').trim().notEmpty().withMessage('Symbol is required'),
  body('type').isIn(['BUY', 'SELL']).withMessage('Type must be BUY or SELL'),
  body('entryPrice').isFloat({ gt: 0 }).withMessage('Entry price must be positive'),
  body('stopLoss').isFloat({ gt: 0 }).withMessage('Stop loss must be positive'),
  body('takeProfit').isFloat({ gt: 0 }).withMessage('Take profit must be positive'),
  body('timeframe')
    .isIn(['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w'])
    .withMessage('Invalid timeframe'),
];

export const courseValidation = [
  body('title').trim().notEmpty().withMessage('Course title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('level')
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Invalid level'),
  body('category')
    .isIn(['forex', 'crypto', 'stocks', 'indices', 'general'])
    .withMessage('Invalid category'),
];

export const lessonValidation = [
  body('title').trim().notEmpty().withMessage('Lesson title is required'),
  body('course').isMongoId().withMessage('Valid course ID is required'),
];

export const bookingValidation = [
  body('mentorship').isMongoId().withMessage('Valid mentorship ID is required'),
  body('scheduledDate').isISO8601().withMessage('Valid date is required'),
];

export const idValidation = [
  param('id').isMongoId().withMessage('Valid ID is required'),
];
