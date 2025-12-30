'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

interface Category {
  _id: string;
  name: string;
  slug: string;
}

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  discount: number;
  finalPrice: number;
  stock: number;
  brand: string;
  isActive: boolean;
  promotionText: string;
  description: string;
  categoryId: Category | null;
  images: string[];
}

export default function ProductsPage() {
  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
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
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: '',
    slug: '',
    price: 0,
    discount: 0,
    stock: 0,
    brand: '',
    isActive: true,
    promotionText: '',
    description: '',
    categoryId: '',
  });

  // Image state
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const baseURL = process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL || 'http://localhost:4000';

  // Fetch categories for dropdown
  const fetchCategories = async () => {
    try {
      const t = Cookies.get('admin_token') || '';
      if (!t) {
        setCategories([]);
        return;
      }
      const res = await axios.get(`${baseURL}/categories/all`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      setCategories(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch {
      setCategories([]);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${baseURL}/products`, {
        params: { page, limit, q, status },
        headers: { Authorization: `Bearer ${Cookies.get('admin_token') || ''}` },
      });
      setItems(res.data?.data?.items || []);
      setTotal(res.data?.data?.total || 0);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi tải sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchCategories();
  }, []);

  useEffect(() => {
    if (mounted) fetchProducts();
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
  const openModal = (product: Product | null = null) => {
    if (product) {
      setEditingProduct(product);
      setForm({
        name: product.name,
        slug: product.slug,
        price: product.price,
        discount: product.discount || 0,
        stock: product.stock,
        brand: product.brand || '',
        isActive: product.isActive,
        promotionText: product.promotionText || '',
        description: product.description || '',
        categoryId: product.categoryId?._id || '',
      });
      setExistingImages(product.images || []);
      setImages([]);
      setImagePreviews([]);
    } else {
      setEditingProduct(null);
      setForm({
        name: '',
        slug: '',
        price: 0,
        discount: 0,
        stock: 0,
        brand: '',
        isActive: true,
        promotionText: '',
        description: '',
        categoryId: '',
      });
      setExistingImages([]);
      setImages([]);
      setImagePreviews([]);
    }
    setShowModal(true);
    setError('');
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setError('');
  };

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length + existingImages.length > 5) {
      setError('Tối đa 5 hình ảnh');
      return;
    }

    // Validate file types
    const validFiles = files.filter(file => file.type.startsWith('image/'));
    if (validFiles.length !== files.length) {
      setError('Chỉ chấp nhận file hình ảnh');
      return;
    }

    setImages([...images, ...validFiles]);
    const previews = validFiles.map(file => URL.createObjectURL(file));
    setImagePreviews([...imagePreviews, ...previews]);
  };

  // Remove new image
  const removeNewImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  // Remove existing image
  const removeExistingImage = (index: number) => {
    setExistingImages(existingImages.filter((_, i) => i !== index));
  };

  // Submit form (create or update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.name || !form.price) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    if (images.length === 0 && existingImages.length === 0) {
      setError('Vui lòng tải lên ít nhất 1 hình ảnh');
      return;
    }

    try {
      setSubmitting(true);
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('slug', form.slug);
      fd.append('price', String(form.price));
      fd.append('discount', String(form.discount));
      fd.append('stock', String(form.stock));
      fd.append('brand', form.brand);
      fd.append('isActive', String(form.isActive));
      fd.append('promotionText', form.promotionText);
      fd.append('description', form.description);
      if (form.categoryId) fd.append('categoryId', form.categoryId);

      // Append new images
      images.forEach((file) => fd.append('images', file));

      if (editingProduct) {
        // For update, include existing images info
        if (existingImages.length > 0) {
          fd.append('keepExistingImages', 'true');
          existingImages.forEach(url => fd.append('existingImageUrls', url));
        }
        await axios.patch(`${baseURL}/products/${editingProduct._id}`, fd, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${Cookies.get('admin_token') || ''}`,
          },
        });
        setSuccess('Cập nhật sản phẩm thành công!');
      } else {
        await axios.post(`${baseURL}/products`, fd, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${Cookies.get('admin_token') || ''}`,
          },
        });
        setSuccess('Tạo sản phẩm thành công!');
      }

      closeModal();
      fetchProducts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi khi lưu sản phẩm');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle product status
  const toggleStatus = async (product: Product) => {
    // Optimistic update
    const updatedItems = items.map(p =>
      p._id === product._id ? { ...p, isActive: !p.isActive } : p
    );
    setItems(updatedItems);

    try {
      await axios.patch(`${baseURL}/products/${product._id}/status`, {}, {
        headers: { Authorization: `Bearer ${Cookies.get('admin_token') || ''}` },
      });
      setSuccess(`Đã ${!product.isActive ? 'hiển thị' : 'ẩn'} sản phẩm`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      // Revert on error
      setItems(items);
      setError(err.response?.data?.message || 'Lỗi cập nhật trạng thái');
    }
  };

  const removeProduct = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xoá sản phẩm này?')) return;
    try {
      await axios.delete(`${baseURL}/products/${id}`, {
        headers: { Authorization: `Bearer ${Cookies.get('admin_token') || ''}` },
      });
      setSuccess('Xoá sản phẩm thành công!');
      fetchProducts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể xoá sản phẩm');
    }
  };

  if (!mounted) return null;

  const totalPages = Math.ceil(total / limit);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  return (
    <div className="admin-container">
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 className="admin-title" style={{ marginBottom: 8 }}>Quản lý sản phẩm</h1>
          <p className="text-muted">Quản lý tất cả sản phẩm trong cửa hàng</p>
        </div>
        <button className="admin-button success" onClick={() => openModal()}>
          + Thêm sản phẩm
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
            placeholder="Nhập tên sản phẩm..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0, minWidth: 150 }}>
          <label className="form-label" htmlFor="status">Trạng thái</label>
          <select id="status" className="admin-select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Tất cả</option>
            <option value="active">Đang bán</option>
            <option value="inactive">Ngừng bán</option>
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
          <button className="admin-button" onClick={() => fetchProducts()} disabled={loading}>
            {loading ? 'Đang tải...' : ' Làm mới'}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: 80 }}>Ảnh</th>
              <th>Tên sản phẩm</th>
              <th>Danh mục</th>
              <th style={{ width: 140 }}>Giá</th>
              <th style={{ width: 100 }}>Tồn kho</th>
              <th style={{ width: 120 }}>Trạng thái</th>
              <th style={{ width: 150 }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p._id}>
                <td>
                  {Array.isArray(p.images) && p.images.length ? (
                    <img
                      src={p.images[0]}
                      alt={p.name}
                      style={{
                        width: 60,
                        height: 60,
                        objectFit: 'cover',
                        borderRadius: 8,
                        border: '1px solid var(--border-color)'
                      }}
                    />
                  ) : (
                    <div className="w-[60px] h-[60px] bg-gray-100 dark:bg-white/10 rounded-lg flex items-center justify-center text-gray-400 dark:text-white/40 text-2xl">
                      📦
                    </div>
                  )}
                </td>
                <td>
                  <div style={{ fontWeight: 600 }}>{p.name}</div>
                  {p.brand && <div className="text-muted" style={{ fontSize: 12 }}>{p.brand}</div>}
                </td>
                <td>
                  <span className="admin-badge info">{p.categoryId?.name || 'N/A'}</span>
                </td>
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--success-600)' }}>
                    {formatPrice(p.finalPrice ?? p.price)}
                  </div>
                  {p.discount > 0 && (
                    <div style={{
                      fontSize: 12,
                      color: 'var(--gray-400)',
                      textDecoration: 'line-through'
                    }}>
                      {formatPrice(p.price)}
                    </div>
                  )}
                </td>
                <td>
                  <span className={`admin-badge ${p.stock > 10 ? 'success' : p.stock > 0 ? 'warning' : 'danger'}`}>
                    {p.stock > 0 ? `${p.stock} sp` : 'Hết hàng'}
                  </span>
                </td>
                <td>
                  {/* Status Toggle Switch */}
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={p.isActive}
                        onChange={() => toggleStatus(p)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                    <span style={{ fontSize: 12, color: p.isActive ? 'var(--success-600)' : 'var(--gray-400)' }}>
                      {p.isActive ? 'Đang bán' : 'Ngừng bán'}
                    </span>
                  </div>
                </td>
                <td>
                  <div className="admin-actions">
                    <button
                      className="admin-button sm"
                      onClick={() => openModal(p)}
                      title="Sửa sản phẩm"
                    >
                      Sửa
                    </button>
                    <button
                      className="admin-button danger sm"
                      onClick={() => removeProduct(p._id)}
                      title="Xoá sản phẩm"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!items.length && !loading && (
              <tr>
                <td colSpan={7}>
                  <div className="admin-empty">
                    <div className="admin-empty-icon">📦</div>
                    <div className="admin-empty-title">Không có sản phẩm</div>
                    <div className="admin-empty-text">Bắt đầu bằng cách thêm sản phẩm mới</div>
                  </div>
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={7}>
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
          Trang {page} / {totalPages || 1} • Tổng {total} sản phẩm
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
          <div className="admin-modal dark:bg-[#1e293b] dark:border-slate-700" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header dark:border-slate-700">
              <h2>{editingProduct ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới'}</h2>
              <button className="admin-modal-close" onClick={closeModal}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="admin-modal-body">
                {error && (
                  <div className="admin-alert error" style={{ marginBottom: 16 }}>
                    <span>⚠️ {error}</span>
                  </div>
                )}

                <div className="form-grid">
                  {/* Name */}
                  <div className="form-group">
                    <label className="form-label required" htmlFor="name">Tên sản phẩm</label>
                    <input
                      id="name"
                      className="admin-input"
                      placeholder="Nhập tên sản phẩm"
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
                      placeholder="ten-san-pham"
                      value={form.slug}
                      onChange={(e) => setForm({ ...form, slug: e.target.value })}
                      required
                    />
                  </div>

                  {/* Category */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="categoryId">Danh mục</label>
                    <select
                      id="categoryId"
                      className="admin-select"
                      value={form.categoryId}
                      onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                    >
                      <option value="">{categories.length ? '-- Chọn danh mục --' : 'Chưa cấu hình danh mục'}</option>
                      {categories.length > 0 &&
                        categories.map(cat => (
                          <option key={cat._id} value={cat._id}>{cat.name}</option>
                        ))}
                    </select>
                  </div>

                  {/* Brand */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="brand">Thương hiệu</label>
                    <input
                      id="brand"
                      className="admin-input"
                      placeholder="VD: Apple, Samsung..."
                      value={form.brand}
                      onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    />
                  </div>

                  {/* Price */}
                  <div className="form-group">
                    <label className="form-label required" htmlFor="price">Giá (VNĐ)</label>
                    <input
                      id="price"
                      className="admin-input"
                      type="number"
                      placeholder="0"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                      required
                      min={0}
                    />
                  </div>

                  {/* Discount */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="discount">Giảm giá (%)</label>
                    <input
                      id="discount"
                      className="admin-input"
                      type="number"
                      placeholder="0"
                      min="0"
                      max="100"
                      value={form.discount}
                      onChange={(e) => setForm({ ...form, discount: Number(e.target.value) })}
                    />
                  </div>

                  {/* Stock */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="stock">Số lượng tồn kho</label>
                    <input
                      id="stock"
                      className="admin-input"
                      type="number"
                      placeholder="0"
                      min="0"
                      value={form.stock}
                      onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                    />
                  </div>

                  {/* Promotion Text */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="promotionText">Khuyến mãi</label>
                    <input
                      id="promotionText"
                      className="admin-input"
                      placeholder="VD: Giảm 10% cho đơn đầu tiên"
                      value={form.promotionText}
                      onChange={(e) => setForm({ ...form, promotionText: e.target.value })}
                    />
                  </div>

                  {/* Description */}
                  <div className="form-group full-width">
                    <label className="form-label" htmlFor="description">Mô tả</label>
                    <textarea
                      id="description"
                      className="admin-input"
                      placeholder="Mô tả chi tiết sản phẩm..."
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
                      <span>Đang bán</span>
                    </label>
                  </div>

                  {/* Image Upload */}
                  <div className="form-group full-width">
                    <label className="form-label">Hình ảnh sản phẩm</label>

                    {/* Existing Images (when editing) */}
                    {existingImages.length > 0 && (
                      <div className="image-preview-grid" style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 8 }}>Ảnh hiện tại:</div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {existingImages.map((url, index) => (
                            <div key={`existing-${index}`} className="image-preview-item">
                              <img src={url} alt={`Existing ${index + 1}`} />
                              <button
                                type="button"
                                className="image-remove-btn"
                                onClick={() => removeExistingImage(index)}
                              >
                                ✕
                              </button>
                              {index === 0 && <span className="image-primary-badge">Ảnh chính</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* New Images Preview */}
                    {imagePreviews.length > 0 && (
                      <div className="image-preview-grid" style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 8 }}>Ảnh mới:</div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {imagePreviews.map((preview, index) => (
                            <div key={`new-${index}`} className="image-preview-item">
                              <img src={preview} alt={`New ${index + 1}`} />
                              <button
                                type="button"
                                className="image-remove-btn"
                                onClick={() => removeNewImage(index)}
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Upload Button */}
                    <div className="admin-file-input">
                      <input
                        id="images"
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageSelect}
                        disabled={images.length + existingImages.length >= 5}
                      />
                      <div className="admin-file-input-label">
                        📷 {images.length + existingImages.length > 0
                          ? `Đã chọn ${images.length + existingImages.length} ảnh (tối đa 5)`
                          : 'Chọn ảnh sản phẩm'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="admin-modal-footer dark:border-slate-700">
                <button type="button" className="admin-button secondary" onClick={closeModal}>
                  Huỷ
                </button>
                <button type="submit" className="admin-button success" disabled={submitting}>
                  {submitting ? 'Đang lưu...' : (editingProduct ? '✓ Cập nhật' : '✓ Tạo sản phẩm')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Additional Styles for Modal and Toggle */}
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
          max-width: 700px;
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

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .form-group.full-width {
          grid-column: 1 / -1;
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

        .image-preview-item {
          position: relative;
          width: 80px;
          height: 80px;
        }

        .image-preview-item img {
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
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--danger-500);
          color: white;
          border: none;
          font-size: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .image-primary-badge {
          position: absolute;
          bottom: 4px;
          left: 4px;
          background: var(--primary-500);
          color: white;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 4px;
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
