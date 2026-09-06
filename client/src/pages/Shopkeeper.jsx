import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import api from '../services/api';
import { getCategories } from '../services/studentService';
import {
  Store,
  Plus,
  Package,
  ShoppingBag,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Layers,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  User,
  List,
  Upload,
  X,
} from 'lucide-react';

export default function Shopkeeper() {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('DASHBOARD');

  const [shop, setShop] = useState(null);
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Search & Filters for Products
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');

  // Shop Form State
  const [shopForm, setShopForm] = useState({
    name: '',
    description: '',
    phone: '',
    category: '',
    address: '',
    openingTime: '09:00 AM',
    closingTime: '09:00 PM',
    minimumOrderAmount: 0,
    deliveryFee: 0,
    isOpen: true,
  });

  // Product Add/Edit Modal & Multi-Image State
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    discountPrice: '',
    unit: 'piece',
    stock: 10,
    sku: '',
    isAvailable: true,
    images: [],
  });

  const [imageInput, setImageInput] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [shopRes, catRes] = await Promise.all([
        api.get('/shopkeeper/shop'),
        getCategories(),
      ]);

      if (catRes.success) {
        setCategories(catRes.categories);
      }

      if (shopRes.success) {
        setShop(shopRes.shop);
        if (shopRes.shop) {
          setShopForm({
            name: shopRes.shop.name || '',
            description: shopRes.shop.description || '',
            phone: shopRes.shop.phone || '',
            category: shopRes.shop.category?._id || shopRes.shop.category || '',
            address: shopRes.shop.address || '',
            openingTime: shopRes.shop.openingTime || '09:00 AM',
            closingTime: shopRes.shop.closingTime || '09:00 PM',
            minimumOrderAmount: shopRes.shop.minimumOrderAmount || 0,
            deliveryFee: shopRes.shop.deliveryFee || 0,
            isOpen: shopRes.shop.isOpen !== undefined ? shopRes.shop.isOpen : true,
            upiEnabled: shopRes.shop.upiEnabled !== undefined ? shopRes.shop.upiEnabled : true,
            upiId: shopRes.shop.upiId || '',
            upiQrImage: shopRes.shop.upiQrImage || '',
          });

          // Fetch Stats, Products, Inventory, Orders
          const [statsRes, prodRes, invRes, ordRes] = await Promise.all([
            api.get('/shopkeeper/stats'),
            api.get('/shopkeeper/products'),
            api.get('/shopkeeper/inventory'),
            api.get('/shopkeeper/orders'),
          ]);

          if (statsRes.success) setStats(statsRes.stats);
          if (prodRes.success) setProducts(prodRes.products);
          if (invRes.success) setInventory(invRes.inventory);
          if (ordRes.success) setOrders(ordRes.orders);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load shopkeeper data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const { socket } = useNotifications();

  // Listen to real-time order events for Shopkeeper
  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = async (data) => {
      console.log('⚡ [Shopkeeper Realtime] order:new received:', data);
      try {
        const ordRes = await api.get('/shopkeeper/orders');
        if (ordRes.success) setOrders(ordRes.orders);
        const statsRes = await api.get('/shopkeeper/stats');
        if (statsRes.success) setStats(statsRes.stats);
      } catch (err) {
        console.warn('Realtime shopkeeper refresh notice:', err.message);
      }
    };

    const handleOrderUpdated = async (data) => {
      console.log('⚡ [Shopkeeper Realtime] order:updated received:', data);
      try {
        const ordRes = await api.get('/shopkeeper/orders');
        if (ordRes.success) setOrders(ordRes.orders);
        const statsRes = await api.get('/shopkeeper/stats');
        if (statsRes.success) setStats(statsRes.stats);
      } catch (err) {
        console.warn('Realtime shopkeeper refresh notice:', err.message);
      }
    };

    socket.on('order:new', handleNewOrder);
    socket.on('order:updated', handleOrderUpdated);

    return () => {
      socket.off('order:new', handleNewOrder);
      socket.off('order:updated', handleOrderUpdated);
    };
  }, [socket]);

  // Handle Shop Create / Edit
  const handleSaveShop = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!shopForm.category) {
      setError('Please select a valid shop category.');
      return;
    }

    try {
      let res;
      if (shop) {
        res = await api.put('/shopkeeper/shop', shopForm);
      } else {
        res = await api.post('/shopkeeper/shop', shopForm);
      }

      if (res.success) {
        setSuccess(`Shop ${shop ? 'updated' : 'created'} successfully!`);
        setShop(res.shop);
        fetchData();
      }
    } catch (err) {
      setError(err.message || 'Failed to save shop.');
    }
  };

  // Open Modal for Add/Edit Product
  const openProductModal = (product = null) => {
    setError('');
    setSuccess('');
    setImageInput('');
    if (product) {
      setEditingProductId(product._id);
      setProductForm({
        name: product.name,
        description: product.description || '',
        category: product.category?._id || product.category || '',
        price: product.price,
        discountPrice: product.discountPrice !== undefined ? product.discountPrice : '',
        unit: product.unit || 'piece',
        stock: product.stock,
        sku: product.sku || '',
        isAvailable: product.isAvailable,
        images: Array.isArray(product.images) ? [...product.images] : [],
      });
    } else {
      setEditingProductId(null);
      setProductForm({
        name: '',
        description: '',
        category: categories.length > 0 ? categories[0]._id : '',
        price: '',
        discountPrice: '',
        unit: 'piece',
        stock: 10,
        sku: '',
        isAvailable: true,
        images: [],
      });
    }
    setShowProductModal(true);
  };

  // Add image URL or File Data URL to form list (Max 5)
  const handleAddImageUrl = () => {
    if (!imageInput.trim()) return;
    if (productForm.images.length >= 5) {
      setError('You can upload up to 5 images per product.');
      return;
    }
    setProductForm({
      ...productForm,
      images: [...productForm.images, imageInput.trim()],
    });
    setImageInput('');
  };

  // Handle local File selection (Convert to Data URL preview & validate max 5)
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;

    if (productForm.images.length + files.length > 5) {
      setError('You can upload up to 5 images per product.');
      return;
    }

    files.forEach((file) => {
      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
        setError('Only JPG, PNG and WEBP images are allowed.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB.');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setProductForm((prev) => ({
          ...prev,
          images: [...prev.images, reader.result],
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  // Remove Image from product images list
  const handleRemoveImage = (index) => {
    setProductForm({
      ...productForm,
      images: productForm.images.filter((_, i) => i !== index),
    });
  };

  // Save Product
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      let res;
      if (editingProductId) {
        res = await api.put(`/shopkeeper/products/${editingProductId}`, productForm);
      } else {
        res = await api.post('/shopkeeper/products', productForm);
      }

      if (res.success) {
        setSuccess(`Product ${editingProductId ? 'updated' : 'added'} successfully!`);
        setShowProductModal(false);
        fetchData();
      }
    } catch (err) {
      setError(err.message || 'Failed to save product.');
    }
  };

  // Delete Product
  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await api.delete(`/shopkeeper/products/${id}`);
      if (res.success) {
        setSuccess('Product deleted successfully.');
        fetchData();
      }
    } catch (err) {
      setError(err.message || 'Failed to delete product.');
    }
  };

  // Update Order Status
  const handleUpdateOrderStatus = async (orderId, nextStatus, cancellationReason = '') => {
    setError('');
    setSuccess('');
    try {
      const res = await api.patch(`/shopkeeper/orders/${orderId}/status`, {
        orderStatus: nextStatus,
        cancellationReason,
      });
      if (res && res.success) {
        setSuccess(`Order status updated to ${nextStatus}`);
        fetchData();
      }
    } catch (err) {
      setError(err.message || 'Failed to update order status.');
    }
  };

  // Filter Products for Tab
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCat = !selectedCategoryFilter || (p.category?._id || p.category) === selectedCategoryFilter;
    return matchesSearch && matchesCat;
  });

  if (loading) {
    return <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading Shopkeeper Business Portal...</div>;
  }

  return (
    <div className="container" style={{ padding: '3rem 1.5rem 5rem 1.5rem' }}>
      {/* Header Banner */}
      <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: '0.75rem', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Store size={32} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                {shop ? shop.name : 'Shopkeeper Portal'}
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                Owner: <strong>{user?.name}</strong> • Account Status: <strong style={{ color: 'var(--success)' }}>{user?.accountStatus}</strong>
              </p>
            </div>
          </div>

          {shop && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ padding: '0.3rem 0.75rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: '700', background: shop.isOpen ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: shop.isOpen ? 'var(--success)' : 'var(--danger)', border: `1px solid ${shop.isOpen ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}` }}>
                SHOP {shop.isOpen ? 'OPEN' : 'CLOSED'}
              </span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', marginBottom: '1.5rem' }}>
          <AlertCircle size={18} /> <span>{error}</span>
        </div>
      )}

      {success && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 'var(--radius-sm)', color: 'var(--success)', marginBottom: '1.5rem' }}>
          <CheckCircle2 size={18} /> <span>{success}</span>
        </div>
      )}

      {/* Case 1: No Shop Created Yet */}
      {!shop ? (
        <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto', padding: '2.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--text-primary)' }}>
            Register Your Campus Shop
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Create your store profile to start adding products and accepting orders.
          </p>

          <form onSubmit={handleSaveShop}>
            <div className="form-group">
              <label className="form-label">Shop Name</label>
              <input type="text" className="form-input" placeholder="e.g. Campus Central Store" value={shopForm.name} onChange={(e) => setShopForm({ ...shopForm, name: e.target.value })} required />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <input type="text" className="form-input" placeholder="e.g. Snacks, groceries, stationery" value={shopForm.description} onChange={(e) => setShopForm({ ...shopForm, description: e.target.value })} />
            </div>

            <div className="form-group">
              <label className="form-label">Shop Category / Type</label>
              <select
                name="category"
                className="form-input"
                value={shopForm.category}
                onChange={(e) => setShopForm({ ...shopForm, category: e.target.value })}
                required
              >
                <option value="">-- Select Category --</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Campus Address</label>
              <input type="text" className="form-input" placeholder="e.g. SAC Building, Room 102" value={shopForm.address} onChange={(e) => setShopForm({ ...shopForm, address: e.target.value })} required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Min Order (₹)</label>
                <input type="number" className="form-input" value={shopForm.minimumOrderAmount} onChange={(e) => setShopForm({ ...shopForm, minimumOrderAmount: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Delivery Fee (₹)</label>
                <input type="number" className="form-input" value={shopForm.deliveryFee} onChange={(e) => setShopForm({ ...shopForm, deliveryFee: e.target.value })} />
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
              Create Campus Shop
            </button>
          </form>
        </div>
      ) : (
        /* Case 2: Full Business Portal with Sub-Navigation */
        <div>
          {/* Sub-Navigation Tabs */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
            {[
              { id: 'DASHBOARD', label: 'Overview', icon: TrendingUp },
              { id: 'PRODUCTS', label: 'Products', icon: Package },
              { id: 'INVENTORY', label: 'Inventory', icon: Layers },
              { id: 'ORDERS', label: 'Orders', icon: ShoppingBag },
              { id: 'PAYMENT_SETTINGS', label: 'Payment Settings', icon: DollarSign },
              { id: 'MY_SHOP', label: 'Shop Settings', icon: Store },
              { id: 'PROFILE', label: 'My Profile', icon: User },
            ].map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                >
                  <IconComponent size={16} /> {tab.label}
                </button>
              );
            })}
          </div>

          {/* TAB 1: OVERVIEW DASHBOARD */}
          {activeTab === 'DASHBOARD' && stats && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Total Products</span>
                  <strong style={{ fontSize: '2rem', color: 'var(--primary)' }}>{stats.totalProducts}</strong>
                </div>
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Pending Orders</span>
                  <strong style={{ fontSize: '2rem', color: 'var(--warning)' }}>{stats.pendingOrders}</strong>
                </div>
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Today's Orders</span>
                  <strong style={{ fontSize: '2rem', color: 'var(--success)' }}>{stats.todaysOrders}</strong>
                </div>
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Today's Sales</span>
                  <strong style={{ fontSize: '2rem', color: 'var(--text-primary)' }}>₹{stats.todaysSales}</strong>
                </div>
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Low Stock Alert</span>
                  <strong style={{ fontSize: '2rem', color: stats.lowStock > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>{stats.lowStock}</strong>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRODUCTS MANAGEMENT */}
          {activeTab === 'PRODUCTS' && (
            <div className="glass-card" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--text-primary)' }}>Product Inventory ({filteredProducts.length})</h3>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search products..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    style={{ width: '200px', padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                  />
                  <select
                    className="form-input"
                    value={selectedCategoryFilter}
                    onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                    style={{ width: '160px', padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                  >
                    <option value="">All Categories</option>
                    {categories.map((c) => (<option key={c._id} value={c._id}>{c.name}</option>))}
                  </select>
                  <button onClick={() => openProductModal(null)} className="btn-primary" style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}>
                    <Plus size={16} /> Add Product
                  </button>
                </div>
              </div>

              {filteredProducts.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No products added yet.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '0.75rem' }}>Main Image</th>
                        <th style={{ padding: '0.75rem' }}>Product Name</th>
                        <th style={{ padding: '0.75rem' }}>Category</th>
                        <th style={{ padding: '0.75rem' }}>Price</th>
                        <th style={{ padding: '0.75rem' }}>Stock</th>
                        <th style={{ padding: '0.75rem' }}>Status</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((p) => (
                        <tr key={p._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '0.75rem' }}>
                            <div style={{ width: '45px', height: '45px', borderRadius: '0.375rem', background: 'rgba(7, 17, 31, 0.8)', border: '1px solid var(--border-color)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {p.images && p.images.length > 0 ? (
                                <img src={p.images[0]} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>No img</span>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '0.75rem', color: 'var(--text-primary)', fontWeight: '600' }}>
                            {p.name}
                            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.unit} ({p.images ? p.images.length : 0} imgs)</span>
                          </td>
                          <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{p.category?.name || 'General'}</td>
                          <td style={{ padding: '0.75rem' }}>
                            ₹{p.discountPrice !== undefined ? p.discountPrice : p.price}
                            {p.discountPrice !== undefined && (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'line-through', marginLeft: '0.4rem' }}>₹{p.price}</span>
                            )}
                          </td>
                          <td style={{ padding: '0.75rem' }}>{p.stock}</td>
                          <td style={{ padding: '0.75rem' }}>
                            <span style={{ padding: '0.2rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: '700', background: p.stock > 0 && p.isAvailable ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: p.stock > 0 && p.isAvailable ? 'var(--success)' : 'var(--danger)' }}>
                              {p.stock === 0 ? 'OUT OF STOCK' : p.stock <= 5 ? 'LOW STOCK' : 'IN STOCK'}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                            <button onClick={() => openProductModal(p)} className="btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', marginRight: '0.5rem' }}>
                              <Edit2 size={14} /> Edit
                            </button>
                            <button onClick={() => handleDeleteProduct(p._id)} className="btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', color: 'var(--danger)' }}>
                              <Trash2 size={14} /> Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: INVENTORY TRACKING */}
          {activeTab === 'INVENTORY' && (
            <div className="glass-card" style={{ padding: '2rem' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
                Inventory & Stock Control ({inventory.length})
              </h3>

              {inventory.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No inventory records.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '0.75rem' }}>Item</th>
                        <th style={{ padding: '0.75rem' }}>SKU</th>
                        <th style={{ padding: '0.75rem' }}>Category</th>
                        <th style={{ padding: '0.75rem' }}>Current Stock</th>
                        <th style={{ padding: '0.75rem' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.map((inv) => (
                        <tr key={inv._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '0.75rem', fontWeight: '600', color: 'var(--text-primary)' }}>{inv.name}</td>
                          <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{inv.sku}</td>
                          <td style={{ padding: '0.75rem' }}>{inv.category}</td>
                          <td style={{ padding: '0.75rem', fontWeight: '700' }}>{inv.stock}</td>
                          <td style={{ padding: '0.75rem' }}>
                            <span style={{ padding: '0.2rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: '700', background: inv.stockStatus === 'OUT_OF_STOCK' ? 'rgba(239, 68, 68, 0.15)' : inv.stockStatus === 'LOW_STOCK' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)', color: inv.stockStatus === 'OUT_OF_STOCK' ? 'var(--danger)' : inv.stockStatus === 'LOW_STOCK' ? 'var(--warning)' : 'var(--success)' }}>
                              {inv.stockStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ORDERS */}
          {activeTab === 'ORDERS' && (
            <div className="glass-card" style={{ padding: '2rem' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
                Incoming Campus Orders ({orders.length})
              </h3>

              {orders.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No orders received yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {orders.map((ord) => (
                    <div key={ord._id} style={{ padding: '1.25rem', background: 'rgba(7, 17, 31, 0.6)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <strong>Order #{ord.orderNumber}</strong>
                        <span style={{
                          color: ['CANCELLED', 'SHOP_REJECTED'].includes(ord.orderStatus) ? 'var(--danger)' : 'var(--primary)',
                          fontWeight: '700',
                        }}>
                          {ord.orderStatus}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Student: {ord.user?.name} ({ord.user?.phone}) • Total: ₹{ord.totalAmount}
                      </p>
                      <div style={{ margin: '0.35rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.825rem' }}>
                        <span>Payment: <strong>{ord.paymentMethod}</strong></span>
                        <span style={{
                          padding: '0.15rem 0.5rem',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          background: ord.paymentStatus === 'PAID' ? 'rgba(16, 185, 129, 0.15)' : ord.paymentStatus === 'USER_CONFIRMED' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                          color: ord.paymentStatus === 'PAID' ? 'var(--success)' : ord.paymentStatus === 'USER_CONFIRMED' ? '#fbbf24' : 'var(--text-muted)',
                        }}>
                          {ord.paymentStatus === 'USER_CONFIRMED' ? '🟡 Payment Claimed — Verification Required' : ord.paymentStatus === 'PAID' ? '🟢 PAID / VERIFIED' : ord.paymentStatus}
                        </span>
                      </div>
                      {/*   Agar koi proble ayi to yahi se remove krna h bro code ko*/}
{/* Ordered Products */}
{Array.isArray(ord.items) && ord.items.length > 0 && (
  <div
    style={{
      marginTop: '1rem',
      padding: '1rem',
      background: 'rgba(15, 23, 42, 0.7)',
      border: '1px solid var(--border-color)',
      borderRadius: '0.5rem',
    }}
  >
    <h4
      style={{
        margin: '0 0 0.75rem 0',
        color: 'var(--text-primary)',
        fontSize: '0.95rem',
      }}
    >
      Ordered Items ({ord.items.length})
    </h4>

    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      {ord.items.map((item, index) => (
        <div
          key={item._id || item.product?._id || index}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            padding: '0.65rem',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '0.4rem',
          }}
        >
          <div>
            <strong
              style={{
                color: 'var(--text-primary)',
                display: 'block',
              }}
            >
              {item.name || item.product?.name || 'Product'}
            </strong>

            <span
              style={{
                color: 'var(--text-muted)',
                fontSize: '0.8rem',
              }}
            >
              Quantity: {item.quantity}
            </span>
          </div>

          <div
            style={{
              color: 'var(--text-primary)',
              fontWeight: '700',
              whiteSpace: 'nowrap',
            }}
          >
            ₹{item.subtotal ?? ((item.price || 0) * (item.quantity || 0))}
          </div>
        </div>
      ))}
    </div>
  </div>
)}
{/* Yaha tak */}

                      {ord.cancellationReason && (
                        <p style={{ fontSize: '0.8rem', color: 'var(--danger)', marginTop: '0.25rem' }}>
                          Reason: {ord.cancellationReason}
                        </p>
                      )}
                      <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {ord.paymentStatus === 'USER_CONFIRMED' && (
                          <>
                            <button
                              onClick={async () => {
                                try {
                                  setLoading(true);
                                  const res = await api.patch(`/shopkeeper/orders/${ord._id}/verify-payment`);
                                  if (res && res.success) {
                                    setSuccess(`Payment for Order #${ord.orderNumber} verified successfully!`);
                                    fetchData();
                                  }
                                } catch (err) {
                                  setError(err.message || 'Failed to verify payment');
                                } finally {
                                  setLoading(false);
                                }
                              }}
                              className="btn-primary"
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                            >
                              ✓ Verify Payment
                            </button>

                            <button
                              onClick={async () => {
                                if (!window.confirm('Mark this payment as NOT received?')) return;
                                try {
                                  setLoading(true);
                                  const res = await api.patch(`/shopkeeper/orders/${ord._id}/reject-payment`);
                                  if (res && res.success) {
                                    setError(`Payment for Order #${ord.orderNumber} marked as NOT received.`);
                                    fetchData();
                                  }
                                } catch (err) {
                                  setError(err.message || 'Failed to reject payment');
                                } finally {
                                  setLoading(false);
                                }
                              }}
                              className="btn-secondary"
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.3)' }}
                            >
                              ✕ Payment Not Received
                            </button>
                          </>
                        )}
                        {ord.orderStatus === 'PLACED' && (
                          <>
                            <button onClick={() => handleUpdateOrderStatus(ord._id, 'SHOP_ACCEPTED')} className="btn-primary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>Accept Order</button>
                            <button onClick={() => {
                              const reason = window.prompt('Reason for rejecting this order (e.g. Product out of stock):', 'Product out of stock');
                              if (reason !== null) {
                                handleUpdateOrderStatus(ord._id, 'SHOP_REJECTED', reason);
                              }
                            }} className="btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>Reject Order</button>
                          </>
                        )}
                        {ord.orderStatus === 'SHOP_ACCEPTED' && (
                          <>
                            <button onClick={() => handleUpdateOrderStatus(ord._id, 'PREPARING')} className="btn-primary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>Start Preparing</button>
                            <button onClick={() => {
                              const reason = window.prompt('Reason for cancelling order:', 'Shop unable to fulfill order');
                              if (reason !== null) {
                                handleUpdateOrderStatus(ord._id, 'CANCELLED', reason);
                              }
                            }} className="btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>Cancel Order</button>
                          </>
                        )}
                        {ord.orderStatus === 'PREPARING' && (
                          <button onClick={() => handleUpdateOrderStatus(ord._id, 'READY_FOR_PICKUP')} className="btn-primary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>Mark Ready for Pickup</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: PAYMENT SETTINGS */}
          {activeTab === 'PAYMENT_SETTINGS' && (
            <div className="glass-card" style={{ maxWidth: '600px', padding: '2rem' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                Payment Settings & UPI QR
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                Manage your shop's UPI payments and payment QR code for student online orders.
              </p>

              <form onSubmit={handleSaveShop}>
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'rgba(7, 17, 31, 0.6)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', marginBottom: '1.25rem' }}>
                  <div>
                    <strong style={{ color: 'var(--text-primary)', display: 'block', fontSize: '0.95rem' }}>UPI Payments</strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Allow students to pay via your shop's UPI QR</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShopForm({ ...shopForm, upiEnabled: !shopForm.upiEnabled })}
                    className={shopForm.upiEnabled ? 'btn-primary' : 'btn-secondary'}
                    style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
                  >
                    {shopForm.upiEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>

                <div className="form-group">
                  <label className="form-label">UPI ID (VPA)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 9876543210@upi or shopname@okaxis"
                    value={shopForm.upiId}
                    onChange={(e) => setShopForm({ ...shopForm, upiId: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginTop: '1.25rem' }}>
                  <label className="form-label">UPI QR Code Image</label>
                  
                  {shopForm.upiQrImage ? (
                    <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', textAlign: 'center', marginBottom: '1rem' }}>
                      <div style={{ width: '180px', height: '180px', margin: '0 auto 1rem auto', borderRadius: '0.5rem', overflow: 'hidden', border: '2px solid var(--primary)', background: '#ffffff', padding: '0.5rem' }}>
                        <img src={shopForm.upiQrImage} alt="Shop UPI QR" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
                        <label className="btn-secondary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                          <Upload size={14} /> Replace QR
                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (!file) return;
                              if (file.size > 5 * 1024 * 1024) {
                                setError('QR image size must be less than 5MB');
                                return;
                              }
                              const reader = new FileReader();
                              reader.onload = () => setShopForm((prev) => ({ ...prev, upiQrImage: reader.result }));
                              reader.readAsDataURL(file);
                            }}
                          />
                        </label>

                        <button
                          type="button"
                          onClick={() => setShopForm({ ...shopForm, upiQrImage: '' })}
                          className="btn-secondary"
                          style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.3)' }}
                        >
                          <Trash2 size={14} /> Remove QR
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ border: '2px dashed var(--border-color)', padding: '1.5rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                      <Upload size={28} style={{ color: 'var(--primary)', marginBottom: '0.5rem' }} />
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 0.75rem 0' }}>
                        Upload your shop's official UPI QR Code (JPG, PNG, WEBP max 5MB)
                      </p>
                      <label className="btn-primary" style={{ display: 'inline-flex', padding: '0.45rem 1rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                        Upload QR Image
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (!file) return;
                            if (file.size > 5 * 1024 * 1024) {
                              setError('QR image size must be less than 5MB');
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = () => setShopForm((prev) => ({ ...prev, upiQrImage: reader.result }));
                            reader.readAsDataURL(file);
                          }}
                        />
                      </label>
                    </div>
                  )}
                </div>

                <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1.5rem' }}>
                  Save Payment Settings
                </button>
              </form>
            </div>
          )}

          {/* TAB 5: MY SHOP SETTINGS */}
          {activeTab === 'MY_SHOP' && (
            <div className="glass-card" style={{ maxWidth: '600px', padding: '2rem' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Shop Settings & Details</h3>
              <form onSubmit={handleSaveShop}>
                <div className="form-group"><label className="form-label">Shop Name</label><input type="text" className="form-input" value={shopForm.name} onChange={(e) => setShopForm({ ...shopForm, name: e.target.value })} required /></div>
                <div className="form-group"><label className="form-label">Description</label><input type="text" className="form-input" value={shopForm.description} onChange={(e) => setShopForm({ ...shopForm, description: e.target.value })} /></div>

                <div className="form-group">
                  <label className="form-label">Shop Category / Type</label>
                  <select
                    name="category"
                    className="form-input"
                    value={shopForm.category}
                    onChange={(e) => setShopForm({ ...shopForm, category: e.target.value })}
                    required
                  >
                    <option value="">-- Select Category --</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group"><label className="form-label">Campus Address</label><input type="text" className="form-input" value={shopForm.address} onChange={(e) => setShopForm({ ...shopForm, address: e.target.value })} required /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group"><label className="form-label">Min Order (₹)</label><input type="number" className="form-input" value={shopForm.minimumOrderAmount} onChange={(e) => setShopForm({ ...shopForm, minimumOrderAmount: e.target.value })} /></div>
                  <div className="form-group"><label className="form-label">Delivery Fee (₹)</label><input type="number" className="form-input" value={shopForm.deliveryFee} onChange={(e) => setShopForm({ ...shopForm, deliveryFee: e.target.value })} /></div>
                </div>
                <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Update Shop Settings</button>
              </form>
            </div>
          )}

          {/* TAB 6: MY PROFILE */}
          {activeTab === 'PROFILE' && user && (
            <div className="glass-card" style={{ maxWidth: '560px', padding: '2rem' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
                Shopkeeper Profile
              </h3>

              {/* Avatar / Photo Display */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  background: 'var(--surface-hover)',
                  border: '2px solid var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'center',
                  fontSize: '2rem',
                  fontWeight: '800',
                  color: 'var(--primary)',
                  flexShrink: 0,
                }}>
                  {user.profileImage ? (
                    <img src={user.profileImage} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span>{user.name ? user.name.charAt(0).toUpperCase() : 'S'}</span>
                  )}
                </div>

                <div>
                  <h4 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 0.25rem 0' }}>
                    {user.name}
                  </h4>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.75rem' }}>
                    Role: {user.role} • Status: <strong style={{ color: 'var(--success)' }}>{user.accountStatus}</strong>
                  </span>

                  <label className="btn-secondary" style={{ display: 'inline-flex', padding: '0.4rem 0.85rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                    <Upload size={14} /> Change Photo
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
                          setError('Only JPG, PNG and WEBP images are allowed.');
                          return;
                        }
                        if (file.size > 5 * 1024 * 1024) {
                          setError('Image size must be less than 5MB.');
                          return;
                        }

                        const reader = new FileReader();
                        reader.onload = async () => {
                          try {
                            setError('');
                            setSuccess('');
                            const res = await api.put('/auth/profile', { profileImage: reader.result });
                            if (res && res.success) {
                              setSuccess('Profile photo updated successfully!');
                              refreshUser();
                            }
                          } catch (err) {
                            setError(err.message || 'Failed to update profile photo');
                          }
                        };
                        reader.readAsDataURL(file);
                      }}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              </div>

              {/* Profile Details Form */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.95rem' }}>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.2rem' }}>Full Name</label>
                  <div style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{user.name}</div>
                </div>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.2rem' }}>Email Address</label>
                  <div style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{user.email}</div>
                </div>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.2rem' }}>Phone Number</label>
                  <div style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{user.phone}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Product Modal with Multi-Image Management */}
      {showProductModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(7, 17, 31, 0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '580px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
              {editingProductId ? 'Edit Product' : 'Add New Product'}
            </h3>

            <form onSubmit={handleSaveProduct}>
              <div className="form-group"><label className="form-label">Product Name</label><input type="text" className="form-input" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} required /></div>
              <div className="form-group"><label className="form-label">Category</label><select className="form-input" value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} required><option value="">Select Category</option>{categories.map((c) => (<option key={c._id} value={c._id}>{c.name}</option>))}</select></div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group"><label className="form-label">Price (₹)</label><input type="number" className="form-input" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} required /></div>
                <div className="form-group"><label className="form-label">Discount Price (₹)</label><input type="number" className="form-input" value={productForm.discountPrice} onChange={(e) => setProductForm({ ...productForm, discountPrice: e.target.value })} /></div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group"><label className="form-label">Unit</label><input type="text" className="form-input" placeholder="e.g. 500ml, packet, pc" value={productForm.unit} onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })} required /></div>
                <div className="form-group"><label className="form-label">Stock Quantity</label><input type="number" className="form-input" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })} required /></div>
              </div>

              {/* Multi-Image Upload & Preview Section */}
              <div className="form-group" style={{ background: 'rgba(7, 17, 31, 0.6)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <label className="form-label">Product Images (Max 5)</label>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.75rem' }}>
                  First image will automatically be used as the main product cover.
                </span>

                {/* Local File Upload Input */}
                <div style={{ marginBottom: '0.75rem' }}>
                  <label className="btn-secondary" style={{ display: 'inline-flex', padding: '0.4rem 0.85rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                    <Upload size={16} /> Choose Image Files (JPG, PNG, WEBP)
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      multiple
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>

                {/* Image URL Input option */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="Or enter Image URL..."
                    value={imageInput}
                    onChange={(e) => setImageInput(e.target.value)}
                    style={{ fontSize: '0.85rem' }}
                  />
                  <button type="button" onClick={handleAddImageUrl} className="btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', flexShrink: 0 }}>
                    Add URL
                  </button>
                </div>

                {/* Image Thumbnails List with Remove X */}
                {productForm.images.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {productForm.images.map((imgUrl, index) => (
                      <div
                        key={index}
                        style={{
                          width: '75px',
                          height: '75px',
                          borderRadius: '0.375rem',
                          border: index === 0 ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                          position: 'relative',
                          overflow: 'hidden',
                          background: '#07111f',
                        }}
                      >
                        <img src={imgUrl} alt={`Prod Preview ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        {index === 0 && (
                          <span style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(56, 189, 248, 0.9)', color: '#07111f', fontSize: '0.6rem', fontWeight: '800', textAlign: 'center' }}>
                            MAIN
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          style={{
                            position: 'absolute',
                            top: '2px',
                            right: '2px',
                            background: 'rgba(239, 68, 68, 0.85)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '50%',
                            width: '18px',
                            height: '18px',
                            display: 'flex',
                            alignItems: 'center',
                            justify: 'center',
                            cursor: 'pointer',
                          }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Save Product</button>
                <button type="button" onClick={() => setShowProductModal(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
