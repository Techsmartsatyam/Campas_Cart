import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCategories, getProducts } from '../services/studentService';
import {
  SearchBar,
  CategoryCard,
  ProductCard,
  LoadingSpinner,
  EmptyState,
} from '../components/StudentUIComponents';
import NearCartLogo from '../components/NearCartLogo';

export default function Student() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [catRes, prodRes] = await Promise.all([
        getCategories(),
        getProducts({ limit: 24, search, category: selectedCategory }),
      ]);

      if (catRes.success) setCategories(catRes.categories);
      if (prodRes.success) setProducts(prodRes.products);
    } catch (err) {
      setError(err.message || 'Failed to load NearCart products');
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
    <div className="container" style={{ padding: '2rem 0.5rem 5rem 0.5rem' }}>
      {/* Welcome Banner */}
      <div
        className="glass-card"
        style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          padding: '2rem 1.5rem',
          marginBottom: '2rem',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid var(--border-color)',
        }}
      >
        <div style={{ maxWidth: '650px', position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <NearCartLogo size="small" />
            <span
              style={{
                padding: '0.2rem 0.6rem',
                borderRadius: '9999px',
                background: '#e0f2fe',
                color: 'var(--primary)',
                fontSize: '0.75rem',
                fontWeight: '800',
              }}
            >
              STUDENT MARKETPLACE
            </span>
          </div>

          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
            Welcome back, {user?.name ? user.name.split(' ')[0] : 'Student'}! 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            Browse products from nearby shops & enjoy fast local delivery straight to your location.
          </p>

          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search Maggi, notebooks, snacks, drinks, pens..."
          />
        </div>
      </div>

      {/* Categories Horizontal Selector */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-primary)' }}>
            Categories
          </h3>
          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory('')}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '700' }}
            >
              Clear Filter
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          <CategoryCard
            category={{ name: 'All Products' }}
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

      {/* Main Student Product Listing Grid */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-primary)' }}>Available Products</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Live items ready for immediate delivery</p>
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
                onShopClick={(e, shopId) => {
                  e.stopPropagation();
                  navigate(`/student/shops/${shopId}`);
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
