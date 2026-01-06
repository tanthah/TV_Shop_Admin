'use client';
import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const baseURL = process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL || 'http://localhost:5000';

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(`${baseURL}/api/auth/forgot-password`, { email });
      if (res.data?.success) {
        setMessage(res.data.message);
        setStep(2);
      } else {
        setError(res.data?.message || 'Không thể gửi OTP');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi server');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(`${baseURL}/api/auth/verify-otp`, { email, otp });
      if (res.data?.success) {
        setStep(3);
      } else {
        setError(res.data?.message || 'OTP không hợp lệ');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi server');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${baseURL}/api/auth/reset-password`, { email, otp, newPassword });
      if (res.data?.success) {
        setMessage(res.data.message);
        setTimeout(() => router.push('/login'), 2000);
      } else {
        setError(res.data?.message || 'Không thể đặt lại mật khẩu');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi server');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { num: 1, title: 'Nhập Email' },
    { num: 2, title: 'Xác thực OTP' },
    { num: 3, title: 'Mật khẩu mới' },
  ];

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
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64,
            height: 64,
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            borderRadius: 16,
            margin: '0 auto 16px',
            boxShadow: '0 8px 32px rgba(245, 158, 11, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 32
          }}>
            🔐
          </div>
          <h1 style={{
            fontSize: 28,
            fontWeight: 700,
            color: '#ffffff',
            margin: 0,
            letterSpacing: '-0.02em'
          }}>
            Quên mật khẩu
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.6)',
            marginTop: 8,
            fontSize: 14
          }}>
            Khôi phục mật khẩu tài khoản Admin
          </p>
        </div>

        {/* Progress Steps */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 8,
          marginBottom: 24
        }}>
          {steps.map((s) => (
            <div
              key={s.num}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: step >= s.num ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'rgba(255,255,255,0.1)',
                color: step >= s.num ? 'white' : 'rgba(255,255,255,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                fontWeight: 600,
                transition: 'all 0.3s'
              }}>
                {step > s.num ? '✓' : s.num}
              </div>
              {s.num < 3 && (
                <div style={{
                  width: 40,
                  height: 2,
                  background: step > s.num ? '#f59e0b' : 'rgba(255,255,255,0.1)',
                  transition: 'all 0.3s'
                }} />
              )}
            </div>
          ))}
        </div>

        {/* Success Message - Show when password reset is complete */}
        {message && step === 3 && (
          <div className="admin-card" style={{ padding: 32, textAlign: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Đặt lại mật khẩu thành công!</h2>
            <p className="text-muted">{message}</p>
            <p className="text-muted">Đang chuyển hướng về trang đăng nhập...</p>
          </div>
        )}

        {/* Step 1: Email */}
        {step === 1 && (
          <div className="admin-card" style={{ padding: 32 }}>
            <form onSubmit={sendOtp}>
              <div className="form-group">
                <label className="form-label required" htmlFor="email">Email đã đăng ký</label>
                <input
                  id="email"
                  className="admin-input"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <span className="form-hint">Nhập email bạn đã dùng để đăng ký tài khoản</span>
              </div>

              {error && (
                <div className="admin-alert error" style={{ marginBottom: 16 }}>
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <button
                className="admin-button lg warning"
                type="submit"
                disabled={loading}
                style={{ width: '100%' }}
              >
                {loading ? 'Đang gửi...' : '📧 Gửi mã OTP'}
              </button>
            </form>
          </div>
        )}

        {/* Step 2: OTP Verification */}
        {step === 2 && (
          <div className="admin-card" style={{ padding: 32 }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>📬</div>
              <p className="text-muted">Mã OTP đã được gửi tới <strong>{email}</strong></p>
            </div>

            <form onSubmit={verifyOtp}>
              <div className="form-group">
                <label className="form-label required" htmlFor="otp">Mã OTP</label>
                <input
                  id="otp"
                  className="admin-input"
                  type="text"
                  placeholder="Nhập 6 số"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  maxLength={6}
                  style={{ textAlign: 'center', fontSize: 24, letterSpacing: 8 }}
                />
              </div>

              {error && (
                <div className="admin-alert error" style={{ marginBottom: 16 }}>
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <button
                className="admin-button lg warning"
                type="submit"
                disabled={loading}
                style={{ width: '100%' }}
              >
                {loading ? 'Đang xác thực...' : '✓ Xác thực OTP'}
              </button>
            </form>
          </div>
        )}

        {/* Step 3: New Password */}
        {step === 3 && !message && (
          <div className="admin-card" style={{ padding: 32 }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>🔑</div>
              <p className="text-muted">Tạo mật khẩu mới cho tài khoản của bạn</p>
            </div>

            <form onSubmit={resetPassword}>
              <div className="form-group">
                <label className="form-label required" htmlFor="newPassword">Mật khẩu mới</label>
                <input
                  id="newPassword"
                  className="admin-input"
                  type="password"
                  placeholder="Tối thiểu 6 ký tự"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <div className="form-group">
                <label className="form-label required" htmlFor="confirmPassword">Xác nhận mật khẩu</label>
                <input
                  id="confirmPassword"
                  className="admin-input"
                  type="password"
                  placeholder="Nhập lại mật khẩu mới"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <div className="admin-alert error" style={{ marginBottom: 16 }}>
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <button
                className="admin-button lg warning"
                type="submit"
                disabled={loading}
                style={{ width: '100%' }}
              >
                {loading ? 'Đang cập nhật...' : '🔐 Đặt lại mật khẩu'}
              </button>
            </form>
          </div>
        )}

        {/* Footer Link */}
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <a
            href="/login"
            style={{
              color: 'rgba(255,255,255,0.7)',
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 500
            }}
          >
            ← Quay lại <span style={{ color: '#ffffff' }}>Đăng nhập</span>
          </a>
        </div>
      </div>
    </div>
  );
}
