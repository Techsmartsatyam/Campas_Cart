import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCategories, getProducts, getShops } from '../services/studentService';
import {
  SearchBar,
  CategoryCard,
  ShopCard,
  ProductCard,
  LoadingSpinner,
  EmptyState,
} from '../components/StudentUIComponents';
import NearCartLogo from '../components/NearCartLogo';

export default function Student() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [shops, setShops] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 24 });

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async (currentPage = 1) => {
    setLoading(true);
    setError('');
    try {
      const [shopsRes, catRes, prodRes] = await Promise.all([
        getShops(search),
        getCategories(),
        getProducts({ limit: 24, page: currentPage, search, category: selectedCategory }),
      ]);

      if (shopsRes.success) setShops(shopsRes.shops || []);
      if (catRes.success) setCategories(catRes.categories);
      if (prodRes.success) {
        setProducts(prodRes.products);
        if (prodRes.pagination) {
          setPagination(prodRes.pagination);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load NearCart products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [search, selectedCategory]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData(page);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, selectedCategory, page]);

  return (
    <div className="container" style={{ padding: '2rem 0.5rem 4rem 0.5rem' }}>
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
            placeholder="Search shops, Maggi, notebooks, snacks, drinks, pens..."
          />
        </div>
      </div>

      {/* Nearby Shops Section */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
              Nearby Shops & Hotels
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
              Select a shop to view its exclusive items and menu
            </p>
          </div>
        </div>

        {shops.length === 0 ? (
          <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            No active shops available right now.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
            {shops.map((shopItem) => (
              <ShopCard
                key={shopItem._id}
                shop={shopItem}
                onClick={() => navigate(`/student/shops/${shopItem._id}`)}
              />
            ))}
          </div>
        )}
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-primary)' }}>Available Products</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {pagination.total > 0 ? `Showing ${products.length} of ${pagination.total} items ready for immediate delivery` : 'Live items ready for immediate delivery'}
            </p>
          </div>

          {pagination.totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="btn-secondary"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', opacity: page <= 1 ? 0.5 : 1 }}
              >
                Previous
              </button>
              <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>
                Page {page} of {pagination.totalPages}
              </span>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                className="btn-secondary"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', opacity: page >= pagination.totalPages ? 0.5 : 1 }}
              >
                Next
              </button>
            </div>
          )}
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
          <>
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

            {/* Bottom Pagination controls */}
            {pagination.totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', marginTop: '2rem' }}>
                <button
                  disabled={page <= 1}
                  onClick={() => {
                    setPage((p) => Math.max(1, p - 1));
                    window.scrollTo({ top: 300, behavior: 'smooth' });
                  }}
                  className="btn-secondary"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', opacity: page <= 1 ? 0.5 : 1 }}
                >
                  ← Previous Page
                </button>
                <span style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  Page {page} of {pagination.totalPages}
                </span>
                <button
                  disabled={page >= pagination.totalPages}
                  onClick={() => {
                    setPage((p) => Math.min(pagination.totalPages, p + 1));
                    window.scrollTo({ top: 300, behavior: 'smooth' });
                  }}
                  className="btn-primary"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', opacity: page >= pagination.totalPages ? 0.5 : 1 }}
                >
                  Next Page →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
