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

  const baseURL = process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL || 'http://localhost:4000';

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
    <div className="admin-content" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0f172a 100%)'
    }}>
      <div style={{ width: '100%', maxWidth: 440, padding: '24px' }}>
        {/* Logo/Brand */}
        <div style={{
          textAlign: 'center',
          marginBottom: 32
        }}>
          <div style={{
            width: 64,
            height: 64,
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            borderRadius: 16,
            margin: '0 auto 16px',
            boxShadow: '0 8px 32px rgba(59, 130, 246, 0.3)'
          }} />
          <h1 style={{
            fontSize: 28,
            fontWeight: 700,
            color: '#ffffff',
            margin: 0,
            letterSpacing: '-0.02em'
          }}>
            UTE Shop Admin
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.6)',
            marginTop: 8,
            fontSize: 14
          }}>
            Đăng nhập để quản lý hệ thống
          </p>
        </div>

        {/* Login Card */}
        <div className="admin-card" style={{
          padding: 32,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}>
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
              <div className="admin-alert error" style={{ marginBottom: 16 }}>
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              className="admin-button lg"
              type="submit"
              disabled={loading}
              style={{ width: '100%', marginTop: 8 }}
            >
              {loading ? (
                <>
                  <span className="admin-spinner" style={{ width: 18, height: 18 }} />
                  Đang đăng nhập...
                </>
              ) : (
                'Đăng nhập'
              )}
            </button>
          </form>
        </div>

        {/* Footer Links */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 24,
          marginTop: 24
        }}>
          <a
            href="/register"
            style={{
              color: 'rgba(255,255,255,0.7)',
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 500,
              transition: 'color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.color = '#ffffff'}
            onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
          >
            Đăng ký Admin
          </a>
          <a
            href="/forgot-password"
            style={{
              color: 'rgba(255,255,255,0.7)',
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 500,
              transition: 'color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.color = '#ffffff'}
            onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
          >
            Quên mật khẩu?
          </a>
        </div>
      </div>
    </div>
  );
}
