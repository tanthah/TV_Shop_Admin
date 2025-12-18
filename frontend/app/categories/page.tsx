'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

interface Category {
    _id: string;
    name: string;
    slug: string;
    description: string;
    image: string;
    isActive: boolean;
    createdAt: string;
}

export default function CategoriesPage() {
    const [mounted, setMounted] = useState(false);
    const [items, setItems] = useState<Category[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [q, setQ] = useState('');
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [form, setForm] = useState({
        name: '',
        slug: '',
        description: '',
        isActive: true,
    });

    // Image state
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [existingImage, setExistingImage] = useState<string>('');

    const baseURL = process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL || 'http://localhost:4000';

    const fetchCategories = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await axios.get(`${baseURL}/categories`, {
                params: { page, limit, q, status },
                headers: { Authorization: `Bearer ${Cookies.get('admin_token') || ''}` },
            });
            setItems(res.data?.data?.items || []);
            setTotal(res.data?.data?.total || 0);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Lỗi tải danh mục');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted) fetchCategories();
    }, [mounted, page, limit, q, status]);

    // Auto-generate slug from name
    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[đĐ]/g, 'd')
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    };

    const handleNameChange = (name: string) => {
        setForm({ ...form, name, slug: generateSlug(name) });
    };

    // Open modal for create or edit
    const openModal = (category: Category | null = null) => {
        if (category) {
            setEditingCategory(category);
            setForm({
                name: category.name,
                slug: category.slug,
                description: category.description || '',
                isActive: category.isActive,
            });
            setExistingImage(category.image || '');
            setImageFile(null);
            setImagePreview('');
        } else {
            setEditingCategory(null);
            setForm({
                name: '',
                slug: '',
                description: '',
                isActive: true,
            });
            setExistingImage('');
            setImageFile(null);
            setImagePreview('');
        }
        setShowModal(true);
        setError('');
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingCategory(null);
        setError('');
        if (imagePreview) {
            URL.revokeObjectURL(imagePreview);
        }
    };

    // Handle image selection
    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setError('Chỉ chấp nhận file hình ảnh');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError('Kích thước file không được vượt quá 5MB');
            return;
        }

        if (imagePreview) {
            URL.revokeObjectURL(imagePreview);
        }

        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
        setExistingImage(''); // Clear existing image when new one is selected
    };

    // Remove image
    const removeImage = () => {
        if (imagePreview) {
            URL.revokeObjectURL(imagePreview);
        }
        setImageFile(null);
        setImagePreview('');
        setExistingImage('');
    };

    // Submit form (create or update)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!form.name || !form.slug) {
            setError('Vui lòng điền đầy đủ thông tin bắt buộc');
            return;
        }

        try {
            setSubmitting(true);
            const fd = new FormData();
            fd.append('name', form.name);
            fd.append('slug', form.slug);
            fd.append('description', form.description);
            fd.append('isActive', String(form.isActive));

            if (imageFile) {
                fd.append('image', imageFile);
            } else if (existingImage) {
                fd.append('image', existingImage);
            }

            if (editingCategory) {
                await axios.patch(`${baseURL}/categories/${editingCategory._id}`, fd, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${Cookies.get('admin_token') || ''}`,
                    },
                });
                setSuccess('Cập nhật danh mục thành công!');
            } else {
                await axios.post(`${baseURL}/categories`, fd, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${Cookies.get('admin_token') || ''}`,
                    },
                });
                setSuccess('Tạo danh mục thành công!');
            }

            closeModal();
            fetchCategories();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Lỗi khi lưu danh mục');
        } finally {
            setSubmitting(false);
        }
    };

    // Toggle category status
    const toggleStatus = async (category: Category) => {
        // Optimistic update
        const updatedItems = items.map(c =>
            c._id === category._id ? { ...c, isActive: !c.isActive } : c
        );
        setItems(updatedItems);

        try {
            await axios.patch(`${baseURL}/categories/${category._id}/status`, {}, {
                headers: { Authorization: `Bearer ${Cookies.get('admin_token') || ''}` },
            });
            setSuccess(`Đã ${!category.isActive ? 'hiển thị' : 'ẩn'} danh mục`);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            // Revert on error
            setItems(items);
            setError(err.response?.data?.message || 'Lỗi cập nhật trạng thái');
        }
    };

    const removeCategory = async (id: string) => {
        if (!confirm('Bạn có chắc muốn xoá danh mục này?')) return;
        try {
            await axios.delete(`${baseURL}/categories/${id}`, {
                headers: { Authorization: `Bearer ${Cookies.get('admin_token') || ''}` },
            });
            setSuccess('Xoá danh mục thành công!');
            fetchCategories();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Không thể xoá danh mục');
        }
    };

    if (!mounted) return null;

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="admin-container">
            {/* Page Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div>
                    <h1 className="admin-title" style={{ marginBottom: 8 }}>Quản lý danh mục</h1>
                    <p className="text-muted">Quản lý tất cả danh mục sản phẩm</p>
                </div>
                <button className="admin-button success" onClick={() => openModal()}>
                    + Thêm danh mục
                </button>
            </div>

            {/* Alerts */}
            {error && (
                <div className="admin-alert error" style={{ marginBottom: 16 }}>
                    <span>⚠️</span>
                    <span>{error}</span>
                    <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                </div>
            )}
            {success && (
                <div className="admin-alert success" style={{ marginBottom: 16 }}>
                    <span>✓</span>
                    <span>{success}</span>
                </div>
            )}

            {/* Toolbar */}
            <div className="admin-toolbar">
                <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: 200 }}>
                    <label className="form-label" htmlFor="search">Tìm kiếm</label>
                    <input
                        id="search"
                        className="admin-input"
                        placeholder="Nhập tên danh mục..."
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                    />
                </div>

                <div className="form-group" style={{ marginBottom: 0, minWidth: 150 }}>
                    <label className="form-label" htmlFor="status">Trạng thái</label>
                    <select id="status" className="admin-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                        <option value="">Tất cả</option>
                        <option value="active">Đang hiển thị</option>
                        <option value="inactive">Đã ẩn</option>
                    </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0, minWidth: 100 }}>
                    <label className="form-label" htmlFor="limit">Hiển thị</label>
                    <select id="limit" className="admin-select" value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0, alignSelf: 'flex-end' }}>
                    <button className="admin-button" onClick={() => fetchCategories()} disabled={loading}>
                        {loading ? 'Đang tải...' : '🔄 Làm mới'}
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="admin-table-wrapper">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th style={{ width: 80 }}>Ảnh</th>
                            <th>Tên danh mục</th>
                            <th>Slug</th>
                            <th>Mô tả</th>
                            <th style={{ width: 120 }}>Trạng thái</th>
                            <th style={{ width: 150 }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((c) => (
                            <tr key={c._id}>
                                <td>
                                    {c.image ? (
                                        <img
                                            src={c.image}
                                            alt={c.name}
                                            style={{
                                                width: 60,
                                                height: 60,
                                                objectFit: 'cover',
                                                borderRadius: 8,
                                                border: '1px solid var(--border-color)'
                                            }}
                                        />
                                    ) : (
                                        <div style={{
                                            width: 60,
                                            height: 60,
                                            background: 'var(--gray-100)',
                                            borderRadius: 8,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'var(--gray-400)',
                                            fontSize: 24
                                        }}>
                                            📁
                                        </div>
                                    )}
                                </td>
                                <td>
                                    <div style={{ fontWeight: 600 }}>{c.name}</div>
                                </td>
                                <td>
                                    <code style={{ fontSize: 12, background: 'var(--gray-100)', padding: '2px 6px', borderRadius: 4 }}>
                                        {c.slug}
                                    </code>
                                </td>
                                <td>
                                    <div style={{
                                        maxWidth: 200,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        color: 'var(--gray-500)',
                                        fontSize: 13
                                    }}>
                                        {c.description || '—'}
                                    </div>
                                </td>
                                <td>
                                    {/* Status Toggle Switch */}
                                    <label className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={c.isActive}
                                            onChange={() => toggleStatus(c)}
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                    <span style={{ marginLeft: 8, fontSize: 12, color: c.isActive ? 'var(--success-600)' : 'var(--gray-400)' }}>
                                        {c.isActive ? 'Hiển thị' : 'Ẩn'}
                                    </span>
                                </td>
                                <td>
                                    <div className="admin-actions">
                                        <button
                                            className="admin-button sm"
                                            onClick={() => openModal(c)}
                                            title="Sửa danh mục"
                                        >
                                            ✏️ Sửa
                                        </button>
                                        <button
                                            className="admin-button danger sm"
                                            onClick={() => removeCategory(c._id)}
                                            title="Xoá danh mục"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {!items.length && !loading && (
                            <tr>
                                <td colSpan={6}>
                                    <div className="admin-empty">
                                        <div className="admin-empty-icon">📁</div>
                                        <div className="admin-empty-title">Không có danh mục</div>
                                        <div className="admin-empty-text">Bắt đầu bằng cách thêm danh mục mới</div>
                                    </div>
                                </td>
                            </tr>
                        )}
                        {loading && (
                            <tr>
                                <td colSpan={6}>
                                    <div className="admin-loading">
                                        <span className="admin-spinner" />
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="admin-pagination">
                <button
                    className="admin-button secondary sm"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                >
                    ← Trước
                </button>
                <span className="page-info">
                    Trang {page} / {totalPages || 1} • Tổng {total} danh mục
                </span>
                <button
                    className="admin-button sm"
                    disabled={(page * limit) >= total}
                    onClick={() => setPage(page + 1)}
                >
                    Sau →
                </button>
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="admin-modal-overlay" onClick={closeModal}>
                    <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-modal-header">
                            <h2>{editingCategory ? 'Cập nhật danh mục' : 'Thêm danh mục mới'}</h2>
                            <button className="admin-modal-close" onClick={closeModal}>✕</button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="admin-modal-body">
                                {error && (
                                    <div className="admin-alert error" style={{ marginBottom: 16 }}>
                                        <span>⚠️ {error}</span>
                                    </div>
                                )}

                                <div className="form-stack">
                                    {/* Name */}
                                    <div className="form-group">
                                        <label className="form-label required" htmlFor="name">Tên danh mục</label>
                                        <input
                                            id="name"
                                            className="admin-input"
                                            placeholder="Nhập tên danh mục"
                                            value={form.name}
                                            onChange={(e) => handleNameChange(e.target.value)}
                                            required
                                        />
                                    </div>

                                    {/* Slug */}
                                    <div className="form-group">
                                        <label className="form-label required" htmlFor="slug">Slug (URL)</label>
                                        <input
                                            id="slug"
                                            className="admin-input"
                                            placeholder="ten-danh-muc"
                                            value={form.slug}
                                            onChange={(e) => setForm({ ...form, slug: e.target.value })}
                                            required
                                        />
                                        <span className="form-hint">Đường dẫn thân thiện với SEO</span>
                                    </div>

                                    {/* Description */}
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="description">Mô tả</label>
                                        <textarea
                                            id="description"
                                            className="admin-input"
                                            placeholder="Mô tả danh mục..."
                                            rows={3}
                                            value={form.description}
                                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                                        />
                                    </div>

                                    {/* Status */}
                                    <div className="form-group">
                                        <label className="form-label">Trạng thái</label>
                                        <label className="admin-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={form.isActive}
                                                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                                            />
                                            <span>Hiển thị danh mục</span>
                                        </label>
                                    </div>

                                    {/* Image Upload */}
                                    <div className="form-group">
                                        <label className="form-label">Hình ảnh danh mục</label>

                                        {/* Image Preview */}
                                        {(imagePreview || existingImage) && (
                                            <div className="image-preview-single" style={{ marginBottom: 12 }}>
                                                <img src={imagePreview || existingImage} alt="Preview" />
                                                <button
                                                    type="button"
                                                    className="image-remove-btn"
                                                    onClick={removeImage}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        )}

                                        {/* Upload Button */}
                                        {!imagePreview && !existingImage && (
                                            <div className="admin-file-input">
                                                <input
                                                    id="image"
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleImageSelect}
                                                />
                                                <div className="admin-file-input-label">
                                                    📷 Chọn ảnh danh mục
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="admin-modal-footer">
                                <button type="button" className="admin-button secondary" onClick={closeModal}>
                                    Huỷ
                                </button>
                                <button type="submit" className="admin-button success" disabled={submitting}>
                                    {submitting ? 'Đang lưu...' : (editingCategory ? '✓ Cập nhật' : '✓ Tạo danh mục')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Additional Styles */}
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
          max-width: 500px;
          max-height: 90vh;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .admin-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid var(--border-color);
        }

        .admin-modal-header h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }

        .admin-modal-close {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: var(--gray-400);
          padding: 4px 8px;
          border-radius: 4px;
        }

        .admin-modal-close:hover {
          background: var(--gray-100);
          color: var(--gray-600);
        }

        .admin-modal-body {
          padding: 24px;
          max-height: 60vh;
          overflow-y: auto;
        }

        .admin-modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px 24px;
          border-top: 1px solid var(--border-color);
          background: var(--gray-50);
        }

        .form-stack {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 44px;
          height: 24px;
        }

        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: var(--gray-300);
          transition: 0.3s;
          border-radius: 24px;
        }

        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: 0.3s;
          border-radius: 50%;
        }

        .toggle-switch input:checked + .toggle-slider {
          background-color: var(--success-500);
        }

        .toggle-switch input:checked + .toggle-slider:before {
          transform: translateX(20px);
        }

        .image-preview-single {
          position: relative;
          width: 120px;
          height: 120px;
        }

        .image-preview-single img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 8px;
          border: 1px solid var(--border-color);
        }

        .image-remove-btn {
          position: absolute;
          top: -8px;
          right: -8px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--danger-500);
          color: white;
          border: none;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .admin-alert.success {
          background: var(--success-50);
          border: 1px solid var(--success-200);
          color: var(--success-700);
          padding: 12px 16px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
      `}</style>
        </div>
    );
}
