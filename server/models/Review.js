import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    type: {
      type: String,
      enum: {
        values: ['PRODUCT', 'SHOP', 'DELIVERY'],
        message: '{VALUE} is not a valid review type',
      },
      required: [true, 'Review type is required'],
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
    deliveryBoy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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
      maxlength: [500, 'Comment cannot exceed 500 characters'],
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

// Schema validation: Verify required fields based on review type
reviewSchema.pre('validate', function (next) {
  if (this.type === 'PRODUCT' && !this.product) {
    this.invalidate('product', 'Product reference is required for a PRODUCT review');
  }
  if (this.type === 'SHOP' && !this.shop) {
    this.invalidate('shop', 'Shop reference is required for a SHOP review');
  }
  if (this.type === 'DELIVERY' && !this.deliveryBoy) {
    this.invalidate('deliveryBoy', 'Delivery boy reference is required for a DELIVERY review');
  }
  next();
});

// Compound Unique Indexes to prevent duplicate reviews per order target
reviewSchema.index(
  { user: 1, order: 1, product: 1, type: 1 },
  { unique: true, partialFilterExpression: { type: 'PRODUCT', product: { $exists: true, $ne: null } } }
);
reviewSchema.index(
  { user: 1, order: 1, shop: 1, type: 1 },
  { unique: true, partialFilterExpression: { type: 'SHOP', shop: { $exists: true, $ne: null } } }
);
reviewSchema.index(
  { user: 1, order: 1, deliveryBoy: 1, type: 1 },
  { unique: true, partialFilterExpression: { type: 'DELIVERY', deliveryBoy: { $exists: true, $ne: null } } }
);

// Standard Lookup Indexes
reviewSchema.index({ user: 1 });
reviewSchema.index({ shop: 1 });
reviewSchema.index({ product: 1 });
reviewSchema.index({ deliveryBoy: 1 });
reviewSchema.index({ order: 1 });

const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);

export default Review;

