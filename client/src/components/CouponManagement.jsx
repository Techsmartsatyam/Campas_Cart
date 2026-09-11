import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  Percent,
  DollarSign,
  ToggleLeft,
  ToggleRight,
  X,
  Copy,
  Check,
  Zap,
} from 'lucide-react';

export default function CouponManagement({ shop }) {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [copiedCode, setCopiedCode] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: '',
    minimumOrderAmount: '0',
    maximumDiscount: '',
    usageLimit: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    isActive: true,
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/shopkeeper/coupons');
      if (res.success) {
        setCoupons(res.coupons || []);
      } else {
        setError(res.message || 'Failed to fetch coupons');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch coupons');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (coupon = null) => {
    setError('');
    setSuccess('');
    if (coupon) {
      setEditingCoupon(coupon);
      setFormData({
        code: coupon.code,
        description: coupon.description || '',
        discountType: coupon.discountType || 'PERCENTAGE',
        discountValue: coupon.discountValue || '',
        minimumOrderAmount: coupon.minimumOrderAmount || '0',
        maximumDiscount: coupon.maximumDiscount !== null ? coupon.maximumDiscount : '',
        usageLimit: coupon.usageLimit !== null ? coupon.usageLimit : '',
        startDate: coupon.startDate ? new Date(coupon.startDate).toISOString().split('T')[0] : '',
        endDate: coupon.endDate ? new Date(coupon.endDate).toISOString().split('T')[0] : '',
        isActive: coupon.isActive ?? true,
      });
    } else {
      setEditingCoupon(null);
      setFormData({
        code: '',
        description: '',
        discountType: 'PERCENTAGE',
        discountValue: '',
        minimumOrderAmount: '0',
        maximumDiscount: '',
        usageLimit: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        isActive: true,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCoupon(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.code.trim()) {
      setError('Coupon code is required');
      return;
    }

    if (!formData.discountValue || Number(formData.discountValue) <= 0) {
      setError('Please enter a valid discount value greater than 0');
      return;
    }

    if (formData.discountType === 'PERCENTAGE' && Number(formData.discountValue) > 100) {
      setError('Percentage discount cannot exceed 100%');
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      setError('Start date and end date are required');
      return;
    }

    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      setError('End date must be on or after start date');
      return;
    }

    try {
      setSaving(true);
      let res;
      if (editingCoupon) {
        res = await api.put(`/shopkeeper/coupons/${editingCoupon._id}`, formData);
      } else {
        res = await api.post('/shopkeeper/coupons', formData);
      }

      if (res.success) {
        setSuccess(res.message || (editingCoupon ? 'Coupon updated' : 'Coupon created'));
        handleCloseModal();
        fetchCoupons();
      } else {
        setError(res.message || 'Failed to save coupon');
      }
    } catch (err) {
      setError(err.message || 'Failed to save coupon');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (couponId, currentStatus) => {
    try {
      const res = await api.patch(`/shopkeeper/coupons/${couponId}/toggle`);
      if (res.success) {
        setCoupons((prev) =>
          prev.map((c) => (c._id === couponId ? { ...c, isActive: !currentStatus } : c))
        );
        setSuccess(res.message);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.message || 'Failed to update coupon status');
    }
  };

  const handleDelete = async (couponId, code) => {
    if (!window.confirm(`Are you sure you want to delete coupon code "${code}"?`)) {
      return;
    }

    try {
      const res = await api.delete(`/shopkeeper/coupons/${couponId}`);
      if (res.success) {
        setCoupons((prev) => prev.filter((c) => c._id !== couponId));
        setSuccess(`Coupon "${code}" deleted successfully`);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.message || 'Failed to delete coupon');
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  if (!shop) {
    return (
      <div className="bg-amber-50 rounded-2xl p-8 border border-amber-200 text-center my-6">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-amber-900 mb-1">Shop Setup Required</h3>
        <p className="text-sm text-amber-700">
          Please create and setup your shop profile first before creating coupon codes.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-6 rounded-2xl text-white shadow-lg">
        <div>
          <div className="flex items-center space-x-2">
            <Tag className="w-7 h-7 text-emerald-200" />
            <h2 className="text-2xl font-black tracking-tight">Coupon Codes & Discounts</h2>
          </div>
          <p className="text-emerald-100 text-sm mt-1">
            Create promotional discount codes for your customers at {shop.name}
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center justify-center space-x-2 bg-white text-emerald-700 hover:bg-emerald-50 px-5 py-2.5 rounded-xl font-bold transition shadow-md hover:shadow-lg active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>Create New Coupon</span>
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-center space-x-2 bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 text-sm font-medium">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-200 text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-500" />
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="ml-auto text-emerald-400 hover:text-emerald-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Coupons List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mx-auto mb-3"></div>
          <p className="text-slate-500 text-sm">Loading coupons...</p>
        </div>
      ) : coupons.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-sm space-y-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
            <Tag className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No Coupon Codes Created</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Boost your sales by creating custom discount codes like <span className="font-mono font-bold text-emerald-600">WELCOME10</span> or <span className="font-mono font-bold text-emerald-600">FLAT50</span> for your customers.
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center space-x-2 bg-emerald-600 text-white hover:bg-emerald-700 px-5 py-2.5 rounded-xl font-bold transition shadow-md"
          >
            <Plus className="w-5 h-5" />
            <span>Create First Coupon</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {coupons.map((coupon) => {
            const isExpired = new Date(coupon.endDate) < new Date();
            const isUpcoming = new Date(coupon.startDate) > new Date();

            return (
              <div
                key={coupon._id}
                className={`bg-white rounded-2xl border transition-all duration-200 shadow-sm hover:shadow-md overflow-hidden flex flex-col justify-between ${
                  !coupon.isActive
                    ? 'border-slate-200 opacity-75 bg-slate-50/50'
                    : isExpired
                    ? 'border-red-200 bg-red-50/20'
                    : 'border-emerald-200/80 hover:border-emerald-400'
                }`}
              >
                {/* Coupon Top Header */}
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-black text-lg bg-emerald-100 text-emerald-900 border border-emerald-200 px-3 py-1 rounded-lg flex items-center gap-1.5 tracking-wider">
                        {coupon.code}
                        <button
                          onClick={() => handleCopyCode(coupon.code)}
                          title="Copy Code"
                          className="text-emerald-700 hover:text-emerald-950 transition"
                        >
                          {copiedCode === coupon.code ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </span>
                    </div>

                    <span
                      className={`text-xs font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        !coupon.isActive
                          ? 'bg-slate-200 text-slate-700'
                          : isExpired
                          ? 'bg-red-100 text-red-700'
                          : isUpcoming
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {!coupon.isActive ? 'Inactive' : isExpired ? 'Expired' : isUpcoming ? 'Upcoming' : 'Active'}
                    </span>
                  </div>

                  {coupon.description && (
                    <p className="text-slate-600 text-xs line-clamp-2">{coupon.description}</p>
                  )}

                  {/* Main Value Banner */}
                  <div className="bg-emerald-50/80 border border-emerald-100 rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-emerald-800">
                      {coupon.discountType === 'PERCENTAGE' ? (
                        <Percent className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Zap className="w-5 h-5 text-emerald-600" />
                      )}
                      <div>
                        <div className="text-xs text-emerald-600 font-semibold uppercase tracking-wider">Discount</div>
                        <div className="text-lg font-black">
                          {coupon.discountType === 'PERCENTAGE'
                            ? `${coupon.discountValue}% OFF`
                            : `₹${coupon.discountValue} FLAT OFF`}
                        </div>
                      </div>
                    </div>

                    {coupon.maximumDiscount > 0 && coupon.discountType === 'PERCENTAGE' && (
                      <div className="text-right">
                        <div className="text-[10px] text-slate-500 font-medium">Max Discount</div>
                        <div className="text-xs font-bold text-slate-700">₹{coupon.maximumDiscount}</div>
                      </div>
                    )}
                  </div>

                  {/* Rules Details */}
                  <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Min Order:</span>
                      <span className="font-semibold text-slate-800">₹{coupon.minimumOrderAmount || 0}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Usage Count:</span>
                      <span className="font-semibold text-slate-800">
                        {coupon.usedCount || 0} {coupon.usageLimit ? `/ ${coupon.usageLimit}` : 'times'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {new Date(coupon.startDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} -{' '}
                        {new Date(coupon.endDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => handleToggleActive(coupon._id, coupon.isActive)}
                    className={`inline-flex items-center space-x-1.5 text-xs font-bold transition ${
                      coupon.isActive ? 'text-slate-600 hover:text-slate-900' : 'text-emerald-600 hover:text-emerald-700'
                    }`}
                  >
                    {coupon.isActive ? (
                      <>
                        <ToggleRight className="w-5 h-5 text-emerald-600" />
                        <span>Deactivate</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-5 h-5 text-slate-400" />
                        <span>Activate</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleOpenModal(coupon)}
                      title="Edit Coupon"
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(coupon._id, coupon.code)}
                      title="Delete Coupon"
                      className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Form for Create/Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Tag className="w-5 h-5 text-emerald-200" />
                <h3 className="font-bold text-lg">
                  {editingCoupon ? 'Edit Coupon Code' : 'Create New Coupon'}
                </h3>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-emerald-100 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              {/* Coupon Code */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Coupon Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WELCOME20, FLAT50"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full font-mono font-bold uppercase tracking-wider px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-slate-800 transition outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Get 20% off on your first order"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-slate-800 text-sm transition outline-none"
                />
              </div>

              {/* Discount Type & Value */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Discount Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-slate-800 text-sm transition outline-none bg-white font-medium"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Flat Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Discount Value {formData.discountType === 'PERCENTAGE' ? '(%)' : '(₹)'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    max={formData.discountType === 'PERCENTAGE' ? '100' : undefined}
                    step="any"
                    placeholder={formData.discountType === 'PERCENTAGE' ? 'e.g. 20' : 'e.g. 50'}
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-slate-800 font-bold transition outline-none"
                  />
                </div>
              </div>

              {/* Min Order & Max Discount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Min Order Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0 for no minimum"
                    value={formData.minimumOrderAmount}
                    onChange={(e) => setFormData({ ...formData, minimumOrderAmount: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-slate-800 text-sm transition outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Max Discount Limit (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Optional max limit"
                    disabled={formData.discountType === 'FIXED'}
                    value={formData.maximumDiscount}
                    onChange={(e) => setFormData({ ...formData, maximumDiscount: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-slate-800 text-sm transition outline-none disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </div>
              </div>

              {/* Usage Limit */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Total Usage Limit
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="Leave empty for unlimited usages"
                  value={formData.usageLimit}
                  onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-slate-800 text-sm transition outline-none"
                />
              </div>

              {/* Start & End Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-slate-800 text-sm transition outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-slate-800 text-sm transition outline-none"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center space-x-3 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <label htmlFor="isActive" className="text-sm font-semibold text-slate-700 cursor-pointer">
                  Activate coupon immediately
                </label>
              </div>

              {/* Modal Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
