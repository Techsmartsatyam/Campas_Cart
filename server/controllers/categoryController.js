import Category from '../models/Category.js';

// @route   GET /api/categories
// @desc    Get all active categories with optional search
// @access  Public
export const getCategories = async (req, res, next) => {
  try {
    const { search } = req.query;

    const query = { isActive: true };

    if (search) {
      query.name = { $regex: search.trim(), $options: 'i' };
    }

    const categories = await Category.find(query).sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    next(error);
  }
};
