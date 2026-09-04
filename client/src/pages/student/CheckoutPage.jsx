import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { MapPin, Plus, Check, Tag, CreditCard, ShoppingBag, ShieldCheck, AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react';

export default function CheckoutPage() {
  const [cart, setCart] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Address Form Modal State
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressFormData, setAddressFormData] = useState({
    label: 'HOSTEL',
    hostelName: '',
    roomNumber: '',
    fullAddress: '',
    landmark: '',
    city: 'Campus Town',
    state: 'State',
    postalCode: '100001',
    isDefault: true,
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchCheckoutData();
  }, []);

  const fetchCheckoutData = async () => {
    try {
      setLoading(true);
      setError('');
      const [cartRes, addrRes] = await Promise.all([
        api.get('/cart'),
        api.get('/addresses'),
      ]);

      if (cartRes && cartRes.success) {
        setCart(cartRes.data);
        if (!cartRes.data.items || cartRes.data.items.length === 0) {
          navigate('/cart');
          return;
        }
      }

      if (addrRes && addrRes.success) {
        const addrList = addrRes.data || [];
        setAddresses(addrList);
        // Default select default address or first address
        const defaultAddr = addrList.find((a) => a.isDefault) || addrList[0];
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr._id);
        }
      }
    } catch (err) {
      console.error('Failed to load checkout data:', err);
      setError(err.message || 'Failed to load checkout data');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setCouponError('');
    try {
      const res = await api.post('/orders/apply-coupon', {
        couponCode: couponCode.trim(),
        subtotal,
      });

      if (res && res.success) {
        setAppliedCoupon(res.data);
      }
    } catch (err) {
      setAppliedCoupon(null);
      setCouponError(err.message || 'Invalid coupon code');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const handleCreateAddress = async (e) => {
    e.preventDefault();
    if (!addressFormData.fullAddress.trim()) {
      alert('Full address is required');
      return;
    }

    try {
      const res = await api.post('/addresses', addressFormData);
      if (res && res.success) {
        const newAddress = res.data;
        setAddresses([newAddress, ...addresses]);
        setSelectedAddressId(newAddress._id);
        setShowAddressModal(false);
        setAddressFormData({
          label: 'HOSTEL',
          hostelName: '',
          roomNumber: '',
          fullAddress: '',
          landmark: '',
          city: 'Campus Town',
          state: 'State',
          postalCode: '100001',
          isDefault: true,
        });
      }
    } catch (err) {
      alert(err.message || 'Failed to save address');
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      setError('Please select or add a delivery address');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const payload = {
        addressId: selectedAddressId,
        paymentMethod,
        couponCode: appliedCoupon ? appliedCoupon.code : undefined,
        notes,
      };

      // 1. Create Order Server-Side
      const res = await api.post('/orders', payload);

      if (res && res.success) {
        const createdOrder = res.data;

        if (['COD', 'UPI', 'ONLINE'].includes(paymentMethod)) {
          navigate(`/orders/${createdOrder._id}/success`);
          return;
        }
      }
    } catch (err) {
      console.error('Failed to place order:', err);
      setError(err.message || 'Failed to place order. Please try again.');
      setSubmitting(false);
    }
  };

  const items = cart?.items || [];
  const subtotal = items.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
  const shop = items.length > 0 ? items[0].shop : null;
  const deliveryFee = shop?.deliveryFee !== undefined ? shop.deliveryFee : 0;
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const finalTotal = Math.max(0, subtotal + deliveryFee - discountAmount);

  if (loading) {
    return (
      <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 1rem auto' }}></div>
        <p style={{ color: 'var(--text-muted)' }}>Preparing checkout details...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      {/* Back button & Title */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/cart" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
          <ArrowLeft size={16} /> Back to Cart
        </Link>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
          Checkout
        </h1>
      </div>

      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid var(--danger)',
          color: '#f87171',
          padding: '0.85rem 1.25rem',
          borderRadius: '0.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }} className="checkout-grid grid-responsive-2">
        {/* Left Column: Address & Payment */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* 1. Delivery Address Section */}
          <div style={{
            background: 'var(--surface)',
            borderRadius: '0.75rem',
            border: '1px solid var(--border-color)',
            padding: '1.5rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={20} style={{ color: 'var(--primary)' }} /> 1. Select Delivery Address
              </h3>
              <button
                onClick={() => setShowAddressModal(true)}
                className="btn-secondary"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
              >
                <Plus size={14} /> Add New Address
              </button>
            </div>

            {addresses.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', border: '1px dashed var(--border-color)', borderRadius: '0.5rem' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                  No delivery address saved yet. Please add a hostel or campus delivery address.
                </p>
                <button onClick={() => setShowAddressModal(true)} className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                  <Plus size={16} /> Add Delivery Address
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {addresses.map((addr) => {
                  const isSelected = selectedAddressId === addr._id;
                  return (
                    <div
                      key={addr._id}
                      onClick={() => setSelectedAddressId(addr._id)}
                      style={{
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                        background: isSelected ? 'rgba(56, 189, 248, 0.05)' : 'var(--surface-hover)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem',
                      }}
                    >
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        border: isSelected ? '6px solid var(--primary)' : '2px solid var(--border-color)',
                        background: '#07111f',
                        marginTop: '0.2rem',
                        flexShrink: 0,
                      }}></div>

                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{
                            background: 'var(--primary-gradient)',
                            color: '#07111f',
                            fontSize: '0.7rem',
                            fontWeight: '800',
                            padding: '0.15rem 0.4rem',
                            borderRadius: '0.25rem',
                            textTransform: 'uppercase',
                          }}>
                            {addr.label || 'HOSTEL'}
                          </span>
                          {addr.hostelName && (
                            <span style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                              {addr.hostelName} {addr.roomNumber ? `(Room ${addr.roomNumber})` : ''}
                            </span>
                          )}
                        </div>

                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0.4rem 0 0 0' }}>
                          {addr.fullAddress}
                        </p>
                        {addr.landmark && (
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0.2rem 0 0 0' }}>
                            Landmark: {addr.landmark}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. Payment Method Section */}
          <div style={{
            background: 'var(--surface)',
            borderRadius: '0.75rem',
            border: '1px solid var(--border-color)',
            padding: '1.5rem',
          }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CreditCard size={20} style={{ color: 'var(--primary)' }} /> 2. Select Payment Method
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* COD Option */}
              <div
                onClick={() => setPaymentMethod('COD')}
                style={{
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  border: paymentMethod === 'COD' ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                  background: paymentMethod === 'COD' ? 'rgba(56, 189, 248, 0.05)' : 'var(--surface-hover)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}
              >
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: paymentMethod === 'COD' ? '6px solid var(--primary)' : '2px solid var(--border-color)',
                  background: '#07111f',
                  flexShrink: 0,
                }}></div>
                <div>
                  <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                    Cash on Delivery (COD)
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Pay in cash or UPI when your order is delivered to your hostel.
                  </div>
                </div>
              </div>

              {/* UPI Option */}
              <div
                onClick={() => {
                  if (shop?.upiEnabled === false) {
                    alert('This shop does not have UPI payments enabled. Please select Cash on Delivery (COD).');
                    return;
                  }
                  setPaymentMethod('UPI');
                }}
                style={{
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  border: paymentMethod === 'UPI' ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                  background: paymentMethod === 'UPI' ? 'rgba(56, 189, 248, 0.05)' : 'var(--surface-hover)',
                  cursor: shop?.upiEnabled === false ? 'not-allowed' : 'pointer',
                  opacity: shop?.upiEnabled === false ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}
              >
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: paymentMethod === 'UPI' ? '6px solid var(--primary)' : '2px solid var(--border-color)',
                  background: '#07111f',
                  flexShrink: 0,
                }}></div>
                <div>
                  <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    Shopkeeper UPI QR <span style={{ fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', padding: '0.1rem 0.4rem', borderRadius: '0.25rem' }}>Direct Pay</span>
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {shop?.upiEnabled === false
                      ? 'Shopkeeper has not enabled UPI QR payment.'
                      : `Scan & pay directly to ${shop?.name || 'Shopkeeper'}'s UPI QR code.`}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Delivery Notes Section */}
          <div style={{
            background: 'var(--surface)',
            borderRadius: '0.75rem',
            border: '1px solid var(--border-color)',
            padding: '1.5rem',
          }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
              3. Delivery Instructions (Optional)
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Please leave at hostel reception if not in room..."
              rows={2}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                background: '#0f172a',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
              }}
            />
          </div>

        </div>

        {/* Right Column: Checkout Summary */}
        <div>
          <div style={{
            background: 'var(--surface)',
            borderRadius: '0.75rem',
            border: '1px solid var(--border-color)',
            padding: '1.5rem',
            position: 'sticky',
            top: '5.5rem',
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              Order Items ({items.length})
            </h3>

            {/* Item list snapshot */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '200px', overflowY: 'auto', marginBottom: '1.25rem', paddingRight: '0.25rem' }}>
              {items.map((item) => (
                <div key={item.product?._id || item._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: '700', color: 'var(--primary)' }}>{item.quantity}x</span>
                    <span style={{ color: 'var(--text-primary)' }}>{item.product?.name}</span>
                  </div>
                  <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Coupon Code Section */}
            <div style={{ marginBottom: '1.25rem', paddingTop: '1rem', borderTop: '1px dashed var(--border-color)' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Have a Coupon Code?
              </label>

              {appliedCoupon ? (
                <div style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid var(--success)',
                  color: 'var(--success)',
                  padding: '0.6rem 0.85rem',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  justify: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.85rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <CheckCircle size={16} />
                    <span>Coupon <strong>{appliedCoupon.code}</strong> applied (-₹{appliedCoupon.discountAmount})</span>
                  </div>
                  <button onClick={handleRemoveCoupon} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.75rem', textDecoration: 'underline' }}>
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="ENTER CODE"
                    style={{
                      flex: 1,
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.4rem',
                      background: '#0f172a',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem',
                      textTransform: 'uppercase',
                    }}
                  />
                  <button type="submit" className="btn-secondary" style={{ padding: '0.5rem 0.85rem', fontSize: '0.85rem' }}>
                    Apply
                  </button>
                </form>
              )}

              {couponError && (
                <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.4rem', margin: 0 }}>
                  {couponError}
                </p>
              )}
            </div>

            {/* Price Calculations */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.95rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Delivery Fee</span>
                <span>{deliveryFee > 0 ? `₹${deliveryFee.toFixed(2)}` : 'FREE'}</span>
              </div>
              {appliedCoupon && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)' }}>
                  <span>Discount</span>
                  <span>-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.25rem 0' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: '800' }}>
                <span style={{ color: 'var(--text-primary)' }}>Final Total</span>
                <span style={{ color: 'var(--primary)' }}>₹{finalTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Place Order Button */}
            <button
              onClick={handlePlaceOrder}
              disabled={submitting || !selectedAddressId}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '0.85rem',
                fontSize: '1.05rem',
                fontWeight: '800',
                marginTop: '1.5rem',
                justifyContent: 'center',
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? 'Placing Order...' : 'Place Order Now'}
            </button>
          </div>
        </div>
      </div>

      {/* Add Address Modal */}
      {showAddressModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justify: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border-color)',
            borderRadius: '0.75rem',
            padding: '1.75rem',
            width: '100%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
              Add Delivery Address
            </h2>

            <form onSubmit={handleCreateAddress} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Address Type</label>
                <select
                  value={addressFormData.label}
                  onChange={(e) => setAddressFormData({ ...addressFormData, label: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', background: '#0f172a', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '0.4rem' }}
                >
                  <option value="HOSTEL">Hostel</option>
                  <option value="HOME">Home</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Hostel Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Boys Hostel A"
                    value={addressFormData.hostelName}
                    onChange={(e) => setAddressFormData({ ...addressFormData, hostelName: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', background: '#0f172a', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '0.4rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Room Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 302"
                    value={addressFormData.roomNumber}
                    onChange={(e) => setAddressFormData({ ...addressFormData, roomNumber: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', background: '#0f172a', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '0.4rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Full Address *</label>
                <textarea
                  required
                  placeholder="Block / Floor / Full Hostel Address..."
                  value={addressFormData.fullAddress}
                  onChange={(e) => setAddressFormData({ ...addressFormData, fullAddress: e.target.value })}
                  rows={2}
                  style={{ width: '100%', padding: '0.6rem', background: '#0f172a', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '0.4rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Landmark</label>
                <input
                  type="text"
                  placeholder="Near Mess / Main Gate"
                  value={addressFormData.landmark}
                  onChange={(e) => setAddressFormData({ ...addressFormData, landmark: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', background: '#0f172a', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '0.4rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowAddressModal(false)} className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ padding: '0.5rem 1rem' }}>
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @media (min-width: 900px) {
          .checkout-grid {
            grid-template-columns: 1fr 360px !important;
          }
        }
      `}</style>
    </div>
  );
}
