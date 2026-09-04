import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Shop from '../models/Shop.js';

// @route   GET /api/products
// @desc    Get active & available products with filters, search, sorting & pagination
// @access  Public
export const getProducts = async (req, res, next) => {
  try {
    const {
      shop,
      category,
      search,
      minPrice,
      maxPrice,
      sort,
      page = 1,
      limit = 12,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    // First find all approved & active shop IDs
    const activeShops = await Shop.find({ isApproved: true, isActive: true }).select('_id');
    const activeShopIds = activeShops.map((s) => s._id);

    const query = {
      isActive: true,
      isAvailable: true,
      shop: { $in: activeShopIds },
    };

    if (shop) {
      if (mongoose.Types.ObjectId.isValid(shop)) {
        query.shop = shop;
      } else {
        return res.status(400).json({ success: false, message: 'Invalid shop ID format' });
      }
    }

    if (category) {
      if (mongoose.Types.ObjectId.isValid(category)) {
        query.category = category;
      } else {
        return res.status(400).json({ success: false, message: 'Invalid category ID format' });
      }
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: searchRegex }, { description: searchRegex }];
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined && !isNaN(minPrice)) query.price.$gte = Number(minPrice);
      if (maxPrice !== undefined && !isNaN(maxPrice)) query.price.$lte = Number(maxPrice);
    }

    let sortOptions = { createdAt: -1 };
    if (sort === 'price_asc') sortOptions = { price: 1 };
    else if (sort === 'price_desc') sortOptions = { price: -1 };
    else if (sort === 'rating') sortOptions = { rating: -1 };

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('shop', 'name logo rating address isOpen')
      .populate('category', 'name')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/products/:id
// @desc    Get single product details
// @access  Public
export const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format',
      });
    }

    const product = await Product.findOne({
      _id: id,
      isActive: true,
      isAvailable: true,
    })
      .populate({
        path: 'shop',
        select: 'name description logo rating totalRatings address phone isOpen isApproved isActive',
        match: { isApproved: true, isActive: true },
      })
      .populate('category', 'name image');

    if (!product || !product.shop) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or unavailable',
      });
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    next(error);
  }
};
