'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import Link from 'next/link';
import Swal from 'sweetalert2';

interface Product {
    _id: string;
    name: string;
    image: string;
}

interface User {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
}

interface Order {
    _id: string;
    orderCode: string;
    completedAt?: string;
}

interface Review {
    _id: string;
    productId: Product;
    userId: User;
    orderId: Order;
    rating: number;
    comment: string;
    images: string[];
    isHidden: boolean;
    createdAt: string;
}

interface Stats {
    totalReviews: number;
    newReviews: number;
    lowRatingReviews: number;
    avgRating: number;
}

export default function ReviewsPage() {
    const [mounted, setMounted] = useState(false);
    const [items, setItems] = useState<Review[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Filters
    const [q, setQ] = useState('');
    const [status, setStatus] = useState('');
    const [rating, setRating] = useState('');

    // Stats
    const [stats, setStats] = useState<Stats>({
        totalReviews: 0,
        newReviews: 0,
        lowRatingReviews: 0,
        avgRating: 0
    });

    // Detail State
    const [selectedReview, setSelectedReview] = useState<Review | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    // Force use of Main Backend (Port 5000) - API exists on User Backend
    const baseURL = process.env.NEXT_PUBLIC_SHOP_API_URL || 'http://localhost:5000';

    const fetchReviews = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await axios.get(`${baseURL}/api/reviews/admin/list`, {
                params: { page, limit, q, status, rating },
                headers: { Authorization: `Bearer ${Cookies.get('admin_token') || ''}` },
            });
            setItems(res.data?.data?.items || []);
            setTotal(res.data?.data?.total || 0);

            // Fetch stats if first page
            if (page === 1) fetchStats();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Lỗi tải đánh giá');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await axios.get(`${baseURL}/api/reviews/admin/stats`, {
                headers: { Authorization: `Bearer ${Cookies.get('admin_token') || ''}` },
            });
            if (res.data.success) {
                setStats(res.data.data);
            }
        } catch (err) {
            console.error("Failed to fetch stats", err);
        }
    };

    useEffect(() => {
        setMounted(true);
        fetchReviews();
    }, [page, limit, status, rating, q]); // Removed q from dependency to avoid too many requests, search via button or debounce (not implemented here)

    // Handle Search on Enter or Button
    const handleSearch = () => {
        setPage(1);
        fetchReviews();
    };

    const toggleHide = async (id: string, currentStatus: boolean) => {
        try {
            await axios.patch(`${baseURL}/api/reviews/admin/${id}/toggle`,
                { isHidden: !currentStatus },
                { headers: { Authorization: `Bearer ${Cookies.get('admin_token') || ''}` } }
            );
            // Optimistic update or refresh
            fetchReviews();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Không thể cập nhật trạng thái');
        }
    };

    const removeReview = async (id: string) => {
        const result = await Swal.fire({
            title: 'Xóa đánh giá này?',
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
                await axios.delete(`${baseURL}/api/reviews/admin/${id}`, {
                    headers: { Authorization: `Bearer ${Cookies.get('admin_token') || ''}` },
                });
                Swal.fire({
                    title: 'Đã xóa!',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });
                fetchReviews();
            } catch (err: any) {
                Swal.fire('Lỗi', err.response?.data?.message || 'Không thể xoá', 'error');
            }
        }
    };

    const handleViewDetail = (review: Review) => {
        setSelectedReview(review);
        setShowDetailModal(true);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
        });
    };

    if (!mounted) return null;

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="admin-container">
            {/* Page Header */}
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="admin-title" style={{ marginBottom: 8 }}>Quản lý Đánh giá</h1>
                    <p className="text-muted">Xem và quản lý tất cả đánh giá sản phẩm từ người dùng</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 32 }}>
                {[
                    { label: 'Tổng đánh giá', value: stats.totalReviews, color: '#3b82f6', icon: '📝' },
                    { label: 'Đánh giá mới (7 ngày)', value: stats.newReviews, color: '#10b981', icon: '🆕' },
                    { label: 'Đánh giá thấp (1-2⭐)', value: stats.lowRatingReviews, color: '#ef4444', icon: '⚠️' },
                    { label: 'Điểm trung bình', value: `${stats.avgRating} ⭐`, color: '#f59e0b', icon: '⭐' },
                ].map((stat, index) => (
                    <div key={index} className="admin-card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{
                            width: 48, height: 48, borderRadius: 12,
                            backgroundColor: `${stat.color}20`, color: stat.color,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24
                        }}>
                            {stat.icon}
                        </div>
                        <div>
                            <div style={{ fontSize: 24, fontWeight: 700, color: '#111827' }}>{stat.value}</div>
                            <div style={{ fontSize: 13, color: '#6b7280' }}>{stat.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Toolbar */}
            <div className="admin-toolbar">
                <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: 200 }}>
                    <label className="form-label" htmlFor="search">Tìm kiếm</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <input
                            id="search"
                            className="admin-input"
                            placeholder="Nội dung review..."
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                    </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0, minWidth: 140 }}>
                    <label className="form-label">Xếp hạng</label>
                    <select className="admin-select" value={rating} onChange={(e) => setRating(e.target.value)}>
                        <option value="">Tất cả sao</option>
                        <option value="5">5 Sao</option>
                        <option value="4">4 Sao</option>
                        <option value="3">3 Sao</option>
                        <option value="2">2 Sao</option>
                        <option value="1">1 Sao</option>
                    </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0, minWidth: 140 }}>
                    <label className="form-label">Trạng thái</label>
                    <select className="admin-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                        <option value="">Tất cả</option>
                        <option value="visible">Hiển thị</option>
                        <option value="hidden">Đã ẩn</option>
                    </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0, alignSelf: 'flex-end' }}>
                </div>
            </div>

            {/* Reviews Table */}
            <div className="admin-table-wrapper">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Sản phẩm</th>
                            <th>Người dùng</th>
                            <th style={{ width: 100 }}>Đánh giá</th>
                            <th>Nội dung</th>
                            <th style={{ width: 140 }}>Ngày tạo</th>
                            <th style={{ width: 100 }}>Trạng thái</th>
                            <th style={{ width: 200 }}>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item) => (
                            <tr key={item._id}>
                                <td>
                                    <div style={{ fontWeight: 500, color: 'var(--primary-600)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.productId?.name}>
                                        {item.productId?.name || 'Unknown Product'}
                                    </div>
                                    <div style={{ fontSize: 11, color: '#9ca3af' }}>ID: {item.productId?._id}</div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 500 }}>{item.userId?.name}</div>
                                            <div style={{ fontSize: 11, color: '#9ca3af' }}>{item.userId?.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div style={{ color: '#f59e0b', fontWeight: 600 }}>
                                        {'⭐'.repeat(item.rating)}
                                    </div>
                                </td>
                                <td>
                                    <div style={{ fontSize: 14, color: '#374151', marginBottom: 4 }}>{item.comment}</div>
                                    {item.images && item.images.length > 0 && (
                                        <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                                            {item.images.map((img: string, idx: number) => (
                                                <a key={idx} href={img} target="_blank" rel="noreferrer">
                                                    <img src={img} alt="review" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4, border: '1px solid #e5e7eb' }} />
                                                </a>
                                            ))}
                                        </div>
                                    )}

                                </td>
                                <td>{formatDate(item.createdAt)}</td>
                                <td>
                                    <span className={`admin-badge ${item.isHidden ? 'danger' : 'success'}`}>
                                        {item.isHidden ? 'Đã ẩn' : 'Hiển thị'}
                                    </span>
                                </td>
                                <td>
                                    <div className="admin-actions">
                                        <button
                                            className="admin-button primary sm"
                                            onClick={() => handleViewDetail(item)}
                                            title="Xem chi tiết"
                                        >
                                            Xem
                                        </button>
                                        <button
                                            className={`admin-button ${item.isHidden ? 'success' : 'warning'} sm`}
                                            onClick={() => toggleHide(item._id, item.isHidden)}
                                        >
                                            {item.isHidden ? 'Hiện' : 'Ẩn'}
                                        </button>
                                        <button
                                            className="admin-button danger sm"
                                            onClick={() => removeReview(item._id)}
                                        >
                                            Xoá
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {items.length === 0 && !loading && (
                            <tr>
                                <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>
                                    Không có đánh giá nào phù hợp
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination settings similar to other pages can be added if needed, simplified here */}
            {totalPages > 1 && (
                <div className="admin-pagination">
                    <button className="admin-button secondary sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Trước</button>
                    <span className="page-info">Trang {page} / {totalPages}</span>
                    <button className="admin-button sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Sau →</button>
                </div>
            )}

            {/* Detail Modal */}
            {showDetailModal && selectedReview && (
                <div className="admin-modal-overlay" onClick={() => setShowDetailModal(false)}>
                    <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-modal-header">
                            <h2>Chi tiết đánh giá</h2>
                            <button className="admin-modal-close" onClick={() => setShowDetailModal(false)}>✕</button>
                        </div>
                        <div className="admin-modal-body text-gray-800 dark:text-gray-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* User Info */}
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Người đánh giá</h3>
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                                            {(selectedReview.userId?.name || 'U').charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-medium text-lg">{selectedReview.userId?.name || 'Unknown User'}</p>
                                            <p className="text-sm text-gray-500">{selectedReview.userId?.email}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Order Info */}
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Thông tin đơn hàng</h3>
                                    <p className="font-mono text-lg">{selectedReview.orderId?.orderCode || 'N/A'}</p>
                                    <p className="text-sm text-gray-500">
                                        Ngày mua: {selectedReview.orderId?.completedAt ? formatDate(selectedReview.orderId.completedAt) : 'N/A'}
                                    </p>
                                </div>
                            </div>

                            <hr className="my-6 border-gray-200 dark:border-gray-700" />

                            {/* Product Info */}
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Sản phẩm</h3>
                                <div className="flex gap-4">
                                    {selectedReview.productId?.image && (
                                        <img src={selectedReview.productId.image} alt="Product" className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                                    )}
                                    <div>
                                        <p className="font-medium">{selectedReview.productId?.name || 'Unknown Product'}</p>
                                        <p className="text-sm text-gray-500">ID: {selectedReview.productId?._id}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Review Content */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Nội dung đánh giá</h3>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-yellow-500 text-xl">
                                        {'⭐'.repeat(selectedReview.rating)}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                        ({selectedReview.rating}/5)
                                    </span>
                                    <span className="mx-2">•</span>
                                    <span className="text-sm text-gray-500">{formatDate(selectedReview.createdAt)}</span>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                    <p className="whitespace-pre-wrap">{selectedReview.comment}</p>
                                </div>
                                {selectedReview.images && selectedReview.images.length > 0 && (
                                    <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                                        {selectedReview.images.map((img: string, idx: number) => (
                                            <a key={idx} href={img} target="_blank" rel="noreferrer">
                                                <img src={img} alt={`Review ${idx}`} className="w-24 h-24 object-cover rounded-lg border border-gray-200" />
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>

                        </div>
                        <div className="admin-modal-footer">
                            <button className="admin-button secondary" onClick={() => setShowDetailModal(false)}>Đóng</button>
                        </div>
                    </div>
                </div>
            )}
            {/* Modal Styles */}
            <style jsx>{`
                .admin-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    padding: 20px;
                }

                .admin-modal {
                    background: white;
                    border-radius: 12px;
                    width: 100%;
                    max-width: 700px;
                    max-height: 90vh;
                    overflow: hidden;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                }

                .admin-modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px 24px;
                    border-bottom: 1px solid #e5e7eb;
                }

                .admin-modal-header h2 {
                    margin: 0;
                    font-size: 18px;
                    font-weight: 600;
                    color: #111827;
                }

                .admin-modal-close {
                    background: none;
                    border: none;
                    font-size: 20px;
                    cursor: pointer;
                    color: #9ca3af;
                    padding: 4px 8px;
                    border-radius: 4px;
                }

                .admin-modal-close:hover {
                    background: #f3f4f6;
                    color: #4b5563;
                }

                .admin-modal-body {
                    padding: 24px;
                    max-height: 70vh;
                    overflow-y: auto;
                }

                .admin-modal-footer {
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                    padding: 16px 24px;
                    border-top: 1px solid #e5e7eb;
                    background: #f9fafb;
                }
            `}</style>
        </div>
    );
}
