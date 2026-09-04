import mongoose from 'mongoose';
import Shop from '../models/Shop.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Notification from '../models/Notification.js';

// @route   GET /api/shopkeeper/stats
// @desc    Get real-time dashboard statistics for logged-in shopkeeper
// @access  Private/Shopkeeper
export const getShopkeeperStats = async (req, res, next) => {
  try {
    const shop = await Shop.findOne({ owner: req.user._id });
    if (!shop) {
      return res.status(200).json({
        success: true,
        stats: {
          totalProducts: 0,
          activeProducts: 0,
          outOfStock: 0,
          lowStock: 0,
          pendingOrders: 0,
          todaysOrders: 0,
          todaysSales: 0,
        },
      });
    }

    const [totalProducts, activeProducts, outOfStock, lowStock] = await Promise.all([
      Product.countDocuments({ shop: shop._id }),
      Product.countDocuments({ shop: shop._id, isActive: true, isAvailable: true }),
      Product.countDocuments({ shop: shop._id, stock: 0 }),
      Product.countDocuments({ shop: shop._id, stock: { $gt: 0, $lte: 5 } }),
    ]);

    const pendingOrders = await Order.countDocuments({
      shop: shop._id,
      orderStatus: { $in: ['PLACED', 'SHOP_ACCEPTED', 'PREPARING'] },
    });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todaysOrdersList = await Order.find({
      shop: shop._id,
      createdAt: { $gte: startOfToday },
    });

    const todaysOrders = todaysOrdersList.length;
    const todaysSales = todaysOrdersList
      .filter((o) => o.orderStatus !== 'CANCELLED')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    res.status(200).json({
      success: true,
      stats: {
        totalProducts,
        activeProducts,
        outOfStock,
        lowStock,
        pendingOrders,
        todaysOrders,
        todaysSales,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/shopkeeper/shop
// @desc    Create a new shop for logged-in shopkeeper
// @access  Private/Shopkeeper
export const createShop = async (req, res, next) => {
  try {
    const {
      name,
      description,
      phone,
      category,
      address,
      openingTime,
      closingTime,
      minimumOrderAmount,
      deliveryFee,
      logo,
      coverImage,
    } = req.body;

    if (!name || !category || !address) {
      return res.status(400).json({
        success: false,
        message: 'Shop name, category, and address are required.',
      });
    }

    const existingShop = await Shop.findOne({ owner: req.user._id });
    if (existingShop) {
      return res.status(400).json({
        success: false,
        message: 'You already have a shop created.',
      });
    }

    const shop = await Shop.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      phone: phone ? phone.trim() : '',
      owner: req.user._id,
      category,
      address: address.trim(),
      openingTime: openingTime || '',
      closingTime: closingTime || '',
      minimumOrderAmount: Number(minimumOrderAmount) || 0,
      deliveryFee: Number(deliveryFee) || 0,
      logo: logo || '',
      coverImage: coverImage || '',
      isApproved: true, // Auto approve for convenience in development
      isActive: true,
      isOpen: true,
    });

    res.status(201).json({
      success: true,
      message: 'Shop created successfully',
      shop,
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/shopkeeper/shop
// @desc    Get logged-in shopkeeper's shop details
// @access  Private/Shopkeeper
export const getMyShop = async (req, res, next) => {
  try {
    const shop = await Shop.findOne({ owner: req.user._id }).populate('category', 'name image');

    res.status(200).json({
      success: true,
      shop: shop || null,
    });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/shopkeeper/shop
// @desc    Update shop details for logged-in shopkeeper
// @access  Private/Shopkeeper
export const updateShop = async (req, res, next) => {
  try {
    const shop = await Shop.findOne({ owner: req.user._id });
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Shop not found' });
    }

    const {
      name,
      description,
      phone,
      category,
      address,
      openingTime,
      closingTime,
      minimumOrderAmount,
      deliveryFee,
      logo,
      coverImage,
      isOpen,
      upiEnabled,
      upiId,
      upiQrImage,
    } = req.body;

    if (name) shop.name = name.trim();
    if (description !== undefined) shop.description = description.trim();
    if (phone !== undefined) shop.phone = phone.trim();
    if (category) shop.category = category;
    if (address) shop.address = address.trim();
    if (openingTime !== undefined) shop.openingTime = openingTime;
    if (closingTime !== undefined) shop.closingTime = closingTime;
    if (minimumOrderAmount !== undefined) shop.minimumOrderAmount = Number(minimumOrderAmount);
    if (deliveryFee !== undefined) shop.deliveryFee = Number(deliveryFee);
    if (logo !== undefined) shop.logo = logo;
    if (coverImage !== undefined) shop.coverImage = coverImage;
    if (isOpen !== undefined) shop.isOpen = Boolean(isOpen);
    if (upiEnabled !== undefined) shop.upiEnabled = Boolean(upiEnabled);
    if (upiId !== undefined) shop.upiId = upiId.trim();
    if (upiQrImage !== undefined) shop.upiQrImage = upiQrImage;

    await shop.save();

    res.status(200).json({
      success: true,
      message: 'Shop details updated successfully',
      shop,
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/shopkeeper/products
// @desc    Get all products belonging to logged-in shopkeeper's shop
// @access  Private/Shopkeeper
export const getShopkeeperProducts = async (req, res, next) => {
  try {
    const shop = await Shop.findOne({ owner: req.user._id });
    if (!shop) {
      return res.status(200).json({ success: true, products: [] });
    }

    const products = await Product.find({ shop: shop._id })
      .populate('category', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/shopkeeper/products
// @desc    Add a product to shopkeeper's shop
// @access  Private/Shopkeeper
export const createProduct = async (req, res, next) => {
  try {
    const shop = await Shop.findOne({ owner: req.user._id });
    if (!shop) {
      return res.status(400).json({
        success: false,
        message: 'You must create a shop before adding products.',
      });
    }

    const {
      name,
      description,
      category,
      price,
      discountPrice,
      unit,
      stock,
      sku,
      isAvailable,
      images,
    } = req.body;

    if (!name || price === undefined || !category || !unit) {
      return res.status(400).json({
        success: false,
        message: 'Product name, price, category, and unit are required.',
      });
    }

    const numPrice = Number(price);
    const numDiscount = discountPrice !== undefined && discountPrice !== '' ? Number(discountPrice) : undefined;
    const numStock = Number(stock) || 0;

    if (numPrice < 0 || numStock < 0) {
      return res.status(400).json({
        success: false,
        message: 'Price and stock cannot be negative.',
      });
    }

    if (numDiscount !== undefined && (numDiscount < 0 || numDiscount > numPrice)) {
      return res.status(400).json({
        success: false,
        message: 'Discount price must be non-negative and less than or equal to original price.',
      });
    }

    const product = await Product.create({
      shop: shop._id,
      category,
      name: name.trim(),
      description: description ? description.trim() : '',
      price: numPrice,
      discountPrice: numDiscount,
      unit: unit.trim(),
      stock: numStock,
      sku: sku ? sku.trim() : '',
      isAvailable: isAvailable !== undefined ? isAvailable : numStock > 0,
      images: Array.isArray(images) ? images : [],
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product,
    });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/shopkeeper/products/:id
// @desc    Update product belonging to shopkeeper's shop
// @access  Private/Shopkeeper
export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }

    const shop = await Shop.findOne({ owner: req.user._id });
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Shop not found' });
    }

    let product = await Product.findOne({ _id: id, shop: shop._id });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or does not belong to your shop',
      });
    }

    const {
      name,
      description,
      category,
      price,
      discountPrice,
      unit,
      stock,
      sku,
      isAvailable,
      images,
    } = req.body;

    if (price !== undefined && Number(price) < 0) {
      return res.status(400).json({ success: false, message: 'Price cannot be negative' });
    }

    if (stock !== undefined && Number(stock) < 0) {
      return res.status(400).json({ success: false, message: 'Stock cannot be negative' });
    }

    if (name) product.name = name.trim();
    if (description !== undefined) product.description = description.trim();
    if (category) product.category = category;
    if (price !== undefined) product.price = Number(price);
    if (discountPrice !== undefined) {
      product.discountPrice = discountPrice !== '' ? Number(discountPrice) : undefined;
    }
    if (unit) product.unit = unit.trim();
    if (stock !== undefined) product.stock = Number(stock);
    if (sku !== undefined) product.sku = sku.trim();
    if (isAvailable !== undefined) product.isAvailable = isAvailable;
    if (images && Array.isArray(images)) product.images = images;

    if (product.stock === 0) {
      product.isAvailable = false;
    }

    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product,
    });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/shopkeeper/products/:id
// @desc    Delete product belonging to shopkeeper's shop
// @access  Private/Shopkeeper
export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }

    const shop = await Shop.findOne({ owner: req.user._id });
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Shop not found' });
    }

    const product = await Product.findOneAndDelete({ _id: id, shop: shop._id });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or does not belong to your shop',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/shopkeeper/inventory
// @desc    Get inventory items with low-stock / stock status
// @access  Private/Shopkeeper
export const getInventory = async (req, res, next) => {
  try {
    const shop = await Shop.findOne({ owner: req.user._id });
    if (!shop) {
      return res.status(200).json({ success: true, inventory: [] });
    }

    const products = await Product.find({ shop: shop._id })
      .populate('category', 'name')
      .select('name sku price stock isAvailable updatedAt category')
      .sort({ stock: 1 });

    const inventory = products.map((p) => {
      let stockStatus = 'IN_STOCK';
      if (p.stock === 0) stockStatus = 'OUT_OF_STOCK';
      else if (p.stock <= 5) stockStatus = 'LOW_STOCK';

      return {
        _id: p._id,
        name: p.name,
        sku: p.sku || 'N/A',
        category: p.category?.name || 'General',
        price: p.price,
        stock: p.stock,
        isAvailable: p.isAvailable,
        stockStatus,
        lastUpdated: p.updatedAt,
      };
    });

    res.status(200).json({
      success: true,
      count: inventory.length,
      inventory,
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/shopkeeper/orders
// @desc    Get orders belonging to shopkeeper's shop
// @access  Private/Shopkeeper
export const getShopkeeperOrders = async (req, res, next) => {
  try {
    const shop = await Shop.findOne({ owner: req.user._id });
    if (!shop) {
      return res.status(200).json({ success: true, orders: [] });
    }

    const orders = await Order.find({ shop: shop._id })
      .populate('user', 'name email phone')
      .populate('address')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

// @route   PATCH /api/shopkeeper/orders/:id/status
// @desc    Update order status within shopkeeper lifecycle limits
// @access  Private/Shopkeeper
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { orderStatus, cancellationReason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid order ID format' });
    }

    const shop = await Shop.findOne({ owner: req.user._id });
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Shop not found' });
    }

    const order = await Order.findOne({ _id: id, shop: shop._id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found or does not belong to your shop' });
    }

    const ALLOWED_SHOP_TRANSITIONS = {
      PLACED: ['SHOP_ACCEPTED', 'SHOP_REJECTED', 'CANCELLED'],
      SHOP_ACCEPTED: ['PREPARING', 'CANCELLED'],
      PREPARING: ['READY_FOR_PICKUP', 'CANCELLED'],
    };

    const allowed = ALLOWED_SHOP_TRANSITIONS[order.orderStatus] || [];
    if (!allowed.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Shopkeepers cannot transition status from ${order.orderStatus} to ${orderStatus}. Allowed transitions: ${allowed.join(', ')}`,
      });
    }

    const previousStatus = order.orderStatus;
    order.orderStatus = orderStatus;
    if (cancellationReason) {
      order.cancellationReason = cancellationReason.trim();
    }

    await order.save();

    // Stock Restoration: If order transitioned to CANCELLED or SHOP_REJECTED from an active state, restore inventory
    if (['CANCELLED', 'SHOP_REJECTED'].includes(orderStatus) && !['CANCELLED', 'SHOP_REJECTED'].includes(previousStatus)) {
      for (const item of order.items) {
        if (item.product) {
          const product = await Product.findById(item.product);
          if (product) {
            product.stock += item.quantity;
            if (product.stock > 0 && !product.isAvailable) {
              product.isAvailable = true;
            }
            await product.save();
          }
        }
      }
    }

    // Create Notification for Student if Shopkeeper rejects the order
    if (orderStatus === 'SHOP_REJECTED') {
      try {
        const reasonMsg = order.cancellationReason ? ` Reason: ${order.cancellationReason}` : '';
        await Notification.create({
          user: order.user,
          title: 'Order Rejected',
          message: `Your order ${order.orderNumber} was rejected by the shop.${reasonMsg}`,
          type: 'ORDER',
          relatedOrder: order._id,
          isRead: false,
        });
      } catch (notifErr) {
        console.warn('Shopkeeper rejection notification notice:', notifErr.message);
      }
    }

    res.status(200).json({
      success: true,
      message: `Order status updated to ${orderStatus}`,
      order,
    });
  } catch (error) {
    next(error);
  }
};
