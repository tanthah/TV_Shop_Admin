'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

export default function OrdersPage() {
  const [mounted, setMounted] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const baseURL = process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL || 'http://localhost:4000';

  const statusOptions = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'new', label: 'Mới', color: 'primary' },
    { value: 'confirmed', label: 'Đã xác nhận', color: 'primary' },
    { value: 'preparing', label: 'Đang chuẩn bị', color: 'warning' },
    { value: 'shipping', label: 'Đang giao', color: 'warning' },
    { value: 'completed', label: 'Hoàn tất', color: 'success' },
    { value: 'cancelled', label: 'Đã huỷ', color: 'danger' },
    { value: 'cancel_requested', label: 'Yêu cầu huỷ', color: 'danger' },
  ];

  const getStatusBadge = (status: string) => {
    const option = statusOptions.find(o => o.value === status);
    return option?.color || '';
  };

  const getStatusLabel = (status: string) => {
    const option = statusOptions.find(o => o.value === status);
    return option?.label || status;
  };

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const t = Cookies.get('admin_token') || '';
      if (!t) {
        setError('Bạn chưa đăng nhập');
        return;
      }
      const res = await axios.get(`${baseURL}/orders`, {
        params: statusFilter ? { status: statusFilter } : {},
        headers: { Authorization: `Bearer ${t}` },
      });
      setOrders(res.data?.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi tải đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchOrders();
  }, [statusFilter]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await axios.patch(
        `${baseURL}/orders/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${Cookies.get('admin_token') || ''}` } },
      );
      fetchOrders();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể cập nhật trạng thái');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!mounted) return null;

  return (
    <div className="admin-container">
      {/* Page Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 className="admin-title" style={{ marginBottom: 8 }}>Quản lý đơn hàng</h1>
        <p className="text-muted">Xem và cập nhật trạng thái đơn hàng</p>
      </div>

      {/* Status Summary Cards */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {statusOptions.filter(s => s.value).slice(0, 4).map((s) => {
          const count = orders.filter(o => o.status === s.value).length;
          return (
            <div
              key={s.value}
              className="stat-card"
              style={{
                cursor: 'pointer',
                borderColor: statusFilter === s.value ? 'var(--primary-500)' : undefined
              }}
              onClick={() => setStatusFilter(statusFilter === s.value ? '' : s.value)}
            >
              <div className="stat-card-label">{s.label}</div>
              <div className="stat-card-value">{statusFilter === '' ? count : (statusFilter === s.value ? orders.length : '—')}</div>
            </div>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="admin-toolbar">
        <div className="form-group" style={{ marginBottom: 0, minWidth: 200 }}>
          <label className="form-label" htmlFor="statusFilter">Lọc theo trạng thái</label>
          <select
            id="statusFilter"
            className="admin-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {statusOptions.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: 0, alignSelf: 'flex-end' }}>
          <button
            className="admin-button"
            onClick={fetchOrders}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="admin-spinner" style={{ width: 16, height: 16 }} />
                Đang tải...
              </>
            ) : (
              <> Làm mới</>
            )}
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="admin-alert error">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Orders Table */}
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Mã đơn hàng</th>
              <th>Khách hàng</th>
              <th>Tổng tiền</th>
              <th>Trạng thái hiện tại</th>
              <th style={{ width: 200 }}>Cập nhật trạng thái</th>
              <th>Ngày tạo</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o._id}>
                <td>
                  <span className="font-mono font-semibold px-2 py-1 rounded bg-gray-100 dark:bg-white/10">
                    #{o.orderCode}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      className="admin-avatar sm"
                      style={{
                        background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: 12,
                        fontWeight: 600
                      }}
                    >
                      {(typeof o.userId === 'string' ? o.userId : o.userId?.name)?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <span>{typeof o.userId === 'string' ? o.userId : o.userId?.name || o.userId?.email || 'N/A'}</span>
                  </div>
                </td>
                <td>
                  <span style={{ fontWeight: 600, color: 'var(--success-600)' }}>
                    {formatPrice(o.totalPrice)}
                  </span>
                </td>
                <td>
                  <span className={`admin-badge ${getStatusBadge(o.status)}`}>
                    {getStatusLabel(o.status)}
                  </span>
                </td>
                <td>
                  <select
                    className="admin-select"
                    style={{ height: 38, fontSize: 13 }}
                    value={o.status}
                    onChange={(e) => updateStatus(o._id, e.target.value)}
                  >
                    {statusOptions.filter(s => s.value).map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <span className="text-muted" style={{ fontSize: 13 }}>
                    {formatDate(o.createdAt)}
                  </span>
                </td>
              </tr>
            ))}
            {!orders.length && !loading && (
              <tr>
                <td colSpan={6}>
                  <div className="admin-empty">
                    <div className="admin-empty-icon">📋</div>
                    <div className="admin-empty-title">Không có đơn hàng</div>
                    <div className="admin-empty-text">
                      {statusFilter ? 'Không có đơn hàng nào với trạng thái này' : 'Chưa có đơn hàng nào trong hệ thống'}
                    </div>
                  </div>
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={6}>
                  <div className="admin-loading">
                    <span className="admin-spinner" />
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      {!loading && orders.length > 0 && (
        <div className="admin-card" style={{ marginTop: 16, textAlign: 'center' }}>
          <p className="text-muted" style={{ margin: 0 }}>
            Đang hiển thị <strong>{orders.length}</strong> đơn hàng
            {statusFilter && ` với trạng thái "${getStatusLabel(statusFilter)}"`}
          </p>
        </div>
      )}
    </div>
  );
}
