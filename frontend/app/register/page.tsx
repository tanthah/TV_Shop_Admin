'use client';
import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('other');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const baseURL = process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL || 'http://localhost:4000';

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(`${baseURL}/register/send-register-otp`, { email });
      if (res.data?.success) {
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
      const res = await axios.post(`${baseURL}/register/verify-register-otp`, { email, otp });
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

  const completeRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const form = new FormData();
      form.append('name', name);
      form.append('email', email);
      form.append('password', password);
      form.append('phone', phone);
      form.append('gender', gender);
      form.append('dateOfBirth', dateOfBirth);
      form.append('otp', otp);
      if (avatar) form.append('avatar', avatar);

      const res = await axios.post(`${baseURL}/register/complete-register`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.success) {
        router.push('/dashboard');
      } else {
        setError(res.data?.message || 'Đăng ký thất bại');
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
    { num: 3, title: 'Hoàn tất' },
  ];

  return (
    <div className="admin-content" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0f172a 100%)'
    }}>
      <div style={{ width: '100%', maxWidth: 480, padding: '24px' }}>
        {/* Logo/Brand */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64,
            height: 64,
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            borderRadius: 16,
            margin: '0 auto 16px',
            boxShadow: '0 8px 32px rgba(34, 197, 94, 0.3)'
          }} />
          <h1 style={{
            fontSize: 28,
            fontWeight: 700,
            color: '#ffffff',
            margin: 0,
            letterSpacing: '-0.02em'
          }}>
            Đăng ký Admin
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.6)',
            marginTop: 8,
            fontSize: 14
          }}>
            Tạo tài khoản quản trị mới
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
                background: step >= s.num ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'rgba(255,255,255,0.1)',
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
                  background: step > s.num ? '#22c55e' : 'rgba(255,255,255,0.1)',
                  transition: 'all 0.3s'
                }} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Email */}
        {step === 1 && (
          <div className="admin-card" style={{ padding: 32 }}>
            <form onSubmit={sendOtp}>
              <div className="form-group">
                <label className="form-label required" htmlFor="email">Email</label>
                <input
                  id="email"
                  className="admin-input"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <span className="form-hint">Chúng tôi sẽ gửi mã OTP tới email này</span>
              </div>

              {error && (
                <div className="admin-alert error" style={{ marginBottom: 16 }}>
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <button
                className="admin-button lg success"
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
                className="admin-button lg success"
                type="submit"
                disabled={loading}
                style={{ width: '100%' }}
              >
                {loading ? 'Đang xác thực...' : '✓ Xác thực OTP'}
              </button>
            </form>
          </div>
        )}

        {/* Step 3: Complete Registration */}
        {step === 3 && (
          <div className="admin-card" style={{ padding: 32 }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
              <p className="text-muted">Email đã xác thực! Hoàn tất thông tin của bạn</p>
            </div>

            <form onSubmit={completeRegister}>
              <div className="form-group">
                <label className="form-label required" htmlFor="name">Họ và tên</label>
                <input
                  id="name"
                  className="admin-input"
                  type="text"
                  placeholder="Nguyễn Văn A"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label required" htmlFor="password">Mật khẩu</label>
                <input
                  id="password"
                  className="admin-input"
                  type="password"
                  placeholder="Tối thiểu 6 ký tự"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label" htmlFor="phone">Số điện thoại</label>
                  <input
                    id="phone"
                    className="admin-input"
                    type="text"
                    placeholder="0123 456 789"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="dateOfBirth">Ngày sinh</label>
                  <input
                    id="dateOfBirth"
                    className="admin-input"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="gender">Giới tính</label>
                <select
                  id="gender"
                  className="admin-select"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="avatar">Ảnh đại diện</label>
                <div className="admin-file-input">
                  <input
                    id="avatar"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setAvatar(e.target.files?.[0] || null)}
                  />
                  <div className="admin-file-input-label">
                    📷 {avatar ? avatar.name : 'Chọn ảnh đại diện'}
                  </div>
                </div>
              </div>

              {error && (
                <div className="admin-alert error" style={{ marginBottom: 16 }}>
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <button
                className="admin-button lg success"
                type="submit"
                disabled={loading}
                style={{ width: '100%' }}
              >
                {loading ? 'Đang tạo tài khoản...' : '🚀 Hoàn tất đăng ký'}
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
            Đã có tài khoản? <span style={{ color: '#ffffff' }}>Đăng nhập</span>
          </a>
        </div>
      </div>
    </div>
  );
}
