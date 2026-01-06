'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Cookies from 'js-cookie';
import Link from 'next/link';

export default function UserDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [updating, setUpdating] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    // Order History State
    const [orders, setOrders] = useState<any[]>([]);
    const [loadingOrders, setLoadingOrders] = useState(false);

    // Force use of Main Backend (Port 5000)
    const baseURL = 'http://localhost:5000';

    useEffect(() => {
        const fetchUser = async () => {
            if (!params.id) return;
            try {
                const res = await axios.get(`${baseURL}/api/users/admin/${params.id}`, {
                    headers: { Authorization: `Bearer ${Cookies.get('admin_token') || ''}` },
                });
                if (res.data.success) {
                    setUser(res.data.user);
                }
            } catch (err: any) {
                setError(err.response?.data?.message || 'Lỗi tải thông tin người dùng');
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, [params.id]);

    const formatDate = (dateString: string) => {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    const handleToggleActive = async () => {
        const action = user.isActive ? 'khóa' : 'mở khóa';
        setShowConfirmDialog(false);
        setUpdating(true);
        try {
            const res = await axios.patch(
                `${baseURL}/api/users/${params.id}`,
                { isActive: !user.isActive },
                { headers: { Authorization: `Bearer ${Cookies.get('admin_token') || ''}` } }
            );
            if (res.data.success) {
                setUser({ ...user, isActive: !user.isActive });
            }
        } catch (err: any) {
            alert(err.response?.data?.message || `Lỗi ${action} tài khoản`);
        } finally {
            setUpdating(false);
        }
    };

    // Fetch User Orders
    useEffect(() => {
        const fetchUserOrders = async () => {
            if (!params.id) return;
            setLoadingOrders(true);
            try {
                const res = await axios.get(`${baseURL}/api/orders/admin/list`, {
                    params: { userId: params.id, limit: 1000 },
                    headers: { Authorization: `Bearer ${Cookies.get('admin_token') || ''}` },
                });
                if (res.data.success) {
                    setOrders(res.data.data || []);
                }
            } catch (err) {
                console.error("Failed to fetch user orders", err);
            } finally {
                setLoadingOrders(false);
            }
        };

        fetchUserOrders();
    }, [params.id]);

    const getStatusColor = (status: string) => {
        const colors: any = {
            'new': 'primary',
            'confirmed': 'primary',
            'preparing': 'warning',
            'shipping': 'warning',
            'completed': 'success',
            'cancelled': 'danger',
            'cancel_requested': 'danger'
        };
        return colors[status] || 'secondary';
    };

    const getStatusLabel = (status: string) => {
        const labels: any = {
            'new': 'Mới',
            'confirmed': 'Đã xác nhận',
            'preparing': 'Đang chuẩn bị',
            'shipping': 'Đang giao',
            'completed': 'Hoàn tất',
            'cancelled': 'Đã huỷ',
            'cancel_requested': 'Yêu cầu huỷ'
        };
        return labels[status] || status;
    };

    if (loading) {
        return (
            <div className="admin-container">
                <div className="admin-loading"><span className="admin-spinner" /></div>
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className="admin-container">
                <div className="admin-alert error">
                    <span>⚠️</span> <span>{error || 'Không tìm thấy người dùng'}</span>
                </div>
                <Link href="/users" className="admin-button secondary">Quay lại danh sách</Link>
            </div>
        );
    }

    return (
        <div className="admin-container">
            {/* Header */}
            <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
                <Link href="/users" className="admin-button secondary icon-only">
                    ←
                </Link>
                <div>
                    <h1 className="admin-title">Hồ sơ người dùng</h1>
                    <div style={{ fontSize: 13, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>ID: {user._id}</span>
                        <span style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: '#d1d5db' }}></span>
                        <span>Tham gia: {formatDate(user.createdAt)}</span>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24, alignItems: 'start' }}>
                {/* Left Column: Identify & Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {/* Identity Card */}
                    <div className="admin-card">
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                            <div style={{ position: 'relative', marginBottom: 16 }}>
                                {user.avatar ? (
                                    <img src={user.avatar} alt={user.name}
                                        style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', border: '4px solid #f3f4f6' }}
                                    />
                                ) : (
                                    <div style={{
                                        width: 120, height: 120, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, fontWeight: 700
                                    }}>
                                        {user.name?.charAt(0)?.toUpperCase()}
                                    </div>
                                )}
                                <div style={{
                                    position: 'absolute', bottom: 0, right: 0,
                                    width: 32, height: 32, borderRadius: '50%',
                                    backgroundColor: user.isActive ? '#10b981' : '#ef4444',
                                    border: '4px solid white',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }} title={user.isActive ? 'Đang hoạt động' : 'Đã khóa'}>
                                    {user.isActive ? (
                                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : (
                                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    )}
                                </div>
                            </div>

                            <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px 0' }}>{user.name}</h2>
                            <p style={{ margin: 0, color: '#6b7280', fontSize: 14 }}>{user.email}</p>

                            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                                <span className={`admin-badge ${user.role === 'admin' ? 'primary' : 'secondary'}`}>
                                    {user.role === 'admin' ? 'Quản trị viên' : 'Khách hàng'}
                                </span>
                            </div>
                        </div>

                        <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid #e5e7eb' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, textAlign: 'center' }}>
                                <div>
                                    <div style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>{user.stats?.totalOrders || 0}</div>
                                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Đơn hàng</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>
                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(user.stats?.totalSpent || 0)}
                                    </div>
                                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Chi tiêu</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions Card */}
                    <div className="admin-card">
                        <h3 className="admin-section-title" style={{ marginBottom: 16 }}>Hành động</h3>
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 8 }}>Trạng thái tài khoản</label>
                            <div style={{
                                padding: '12px 16px',
                                borderRadius: 8,
                                backgroundColor: user.isActive ? '#ecfdf5' : '#fef2f2',
                                border: `1px solid ${user.isActive ? '#a7f3d0' : '#fecaca'}`,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8
                            }}>
                                <span style={{
                                    width: 10, height: 10, borderRadius: '50%',
                                    backgroundColor: user.isActive ? '#10b981' : '#ef4444'
                                }}></span>
                                <span style={{ fontWeight: 600, color: user.isActive ? '#047857' : '#dc2626' }}>
                                    {user.isActive ? 'Đang hoạt động' : 'Đã bị khóa'}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowConfirmDialog(true)}
                            disabled={updating}
                            className="admin-button"
                            style={{
                                width: '100%',
                                justifyContent: 'center',
                                backgroundColor: user.isActive ? '#ef4444' : '#10b981',
                                borderColor: user.isActive ? '#ef4444' : '#10b981',
                                color: 'white'
                            }}
                        >
                            {updating ? 'Đang xử lý...' : (user.isActive ? '🔒 Khóa tài khoản' : '🔓 Mở khóa tài khoản')}
                        </button>
                    </div>
                </div>

                {/* Right Column: Detailed Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                    {/* Personal Info */}
                    <div className="admin-card">
                        <h3 className="admin-section-title" style={{ marginBottom: 20 }}>Thông tin cá nhân</h3>
                        <div className="admin-detail-grid">
                            <div className="admin-detail-item">
                                <label>Giới tính</label>
                                <span style={{ textTransform: 'capitalize' }}>
                                    {user.gender === 'male' ? 'Nam' : user.gender === 'female' ? 'Nữ' : 'Khác'}
                                </span>
                            </div>
                            <div className="admin-detail-item">
                                <label>Ngày sinh</label>
                                <span>{user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}</span>
                            </div>
                            <div className="admin-detail-item">
                                <label>Số điện thoại</label>
                                <span>{user.phone || 'Chưa cập nhật'}</span>
                            </div>
                            <div className="admin-detail-item">
                                <label>Ngày cập nhật</label>
                                <span>{formatDate(user.updatedAt)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Account Settings */}
                    <div className="admin-card">
                        <h3 className="admin-section-title">Cài đặt tài khoản</h3>
                        <div className="admin-detail-grid">
                            <div className="admin-detail-item">
                                <label>Trạng thái email</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981' }}></span>
                                    <span>Đã xác thực</span>
                                </div>
                            </div>
                            <div className="admin-detail-item">
                                <label>Nhận tin khuyến mãi</label>
                                <span>{user.receivePromotions ? 'Đang bật' : 'Đang tắt'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Placeholders for Future Data */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                        <div className="admin-card" style={{ opacity: 0.7 }}>
                            <h3 className="admin-section-title">Sổ địa chỉ (0)</h3>
                            <div style={{ padding: '32px 0', textAlign: 'center', color: '#9ca3af', border: '1px dashed #e5e7eb', borderRadius: 8 }}>
                                Chưa có địa chỉ nào
                            </div>
                        </div>
                        <div className="admin-card">
                            <h3 className="admin-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                Lịch sử đơn hàng ({orders.length})
                                <Link href={`/orders?search=${user.email || user.name}`} style={{ fontSize: 13, textDecoration: 'none', color: 'var(--primary-500)' }}>
                                    Xem tất cả →
                                </Link>
                            </h3>

                            {loadingOrders ? (
                                <div className="text-center py-4"><span className="admin-spinner"></span></div>
                            ) : orders.length > 0 ? (
                                <div className="space-y-3" style={{ maxHeight: '500px', overflowY: 'auto', paddingRight: '4px' }}>
                                    {orders.map((order) => (
                                        <div key={order._id} style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px'
                                        }}>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: 14 }}>
                                                    <Link href={`/orders/${order._id}`} style={{ textDecoration: 'none', color: 'var(--foreground)' }}>
                                                        {order.orderCode}
                                                    </Link>
                                                </div>
                                                <div style={{ fontSize: 12, color: '#6b7280' }}>
                                                    {new Date(order.createdAt).toLocaleDateString('vi-VN')} • {order.items?.length} sản phẩm
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontWeight: 600, fontSize: 14 }}>
                                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalPrice)}
                                                </div>
                                                <span className={`admin-badge ${getStatusColor(order.status)}`} style={{ fontSize: 11, padding: '2px 6px' }}>
                                                    {getStatusLabel(order.status)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ padding: '32px 0', textAlign: 'center', color: '#9ca3af', border: '1px dashed #e5e7eb', borderRadius: 8 }}>
                                    Chưa có đơn hàng nào
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>

            {/* Confirmation Dialog */}
            {showConfirmDialog && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white', borderRadius: 16, padding: 24,
                        maxWidth: 400, width: '90%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
                    }}>
                        <div style={{ textAlign: 'center', marginBottom: 20 }}>
                            <div style={{
                                width: 56, height: 56, borderRadius: '50%', margin: '0 auto 16px',
                                backgroundColor: user.isActive ? '#fef2f2' : '#ecfdf5',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 28
                            }}>
                                {user.isActive ? '🔒' : '🔓'}
                            </div>
                            <h3 style={{ margin: '0 0 8px 0', fontSize: 18, fontWeight: 600 }}>
                                {user.isActive ? 'Khóa tài khoản?' : 'Mở khóa tài khoản?'}
                            </h3>
                            <p style={{ margin: 0, color: '#6b7280', fontSize: 14 }}>
                                {user.isActive
                                    ? `Bạn có chắc muốn khóa tài khoản của "${user.name}"? Người dùng sẽ không thể đăng nhập.`
                                    : `Bạn có chắc muốn mở khóa tài khoản của "${user.name}"? Người dùng sẽ có thể đăng nhập lại.`
                                }
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button
                                onClick={() => setShowConfirmDialog(false)}
                                className="admin-button secondary"
                                style={{ flex: 1, justifyContent: 'center' }}
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={handleToggleActive}
                                className="admin-button"
                                style={{
                                    flex: 1, justifyContent: 'center',
                                    backgroundColor: user.isActive ? '#ef4444' : '#10b981',
                                    borderColor: user.isActive ? '#ef4444' : '#10b981',
                                    color: 'white'
                                }}
                            >
                                {user.isActive ? 'Khóa' : 'Mở khóa'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
