import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'analyst', 'admin'],
      default: 'user',
    },
    avatar: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    subscription: {
      status: {
        type: String,
        enum: ['none', 'active', 'expired', 'cancelled'],
        default: 'none',
      },
      plan: {
        type: String,
        enum: ['none', 'basic', 'pro', 'premium'],
        default: 'none',
      },
      startDate: Date,
      endDate: Date,
      paystackReference: String,
      paystackCustomerCode: String,
      paystackSubscriptionCode: String,
      nextPaymentDate: Date,
    },
    refreshToken: {
      type: String,
      select: false,
    },
    lastLogin: Date,
    // Simulator fields
    simulator: {
      balance: {
        type: Number,
        default: 10000,
      },
      level: {
        type: Number,
        default: 1,
        min: 1,
        max: 3,
      },
      totalTrades: {
        type: Number,
        default: 0,
      },
      achievements: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Achievement',
        },
      ],
      rulesViolations: {
        maxTradesPerDay: {
          type: Number,
          default: 0,
        },
        cooldownUntil: Date,
        lastResetDate: Date,
      },
      statistics: {
        winRate: { type: Number, default: 0 },
        profitLoss: { type: Number, default: 0 },
        maxDrawdown: { type: Number, default: 0 },
      },
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if user has active subscription
userSchema.methods.hasActiveSubscription = function () {
  return (
    this.subscription.status === 'active' &&
    this.subscription.endDate &&
    new Date(this.subscription.endDate) > new Date()
  );
};

// Safe user object (without sensitive data)
userSchema.methods.toSafeObject = function () {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.refreshToken;
  return userObject;
};

const User = mongoose.model('User', userSchema);

export default User;
