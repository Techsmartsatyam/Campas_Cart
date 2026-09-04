import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getShopById, getProducts } from '../../services/studentService';
import { ProductCard, LoadingSpinner, EmptyState, SearchBar } from '../../components/StudentUIComponents';
import { Store, ArrowLeft, Phone, MapPin, Star } from 'lucide-react';

export default function ShopDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchShopData() {
      setLoading(true);
      setError('');
      try {
        const [shopRes, prodRes] = await Promise.all([
          getShopById(id),
          getProducts({ shop: id, search }),
        ]);

        if (shopRes.success) {
          setShop(shopRes.shop);
        }
        if (prodRes.success) {
          setProducts(prodRes.products);
        }
      } catch (err) {
        setError(err.message || 'Shop not found or unavailable');
      } finally {
        setLoading(false);
      }
    }
    fetchShopData();
  }, [id, search]);

  if (loading) return <LoadingSpinner />;

  if (error || !shop) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <div className="glass-card" style={{ maxWidth: '500px', margin: '0 auto' }}>
          <h3 style={{ fontSize: '1.5rem', color: 'var(--danger)', marginBottom: '1rem' }}>{error || 'Shop Unavailable'}</h3>
          <button onClick={() => navigate('/student')} className="btn-secondary">
            Back to Campus Stores
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem 5rem 1.5rem' }}>
      <button
        onClick={() => navigate(-1)}
        className="btn-secondary"
        style={{ marginBottom: '1.5rem', padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}
      >
        <ArrowLeft size={16} /> Back
      </button>

      {/* Shop Info Banner */}
      <div
        className="glass-card"
        style={{
          padding: '2rem',
          marginBottom: '2.5rem',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
          <div
            style={{
              width: '4rem',
              height: '4rem',
              borderRadius: '0.75rem',
              background: 'var(--surface-light)',
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              fontWeight: '800',
              color: 'var(--primary)',
              fontSize: '1.8rem',
              border: '1px solid var(--border-color)',
            }}
          >
            {shop.name.charAt(0)}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
              <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-primary)' }}>{shop.name}</h1>
              <span
                style={{
                  padding: '0.2rem 0.6rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  background: shop.isOpen ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: shop.isOpen ? 'var(--success)' : 'var(--danger)',
                }}
              >
                {shop.isOpen ? 'OPEN' : 'CLOSED'}
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '0.5rem' }}>
              {shop.description || 'Campus partner store'}
            </p>
            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <MapPin size={14} /> {shop.address}
              </span>
              <span>⭐ {shop.rating?.toFixed(1) || '4.5'} ({shop.totalRatings || 0} ratings)</span>
              <span>Min Order: ₹{shop.minimumOrderAmount || 0}</span>
              <span>Delivery: ₹{shop.deliveryFee || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Shop Products Section */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            Products at {shop.name}
          </h3>
          <div style={{ maxWidth: '300px', width: '100%' }}>
            <SearchBar value={search} onChange={setSearch} placeholder="Search in this shop..." />
          </div>
        </div>

        {products.length === 0 ? (
          <EmptyState message="No available products found in this store." />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem' }}>
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
