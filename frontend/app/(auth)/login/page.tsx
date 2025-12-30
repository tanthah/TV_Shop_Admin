'use client';
import { useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const baseURL = process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL || 'http://localhost:4001';

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(`${baseURL}/auth/login`, { email, password });
      if (res.data?.success) {
        Cookies.set('admin_token', res.data.token);
        router.push('/dashboard');
      } else {
        setError(res.data?.message || 'Đăng nhập thất bại');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900" style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0f172a 100%)'
    }}>
      <div className="w-full max-w-[440px] p-6">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30" />
          <h1 className="text-2xl font-bold text-white mb-0 tracking-tight">
            UTE Shop Admin
          </h1>
          <p className="text-white/60 mt-2 text-sm">
            Đăng nhập để quản lý hệ thống
          </p>
        </div>

        {/* Login Card */}
        <div className="admin-card p-8 shadow-2xl">
          <form onSubmit={onSubmit}>
            {/* Email Field */}
            <div className="form-group">
              <label className="form-label required" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                className="admin-input"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label className="form-label required" htmlFor="password">
                Mật khẩu
              </label>
              <input
                id="password"
                className="admin-input"
                type="password"
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 mb-4 rounded-md bg-red-500/10 border border-red-500/20 text-red-500 flex items-center gap-2 text-sm">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              className="admin-button lg w-full mt-2"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="admin-spinner w-[18px] h-[18px]" />
                  Đang đăng nhập...
                </>
              ) : (
                'Đăng nhập'
              )}
            </button>
          </form>
        </div>

        {/* Footer Links */}
        <div className="flex justify-center gap-6 mt-6">
          <a
            href="/register"
            className="text-white/70 hover:text-white no-underline text-sm font-medium transition-colors"
          >
            Đăng ký Admin
          </a>
          <a
            href="/forgot-password"
            className="text-white/70 hover:text-white no-underline text-sm font-medium transition-colors"
          >
            Quên mật khẩu?
          </a>
        </div>
      </div>
    </div>
  );
}
