'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import Cookies from 'js-cookie';

interface FAQ {
    _id: string;
    category: string;
    question: string;
    answer: string;
    order: number;
    isActive: boolean;
}

interface Category {
    _id: string;
    name: string;
    slug: string;
    order: number;
    isActive: boolean;
    color: string;
}

export default function FAQPage() {
    const [faqs, setFaqs] = useState<FAQ[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
    const [activeTab, setActiveTab] = useState<'faqs' | 'categories'>('faqs');

    // Pagination State
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [total, setTotal] = useState(0);

    const baseURL = (process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL || 'http://localhost:5000') + '/api';

    // FAQ Form State
    const [formData, setFormData] = useState({
        category: '',
        question: '',
        answer: '',
        order: 0,
        isActive: true,
    });

    // Category Form State
    const [categoryForm, setCategoryForm] = useState({
        _id: '',
        name: '',
        slug: '',
        order: 0,
        color: 'bg-gray-800 text-gray-300 border-gray-700',
        isActive: true
    });

    const getAuthHeaders = () => ({
        headers: { Authorization: `Bearer ${Cookies.get('admin_token') || ''}` }
    });

    const fetchFaqs = async () => {
        try {
            setLoading(true);
            // Use Admin Paginated Endpoint
            const res = await axios.get(`${baseURL}/faqs/admin/list`, {
                params: { page, limit },
                ...getAuthHeaders()
            });

            if (res.data.success) {
                setFaqs(res.data.data?.items || []);
                setTotal(res.data.data?.total || 0);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await axios.get(`${baseURL}/faq-categories`);
            if (res.data.success) {
                setCategories(res.data.categories);
                if (res.data.categories.length > 0 && !formData.category) {
                    setFormData(prev => ({ ...prev, category: res.data.categories[0].slug }));
                }
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        if (activeTab === 'faqs') {
            fetchFaqs();
        } else {
            fetchCategories();
        }
    }, [page, limit, activeTab]);

    useEffect(() => {
        // Load categories initially for the dropdown in Modal
        fetchCategories();
    }, []);


    // --- FAQ Handlers ---
    const handleOpenModal = (faq: FAQ | null = null) => {
        if (faq) {
            setEditingFaq(faq);
            setFormData({
                category: faq.category,
                question: faq.question,
                answer: faq.answer,
                order: faq.order,
                isActive: faq.isActive,
            });
        } else {
            setEditingFaq(null);
            setFormData({
                category: categories.length > 0 ? categories[0].slug : '',
                question: '',
                answer: '',
                order: total + 1, // Suggest next order
                isActive: true,
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.question.trim() || !formData.answer.trim()) {
            Swal.fire('Lỗi', 'Vui lòng nhập câu hỏi và câu trả lời', 'error');
            return;
        }

        try {
            if (editingFaq) {
                await axios.put(`${baseURL}/faqs/${editingFaq._id}`, formData, getAuthHeaders());
                Swal.fire({ title: 'Thành công', text: 'Đã cập nhật câu hỏi', icon: 'success', timer: 1500, showConfirmButton: false });
            } else {
                await axios.post(`${baseURL}/faqs`, formData, getAuthHeaders());
                Swal.fire({ title: 'Thành công', text: 'Đã thêm câu hỏi mới', icon: 'success', timer: 1500, showConfirmButton: false });
            }
            setShowModal(false);
            fetchFaqs();
        } catch (error) {
            Swal.fire('Lỗi', 'Có lỗi xảy ra', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        const result = await Swal.fire({
            title: 'Xóa câu hỏi?', text: "Không thể hoàn tác!", icon: 'warning', showCancelButton: true,
            confirmButtonColor: '#ef4444', cancelButtonColor: '#4b5563', confirmButtonText: 'Xóa', cancelButtonText: 'Hủy'
        });
        if (result.isConfirmed) {
            try {
                await axios.delete(`${baseURL}/faqs/${id}`, getAuthHeaders());
                Swal.fire({ title: 'Đã xóa!', icon: 'success', timer: 1500, showConfirmButton: false });
                fetchFaqs();
            } catch (error) {
                Swal.fire('Lỗi', 'Không thể xóa', 'error');
            }
        }
    };

    // --- Category Handlers ---
    const handleOpenCategoryModal = (cat: Category | null = null) => {
        if (cat) {
            setCategoryForm({ ...cat });
        } else {
            setCategoryForm({
                _id: '',
                name: '',
                slug: '',
                order: categories.length + 1,
                color: 'bg-gray-800 text-gray-300 border-gray-700',
                isActive: true
            });
        }
        setShowCategoryModal(true);
    };

    const handleCategorySubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const name = categoryForm.name.trim();
        const slug = categoryForm.slug.trim();

        if (!name || !slug) {
            Swal.fire('Lỗi', 'Vui lòng nhập tên danh mục và slug', 'error');
            return;
        }

        try {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { _id, ...payload } = { ...categoryForm, name, slug };

            if (categoryForm._id) {
                await axios.put(`${baseURL}/faq-categories/${categoryForm._id}`, payload, getAuthHeaders());
                Swal.fire({ title: 'Thành công', text: 'Đã cập nhật danh mục', icon: 'success', timer: 1500, showConfirmButton: false });
            } else {
                await axios.post(`${baseURL}/faq-categories`, payload, getAuthHeaders());
                Swal.fire({ title: 'Thành công', text: 'Đã thêm danh mục mới', icon: 'success', timer: 1500, showConfirmButton: false });
            }
            setShowCategoryModal(false);
            fetchCategories();
        } catch (error: any) {
            Swal.fire('Lỗi', error.response?.data?.message || 'Có lỗi xảy ra', 'error');
        }
    };

    const handleDeleteCategory = async (id: string) => {
        const result = await Swal.fire({
            title: 'Xóa danh mục?', text: "Không thể hoàn tác!", icon: 'warning', showCancelButton: true,
            confirmButtonColor: '#ef4444', cancelButtonColor: '#4b5563', confirmButtonText: 'Xóa', cancelButtonText: 'Hủy'
        });
        if (result.isConfirmed) {
            try {
                await axios.delete(`${baseURL}/faq-categories/${id}`, getAuthHeaders());
                Swal.fire({ title: 'Đã xóa!', icon: 'success', timer: 1500, showConfirmButton: false });
                fetchCategories();
            } catch (error) {
                Swal.fire('Lỗi', 'Không thể xóa', 'error');
            }
        }
    };

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="admin-container">
            {/* Header with Tabs */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                <div>
                    <h1 className="admin-title !mb-2">Trung tâm trợ giúp</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Quản lý các câu hỏi thường gặp và danh mục</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex space-x-1 bg-white dark:bg-slate-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
                        <button
                            onClick={() => { setActiveTab('faqs'); setPage(1); }}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'faqs' ? 'bg-blue-600 text-white shadow' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'}`}
                        >
                            Câu hỏi thường gặp
                        </button>
                        <button
                            onClick={() => setActiveTab('categories')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'categories' ? 'bg-blue-600 text-white shadow' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'}`}
                        >
                            Danh mục câu hỏi
                        </button>
                    </div>

                    <button
                        onClick={() => activeTab === 'faqs' ? handleOpenModal() : handleOpenCategoryModal()}
                        className="admin-button success"
                    >
                        <span className="flex items-center gap-2">
                            {activeTab === 'faqs' ? '+ Thêm câu hỏi' : '+ Thêm danh mục'}
                        </span>
                    </button>
                </div>
            </div>

            <div className="admin-table-wrapper">
                {loading ? (
                    <div className="p-12 flex flex-col items-center justify-center space-y-4">
                        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-gray-400 font-medium">Đang tải dữ liệu...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        {activeTab === 'faqs' ? (
                            <>
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Danh mục</th>
                                            <th className="w-1/3">Câu hỏi</th>
                                            <th className="text-center">Thứ tự</th>
                                            <th className="text-center">Trạng thái</th>
                                            <th className="text-right">Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {faqs.map((faq) => {
                                            const cat = categories.find(c => c.slug === faq.category);
                                            return (
                                                <tr key={faq._id}>
                                                    <td>
                                                        <span className="admin-badge info">
                                                            {cat?.name || faq.category}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="font-semibold line-clamp-2">{faq.question}</div>
                                                    </td>
                                                    <td className="text-center font-mono">{faq.order}</td>
                                                    <td className="text-center">
                                                        <span className={`admin-badge ${faq.isActive ? 'success' : 'secondary'}`}>
                                                            {faq.isActive ? 'Hiện' : 'Ẩn'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="admin-actions justify-end">
                                                            <button
                                                                onClick={() => handleOpenModal(faq)}
                                                                className="admin-button sm"
                                                                title="Sửa"
                                                            >
                                                                Sửa
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(faq._id)}
                                                                className="admin-button danger sm"
                                                                title="Xóa"
                                                            >
                                                                Xóa
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>

                                {/* Pagination for FAQs */}
                                <div className="admin-pagination">
                                    <button
                                        className="admin-button secondary sm"
                                        disabled={page <= 1}
                                        onClick={() => setPage(page - 1)}
                                    >
                                        ← Trước
                                    </button>
                                    <span className="page-info">
                                        Trang {page} / {totalPages || 1} • Tổng {total} câu hỏi
                                    </span>
                                    <button
                                        className="admin-button sm"
                                        disabled={(page * limit) >= total}
                                        onClick={() => setPage(page + 1)}
                                    >
                                        Sau →
                                    </button>
                                </div>
                            </>
                        ) : (
                            // CATEGORIES TABLE (No pagination needed usually for categories unless many)
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Tên danh mục</th>
                                        <th>Slug</th>
                                        <th className="text-center">Thứ tự</th>
                                        <th className="text-right">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {categories.map((cat) => (
                                        <tr key={cat._id}>
                                            <td className="font-semibold">{cat.name}</td>
                                            <td className="font-mono text-sm text-gray-500">{cat.slug}</td>
                                            <td className="text-center">{cat.order}</td>
                                            <td>
                                                <div className="admin-actions justify-end">
                                                    <button
                                                        onClick={() => handleOpenCategoryModal(cat)}
                                                        className="admin-button sm"
                                                        title="Sửa"
                                                    >
                                                        Sửa
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteCategory(cat._id)}
                                                        className="admin-button danger sm"
                                                        title="Xóa"
                                                    >
                                                        Xóa
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                        {!loading && ((activeTab === 'faqs' && faqs.length === 0) || (activeTab === 'categories' && categories.length === 0)) && (
                            <div className="p-16 text-center text-gray-500">
                                <p>Chưa có dữ liệu.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* FAQ MODAL */}
            {showModal && (
                <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="admin-modal dark:bg-[#1e293b] dark:border-slate-700" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-modal-header dark:border-slate-700">
                            <h2>{editingFaq ? 'Sửa câu hỏi' : 'Thêm câu hỏi mới'}</h2>
                            <button className="admin-modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="admin-modal-body">
                                <div className="form-group">
                                    <label className="form-label">Danh mục</label>
                                    <select className="admin-select"
                                        value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                        {categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Câu hỏi</label>
                                    <input type="text" required className="admin-input"
                                        value={formData.question} onChange={e => setFormData({ ...formData, question: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Trả lời</label>
                                    <textarea rows={10} required className="admin-input !h-96 py-2"
                                        value={formData.answer} onChange={e => setFormData({ ...formData, answer: e.target.value })}></textarea>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="form-group">
                                        <label className="form-label">Thứ tự</label>
                                        <input type="number" className="admin-input"
                                            value={formData.order} onChange={e => setFormData({ ...formData, order: parseInt(e.target.value) })} />
                                    </div>
                                    <div className="form-group flex items-end pb-3">
                                        <label className="admin-checkbox">
                                            <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} />
                                            <span>Hiển thị</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className="admin-modal-footer dark:border-slate-700">
                                <button type="button" onClick={() => setShowModal(false)} className="admin-button secondary">Huỷ</button>
                                <button type="submit" className="admin-button success">Lưu</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* CATEGORY MODAL */}
            {showCategoryModal && (
                <div className="admin-modal-overlay" onClick={() => setShowCategoryModal(false)}>
                    <div className="admin-modal dark:bg-[#1e293b] dark:border-slate-700" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-modal-header dark:border-slate-700">
                            <h2>{categoryForm._id ? 'Sửa danh mục' : 'Thêm danh mục'}</h2>
                            <button className="admin-modal-close" onClick={() => setShowCategoryModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleCategorySubmit}>
                            <div className="admin-modal-body">
                                <div className="form-group">
                                    <label className="form-label">Tên danh mục</label>
                                    <input type="text" required className="admin-input"
                                        value={categoryForm.name}
                                        onChange={e => {
                                            const name = e.target.value;
                                            const slug = name.toLowerCase()
                                                .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                                                .replace(/[đĐ]/g, "d")
                                                .replace(/([^0-9a-z-\s])/g, "")
                                                .replace(/(\s+)/g, "-")
                                                .replace(/^-+|-+$/g, "");
                                            setCategoryForm({ ...categoryForm, name, slug });
                                        }} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Slug (Mã định danh)</label>
                                    <input type="text" required className="admin-input font-mono"
                                        placeholder="tu-dong-tao-tu-ten"
                                        value={categoryForm.slug}
                                        onChange={e => setCategoryForm({ ...categoryForm, slug: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Thứ tự</label>
                                    <input type="number" className="admin-input"
                                        value={categoryForm.order} onChange={e => setCategoryForm({ ...categoryForm, order: parseInt(e.target.value) })} />
                                </div>
                            </div>
                            <div className="admin-modal-footer dark:border-slate-700">
                                <button type="button" onClick={() => setShowCategoryModal(false)} className="admin-button secondary">Huỷ</button>
                                <button type="submit" className="admin-button success">Lưu</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Styles */}
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
              max-width: 600px;
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
              color: var(--foreground);
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
          `}</style>
        </div>
    );
}
