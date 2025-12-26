import mongoose from 'mongoose';

const affiliateClickSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    referrer: {
      type: String,
    },
    clickedAt: {
      type: Date,
      default: Date.now,
    },
    converted: {
      type: Boolean,
      default: false,
    },
    conversionDate: Date,
  },
  {
    timestamps: true,
  }
);

// Index for analytics queries
affiliateClickSchema.index({ clickedAt: -1 });
affiliateClickSchema.index({ user: 1 });

const AffiliateClick = mongoose.model('AffiliateClick', affiliateClickSchema);

export default AffiliateClick;
