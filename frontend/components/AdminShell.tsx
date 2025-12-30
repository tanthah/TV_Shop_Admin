'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import axios from 'axios';

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const baseURL = process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL || 'http://localhost:4001';
    axios.defaults.baseURL = baseURL;
    axios.interceptors.request.use((config) => {
      const token = Cookies.get('admin_token') || '';
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
    axios.interceptors.response.use(
      (res) => res,
      (error) => {
        if (error?.response?.status === 401) {
          Cookies.remove('admin_token');
          router.push('/login');
        }
        return Promise.reject(error);
      },
    );
  }, [router]);

  const isAuthRoute =
    pathname?.startsWith('/login') ||
    pathname?.startsWith('/register') ||
    pathname?.startsWith('/forgot-password');
  if (isAuthRoute) return <>{children}</>;

  const icons: Record<string, React.JSX.Element> = {
    dashboard: (
      <svg className="icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"></path>
      </svg>
    ),
    orders: (
      <svg className="icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M21 4H3v2h18V4zm0 4H3v2h18V8zm0 4H3v2h18v-2zm0 4H3v2h18v-2z"></path>
      </svg>
    ),
    products: (
      <svg className="icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l9 4-9 4-9-4 9-4zm9 6v10l-9 4-9-4V8l9 4 9-4z"></path>
      </svg>
    ),
    users: (
      <svg className="icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5z"></path>
      </svg>
    ),
    settings: (
      <svg className="icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.14 12.94a7.49 7.49 0 000-1.88l2.03-1.58-2-3.46-2.39.96a7.49 7.49 0 00-1.63-.95L12 3H8l-.12 2.96c-.57.22-1.11.52-1.62.89l-2.39-.96-2 3.46 2.03 1.58c-.06.31-.09.63-.09.95s.03.64.09.95L.87 14.52l2 3.46 2.39-.96c.5.37 1.05.67 1.62.89L8 21h4l.12-2.96c.57-.22 1.11-.52 1.63-.95l2.39.96 2-3.46-2.03-1.58zM12 15a3 3 0 110-6 3 3 0 010 6z"></path>
      </svg>
    ),
    comments: (
      <svg className="icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M21 6h-18v12h4v4l6-4h8z"></path>
      </svg>
    ),
    promotions: (
      <svg className="icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 11l9-9 9 9-9 9-9-9zm9-5.5L6.5 11 12 16.5 17.5 11 12 5.5z"></path>
      </svg>
    ),
    notifications: (
      <svg className="icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 22a2 2 0 002-2h-4a2 2 0 002 2zm6-6V9a6 6 0 10-12 0v7l-2 2v1h16v-1l-2-2z"></path>
      </svg>
    ),
    categories: (
      <svg className="icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"></path>
      </svg>
    ),
  };

  const menu = [
    { key: 'dashboard', label: 'Dashboard', path: '/dashboard' },
    { key: 'orders', label: 'Quản lý đơn hàng', path: '/orders' },
    { key: 'products', label: 'Quản lý sản phẩm', path: '/products' },
    { key: 'categories', label: 'Quản lý danh mục', path: '/categories' },
    { key: 'users', label: 'Quản lý người dùng', path: '/users' },
    { key: 'promotions', label: 'Quản lý khuyến mãi', path: '/promotions' },
    { key: 'comments', label: 'Quản lý bình luận', path: '/comments' },
    { key: 'notifications', label: 'Quản lý thông báo', path: '/notifications' },
    { key: 'settings', label: 'Cài đặt hệ thống', path: '/settings' },
  ];

  const current = menu.find((m) => pathname?.startsWith(m.path))?.label || 'Admin';

  const logout = () => {
    Cookies.remove('admin_token');
    router.push('/login');
  };

  return (
    <div className={`admin-layout${collapsed ? ' collapsed' : ''}`}>
      <aside className={`admin-sidebar${collapsed ? ' collapsed' : ''}`}>
        <div className="sidebar-header flex items-center justify-between px-4 py-4 border-b border-white/10 min-h-[64px]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex-shrink-0 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-900/20">
              U
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight whitespace-nowrap text-white leading-tight">UTE Shop</span>
              <span className="text-[11px] font-medium text-blue-200/80 leading-tight">Admin Portal</span>
            </div>
          </div>
          <button className="toggle-btn w-8 h-8 rounded-md bg-white/10 hover:bg-white/15 border border-white/10 hover:border-white/20 flex items-center justify-center transition-all text-white" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? '›' : '‹'}
          </button>
        </div>
        <nav className="admin-nav">
          {menu.map((m) => (
            <Link
              key={m.path}
              href={m.path}
              className={`nav-item${pathname?.startsWith(m.path) ? ' active' : ''}`}
            >
              {icons[m.key]}
              <span>{m.label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={logout}>
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>
      <main className="admin-main">
        <div className="admin-topbar">
          <div className="page-title">
            <h1>{current}</h1>
          </div>
          <div className="topbar-actions">
            <Link className="icon-btn" href="/dashboard">Trang điều khiển</Link>
          </div>
        </div>
        <div className="admin-content">{children}</div>
      </main>
    </div>
  );
}
