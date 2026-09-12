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
            Back to NearCart Stores
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
          padding: '1.75rem',
          marginBottom: '2.5rem',
          width: '100%',
          boxSizing: 'border-box',
          overflow: 'hidden',
          maxWidth: '100%',
        }}
      >
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start', flexWrap: 'wrap', minWidth: 0, width: '100%' }}>
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
              flexShrink: 0,
            }}
          >
            {shop.name.charAt(0)}
          </div>
          <div style={{ flex: 1, minWidth: 0, maxWidth: '100%', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem', flexWrap: 'wrap', minWidth: 0 }}>
              <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0, overflowWrap: 'anywhere', wordBreak: 'break-word', minWidth: 0 }}>
                {shop.name}
              </h1>
              <span
                style={{
                  padding: '0.2rem 0.6rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  background: shop.isOpen ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: shop.isOpen ? 'var(--success)' : 'var(--danger)',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {shop.isOpen ? 'OPEN' : 'CLOSED'}
              </span>
            </div>

            <p style={{
              color: 'var(--text-secondary)',
              fontSize: '0.95rem',
              marginBottom: '0.75rem',
              lineHeight: '1.5',
              overflowWrap: 'anywhere',
              wordBreak: 'break-word',
              maxWidth: '100%',
            }}>
              {shop.description || 'Campus partner store'}
            </p>

            <div style={{ display: 'flex', gap: '0.75rem 1.5rem', flexWrap: 'wrap', fontSize: '0.85rem', color: 'var(--text-muted)', overflowWrap: 'anywhere', wordBreak: 'break-word', maxWidth: '100%' }}>
              {shop.address && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                  <MapPin size={14} style={{ flexShrink: 0 }} /> <span>{shop.address}</span>
                </span>
              )}
              {shop.phone && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Phone size={14} style={{ flexShrink: 0 }} /> <span>{shop.phone}</span>
                </span>
              )}
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

      {/* Shop Reviews Section */}
      <ShopReviewsSection shopId={id} shopName={shop.name} />
    </div>
  );
}

function ShopReviewsSection({ shopId, shopName }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ avgRating: 0, totalRatings: 0 });

  useEffect(() => {
    async function fetchShopReviews() {
      try {
        setLoading(true);
        const res = await api.get(`/reviews/shop/${shopId}`);
        if (res && res.success) {
          setReviews(res.data || []);
          setStats({
            avgRating: res.avgRating || 0,
            totalRatings: res.totalRatings || 0,
          });
        }
      } catch (err) {
        console.error('Failed to load shop reviews:', err);
      } finally {
        setLoading(false);
      }
    }
    if (shopId) fetchShopReviews();
  }, [shopId]);

  return (
    <div
      style={{
        marginTop: '3rem',
        background: 'var(--surface, #ffffff)',
        border: '1px solid var(--border-color, #e2e8f0)',
        borderRadius: '1rem',
        padding: '1.75rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Star size={20} fill="#f59e0b" style={{ color: '#f59e0b' }} /> Customer Reviews for {shopName}
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '800', fontSize: '1.1rem', color: '#f59e0b' }}>
          <span>{stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '0.0'}</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>({stats.totalRatings} ratings)</span>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '1.5rem' }}>
          <div className="spinner" style={{ margin: '0 auto 0.5rem auto' }}></div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading shop reviews...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem 1rem', background: '#f8fafc', borderRadius: '0.75rem', border: '1px dashed var(--border-color)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
            No shop reviews submitted yet.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {reviews.map((rev) => {
            const uName = rev.user?.name || 'Verified Student';
            const uImg = rev.user?.profileImage;
            const dateStr = new Date(rev.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });

            return (
              <div key={rev._id} style={{ padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', background: '#ffffff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: '800', fontSize: '0.85rem', overflow: 'hidden' }}>
                      {uImg ? <img src={uImg} alt={uName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : uName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-primary)' }}>{uName}</h4>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{dateStr}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.1rem', color: '#f59e0b' }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={13} fill={s <= rev.rating ? '#f59e0b' : 'none'} strokeWidth={1.5} />
                    ))}
                  </div>
                </div>

                {rev.comment && (
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    "{rev.comment}"
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
