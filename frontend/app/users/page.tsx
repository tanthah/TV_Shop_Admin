'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

export default function UsersPage() {
  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const baseURL = process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL || 'http://localhost:4000';

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${baseURL}/users`, {
        params: { page, limit, q, role, status },
        headers: { Authorization: `Bearer ${Cookies.get('admin_token') || ''}` },
      });
      setItems(res.data?.data?.items || []);
      setTotal(res.data?.data?.total || 0);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi tải người dùng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchUsers();
  }, [page, limit, q, role, status]);

  const updateUser = async (id: string, payload: any) => {
    try {
      await axios.patch(`${baseURL}/users/${id}`, payload, {
        headers: { Authorization: `Bearer ${Cookies.get('admin_token') || ''}` },
      });
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể cập nhật người dùng');
    }
  };

  const deactivateUser = async (id: string) => {
    try {
      await axios.delete(`${baseURL}/users/${id}`, {
        headers: { Authorization: `Bearer ${Cookies.get('admin_token') || ''}` },
      });
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể xoá người dùng');
    }
  };

  const uploadAvatar = async (id: string, file: File | null) => {
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      await axios.post(`${baseURL}/users/${id}/avatar`, fd, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${Cookies.get('admin_token') || ''}`,
        },
      });
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể cập nhật avatar');
    }
  };

  if (!mounted) return null;

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="admin-container">
      {/* Page Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 className="admin-title" style={{ marginBottom: 8 }}>Quản lý người dùng</h1>
        <p className="text-muted">Quản lý tất cả người dùng trong hệ thống</p>
      </div>

      {/* Toolbar */}
      <div className="admin-toolbar">
        <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: 200 }}>
          <label className="form-label" htmlFor="search">Tìm kiếm</label>
          <input
            id="search"
            className="admin-input"
            placeholder="Nhập tên hoặc email..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0, minWidth: 150 }}>
          <label className="form-label" htmlFor="role">Vai trò</label>
          <select id="role" className="admin-select" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">Tất cả</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: 0, minWidth: 160 }}>
          <label className="form-label" htmlFor="status">Trạng thái</label>
          <select id="status" className="admin-select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Tất cả</option>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Ngừng hoạt động</option>
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
            onClick={() => fetchUsers()}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="admin-spinner" style={{ width: 16, height: 16 }} />
                Đang tải...
              </>
            ) : (
              <>

                Làm mới
              </>
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

      {/* Table */}
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: 100 }}>Avatar</th>
              <th>Tên</th>
              <th>Email</th>
              <th>Điện thoại</th>
              <th style={{ width: 160 }}>Vai trò</th>
              <th style={{ width: 140 }}>Trạng thái</th>
              <th style={{ width: 140 }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {items.map((u) => (
              <tr key={u._id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {u.avatar ? (
                      <img
                        src={u.avatar}
                        alt={u.name}
                        className="admin-avatar"
                      />
                    ) : (
                      <div
                        className="admin-avatar"
                        style={{
                          background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: 14,
                          fontWeight: 600
                        }}
                      >
                        {u.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <label className="admin-file-input" style={{ width: 80 }}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => uploadAvatar(u._id, e.target.files?.[0] || null)}
                      />
                      <span style={{
                        fontSize: 11,
                        color: 'var(--primary-500)',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}>
                        Đổi ảnh
                      </span>
                    </label>
                  </div>
                </td>
                <td>
                  <span style={{ fontWeight: 600 }}>{u.name}</span>
                </td>
                <td>
                  <span className="text-muted">{u.email}</span>
                </td>
                <td>{u.phone || <span className="text-muted">—</span>}</td>
                <td>
                  <select
                    className="admin-select"
                    style={{ height: 36, fontSize: 13 }}
                    defaultValue={u.role}
                    onChange={(e) => updateUser(u._id, { role: e.target.value })}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td>
                  <label className="admin-checkbox">
                    <input
                      type="checkbox"
                      checked={!!u.isActive}
                      onChange={(e) => updateUser(u._id, { isActive: e.target.checked })}
                    />
                    <span className={`admin-badge ${u.isActive ? 'success' : 'danger'}`} style={{ whiteSpace: 'nowrap' }}>
                      {u.isActive ? 'Hoạt động' : 'Ngừng'}
                    </span>
                  </label>
                </td>
                <td>
                  <div className="admin-actions">
                    <button
                      className="admin-button danger sm"
                      onClick={() => deactivateUser(u._id)}
                      title="Vô hiệu hoá người dùng"
                    >
                      Vô hiệu hoá
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!items.length && !loading && (
              <tr>
                <td colSpan={7}>
                  <div className="admin-empty">
                    <div className="admin-empty-icon">👥</div>
                    <div className="admin-empty-title">Không có dữ liệu</div>
                    <div className="admin-empty-text">Chưa có người dùng nào trong hệ thống</div>
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
          Trang {page} / {totalPages || 1} • Tổng {total} người dùng
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
