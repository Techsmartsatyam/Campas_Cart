import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductById } from '../../services/studentService';
import api from '../../services/api';
import { LoadingSpinner } from '../../components/StudentUIComponents';
import { ArrowLeft, ChevronLeft, ChevronRight, X, Maximize2, ShoppingCart } from 'lucide-react';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Cart action state
  const [addingToCart, setAddingToCart] = useState(false);
  const [showShopConflictModal, setShowShopConflictModal] = useState(false);
  const [conflictMessage, setConflictMessage] = useState('');

  // Gallery state
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);

  const handleAddToCart = async (clearCartFirst = false) => {
    try {
      setAddingToCart(true);
      setShowShopConflictModal(false);
      const res = await api.post('/cart/add', {
        productId: product._id,
        quantity: 1,
        clearCartFirst,
      });

      if (res && res.success) {
        navigate('/cart');
      }
    } catch (err) {
      if (err.status === 409 || err.response?.status === 409 || err.differentShop) {
        setConflictMessage(err.message || err.response?.data?.message);
        setShowShopConflictModal(true);
      } else {
        alert(err.message || err.response?.data?.message || 'Failed to add item to cart');
      }
    } finally {
      setAddingToCart(false);
    }
  };

  useEffect(() => {
    async function fetchProduct() {
      setLoading(true);
      setError('');
      try {
        const res = await getProductById(id);
        if (res.success && res.product) {
          setProduct(res.product);
          setSelectedImageIndex(0);
        } else {
          setError(res.message || 'Product not found');
        }
      } catch (err) {
        setError(err.message || 'Product details unavailable');
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [id]);

  if (loading) return <LoadingSpinner />;

  if (error || !product) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <div className="glass-card" style={{ maxWidth: '500px', margin: '0 auto' }}>
          <h3 style={{ fontSize: '1.5rem', color: 'var(--danger)', marginBottom: '1rem' }}>{error || 'Product Unavailable'}</h3>
          <button onClick={() => navigate('/student')} className="btn-secondary">
            Back to Student Dashboard
          </button>
        </div>
      </div>
    );
  }

  const imagesList = Array.isArray(product.images) && product.images.length > 0 ? product.images : [];
  const currentImage = imagesList[selectedImageIndex] || null;

  const hasDiscount = product.discountPrice !== undefined && product.discountPrice !== null && product.discountPrice < product.price;
  const discountPercent = hasDiscount ? Math.round(((product.price - product.discountPrice) / product.price) * 100) : 0;

  const handlePrevImage = (e) => {
    if (e) e.stopPropagation();
    setSelectedImageIndex((prev) => (prev === 0 ? imagesList.length - 1 : prev - 1));
  };

  const handleNextImage = (e) => {
    if (e) e.stopPropagation();
    setSelectedImageIndex((prev) => (prev === imagesList.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem 5rem 1.5rem' }}>
      <button
        onClick={() => navigate(-1)}
        className="btn-secondary"
        style={{ marginBottom: '2rem', padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div
        className="glass-card"
        style={{
          padding: '2.5rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2.5rem',
          alignItems: 'start',
        }}
      >
        {/* Product Image Gallery Box */}
        <div>
          <div
            onClick={() => currentImage && setShowLightbox(true)}
            style={{
              width: '100%',
              height: '340px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(7, 17, 31, 0.8)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              overflow: 'hidden',
              position: 'relative',
              cursor: currentImage ? 'pointer' : 'default',
            }}
          >
            {currentImage ? (
              <>
                <img
                  src={currentImage}
                  alt={product.name}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: '0.75rem',
                    right: '0.75rem',
                    background: 'rgba(7, 17, 31, 0.7)',
                    padding: '0.35rem',
                    borderRadius: '0.375rem',
                    color: 'var(--text-primary)',
                  }}
                >
                  <Maximize2 size={16} />
                </div>
              </>
            ) : (
              <span style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>No Image Available</span>
            )}

            {/* Prev / Next controls on Main Image */}
            {imagesList.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevImage}
                  style={{
                    position: 'absolute',
                    left: '0.5rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(7, 17, 31, 0.8)',
                    border: '1px solid var(--border-color)',
                    color: '#fff',
                    borderRadius: '50%',
                    padding: '0.4rem',
                    cursor: 'pointer',
                  }}
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  onClick={handleNextImage}
                  style={{
                    position: 'absolute',
                    right: '0.5rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(7, 17, 31, 0.8)',
                    border: '1px solid var(--border-color)',
                    color: '#fff',
                    borderRadius: '50%',
                    padding: '0.4rem',
                    cursor: 'pointer',
                  }}
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}
          </div>

          {/* Thumbnails Gallery Strip */}
          {imagesList.length > 1 && (
            <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
              {imagesList.map((imgUrl, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '0.375rem',
                    border: idx === selectedImageIndex ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                    background: 'rgba(7, 17, 31, 0.8)',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    flexShrink: 0,
                    opacity: idx === selectedImageIndex ? 1 : 0.6,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <img src={imgUrl} alt={`Thumb ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Info Column */}
        <div>
          <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {product.category?.name || 'Category'}
          </span>

          <h1 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-primary)', margin: '0.5rem 0 1rem 0' }}>
            {product.name}
          </h1>

          {/* Pricing */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '2.2rem', fontWeight: '800', color: 'var(--text-primary)' }}>
              ₹{hasDiscount ? product.discountPrice : product.price}
            </span>
            {hasDiscount && (
              <>
                <span style={{ fontSize: '1.1rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                  ₹{product.price}
                </span>
                <span style={{ background: 'var(--danger)', color: '#fff', fontSize: '0.75rem', fontWeight: '700', padding: '0.25rem 0.6rem', borderRadius: '0.25rem' }}>
                  SAVE {discountPercent}%
                </span>
              </>
            )}
            {product.unit && <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>per {product.unit}</span>}
          </div>

          {/* Status badge */}
          <div style={{ marginBottom: '1.5rem' }}>
            <span
              style={{
                padding: '0.3rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.8rem',
                fontWeight: '700',
                background: product.stock > 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: product.stock > 0 ? 'var(--success)' : 'var(--danger)',
                border: `1px solid ${product.stock > 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              }}
            >
              {product.stock > 0 ? `In Stock (${product.stock} available)` : 'Currently Out of Stock'}
            </span>
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '2rem' }}>
            {product.description || 'No detailed product description available.'}
          </p>

          {/* Associated Shop Card */}
          {product.shop && (
            <div
              style={{
                background: 'rgba(7, 17, 31, 0.6)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                padding: '1.25rem',
                marginBottom: '2rem',
                display: 'flex',
                justify: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Sold & Fulfilled by</span>
                <strong style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>{product.shop.name}</strong>
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  📍 {product.shop.address}
                </span>
              </div>
              <button
                onClick={() => navigate(`/student/shops/${product.shop._id}`)}
                className="btn-secondary"
                style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}
              >
                View Shop
              </button>
            </div>
          )}

          {/* Add to Cart Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
            <button
              onClick={() => handleAddToCart(false)}
              disabled={addingToCart || product.stock <= 0}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '0.85rem',
                fontSize: '1.05rem',
                fontWeight: '700',
                justifyContent: 'center',
                opacity: addingToCart || product.stock <= 0 ? 0.6 : 1,
              }}
            >
              <ShoppingCart size={20} />
              {product.stock <= 0 ? 'Out of Stock' : addingToCart ? 'Adding to Cart...' : 'Add to Cart'}
            </button>
          </div>
        </div>
      </div>

      {/* Different Shop Confirmation Modal */}
      {showShopConflictModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justify: 'center',
          zIndex: 1000,
          padding: '1rem',
        }}>
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border-color)',
            borderRadius: '0.75rem',
            padding: '1.75rem',
            maxWidth: '450px',
            width: '100%',
            textAlign: 'center',
          }}>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
              Items from another shop in cart
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '1.5rem' }}>
              {conflictMessage || 'Your cart contains products from another shop. Clear existing cart and add this product?'}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
              <button
                onClick={() => setShowShopConflictModal(false)}
                className="btn-secondary"
                style={{ padding: '0.6rem 1.25rem' }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleAddToCart(true)}
                className="btn-primary"
                style={{ padding: '0.6rem 1.25rem' }}
              >
                Clear Cart & Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {showLightbox && currentImage && (
        <div
          onClick={() => setShowLightbox(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(7, 17, 31, 0.95)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            zIndex: 300,
            padding: '2rem',
          }}
        >
          <button
            onClick={() => setShowLightbox(false)}
            style={{
              position: 'absolute',
              top: '1.5rem',
              right: '1.5rem',
              background: 'none',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            <X size={28} />
          </button>

          {imagesList.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrevImage}
                style={{
                  position: 'absolute',
                  left: '1.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid var(--border-color)',
                  color: '#fff',
                  borderRadius: '50%',
                  padding: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                <ChevronLeft size={28} />
              </button>
              <button
                type="button"
                onClick={handleNextImage}
                style={{
                  position: 'absolute',
                  right: '1.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid var(--border-color)',
                  color: '#fff',
                  borderRadius: '50%',
                  padding: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                <ChevronRight size={28} />
              </button>
            </>
          )}

          <img
            src={currentImage}
            alt={product.name}
            style={{ maxWidth: '90%', maxHeight: '85vh', objectFit: 'contain', borderRadius: '0.5rem' }}
          />
        </div>
      )}
    </div>
  );
}
