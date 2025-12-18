'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

export default function CommentsPage() {
  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const baseURL = process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL || 'http://localhost:4000';

  const fetchComments = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${baseURL}/comments`, {
        params: { page, limit, q, status },
        headers: { Authorization: `Bearer ${Cookies.get('admin_token') || ''}` },
      });
      setItems(res.data?.data?.items || []);
      setTotal(res.data?.data?.total || 0);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi tải bình luận');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchComments();
  }, [page, limit, q, status]);

  const toggleHide = async (id: string, value: boolean) => {
    try {
      await axios.patch(`${baseURL}/comments/${id}/hide?value=${value}`, {}, {
        headers: { Authorization: `Bearer ${Cookies.get('admin_token') || ''}` },
      });
      fetchComments();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể cập nhật');
    }
  };

  const removeComment = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xoá bình luận này?')) return;
    try {
      await axios.delete(`${baseURL}/comments/${id}`, {
        headers: { Authorization: `Bearer ${Cookies.get('admin_token') || ''}` },
      });
      fetchComments();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể xoá');
    }
  };

  if (!mounted) return null;

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="admin-container">
      {/* Page Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 className="admin-title" style={{ marginBottom: 8 }}>Quản lý bình luận</h1>
        <p className="text-muted">Duyệt và quản lý bình luận, đánh giá sản phẩm</p>
      </div>

      {/* Toolbar */}
      <div className="admin-toolbar">
        <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: 200 }}>
          <label className="form-label" htmlFor="search">Tìm kiếm</label>
          <input
            id="search"
            className="admin-input"
            placeholder="Nhập nội dung bình luận..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0, minWidth: 160 }}>
          <label className="form-label" htmlFor="status">Trạng thái</label>
          <select id="status" className="admin-select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Tất cả</option>
            <option value="hidden">Đã ẩn</option>
            <option value="visible">Đang hiển thị</option>
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
            onClick={() => fetchComments()}
            disabled={loading}
          >
            {loading ? 'Đang tải...' : '🔄 Làm mới'}
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

      {/* Comments Table */}
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Sản phẩm</th>
              <th>Người dùng</th>
              <th>Nội dung bình luận</th>
              <th style={{ width: 120 }}>Trạng thái</th>
              <th style={{ width: 180 }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c._id}>
                <td>
                  <span style={{
                    fontWeight: 500,
                    color: 'var(--primary-600)'
                  }}>
                    {typeof c.productId === 'object' ? c.productId?.name : c.productId}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      className="admin-avatar sm"
                      style={{
                        background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: 11,
                        fontWeight: 600
                      }}
                    >
                      {(typeof c.userId === 'object' ? c.userId?.name : c.userId)?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <span>{typeof c.userId === 'object' ? c.userId?.name || c.userId?.email : c.userId}</span>
                  </div>
                </td>
                <td>
                  <div style={{
                    maxWidth: 300,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    💬 {c.content}
                  </div>
                  {c.rating && (
                    <div style={{ marginTop: 4 }}>
                      {'⭐'.repeat(c.rating)}{'☆'.repeat(5 - c.rating)}
                    </div>
                  )}
                </td>
                <td>
                  <span className={`admin-badge ${c.isHidden ? 'danger' : 'success'}`}>
                    {c.isHidden ? '👁️‍🗨️ Đã ẩn' : '✓ Hiển thị'}
                  </span>
                </td>
                <td>
                  <div className="admin-actions">
                    <button
                      className={`admin-button ${c.isHidden ? 'success' : 'warning'} sm`}
                      onClick={() => toggleHide(c._id, !c.isHidden)}
                      title={c.isHidden ? 'Hiện bình luận' : 'Ẩn bình luận'}
                    >
                      {c.isHidden ? '👁️ Hiện' : '🙈 Ẩn'}
                    </button>
                    <button
                      className="admin-button danger sm"
                      onClick={() => removeComment(c._id)}
                      title="Xoá bình luận"
                    >
                      🗑️ Xoá
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!items.length && !loading && (
              <tr>
                <td colSpan={5}>
                  <div className="admin-empty">
                    <div className="admin-empty-icon">💬</div>
                    <div className="admin-empty-title">Không có bình luận</div>
                    <div className="admin-empty-text">Chưa có bình luận nào trong hệ thống</div>
                  </div>
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={5}>
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
          Trang {page} / {totalPages || 1} • Tổng {total} bình luận
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
