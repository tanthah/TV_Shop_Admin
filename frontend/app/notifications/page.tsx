'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

export default function NotificationsPage() {
  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    userId: '',
    type: 'order_confirmed',
    title: '',
    message: '',
    link: '',
  });

  const baseURL = process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL || 'http://localhost:4000';

  const notificationTypes = [
    { value: 'order_confirmed', label: 'Đơn hàng đã xác nhận', icon: '📋' },
    { value: 'order_shipping', label: 'Đang giao hàng', icon: '🚚' },
    { value: 'order_completed', label: 'Hoàn tất đơn hàng', icon: '✅' },
    { value: 'coupon_received', label: 'Nhận mã giảm giá', icon: '🏷️' },
    { value: 'comment_reply', label: 'Phản hồi bình luận', icon: '💬' },
    { value: 'loyalty_points', label: 'Điểm thưởng', icon: '⭐' },
    { value: 'order_cancelled', label: 'Huỷ đơn hàng', icon: '❌' },
  ];

  const getTypeLabel = (type: string) => {
    const found = notificationTypes.find(t => t.value === type);
    return found?.label || type;
  };

  const getTypeIcon = (type: string) => {
    const found = notificationTypes.find(t => t.value === type);
    return found?.icon || '🔔';
  };

  const fetchNotifications = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${baseURL}/notifications`, {
        params: { page, limit, status },
        headers: { Authorization: `Bearer ${Cookies.get('admin_token') || ''}` },
      });
      setItems(res.data?.data?.items || []);
      setTotal(res.data?.data?.total || 0);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi tải thông báo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchNotifications();
  }, [page, limit, status]);

  const createNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${baseURL}/notifications`, form, {
        headers: { Authorization: `Bearer ${Cookies.get('admin_token') || ''}` },
      });
      setForm({ userId: '', type: 'order_confirmed', title: '', message: '', link: '' });
      setShowForm(false);
      fetchNotifications();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tạo thông báo');
    }
  };

  const setRead = async (id: string, value: boolean) => {
    try {
      await axios.patch(`${baseURL}/notifications/${id}/read?value=${value}`, {}, {
        headers: { Authorization: `Bearer ${Cookies.get('admin_token') || ''}` },
      });
      fetchNotifications();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể cập nhật trạng thái');
    }
  };

  const removeNotification = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xoá thông báo này?')) return;
    try {
      await axios.delete(`${baseURL}/notifications/${id}`, {
        headers: { Authorization: `Bearer ${Cookies.get('admin_token') || ''}` },
      });
      fetchNotifications();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể xoá');
    }
  };

  if (!mounted) return null;

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="admin-container">
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 className="admin-title" style={{ marginBottom: 8 }}>Quản lý thông báo</h1>
          <p className="text-muted">Gửi và quản lý thông báo tới người dùng</p>
        </div>
        <button
          className="admin-button success"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '✕ Đóng' : '+ Gửi thông báo mới'}
        </button>
      </div>

      {/* Create Notification Form */}
      {showForm && (
        <div className="admin-card" style={{ marginBottom: 24 }}>
          <div className="admin-card-title">🔔 Gửi thông báo mới</div>
          <form onSubmit={createNotification}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label required" htmlFor="userId">User ID</label>
                <input
                  id="userId"
                  className="admin-input"
                  placeholder="ID người nhận"
                  value={form.userId}
                  onChange={(e) => setForm({ ...form, userId: e.target.value })}
                  required
                />
                <span className="form-hint">ID của người dùng sẽ nhận thông báo</span>
              </div>

              <div className="form-group">
                <label className="form-label required" htmlFor="type">Loại thông báo</label>
                <select
                  id="type"
                  className="admin-select"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  {notificationTypes.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group full-width">
                <label className="form-label required" htmlFor="title">Tiêu đề</label>
                <input
                  id="title"
                  className="admin-input"
                  placeholder="Tiêu đề thông báo"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group full-width">
                <label className="form-label required" htmlFor="message">Nội dung</label>
                <input
                  id="message"
                  className="admin-input"
                  placeholder="Nội dung chi tiết thông báo"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  required
                />
              </div>

              <div className="form-group full-width">
                <label className="form-label" htmlFor="link">Link (tuỳ chọn)</label>
                <input
                  id="link"
                  className="admin-input"
                  placeholder="VD: /orders/123"
                  value={form.link}
                  onChange={(e) => setForm({ ...form, link: e.target.value })}
                />
                <span className="form-hint">Link điều hướng khi người dùng click vào thông báo</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button className="admin-button success" type="submit">
                Gửi thông báo
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
        <div className="form-group" style={{ marginBottom: 0, minWidth: 180 }}>
          <label className="form-label" htmlFor="status">Trạng thái</label>
          <select id="status" className="admin-select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Tất cả</option>
            <option value="unread">Chưa đọc</option>
            <option value="read">Đã đọc</option>
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: 0, minWidth: 100 }}>
          <label className="form-label" htmlFor="limit">Hiển thị</label>
          <select id="limit" className="admin-select" value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: 0, alignSelf: 'flex-end' }}>
          <button
            className="admin-button"
            onClick={() => fetchNotifications()}
            disabled={loading}
          >
            {loading ? 'Đang tải...' : 'Làm mới'}
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

      {/* Notifications Table */}
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Người nhận</th>
              <th>Loại</th>
              <th>Tiêu đề</th>
              <th>Nội dung</th>
              <th style={{ width: 120 }}>Trạng thái</th>
              <th style={{ width: 220 }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {items.map((n) => (
              <tr key={n._id} className={n.isRead ? '' : 'bg-blue-50 dark:bg-blue-900/10'}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      className="admin-avatar sm"
                      style={{
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: 11,
                        fontWeight: 600
                      }}
                    >
                      {(typeof n.userId === 'object' ? n.userId?.name : n.userId)?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <span style={{ fontSize: 13 }}>
                      {typeof n.userId === 'object' ? n.userId?.name || n.userId?.email : n.userId}
                    </span>
                  </div>
                </td>
                <td>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                    <span style={{ fontSize: 16 }}>{getTypeIcon(n.type)}</span>
                    <span className="text-muted">{getTypeLabel(n.type)}</span>
                  </span>
                </td>
                <td>
                  <span style={{ fontWeight: 600 }}>{n.title}</span>
                </td>
                <td>
                  <span style={{
                    maxWidth: 200,
                    display: 'block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: 'var(--gray-500)'
                  }}>
                    {n.message}
                  </span>
                </td>
                <td>
                  <span className={`admin-badge ${n.isRead ? '' : 'primary'}`}>
                    {n.isRead ? '✓ Đã đọc' : '● Chưa đọc'}
                  </span>
                </td>
                <td>
                  <div className="admin-actions">
                    <button
                      className={`admin-button ${n.isRead ? 'warning' : 'success'} sm`}
                      onClick={() => setRead(n._id, !n.isRead)}
                      style={{ fontSize: 12 }}
                    >
                      {n.isRead ? 'Đánh dấu chưa đọc' : 'Đánh dấu đã đọc'}
                    </button>
                    <button
                      className="admin-button danger sm"
                      onClick={() => removeNotification(n._id)}
                    >
                      Xoá
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!items.length && !loading && (
              <tr>
                <td colSpan={6}>
                  <div className="admin-empty">
                    <div className="admin-empty-icon">🔔</div>
                    <div className="admin-empty-title">Chưa có thông báo</div>
                    <div className="admin-empty-text">Bắt đầu bằng cách gửi thông báo mới</div>
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
          Trang {page} / {totalPages || 1} • Tổng {total} thông báo
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
