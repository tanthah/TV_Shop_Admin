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
  const baseURL = process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL || 'http://localhost:4000';

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
        const res = await axios.get(`${baseURL}/orders/metrics`, {
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
    { href: '/promotions', icon: '🏷️', label: 'Quản lý khuyến mãi', desc: 'Tạo mã giảm giá và ưu đãi' },
    { href: '/notifications', icon: '🔔', label: 'Thông báo', desc: 'Gửi thông báo tới người dùng' },
  ];

  return (
    <div className="admin-container">
      {/* Welcome Section */}
      <div style={{ marginBottom: 32 }}>
        <h1 className="admin-title" style={{ marginBottom: 8, fontSize: 28 }}>
          Chào mừng trở lại! 👋
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
              📈 Tất cả thời gian
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-label">Đơn mới hôm nay</div>
            <div className="stat-card-value">{metrics.newToday?.toLocaleString() || 0}</div>
            <div className="stat-card-change positive">
              🆕 Hôm nay
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-label">Doanh thu hoàn tất</div>
            <div className="stat-card-value" style={{ fontSize: 22 }}>
              {formatCurrency(metrics.revenue || 0)}
            </div>
            <div className="stat-card-change positive">
              💰 Đã thanh toán
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      {metrics && metrics.statusCounts && (
        <div className="admin-card" style={{ marginBottom: 24 }}>
          <div className="admin-card-title">📊 Thống kê đơn hàng theo trạng thái</div>
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
        <div className="admin-card-title">⚡ Truy cập nhanh</div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 16
        }}>
          {quickLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: 16,
                background: 'var(--gray-50)',
                borderRadius: 12,
                textDecoration: 'none',
                color: 'inherit',
                border: '1px solid var(--border-color)',
                transition: 'all 0.2s ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'var(--primary-50)';
                e.currentTarget.style.borderColor = 'var(--primary-200)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'var(--gray-50)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{
                fontSize: 32,
                width: 56,
                height: 56,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'white',
                borderRadius: 12,
                boxShadow: 'var(--shadow-sm)'
              }}>
                {link.icon}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>
                  {link.label}
                </div>
                <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>
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
