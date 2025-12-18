'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const baseURL = process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL || 'http://localhost:4000';

  const fetchSettings = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await axios.get(`${baseURL}/settings`, {
        headers: { Authorization: `Bearer ${Cookies.get('admin_token') || ''}` },
      });
      setData(res.data?.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi tải cài đặt');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchSettings();
  }, []);

  const updateField = (section: 'general' | 'order' | 'notification', key: string, value: any) => {
    setData((prev: any) => ({ ...prev, [section]: { ...prev[section], [key]: value } }));
    setSuccess('');
  };

  const save = async () => {
    if (!data) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        siteName: data.general?.siteName,
        contactEmail: data.general?.contactEmail,
        supportPhone: data.general?.supportPhone,
        maintenanceMode: !!data.general?.maintenanceMode,
        homepageMessage: data.general?.homepageMessage,
        allowGuestCheckout: !!data.order?.allowGuestCheckout,
        autoConfirm: !!data.order?.autoConfirm,
        defaultShippingFee: Number(data.order?.defaultShippingFee || 0),
        enableEmailNotifications: !!data.notification?.enableEmailNotifications,
        enablePushNotifications: !!data.notification?.enablePushNotifications,
      };
      const res = await axios.patch(`${baseURL}/settings`, payload, {
        headers: { Authorization: `Bearer ${Cookies.get('admin_token') || ''}` },
      });
      setData(res.data?.data);
      setSuccess('Lưu cài đặt thành công!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể lưu cài đặt');
    } finally {
      setSaving(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="admin-container">
      {/* Page Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 className="admin-title" style={{ marginBottom: 8 }}>Cài đặt hệ thống</h1>
        <p className="text-muted">Cấu hình các thiết lập chung cho cửa hàng</p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="admin-alert error">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="admin-alert success">
          <span>✅</span>
          <span>{success}</span>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="admin-card" style={{ textAlign: 'center', padding: 48 }}>
          <div className="admin-spinner" style={{ margin: '0 auto 16px' }} />
          <p className="text-muted">Đang tải cài đặt...</p>
        </div>
      ) : data ? (
        <div style={{ display: 'grid', gap: 24 }}>
          {/* General Settings */}
          <div className="admin-card">
            <div className="admin-card-title">🏪 Thông tin chung</div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label" htmlFor="siteName">Tên website</label>
                <input
                  id="siteName"
                  className="admin-input"
                  placeholder="VD: UTE Shop"
                  value={data.general?.siteName || ''}
                  onChange={(e) => updateField('general', 'siteName', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="contactEmail">Email liên hệ</label>
                <input
                  id="contactEmail"
                  className="admin-input"
                  type="email"
                  placeholder="contact@example.com"
                  value={data.general?.contactEmail || ''}
                  onChange={(e) => updateField('general', 'contactEmail', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="supportPhone">Số điện thoại hỗ trợ</label>
                <input
                  id="supportPhone"
                  className="admin-input"
                  placeholder="0123 456 789"
                  value={data.general?.supportPhone || ''}
                  onChange={(e) => updateField('general', 'supportPhone', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Chế độ bảo trì</label>
                <label className="admin-checkbox">
                  <input
                    type="checkbox"
                    checked={!!data.general?.maintenanceMode}
                    onChange={(e) => updateField('general', 'maintenanceMode', e.target.checked)}
                  />
                  <span>Bật chế độ bảo trì</span>
                </label>
                <span className="form-hint">Khi bật, người dùng sẽ thấy thông báo bảo trì</span>
              </div>

              <div className="form-group full-width">
                <label className="form-label" htmlFor="homepageMessage">Thông điệp trang chủ</label>
                <input
                  id="homepageMessage"
                  className="admin-input"
                  placeholder="Hiển thị ở banner trang chủ"
                  value={data.general?.homepageMessage || ''}
                  onChange={(e) => updateField('general', 'homepageMessage', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Order Settings */}
          <div className="admin-card">
            <div className="admin-card-title">📋 Cài đặt đơn hàng</div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Khách vãng lai</label>
                <label className="admin-checkbox">
                  <input
                    type="checkbox"
                    checked={!!data.order?.allowGuestCheckout}
                    onChange={(e) => updateField('order', 'allowGuestCheckout', e.target.checked)}
                  />
                  <span>Cho phép khách vãng lai đặt hàng</span>
                </label>
                <span className="form-hint">Cho phép đặt hàng không cần đăng ký tài khoản</span>
              </div>

              <div className="form-group">
                <label className="form-label">Xác nhận tự động</label>
                <label className="admin-checkbox">
                  <input
                    type="checkbox"
                    checked={!!data.order?.autoConfirm}
                    onChange={(e) => updateField('order', 'autoConfirm', e.target.checked)}
                  />
                  <span>Tự động xác nhận đơn hàng mới</span>
                </label>
                <span className="form-hint">Đơn hàng sẽ được xác nhận ngay sau khi đặt</span>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="defaultShippingFee">Phí vận chuyển mặc định (VNĐ)</label>
                <input
                  id="defaultShippingFee"
                  className="admin-input"
                  type="number"
                  min="0"
                  placeholder="30000"
                  value={Number(data.order?.defaultShippingFee || 0)}
                  onChange={(e) => updateField('order', 'defaultShippingFee', Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="admin-card">
            <div className="admin-card-title">🔔 Cài đặt thông báo</div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Thông báo Email</label>
                <label className="admin-checkbox">
                  <input
                    type="checkbox"
                    checked={!!data.notification?.enableEmailNotifications}
                    onChange={(e) => updateField('notification', 'enableEmailNotifications', e.target.checked)}
                  />
                  <span>Bật thông báo qua Email</span>
                </label>
                <span className="form-hint">Gửi email khi có đơn hàng mới, cập nhật trạng thái...</span>
              </div>

              <div className="form-group">
                <label className="form-label">Thông báo Push</label>
                <label className="admin-checkbox">
                  <input
                    type="checkbox"
                    checked={!!data.notification?.enablePushNotifications}
                    onChange={(e) => updateField('notification', 'enablePushNotifications', e.target.checked)}
                  />
                  <span>Bật thông báo Push</span>
                </label>
                <span className="form-hint">Gửi thông báo đẩy tới ứng dụng di động</span>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              className="admin-button success lg"
              onClick={save}
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="admin-spinner" style={{ width: 18, height: 18 }} />
                  Đang lưu...
                </>
              ) : (
                <>✓ Lưu cài đặt</>
              )}
            </button>
            <button
              className="admin-button secondary lg"
              onClick={fetchSettings}
              disabled={saving}
            >
              ↺ Đặt lại
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
