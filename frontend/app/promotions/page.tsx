'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import Swal from 'sweetalert2';

export default function PromotionsPage() {
  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    code: '',
    type: 'fixed',
    value: 0,
    minOrderValue: 0,
    maxDiscount: 0,
    maxUses: 0,
    expiryDate: '',
    isActive: true,
    description: '',
  });

  const baseURL = process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL || 'http://localhost:5001';

  const fetchCoupons = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${baseURL}/api/coupons/admin/list`, {
        params: { page, limit, q, status },
        headers: { Authorization: `Bearer ${Cookies.get('admin_token') || ''}` },
      });
      setItems(res.data?.data?.items || []);
      setTotal(res.data?.data?.total || 0);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi tải khuyến mãi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchCoupons();
  }, [page, limit, q, status]);

  const createCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${baseURL}/api/coupons`, form, {
        headers: { Authorization: `Bearer ${Cookies.get('admin_token') || ''}` },
      });
      setForm({ code: '', type: 'fixed', value: 0, minOrderValue: 0, maxDiscount: 0, maxUses: 0, expiryDate: '', isActive: true, description: '' });
      setShowForm(false);
      fetchCoupons();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tạo khuyến mãi');
    }
  };

  const setActive = async (id: string, value: boolean) => {
    try {
      await axios.patch(`${baseURL}/api/coupons/${id}/active?value=${value}`, {}, {
        headers: { Authorization: `Bearer ${Cookies.get('admin_token') || ''}` },
      });
      fetchCoupons();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể cập nhật trạng thái');
    }
  };

  const removeCoupon = async (id: string, code: string) => {
    const result = await Swal.fire({
      title: `Xóa mã "${code}"?`,
      text: "Hành động này không thể hoàn tác!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#4b5563',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${baseURL}/api/coupons/${id}`, {
          headers: { Authorization: `Bearer ${Cookies.get('admin_token') || ''}` },
        });
        Swal.fire({
          title: 'Đã xóa!',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
        fetchCoupons();
      } catch (err: any) {
        Swal.fire('Lỗi', err.response?.data?.message || 'Không thể xoá', 'error');
      }
    }
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  if (!mounted) return null;

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="admin-container">
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 className="admin-title" style={{ marginBottom: 8 }}>Quản lý khuyến mãi</h1>
          <p className="text-muted">Tạo và quản lý mã giảm giá, coupon</p>
        </div>
        <button
          className="admin-button success"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '✕ Đóng' : '+ Tạo mã mới'}
        </button>
      </div>

      {/* Create Coupon Form */}
      {showForm && (
        <div className="admin-card" style={{ marginBottom: 24 }}>
          <div className="admin-card-title">Tạo mã khuyến mãi mới</div>
          <form onSubmit={createCoupon}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label required" htmlFor="code">Mã khuyến mãi</label>
                <input
                  id="code"
                  className="admin-input"
                  placeholder="VD: SALE50"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  required
                  style={{ textTransform: 'uppercase' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label required" htmlFor="type">Loại giảm giá</label>
                <select
                  id="type"
                  className="admin-select"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="fixed">Số tiền cố định (VNĐ)</option>
                  <option value="percentage">Phần trăm (%)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label required" htmlFor="value">
                  Giá trị {form.type === 'percentage' ? '(%)' : '(VNĐ)'}
                </label>
                <input
                  id="value"
                  className="admin-input"
                  type="number"
                  min="0"
                  max={form.type === 'percentage' ? 100 : undefined}
                  placeholder="0"
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="minOrderValue">Đơn hàng tối thiểu (VNĐ)</label>
                <input
                  id="minOrderValue"
                  className="admin-input"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.minOrderValue}
                  onChange={(e) => setForm({ ...form, minOrderValue: Number(e.target.value) })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="maxDiscount">Giảm tối đa (VNĐ)</label>
                <input
                  id="maxDiscount"
                  className="admin-input"
                  type="number"
                  min="0"
                  placeholder="0 = Không giới hạn"
                  value={form.maxDiscount}
                  onChange={(e) => setForm({ ...form, maxDiscount: Number(e.target.value) })}
                />
                <span className="form-hint">Chỉ áp dụng cho loại phần trăm</span>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="maxUses">Lượt sử dụng tối đa</label>
                <input
                  id="maxUses"
                  className="admin-input"
                  type="number"
                  min="0"
                  placeholder="0 = Không giới hạn"
                  value={form.maxUses}
                  onChange={(e) => setForm({ ...form, maxUses: Number(e.target.value) })}
                />
              </div>

              <div className="form-group">
                <label className="form-label required" htmlFor="expiryDate">Ngày hết hạn</label>
                <input
                  id="expiryDate"
                  className="admin-input"
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Trạng thái</label>
                <label className="admin-checkbox">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  />
                  <span>Kích hoạt ngay</span>
                </label>
              </div>

              <div className="form-group full-width">
                <label className="form-label" htmlFor="description">Mô tả</label>
                <input
                  id="description"
                  className="admin-input"
                  placeholder="Mô tả nội dung khuyến mãi..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button className="admin-button success" type="submit">
                ✓ Tạo mã khuyến mãi
              </button>
              <button
                type="button"
                className="admin-button secondary"
                onClick={() => setShowForm(false)}
              >
                Huỷ
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Toolbar */}
      <div className="admin-toolbar">
        <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: 200 }}>
          <label className="form-label" htmlFor="search">Tìm kiếm</label>
          <input
            id="search"
            className="admin-input"
            placeholder="Nhập mã khuyến mãi..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0, minWidth: 160 }}>
          <label className="form-label" htmlFor="status">Trạng thái</label>
          <select id="status" className="admin-select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Tất cả</option>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Ngừng hoạt động</option>
          </select>
        </div>




      </div>

      {/* Error Alert */}
      {error && (
        <div className="admin-alert error">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Coupons Table */}
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Mã</th>
              <th>Loại</th>
              <th>Giá trị</th>
              <th>Đơn tối thiểu</th>
              <th>Hạn sử dụng</th>
              <th style={{ width: 120 }}>Trạng thái</th>
              <th style={{ width: 180 }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => {
              const isExpired = new Date(c.expiryDate) < new Date();
              return (
                <tr key={c._id}>
                  <td>
                    <span className="font-mono font-bold px-3 py-1.5 rounded-md text-sm bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700 dark:from-blue-900/30 dark:to-blue-800/30 dark:text-blue-300">
                      {c.code}
                    </span>
                  </td>
                  <td>
                    <span className={`admin-badge ${c.type === 'percentage' ? 'primary' : 'success'}`}>
                      {c.type === 'percentage' ? '% Phần trăm' : '₫ Cố định'}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {c.type === 'percentage' ? `${c.value}%` : formatPrice(c.value)}
                  </td>
                  <td>{c.minOrderValue > 0 ? formatPrice(c.minOrderValue) : '—'}</td>
                  <td>
                    <span style={{ color: isExpired ? 'var(--danger-500)' : 'inherit' }}>
                      {formatDate(c.expiryDate)}
                      {isExpired && <span className="admin-badge danger" style={{ marginLeft: 8 }}>Hết hạn</span>}
                    </span>
                  </td>
                  <td>
                    <span className={`admin-badge ${c.isActive ? 'success' : 'danger'}`} style={{ whiteSpace: 'nowrap' }}>
                      {c.isActive ? '✓ Hoạt động' : '✕ Ngừng'}
                    </span>
                  </td>
                  <td>
                    <div className="admin-actions">
                      <button
                        className={`admin-button ${c.isActive ? 'warning' : 'success'} sm`}
                        onClick={() => setActive(c._id, !c.isActive)}
                      >
                        {c.isActive ? '⏸ Ngừng' : '▶ Kích hoạt'}
                      </button>
                      <button
                        className="admin-button danger sm"
                        onClick={() => removeCoupon(c._id, c.code)}
                      >
                        Xoá
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!items.length && !loading && (
              <tr>
                <td colSpan={7}>
                  <div className="admin-empty">
                    <div className="admin-empty-icon">🏷️</div>
                    <div className="admin-empty-title">Chưa có mã khuyến mãi</div>
                    <div className="admin-empty-text">Bắt đầu bằng cách tạo mã khuyến mãi mới</div>
                  </div>
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={7}>
                  <div className="admin-loading">
                    <span className="admin-spinner" />
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="admin-pagination">
        <button
          className="admin-button secondary sm"
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
        >
          ← Trước
        </button>
        <span className="page-info">
          Trang {page} / {totalPages || 1} • Tổng {total} mã
        </span>
        <button
          className="admin-button sm"
          disabled={(page * limit) >= total}
          onClick={() => setPage(page + 1)}
        >
          Sau →
        </button>
      </div>
    </div>
  );
}
