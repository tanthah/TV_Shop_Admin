'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

export default function OrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Actions State
    const [note, setNote] = useState(''); // Internal Note
    const [status, setStatus] = useState(''); // Status selection
    const [updating, setUpdating] = useState(false);

    // Force use of Main Backend Port 4000
    // Use configured Admin API URL
    const baseURL = process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL || 'http://localhost:5001';
    const SHOP_API_URL = process.env.NEXT_PUBLIC_SHOP_API_URL || 'http://localhost:5000';

    const statusOptions = [
        { value: 'new', label: 'Mới', color: 'primary' },
        { value: 'confirmed', label: 'Đã xác nhận', color: 'primary' },
        { value: 'preparing', label: 'Đang chuẩn bị', color: 'warning' },
        { value: 'shipping', label: 'Đang giao', color: 'warning' },
        { value: 'completed', label: 'Hoàn tất', color: 'success' },
        { value: 'cancelled', label: 'Đã huỷ', color: 'danger' },
        { value: 'cancel_requested', label: 'Yêu cầu huỷ', color: 'danger' },
    ];

    const getStatusBadge = (s: string) => statusOptions.find(o => o.value === s)?.color || 'secondary';
    const getStatusLabel = (s: string) => statusOptions.find(o => o.value === s)?.label || s;

    const fetchOrder = async () => {
        setLoading(true);
        try {
            const t = Cookies.get('admin_token');
            if (!t) {
                router.push('/login');
                return;
            }
            const res = await axios.get(`${baseURL}/api/orders/${params.id}`, {
                headers: { Authorization: `Bearer ${t}` }
            });
            setOrder(res.data.data);
            setNote(res.data.data.internalNote || '');
            setStatus(res.data.data.status);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Lỗi tải đơn hàng');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (params.id) fetchOrder();
    }, [params.id]);

    const handleUpdateStatus = async () => {
        if (!status || status === order.status) return;
        if (!confirm('Bạn có chắc muốn cập nhật trạng thái đơn hàng?')) return;

        setUpdating(true);
        try {
            await axios.patch(
                `${baseURL}/api/orders/${params.id}/status`,
                { status },
                { headers: { Authorization: `Bearer ${Cookies.get('admin_token')}` } }
            );
            alert('Cập nhật trạng thái thành công!');
            fetchOrder();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Lỗi cập nhật');
        } finally {
            setUpdating(false);
        }
    };

    const handleSaveNote = async () => {
        setUpdating(true);
        try {
            await axios.patch(
                `${baseURL}/api/orders/${params.id}/status`,
                { status: order.status, note },
                { headers: { Authorization: `Bearer ${Cookies.get('admin_token')}` } }
            );
            alert('Đã lưu ghi chú nội bộ');
            // No need to refetch full order if we just updated note locally
        } catch (err: any) {
            alert(err.response?.data?.message || 'Lỗi lưu ghi chú');
        } finally {
            setUpdating(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleDateString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const getImageUrl = (img?: string) => {
        if (!img) return '/placeholder.png';
        if (img.startsWith('http')) return img;
        return `${SHOP_API_URL}${img}`;
    };

    if (loading) return <div className="p-8 text-center"><span className="admin-spinner"></span> Loading...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
    if (!order) return null;

    return (
        <>
            {/* INVOICE PRINT LAYOUT (Hidden on screen) */}
            <div className="hidden print-only bg-white p-8 text-black" style={{ fontFamily: 'Times New Roman, serif' }}>
                <div className="text-center mb-8 border-b pb-4 border-black">
                    <h1 className="text-3xl font-bold uppercase mb-2">Hóa đơn bán hàng</h1>
                    <div className="text-xl font-bold">TV SHOP ELECTRONICS</div>
                    <div className="text-sm italic">Uy tín - Chất lượng - Tận tâm</div>
                </div>

                <div className="flex justify-between mb-8">
                    <div>
                        <div className="font-bold mb-1">Khách hàng:</div>
                        <div>{order.addressId?.fullName || order.userId?.name || 'Khách vãng lai'}</div>
                        <div>{order.addressId?.phone || order.userId?.phone}</div>
                        <div className="max-w-[300px] break-words">
                            {order.addressId ? `${order.addressId.addressLine || order.addressId.street}, ${order.addressId.ward}, ${order.addressId.district}, ${order.addressId.city}` : ''}
                        </div>
                    </div>
                    <div className="text-right">
                        <div><span className="font-bold">Mã đơn:</span> #{order.orderCode}</div>
                        <div><span className="font-bold">Ngày:</span> {new Date(order.createdAt).toLocaleDateString('vi-VN')}</div>
                    </div>
                </div>

                <table className="w-full mb-8 border-collapse border border-black">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="border border-black p-2 text-left">Sản phẩm</th>
                            <th className="border border-black p-2 text-center w-16">SL</th>
                            <th className="border border-black p-2 text-right w-32">Đơn giá</th>
                            <th className="border border-black p-2 text-right w-32">Thành tiền</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.items?.map((item: any, i: number) => (
                            <tr key={item._id || i}>
                                <td className="border border-black p-2">
                                    <div className="font-medium">{item.productId?.name}</div>
                                </td>
                                <td className="border border-black p-2 text-center">{item.quantity}</td>
                                <td className="border border-black p-2 text-right">{formatPrice(item.price)}</td>
                                <td className="border border-black p-2 text-right font-bold">
                                    {formatPrice(item.price * item.quantity)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colSpan={3} className="border border-black p-2 text-right font-bold">Tổng cộng:</td>
                            <td className="border border-black p-2 text-right font-bold text-xl">
                                {formatPrice(order.totalPrice)}
                            </td>
                        </tr>
                    </tfoot>
                </table>

                {order.notes && (
                    <div className="mb-8 border border-black border-dashed p-3">
                        <span className="font-bold decoration-slice">Ghi chú:</span> {order.notes}
                    </div>
                )}

                <div className="text-center text-sm italic mt-12">
                    Cảm ơn quý khách đã mua hàng tại TV Shop!
                </div>
            </div>

            {/* MAIN ADMIN CONTENT (Hidden on print) */}
            <div className="admin-container max-w-7xl mx-auto no-print">
                {/* Header */}
                <div className="flex justify-between items-center mb-6 no-print">
                    <div className="flex items-center gap-4">
                        <Link href="/orders" className="admin-button secondary icon-only">
                            ←
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-3">
                                Đơn hàng #{order.orderCode}
                                <span className={`admin-badge ${getStatusBadge(order.status)}`}>
                                    {getStatusLabel(order.status)}
                                </span>
                            </h1>
                            <p className="text-muted text-sm mt-1">
                                Đặt ngày {formatDate(order.createdAt)}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={handlePrint} className="admin-button secondary">
                            🖨️ In hoá đơn
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left Column: Products & Payment */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Products Card */}
                        <div className="admin-card p-0 overflow-hidden">
                            <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-between items-center">
                                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Sản phẩm ({order.items?.length})</h3>
                            </div>
                            <table className="w-full text-sm">
                                <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-left">
                                    <tr>
                                        <th className="p-3">Sản phẩm</th>
                                        <th className="p-3 text-right">Đơn giá</th>
                                        <th className="p-3 text-center">SL</th>
                                        <th className="p-3 text-right">Thành tiền</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {order.items?.map((item: any) => (
                                        <tr key={item._id} className="border-t">
                                            <td className="p-3">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={getImageUrl(item.productId?.images?.[0])}
                                                        onError={(e) => { e.currentTarget.src = '/placeholder.png'; }}
                                                        alt=""
                                                        className="w-12 h-12 rounded object-cover border bg-white"
                                                    />
                                                    <div>
                                                        <div className="font-medium">{item.productId?.name}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-3 text-right">{formatPrice(item.price)}</td>
                                            <td className="p-3 text-center">{item.quantity}</td>
                                            <td className="p-3 text-right font-medium">{formatPrice(item.price * item.quantity)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Payment Summary */}
                        <div className="admin-card p-4">
                            <h3 className="font-semibold mb-4 border-b pb-2">Chi tiết thanh toán</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted">Tạm tính:</span>
                                    <span>{formatPrice(order.totalPrice - order.shippingFee + (order.discount || 0))}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted">Phí vận chuyển:</span>
                                    <span>{formatPrice(order.shippingFee)}</span>
                                </div>
                                {order.discount > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Giảm giá (Coupon/Points):</span>
                                        <span>-{formatPrice(order.discount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-xl font-bold border-t pt-2 mt-2">
                                    <span>Tổng cộng:</span>
                                    <span className="text-primary-600">{formatPrice(order.totalPrice)}</span>
                                </div>

                                <div className="mt-4 pt-4 border-t dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800 p-3 rounded">
                                    <div>
                                        <div className="text-xs text-muted uppercase">Phương thức thanh toán</div>
                                        <div className="font-semibold">{order.paymentMethod || 'COD'}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted uppercase text-right">Trạng thái</div>
                                        <div className={`font-semibold ${order.paymentStatus === 'paid' ? 'text-green-600' : 'text-orange-500'}`}>
                                            {order.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Customer & Actions */}
                    <div className="space-y-6">

                        {/* Actions Card */}
                        <div className="admin-card p-4 no-print">
                            <h3 className="font-semibold mb-4">Hành động</h3>
                            <div className="form-group">
                                <label className="text-sm font-medium">Trạng thái đơn hàng</label>
                                <select
                                    className="admin-select mt-1"
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                >
                                    {statusOptions.map(s => (
                                        <option key={s.value} value={s.value}>{s.label}</option>
                                    ))}
                                </select>
                            </div>
                            <button
                                onClick={handleUpdateStatus}
                                disabled={updating || status === order.status}
                                className="admin-button w-full justify-center"
                            >
                                {updating ? 'Đang xử lý...' : 'Cập nhật trạng thái'}
                            </button>
                        </div>

                        {/* Internal Note */}
                        <div className="admin-card p-4 no-print">
                            <h3 className="font-semibold mb-2">Ghi chú nội bộ (Admin Only)</h3>
                            <textarea
                                className="admin-input min-h-[100px] text-sm"
                                placeholder="Ghi chú về đơn hàng này (chỉ admin thấy)..."
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                            />
                            <div className="mt-2 text-right">
                                <button onClick={handleSaveNote} disabled={updating} className="admin-button secondary text-xs">
                                    Lưu ghi chú
                                </button>
                            </div>
                        </div>

                        {/* Customer Info */}
                        <div className="admin-card p-4">
                            <h3 className="font-semibold mb-4 border-b pb-2">Khách hàng</h3>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                                    {(order.addressId?.fullName || order.userId?.name || '?').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div className="font-medium">{order.addressId?.fullName || order.userId?.name || 'Khách vãng lai'}</div>
                                    <div className="text-xs text-muted">{order.userId?.email}</div>
                                </div>
                            </div>
                            <div className="text-sm space-y-3">
                                <div>
                                    <div className="text-muted text-xs">Số điện thoại</div>
                                    <div>{order.addressId?.phone || order.userId?.phone || '—'}</div>
                                </div>
                                <div>
                                    <div className="text-muted text-xs">Địa chỉ giao hàng</div>
                                    <div>{order.addressId ? `${order.addressId.addressLine || order.addressId.street}, ${order.addressId.ward}, ${order.addressId.district}, ${order.addressId.city}` : '—'}</div>
                                </div>
                                {order.notes && (
                                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded text-xs border border-yellow-100 dark:border-yellow-900/30">
                                        <span className="font-semibold text-yellow-700 dark:text-yellow-500">Ghi chú từ khách:</span>
                                        <p className="mt-1 text-gray-700 dark:text-gray-300">{order.notes}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Status History */}
                        <div className="admin-card p-4">
                            <h3 className="font-semibold mb-4 border-b pb-2">Lịch sử trạng thái</h3>
                            <div className="space-y-4 max-h-[300px] overflow-y-auto">
                                {order.statusHistory?.slice().reverse().map((h: any, i: number) => (
                                    <div key={i} className="flex gap-3 text-sm">
                                        <div className="mt-1">
                                            <div className={`w-2 h-2 rounded-full bg-${getStatusBadge(h.status)}-500`} />
                                        </div>
                                        <div>
                                            <div className="font-medium">{getStatusLabel(h.status)}</div>
                                            <div className="text-xs text-muted">
                                                {new Date(h.changedAt).toLocaleString('vi-VN')}
                                            </div>
                                            {h.note && <div className="text-xs text-gray-500 italic mt-1">"{h.note}"</div>}
                                            <div className="text-[10px] text-gray-400 capitalize">Bởi: {h.changedBy}</div>
                                        </div>
                                    </div>
                                ))}
                                {(!order.statusHistory || order.statusHistory.length === 0) && (
                                    <div className="text-center text-muted text-sm italic">Chưa có lịch sử</div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </>
    );
}
