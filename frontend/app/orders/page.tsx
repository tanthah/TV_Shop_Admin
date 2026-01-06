'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import Link from 'next/link';
import Swal from 'sweetalert2';

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
}

interface Address {
  _id: string;
  street: string;
  district: string;
  city: string;
  phone: string;
}

interface Order {
  _id: string;
  orderCode: string;
  userId: User;
  addressId: Address;
  totalPrice: number;
  usedPoints: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  createdAt: string;
  items: any[];
}

export default function OrdersPage() {
  const [mounted, setMounted] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Use configured Admin API URL
  const baseURL = process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL || 'http://localhost:5001';

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

  const paymentOptions = [
    { value: '', label: 'Tất cả PTTT' },
    { value: 'COD', label: 'Thanh toán khi nhận hàng (COD)' },
    { value: 'VNPAY', label: 'VNPAY' },
    { value: 'MOMO', label: 'MoMo' },
    { value: 'ZALOPAY', label: 'ZaloPay' },
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

      const params: any = { // Keep any for flexibility with query params
        page,
        limit
      };
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      if (paymentMethod) params.paymentMethod = paymentMethod;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      console.log('Fetching orders from URL:', `${baseURL}/api/orders/admin/list`);
      // Call Admin Specific Endpoint
      const res = await axios.get(`${baseURL}/api/orders/admin/list`, {
        params,
        headers: { Authorization: `Bearer ${t}` },
      });
      setOrders(res.data?.data?.items || []);
      setTotal(res.data?.data?.total || 0);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi tải đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchOrders();
  }, [page, limit, statusFilter, paymentMethod, startDate, endDate]); // Auto fetch on changes

  // Reset page when filters change (handle in separate effect or here)
  useEffect(() => {
    setPage(1);
  }, [statusFilter, paymentMethod, startDate, endDate, search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await axios.patch(
        `${baseURL}/api/orders/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${Cookies.get('admin_token') || ''}` } },
      );
      fetchOrders();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể cập nhật trạng thái');
    }
  };

  const handleDeleteOrder = async (id: string, code: string) => {
    const result = await Swal.fire({
      title: `Xóa đơn hàng #${code}?`,
      text: "Hành động này sẽ XÓA VĨNH VIỄN đơn hàng và không thể khôi phục!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#4b5563',
      confirmButtonText: 'Xóa vĩnh viễn',
      cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(
          `${baseURL}/api/orders/${id}`,
          { headers: { Authorization: `Bearer ${Cookies.get('admin_token') || ''}` } },
        );
        Swal.fire({
          title: 'Đã xóa!',
          text: 'Đơn hàng đã xóa thành công.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
        fetchOrders();
      } catch (err: any) {
        Swal.fire('Lỗi', err.response?.data?.message || 'Lỗi xóa đơn hàng', 'error');
      }
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

  const exportToExcel = () => {
    if (!orders.length) return;

    // Headers
    const headers = ['Order Code', 'Customer Name', 'Email', 'Phone', 'Total Price', 'Payment Method', 'Payment Status', 'Status', 'Date', 'Address'];

    // Rows
    const rows = orders.map(o => [
      o.orderCode,
      o.userId?.name || 'Guest',
      o.userId?.email || '',
      o.userId?.phone || o.addressId?.phone || '',
      o.totalPrice,
      o.paymentMethod,
      o.paymentStatus,
      getStatusLabel(o.status),
      new Date(o.createdAt).toLocaleDateString('vi-VN'),
      o.addressId ? `${o.addressId.street}, ${o.addressId.district}, ${o.addressId.city}` : ''
    ]);

    // CSV Content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // Download
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `orders_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!mounted) return null;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="admin-container">
      {/* Page Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="admin-title" style={{ marginBottom: 8 }}>Quản lý đơn hàng</h1>
          <p className="text-muted">Xem và quản lý tất cả đơn hàng từ hệ thống</p>
        </div>
        <div className="flex gap-2">
          <button className="admin-button secondary" onClick={exportToExcel} disabled={loading || orders.length === 0}>
            Xuất file Excel
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="admin-card mb-6" style={{ marginBottom: 24, padding: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {/* Search */}
          <div className="form-group mb-0">
            <label className="form-label">Tìm kiếm</label>
            <input
              type="text"
              className="admin-input"
              placeholder="Mã đơn / Tên KH / Email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Status */}
          <div className="form-group mb-0">
            <label className="form-label">Trạng thái</label>
            <select
              className="admin-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {statusOptions.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Payment Method */}
          <div className="form-group mb-0">
            <label className="form-label">Phương thức thanh toán</label>
            <select
              className="admin-select"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              {paymentOptions.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div className="form-group mb-0">
            <label className="form-label">Từ ngày</label>
            <input
              type="date"
              className="admin-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          {/* End Date */}
          <div className="form-group mb-0">
            <label className="form-label">Đến ngày</label>
            <input
              type="date"
              className="admin-input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

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
              <th>Thanh toán</th>
              <th>Trạng thái</th>
              <th>Ngày tạo</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o._id}>
                <td>
                  <div className="font-mono font-semibold" style={{ color: 'var(--primary-600)' }}>
                    #{o.orderCode}
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      className="admin-avatar sm"
                      style={{
                        background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                        color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700
                      }}
                    >
                      {(o.userId?.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 500 }}>{o.userId?.name || 'Khách vãng lai'}</div>
                      <div className="text-muted" style={{ fontSize: 11 }}>{o.userId?.email}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--success-600)' }}>
                    {formatPrice(o.totalPrice)}
                  </div>
                  {o.usedPoints > 0 && (
                    <div style={{ fontSize: 11, color: '#eab308' }}>
                      ⚡ Dùng {o.usedPoints} điểm
                    </div>
                  )}
                </td>
                <td>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{o.paymentMethod || 'COD'}</div>
                  <div style={{
                    fontSize: 11,
                    color: o.paymentStatus === 'paid' ? 'var(--success-600)' : 'var(--warning-600)'
                  }}>
                    {o.paymentStatus === 'paid' ? '✔ Đã thanh toán' : '⏳ Chưa thanh toán'}
                  </div>
                </td>
                <td>
                  <select
                    className="admin-select h-8 text-xs px-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
                    value={o.status}
                    onChange={(e) => updateStatus(o._id, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {statusOptions.filter(s => s.value).map((s) => (
                      <option key={s.value} value={s.value} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                        {s.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <span className="text-muted" style={{ fontSize: 13 }}>
                    {formatDate(o.createdAt)}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Link
                      href={`/orders/${o._id}`}
                      className="admin-button secondary"
                      style={{ textDecoration: 'none', padding: '4px 12px', fontSize: 12, height: 30 }}
                    >
                      Xem
                    </Link>
                    <button
                      className="admin-button danger"
                      onClick={() => handleDeleteOrder(o._id, o.orderCode)}
                      style={{ padding: '4px 12px', fontSize: 12, height: 30 }}
                    >
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!orders.length && !loading && (
              <tr>
                <td colSpan={7}>
                  <div className="admin-empty">
                    <div className="admin-empty-icon">📂</div>
                    <div className="admin-empty-title">Không tìm thấy đơn hàng</div>
                    <div className="admin-empty-text">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</div>
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
          Trang {page} / {totalPages || 1} • Tổng {total} đơn hàng
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
