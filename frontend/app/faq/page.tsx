'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

interface FAQ {
    _id: string;
    category: string;
    question: string;
    answer: string;
    order: number;
    isActive: boolean;
}

const CATEGORIES = [
    { value: 'shipping', label: 'Vận chuyển', color: 'bg-blue-900/50 text-blue-200 border border-blue-800' },
    { value: 'payment', label: 'Thanh toán', color: 'bg-green-900/50 text-green-200 border border-green-800' },
    { value: 'return', label: 'Đổi trả', color: 'bg-orange-900/50 text-orange-200 border border-orange-800' },
    { value: 'loyalty', label: 'Điểm thưởng', color: 'bg-purple-900/50 text-purple-200 border border-purple-800' },
    { value: 'account', label: 'Tài khoản', color: 'bg-cyan-900/50 text-cyan-200 border border-cyan-800' },
    { value: 'general', label: 'Chung', color: 'bg-gray-800 text-gray-300 border border-gray-700' },
];

export default function FAQPage() {
    const [faqs, setFaqs] = useState<FAQ[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        category: 'shipping',
        question: '',
        answer: '',
        order: 0,
        isActive: true,
    });

    const fetchFaqs = async () => {
        try {
            setLoading(true);
            const res = await axios.get('http://localhost:4001/faqs');
            if (res.data.success) {
                const grouped = res.data.faqs;
                let flatList: FAQ[] = [];
                Object.values(grouped).forEach((group: any) => {
                    flatList = [...flatList, ...group];
                });
                flatList.sort((a, b) => a.order - b.order);
                setFaqs(flatList);
            }
        } catch (error) {
            console.error(error);
            Swal.fire({
                title: 'Lỗi',
                text: 'Không thể tải danh sách câu hỏi',
                icon: 'error',
                confirmButtonColor: '#3085d6'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFaqs();
    }, []);

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
                category: 'shipping',
                question: '',
                answer: '',
                order: faqs.length + 1,
                isActive: true,
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingFaq) {
                await axios.put(`/faqs/${editingFaq._id}`, formData);
                Swal.fire({
                    title: 'Thành công',
                    text: 'Đã cập nhật câu hỏi',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false,
                    background: '#1f2937',
                    color: '#fff'
                });
            } else {
                await axios.post('/faqs', formData);
                Swal.fire({
                    title: 'Thành công',
                    text: 'Đã thêm câu hỏi mới',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false,
                    background: '#1f2937',
                    color: '#fff'
                });
            }
            setShowModal(false);
            fetchFaqs();
        } catch (error) {
            console.error(error);
            Swal.fire('Lỗi', 'Có lỗi xảy ra', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        const result = await Swal.fire({
            title: 'Xóa câu hỏi?',
            text: "Hành động này không thể hoàn tác!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#4b5563',
            confirmButtonText: 'Vâng, xóa đi',
            cancelButtonText: 'Hủy',
            background: '#1f2937',
            color: '#fff',
            customClass: {
                popup: 'rounded-2xl border border-gray-700',
                confirmButton: 'rounded-lg px-4 py-2',
                cancelButton: 'rounded-lg px-4 py-2'
            }
        });

        if (result.isConfirmed) {
            try {
                await axios.delete(`/faqs/${id}`);
                Swal.fire({
                    title: 'Đã xóa!',
                    text: 'Câu hỏi đã được xóa thành công.',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false,
                    background: '#1f2937',
                    color: '#fff'
                });
                fetchFaqs();
            } catch (error) {
                Swal.fire('Lỗi', 'Không thể xóa câu hỏi', 'error');
            }
        }
    };

    return (
        <div className="admin-container">
            {/* Page Header */}
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="admin-title" style={{ marginBottom: 8 }}>Quản lý FAQ</h1>
                    <p className="text-muted">Quản lý các câu hỏi thường gặp hiển thị trên trang chủ.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="admin-button primary"
                >
                    <span className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        Thêm câu hỏi
                    </span>
                </button>
            </div>

            <div className="bg-[#1e293b] rounded-2xl shadow-xl shadow-black/20 border border-gray-700 overflow-hidden">
                {loading ? (
                    <div className="p-12 flex flex-col items-center justify-center space-y-4">
                        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-gray-400 font-medium">Đang tải dữ liệu...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#0f172a]/50 border-b border-gray-700">
                                    <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Danh mục</th>
                                    <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider w-1/3">Câu hỏi</th>
                                    <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Thứ tự</th>
                                    <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Trạng thái</th>
                                    <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {faqs.map((faq) => {
                                    const catStyle = CATEGORIES.find(c => c.value === faq.category) || { label: faq.category, color: 'bg-gray-800 text-gray-300 border-gray-600' };
                                    return (
                                        <tr key={faq._id} className="hover:bg-[#334155]/30 transition-colors group">
                                            <td className="p-5">
                                                <span className={`px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm border ${catStyle.color}`}>
                                                    {catStyle.label}
                                                </span>
                                            </td>
                                            <td className="p-5">
                                                <div className="font-semibold text-gray-200 line-clamp-2">{faq.question}</div>
                                            </td>
                                            <td className="p-5 text-center">
                                                <span className="w-8 h-8 inline-flex items-center justify-center bg-[#334155] rounded-full text-sm font-bold text-gray-300">
                                                    {faq.order}
                                                </span>
                                            </td>
                                            <td className="p-5 text-center">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${faq.isActive
                                                        ? 'bg-green-900/30 text-green-400 border-green-800'
                                                        : 'bg-gray-800 text-gray-400 border-gray-700'
                                                        }`}
                                                >
                                                    <span className={`w-1.5 h-1.5 rounded-full ${faq.isActive ? 'bg-green-400' : 'bg-gray-500'}`}></span>
                                                    {faq.isActive ? 'Hiển thị' : 'Ẩn'}
                                                </span>
                                            </td>
                                            <td className="p-5 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleOpenModal(faq)}
                                                        className="p-2 text-blue-400 hover:bg-blue-900/30 rounded-lg transition-colors"
                                                        title="Chỉnh sửa"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(faq._id)}
                                                        className="p-2 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                                                        title="Xóa"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                                {faqs.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-16 text-center text-gray-500">
                                            <div className="flex flex-col items-center">
                                                <svg className="w-16 h-16 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                <p className="text-lg font-medium text-gray-400">Chưa có câu hỏi nào</p>
                                                <button onClick={() => handleOpenModal()} className="mt-4 text-blue-400 hover:underline">Thêm câu hỏi đầu tiên</button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* DARK THEME MODAL (Existing one was good, just minor adjustments if needed) */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-[#1e293b] rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-300 border border-gray-700">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center bg-[#1e293b]">
                            <h3 className="font-bold text-lg text-white">
                                {editingFaq ? 'Chỉnh sửa FAQ' : 'Thêm FAQ mới'}
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6 bg-[#1e293b]">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Danh mục <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <select
                                            className="w-full px-4 py-2.5 bg-[#334155] border border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-white appearance-none transition-all"
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        >
                                            {CATEGORIES.map((c) => (
                                                <option key={c.value} value={c.value} className="bg-[#1e293b] text-white">
                                                    {c.label}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Thứ tự hiển thị</label>
                                    <input
                                        type="number"
                                        className="w-full px-4 py-2.5 bg-[#334155] border border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-white placeholder-gray-400"
                                        value={formData.order}
                                        onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Câu hỏi <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Nhập câu hỏi..."
                                    className="w-full px-4 py-2.5 bg-[#334155] border border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-white placeholder-gray-400"
                                    value={formData.question}
                                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Câu trả lời <span className="text-red-500">*</span></label>
                                <textarea
                                    rows={5}
                                    required
                                    placeholder="Nhập nội dung trả lời..."
                                    className="w-full px-4 py-2.5 bg-[#334155] border border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-white placeholder-gray-400 resize-none"
                                    value={formData.answer}
                                    onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="w-4 h-4 rounded border-gray-600 bg-[#334155] text-blue-600 focus:ring-offset-[#1e293b]"
                                />
                                <label htmlFor="isActive" className="text-sm font-medium text-white select-none">Đang hiển thị</label>
                            </div>

                            <div className="pt-4 flex justify-end gap-3 border-t border-gray-700 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-6 py-2 text-gray-300 bg-[#334155] border border-gray-600 hover:bg-gray-700 font-medium rounded-lg transition-colors"
                                >
                                    Huỷ
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    {editingFaq ? 'Lưu thay đổi' : 'Tạo FAQ'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
