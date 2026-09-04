import mongoose from 'mongoose';

const shopSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Shop name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Shop owner is required'],
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    logo: {
      type: String,
      default: '',
    },
    coverImage: {
      type: String,
      default: '',
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Shop category is required'],
    },
    address: {
      type: String,
      required: [true, 'Shop address is required'],
      trim: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
    },
    isOpen: {
      type: Boolean,
      default: false,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    openingTime: {
      type: String,
      default: '',
    },
    closingTime: {
      type: String,
      default: '',
    },
    minimumOrderAmount: {
      type: Number,
      default: 0,
      min: [0, 'Minimum order amount cannot be negative'],
    },
    deliveryFee: {
      type: Number,
      default: 0,
      min: [0, 'Delivery fee cannot be negative'],
    },
    rating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be below 0'],
      max: [5, 'Rating cannot exceed 5'],
    },
    totalRatings: {
      type: Number,
      default: 0,
      min: [0, 'Total ratings cannot be negative'],
    },
    upiEnabled: {
      type: Boolean,
      default: true,
    },
    upiId: {
      type: String,
      trim: true,
      default: '',
    },
    upiQrImage: {
      type: String,
      default: '',
    },
    upiQrPublicId: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
shopSchema.index({ owner: 1 });
shopSchema.index({ category: 1 });
shopSchema.index({ location: '2dsphere' });

const Shop = mongoose.models.Shop || mongoose.model('Shop', shopSchema);

export default Shop;
