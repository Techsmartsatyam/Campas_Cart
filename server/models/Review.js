import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      default: null,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order reference is required'],
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    comment: {
      type: String,
      trim: true,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Schema validation: Review must reference at least shop OR product
reviewSchema.pre('validate', function (next) {
  if (!this.shop && !this.product) {
    this.invalidate('shop', 'A review must reference at least one of shop or product');
    this.invalidate('product', 'A review must reference at least one of shop or product');
  }
  next();
});

// Indexes
reviewSchema.index({ user: 1 });
reviewSchema.index({ shop: 1 });
reviewSchema.index({ product: 1 });

const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);

export default Review;
