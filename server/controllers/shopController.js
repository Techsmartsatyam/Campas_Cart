import mongoose from 'mongoose';
import Shop from '../models/Shop.js';

// @route   GET /api/shops
// @desc    Get all active and approved shops with search
// @access  Public
export const getShops = async (req, res, next) => {
  try {
    const { search } = req.query;

    const query = {
      isApproved: true,
      isActive: true,
    };

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: searchRegex }, { description: searchRegex }];
    }

    const shops = await Shop.find(query)
      .populate('category', 'name image')
      .select('-owner')
      .sort({ rating: -1, name: 1 });

    res.status(200).json({
      success: true,
      count: shops.length,
      shops,
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/shops/:id
// @desc    Get approved & active shop by ID
// @access  Public
export const getShopById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid shop ID format',
      });
    }

    const shop = await Shop.findOne({
      _id: id,
      isApproved: true,
      isActive: true,
    })
      .populate('category', 'name image')
      .select('-owner');

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found or currently unavailable',
      });
    }

    res.status(200).json({
      success: true,
      shop,
    });
  } catch (error) {
    next(error);
  }
};
