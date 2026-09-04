import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Shop from './models/Shop.js';
import Product from './models/Product.js';
import Category from './models/Category.js';
import User from './models/User.js';

dotenv.config();

async function seedShopAndProduct() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campuscart');
  
  let shopkeeper = await User.findOne({ role: 'SHOPKEEPER' });
  if (!shopkeeper) {
    shopkeeper = await User.create({
      name: 'Shop Owner',
      email: 'shop@campuscart.com',
      password: 'Password123!',
      role: 'SHOPKEEPER',
      phone: '7777777777',
      isActive: true,
      accountStatus: 'APPROVED',
    });
  } else {
    shopkeeper.password = 'Password123!';
    await shopkeeper.save();
  }

  let cat = await Category.findOne({});
  if (!cat) {
    cat = await Category.create({ name: 'General', description: 'General items' });
  }

  let shop = await Shop.findOne({});
  if (!shop) {
    shop = await Shop.create({
      name: 'Campus Store',
      owner: shopkeeper._id,
      category: cat._id,
      address: 'Campus Center',
      isApproved: true,
      isActive: true,
      isOpen: true,
    });
  }

  let prod = await Product.findOne({ shop: shop._id });
  if (!prod) {
    prod = await Product.create({
      name: 'Notebook',
      shop: shop._id,
      category: cat._id,
      price: 50,
      stock: 100,
      unit: 'pcs',
      isAvailable: true,
      isActive: true,
    });
  }

  console.log('Sample shop & product seeded successfully.');
  await mongoose.disconnect();
}

seedShopAndProduct();
