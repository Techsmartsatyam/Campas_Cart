import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCategories, getShops, getProducts } from '../services/studentService';
import {
  SearchBar,
  CategoryCard,
  ShopCard,
  ProductCard,
  LoadingSpinner,
  EmptyState,
} from '../components/StudentUIComponents';
import { ShoppingBag, Store, ArrowRight, Compass } from 'lucide-react';

export default function Student() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [shops, setShops] = useState([]);
  const [products, setProducts] = useState([]);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [catRes, shopRes, prodRes] = await Promise.all([
        getCategories(),
        getShops(),
        getProducts({ limit: 24, search, category: selectedCategory }),
      ]);

      if (catRes.success) setCategories(catRes.categories);
      if (shopRes.success) setShops(shopRes.shops);
      if (prodRes.success) setProducts(prodRes.products);
    } catch (err) {
      setError(err.message || 'Failed to load campus data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, selectedCategory]);

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem 5rem 1.5rem' }}>
      {/* Welcome Banner */}
      <div
        className="glass-card"
        style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
          padding: '2.5rem 2rem',
          marginBottom: '2.5rem',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid var(--border-color)',
        }}
      >
        <div style={{ maxWidth: '600px', position: 'relative', zIndex: 10 }}>
          <span
            style={{
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              background: '#e0f2fe',
              color: 'var(--primary)',
              fontSize: '0.8rem',
              fontWeight: '700',
              display: 'inline-block',
              marginBottom: '0.75rem',
            }}
          >
            STUDENT DASHBOARD
          </span>
          <h1 style={{ fontSize: '2.2rem', fontWeight: '800', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            Welcome back, {user?.name ? user.name.split(' ')[0] : 'Student'}! 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '1.75rem' }}>
            Discover nearby campus shops, stationery stalls, and daily essentials.
          </p>

          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search products, shops, or categories..."
          />
        </div>
      </div>


      {/* Categories Horizontal Selector */}
      <div style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            Browse Categories
          </h3>
          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory('')}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              Clear Filter
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.85rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          <CategoryCard
            category={{ name: 'All Items' }}
            isSelected={selectedCategory === ''}
            onClick={() => setSelectedCategory('')}
          />
          {categories.map((cat) => (
            <CategoryCard
              key={cat._id}
              category={cat}
              isSelected={selectedCategory === cat._id}
              onClick={() => setSelectedCategory(selectedCategory === cat._id ? '' : cat._id)}
            />
          ))}
        </div>
      </div>

      {/* Main Grid: Campus Shops */}
      <div style={{ marginBottom: '3.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--text-primary)' }}>Campus Shops</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Approved local campus vendors & stalls</p>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : shops.length === 0 ? (
          <EmptyState message="No approved campus shops available right now." />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
            {shops.map((shop) => (
              <ShopCard key={shop._id} shop={shop} onClick={() => navigate(`/student/shops/${shop._id}`)} />
            ))}
          </div>
        )}
      </div>

      {/* Featured Products Grid */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--text-primary)' }}>Available Products</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Real-time inventory from campus stores</p>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : products.length === 0 ? (
          <EmptyState
            message="No products found matching your search or category criteria."
            onReset={() => {
              setSearch('');
              setSelectedCategory('');
            }}
          />
        ) : (
          <div className="product-grid-responsive">
            {products.map((prod) => (
              <ProductCard
                key={prod._id}
                product={prod}
                onClick={() => navigate(`/student/products/${prod._id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
