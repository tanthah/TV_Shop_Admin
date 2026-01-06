'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import Swal from 'sweetalert2';

export default function CommentsPage() {
  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // New States
  const [unreadCount, setUnreadCount] = useState(0);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // Detail State
  const [selectedComment, setSelectedComment] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [thread, setThread] = useState<any[]>([]);

  const baseURL = process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL || 'http://localhost:5001';

  const fetchComments = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${baseURL}/api/comments/admin/list`, {
        params: { page, limit, q, status },
        headers: { Authorization: `Bearer ${Cookies.get('admin_token') || ''}` },
      });
      setItems(res.data?.data?.items || []);
      setTotal(res.data?.data?.total || 0);

      // Also fetch unread count (metrics)
      fetchMetrics();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi tải bình luận');
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      const res = await axios.get(`${baseURL}/api/comments/metrics`, {
        headers: { Authorization: `Bearer ${Cookies.get('admin_token') || ''}` },
      });
      setUnreadCount(res.data?.data?.unread || 0);
    } catch (err) {
      console.error("Failed to fetch metrics", err);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchComments();

    // Optional: Poll every 30s for new comments
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, [page, limit, q, status]);

  const toggleReadStatus = async (id: string, value: boolean) => {
    try {
      await axios.patch(`${baseURL}/api/comments/${id}/read?value=${value}`, {}, {
        headers: { Authorization: `Bearer ${Cookies.get('admin_token') || ''}` },
      });
      fetchComments();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể cập nhật trạng thái');
    }
  };

  const toggleHide = async (id: string, value: boolean) => {
    try {
      await axios.patch(`${baseURL}/api/comments/${id}/hide?value=${value}`, {}, {
        headers: { Authorization: `Bearer ${Cookies.get('admin_token') || ''}` },
      });
      fetchComments();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể cập nhật');
    }
  };

  const removeComment = async (id: string) => {
    const result = await Swal.fire({
      title: 'Xóa bình luận này?',
      text: "Hành động này không thể hoàn tác!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#4b5563',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${baseURL}/api/comments/${id}`, {
          headers: { Authorization: `Bearer ${Cookies.get('admin_token') || ''}` },
        });
        Swal.fire({
          title: 'Đã xóa!',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
        fetchComments();
      } catch (err: any) {
        Swal.fire('Lỗi', err.response?.data?.message || 'Không thể xoá', 'error');
      }
    }
  };

  const handleReplySubmit = async () => {
    if (!replyingId || !replyContent.trim()) return;
    setSubmittingReply(true);
    try {
      await axios.post(`${baseURL}/api/comments/${replyingId}/reply`, { content: replyContent }, {
        headers: { Authorization: `Bearer ${Cookies.get('admin_token') || ''}` },
      });
      setReplyingId(null);
      setReplyContent('');
      fetchComments(); // Refresh list to show reply
    } catch (err: any) {
      alert('Lỗi gửi phản hồi: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmittingReply(false);
    }
  };

  const openReplyModal = (comment: any) => {
    setReplyingId(comment._id);
    setReplyContent(comment.adminReply?.content || '');
  };

  const handleViewDetail = async (comment: any) => {
    setSelectedComment(comment);
    setThread([]);
    setShowDetailModal(true);
    try {
      const res = await axios.get(`${baseURL}/api/comments/${comment._id}/thread`, {
        headers: { Authorization: `Bearer ${Cookies.get('admin_token') || ''}` },
      });
      setThread(res.data?.data || []);
    } catch (err) {
      console.error(err);
    }
  };


  if (!mounted) return null;

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="admin-container">
      {/* Page Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="admin-title" style={{ marginBottom: 8 }}>Quản lý bình luận</h1>
          <p className="text-muted">Duyệt và quản lý bình luận, đánh giá sản phẩm</p>
        </div>
        {unreadCount > 0 && (
          <div style={{
            backgroundColor: '#ef4444',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '20px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.4)'
          }}>
            <span style={{ fontSize: '1.2rem' }}></span>
            <span>{unreadCount} bình luận mới</span>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="admin-toolbar">
        <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: 200 }}>
          <label className="form-label" htmlFor="search">Tìm kiếm</label>
          <input
            id="search"
            className="admin-input"
            placeholder="Nhập nội dung bình luận..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0, minWidth: 160 }}>
          <label className="form-label" htmlFor="status">Trạng thái</label>
          <select id="status" className="admin-select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Tất cả</option>
            <option value="hidden">Đã ẩn</option>
            <option value="visible">Đang hiển thị</option>
          </select>
        </div>




      </div>

      {/* Error Alert */}
      {error && (
        <div className="admin-alert error">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Comments Table */}
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Sản phẩm</th>
              <th>Người dùng</th>
              <th>Nội dung bình luận</th>
              <th style={{ width: 120 }}>Trạng thái</th>
              <th style={{ width: 320 }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c._id}>
                <td>
                  <span style={{
                    fontWeight: 500,
                    color: 'var(--primary-600)'
                  }}>
                    {typeof c.productId === 'object' ? c.productId?.name : c.productId}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 500 }}>{typeof c.userId === 'object' ? c.userId?.name : 'User'}</span>
                    <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                      {typeof c.userId === 'object' ? c.userId?.email : c.userId}
                    </span>
                  </div>
                </td>
                <td>
                  <div style={{
                    maxWidth: 300,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {c.content}
                  </div>
                  {c.rating && (
                    <div style={{ marginTop: 4 }}>
                      {'⭐'.repeat(c.rating)}{'☆'.repeat(5 - c.rating)}
                    </div>
                  )}
                  {c.adminReply && (
                    <div style={{ marginTop: 6, fontSize: '0.85rem', color: '#059669', fontStyle: 'italic' }}>
                      ↪ Admin: {c.adminReply.content}
                    </div>
                  )}
                </td>
                <td>
                  <span className={`admin-badge ${c.isHidden ? 'danger' : 'success'}`} style={{ whiteSpace: 'nowrap' }}>
                    {c.isHidden ? 'Đã ẩn' : 'Hiển thị'}
                  </span>
                </td>
                <td>
                  <div className="admin-actions">
                    <button
                      className="admin-button info sm"
                      onClick={() => handleViewDetail(c)}
                      title="Xem chi tiết"
                    >
                      Chi tiết
                    </button>
                    <button
                      className="admin-button primary sm"
                      onClick={() => openReplyModal(c)}
                      title="Trả lời"
                    >
                      Reply
                    </button>
                    {!c.isRead ? (
                      <button
                        className="admin-button success sm"
                        onClick={() => toggleReadStatus(c._id, true)}
                        title="Đánh dấu đã đọc"
                      >
                        Đã đọc
                      </button>
                    ) : (
                      <button
                        className="admin-button warning sm"
                        onClick={() => toggleReadStatus(c._id, false)}
                        title="Đánh dấu chưa đọc"
                      >
                        Chưa đọc
                      </button>
                    )}
                    <button
                      className={`admin-button ${c.isHidden ? 'success' : 'warning'} sm`}
                      onClick={() => toggleHide(c._id, !c.isHidden)}
                      title={c.isHidden ? 'Hiện bình luận' : 'Ẩn bình luận'}
                    >
                      {c.isHidden ? 'Hiện' : 'Ẩn'}
                    </button>
                    <button
                      className="admin-button danger sm"
                      onClick={() => removeComment(c._id)}
                      title="Xoá bình luận"
                    >
                      Xoá
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!items.length && !loading && (
              <tr>
                <td colSpan={5}>
                  <div className="admin-empty">
                    <div className="admin-empty-icon">💬</div>
                    <div className="admin-empty-title">Không có bình luận</div>
                    <div className="admin-empty-text">Chưa có bình luận nào trong hệ thống</div>
                  </div>
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={5}>
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
          Trang {page} / {totalPages || 1} • Tổng {total} bình luận
        </span>
        <button
          className="admin-button sm"
          disabled={(page * limit) >= total}
          onClick={() => setPage(page + 1)}
        >
          Sau →
        </button>
      </div>

      {/* Reply Modal */}
      {replyingId && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#1e293b',
            padding: '24px',
            borderRadius: '12px',
            width: '500px',
            maxWidth: '90%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
            border: '1px solid #334155'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#f8fafc' }}>Trả lời bình luận</h3>
            <textarea
              style={{
                width: '100%',
                height: '120px',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #475569',
                resize: 'vertical',
                marginBottom: '16px',
                fontFamily: 'inherit',
                backgroundColor: '#0f172a',
                color: '#f8fafc'
              }}
              placeholder="Nhập nội dung trả lời..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                className="admin-button secondary"
                onClick={() => { setReplyingId(null); setReplyContent(''); }}
                disabled={submittingReply}
                style={{ backgroundColor: '#334155', color: 'white', border: 'none' }}
              >
                Huỷ
              </button>
              <button
                className="admin-button primary"
                onClick={handleReplySubmit}
                disabled={submittingReply || !replyContent.trim()}
              >
                {submittingReply ? 'Đang gửi...' : 'Gửi trả lời'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedComment && (
        <div className="admin-modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>Chi tiết bình luận</h2>
              <button className="admin-modal-close" onClick={() => setShowDetailModal(false)}>✕</button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-modal-body">
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Sản phẩm</h3>
                  <div>
                    <p className="font-medium text-gray-900">{selectedComment.productId?.name || 'Unknown Product'}</p>
                    <p className="text-sm text-gray-500">ID: {selectedComment.productId?._id}</p>
                  </div>
                </div>

                <hr className="my-6 border-gray-200" />

                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Cuộc hội thoại</h3>
                  <div className="flex flex-col gap-4">
                    {thread.map((comment, index) => (
                      <div key={comment._id} className={`p-4 rounded-lg border ${comment._id === selectedComment._id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-gray-50'}`}>
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            {comment.isAdmin ? (
                              <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">ADMIN</span>
                            ) : (
                              <span className="font-semibold text-gray-900">{comment.userId?.name || 'User'}</span>
                            )}
                            <span className="text-xs text-gray-500">• {new Date(comment.createdAt).toLocaleString('vi-VN')}</span>
                          </div>
                        </div>
                        <p className="text-gray-800 whitespace-pre-wrap">{comment.content}</p>
                        {comment.images && comment.images.length > 0 && (
                          <div className="flex gap-2 mt-3 overflow-x-auto">
                            {comment.images.map((img: string, idx: number) => (
                              <a key={idx} href={img} target="_blank" rel="noreferrer">
                                <img src={img} alt={`Img ${idx}`} className="w-20 h-20 object-cover rounded border border-gray-200" />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    {thread.length === 0 && <p className="text-center text-gray-500">Đang tải...</p>}
                  </div>
                </div>
              </div>
              <div className="admin-modal-footer">
                <button className="admin-button secondary" onClick={() => setShowDetailModal(false)}>Đóng</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .admin-modal-overlay {
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0, 0, 0, 0.5); display: flex; alignItems: center; justifyContent: center; zIndex: 1000; padding: 20px;
        }
        .admin-modal {
            background: white; borderRadius: 12px; width: 100%; maxWidth: 700px; maxHeight: 90vh; overflow: hidden; boxShadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        .admin-modal-header {
            display: flex; justifyContent: space-between; alignItems: center; padding: 20px 24px; borderBottom: 1px solid #e5e7eb;
        }
        .admin-modal-header h2 { margin: 0; fontSize: 18px; fontWeight: 600; color: #111827; }
        .admin-modal-close { background: none; border: none; fontSize: 20px; cursor: pointer; color: #9ca3af; padding: 4px 8px; borderRadius: 4px; }
        .admin-modal-close:hover { background: #f3f4f6; color: #4b5563; }
        .admin-modal-body { padding: 24px; maxHeight: 70vh; overflowY: auto; }
        .admin-modal-footer { display: flex; justifyContent: flex-end; gap: 12px; padding: 16px 24px; borderTop: 1px solid #e5e7eb; background: #f9fafb; }
      `}</style>
    </div>
  );
}
