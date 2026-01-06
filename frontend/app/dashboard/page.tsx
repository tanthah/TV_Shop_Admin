'use client';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const baseURL = process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL || 'http://localhost:5000';

  useEffect(() => {
    setMounted(true);
    const t = Cookies.get('admin_token') || null;
    setToken(t);
    const fetchMetrics = async () => {
      if (!t) {
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get(`${baseURL}/api/orders/metrics`, {
          headers: { Authorization: `Bearer ${t}` },
        });
        setMetrics(res.data?.data);
      } catch (err) {
        console.error('Failed to fetch metrics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (!mounted) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
  };

  const quickLinks = [
    { href: '/orders', icon: '📋', label: 'Quản lý đơn hàng', desc: 'Xử lý và theo dõi đơn hàng' },
    { href: '/products', icon: '📦', label: 'Quản lý sản phẩm', desc: 'Thêm, sửa, xoá sản phẩm' },
    { href: '/users', icon: '👥', label: 'Quản lý người dùng', desc: 'Quản lý tài khoản người dùng' },
    { href: '/comments', icon: '💬', label: 'Quản lý bình luận', desc: 'Duyệt và phản hồi đánh giá' },
    { href: '/chat', icon: '🎧', label: 'Hỗ trợ khách hàng', desc: 'Hỗ trợ trực tuyến khách hàng' },
    { href: '/faq', icon: '❓', label: 'Quản lý FAQ', desc: 'Quản lý câu hỏi thường gặp' },
    { href: '/promotions', icon: '🏷️', label: 'Quản lý khuyến mãi', desc: 'Tạo mã giảm giá và ưu đãi' },
    { href: '/notifications', icon: '🔔', label: 'Thông báo', desc: 'Gửi thông báo tới người dùng' },
  ];

  return (
    <div className="admin-container">
      {/* Welcome Section */}
      <div style={{ marginBottom: 24 }}>
        <h1 className="admin-title" style={{ marginBottom: 4, fontSize: 24 }}>
          Chào mừng trở lại!
        </h1>
        <p className="text-muted" style={{ fontSize: 15 }}>
          Đây là tổng quan về cửa hàng của bạn hôm nay
        </p>
      </div>

      {/* Auth Status */}
      {!loading && (
        <div
          className={`admin-alert ${token ? 'success' : 'warning'}`}
          style={{ marginBottom: 24 }}
        >
          <span>{token ? '✅' : '⚠️'}</span>
          <span>
            Trạng thái: {token ? 'Đã đăng nhập và xác thực thành công' : 'Chưa đăng nhập'}
          </span>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="admin-card" style={{ textAlign: 'center', padding: 48 }}>
          <div className="admin-spinner" style={{ margin: '0 auto 16px' }} />
          <p className="text-muted">Đang tải dữ liệu...</p>
        </div>
      )}

      {/* Stats Cards */}
      {metrics && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card-label">Tổng đơn hàng</div>
            <div className="stat-card-value">{metrics.totalOrders?.toLocaleString() || 0}</div>
            <div className="stat-card-change positive">
              Tất cả thời gian
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-label">Đơn mới hôm nay</div>
            <div className="stat-card-value">{metrics.newToday?.toLocaleString() || 0}</div>
            <div className="stat-card-change positive">
              Hôm nay
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-label">Doanh thu hoàn tất</div>
            <div className="stat-card-value" style={{ fontSize: 22 }}>
              {formatCurrency(metrics.revenue || 0)}
            </div>
            <div className="stat-card-change positive">
              Đã thanh toán
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      {metrics && metrics.statusCounts && (
        <div className="admin-card" style={{ marginBottom: 24 }}>
          <div className="admin-card-title">Thống kê đơn hàng theo trạng thái</div>
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <Bar
              data={{
                labels: metrics.statusCounts.map((s: any) => {
                  const statusLabels: Record<string, string> = {
                    'pending': 'Chờ xử lý',
                    'processing': 'Đang xử lý',
                    'shipped': 'Đang giao',
                    'delivered': 'Đã giao',
                    'cancelled': 'Đã huỷ',
                    'completed': 'Hoàn tất'
                  };
                  return statusLabels[s.status] || s.status;
                }),
                datasets: [
                  {
                    label: 'Số đơn hàng',
                    data: metrics.statusCounts.map((s: any) => s.count),
                    backgroundColor: [
                      'rgba(59, 130, 246, 0.8)',
                      'rgba(245, 158, 11, 0.8)',
                      'rgba(139, 92, 246, 0.8)',
                      'rgba(34, 197, 94, 0.8)',
                      'rgba(239, 68, 68, 0.8)',
                      'rgba(16, 185, 129, 0.8)',
                    ],
                    borderColor: [
                      'rgb(59, 130, 246)',
                      'rgb(245, 158, 11)',
                      'rgb(139, 92, 246)',
                      'rgb(34, 197, 94)',
                      'rgb(239, 68, 68)',
                      'rgb(16, 185, 129)',
                    ],
                    borderWidth: 2,
                    borderRadius: 6,
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    display: false,
                  },
                  tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    padding: 12,
                    cornerRadius: 8,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: {
                      color: 'rgba(0, 0, 0, 0.05)',
                    },
                  },
                  x: {
                    grid: {
                      display: false,
                    },
                  },
                },
              }}
            />
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="admin-card">
        <div className="admin-card-title">Truy cập nhanh</div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 16
        }}>
          {quickLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-primary-50 dark:hover:bg-primary-900/10 hover:border-primary-500 dark:hover:border-primary-500 hover:-translate-y-0.5 transition-all duration-200 group no-underline text-inherit"
            >
              <div className="text-3xl w-14 h-14 flex items-center justify-center bg-white dark:bg-white/10 rounded-lg shadow-sm group-hover:scale-110 transition-transform duration-200">
                {link.icon}
              </div>
              <div>
                <div className="font-semibold text-[15px] mb-0.5 group-hover:text-primary-600 dark:group-hover:text-primary-400">
                  {link.label}
                </div>
                <div className="text-[13px] text-gray-500 dark:text-gray-400">
                  {link.desc}
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
