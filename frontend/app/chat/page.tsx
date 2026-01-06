'use client';

import React, { useState, useEffect, useRef } from 'react';
import io, { Socket } from 'socket.io-client';
import Swal from 'sweetalert2';

interface Message {
  from: 'user' | 'bot' | 'admin';
  message: string;
  timestamp: string | Date;
}

interface ChatSession {
  userId: string;
  name: string;
  lastMessage?: string; // Optional: to show preview
  unread?: number;
}

export default function AdminChatPage() {
  const [activeChats, setActiveChats] = useState<ChatSession[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [reply, setReply] = useState('');
  const socket = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Connect directly to User Backend Socket (Port 5000) where users are connected
    socket.current = io('http://localhost:5000');
    socket.current.emit('admin_join_chat');

    socket.current.on('active_chats_summary', (summaries: any[]) => {
      const mapped = summaries.map(s => ({
        userId: s.userId,
        name: s.name || 'Khách hàng',
        lastMessage: s.lastMessage,
        unread: s.unread,
        timestamp: s.timestamp
      }));
      setActiveChats(mapped);
    });

    socket.current.on('chat_history', (data: { userId: string, history: any[] }) => {
      setMessages(prev => ({
        ...prev,
        [data.userId]: data.history.map(h => ({
          from: h.from,
          message: h.message,
          timestamp: h.createdAt
        }))
      }));
    });

    socket.current.on('new_chat_request', (data: ChatSession) => {
      setActiveChats((prev) => {
        // ... logic
        const exists = prev.find(c => c.userId === data.userId);
        if (exists) return prev;
        return [{ ...data, unread: 1 }, ...prev];
      });
      // messages update handled by chat_history request usually, or empty
    });

    socket.current.on('receive_message', (data: { userId: string; message: string; from: 'user' | 'bot' | 'admin'; name?: string; timestamp?: string }) => {
      const { userId, message, from, timestamp } = data;

      // Ignore own messages to prevent duplication with optimistic UI
      if (from === 'admin' || from === 'bot') return;

      if (from === 'user') {
        setActiveChats((prev) => {
          const existing = prev.find((c) => c.userId === userId);
          if (existing) {
            return [
              { ...existing, lastMessage: message, unread: (userId !== selectedChat ? (existing.unread || 0) + 1 : 0) },
              ...prev.filter(c => c.userId !== userId)
            ]
          }
          // For new user message, name might be missing if relying solely on this event.
          // Use provided name or default.
          return [{ userId, name: data.name || 'Khách mới', lastMessage: message, unread: 1 }, ...prev];
        });
      }

      setMessages((prev) => {
        const chatMsgs = prev[userId] || [];
        return {
          ...prev,
          [userId]: [...chatMsgs, { from, message, timestamp: timestamp || new Date() }],
        };
      });
    });

    return () => {
      if (socket.current) socket.current.disconnect();
    };
  }, [selectedChat]);

  // Request history when selecting chat
  useEffect(() => {
    if (selectedChat && socket.current) {
      // Request history
      socket.current.emit('admin_request_history', { userId: selectedChat });

      // Mark as read in DB
      socket.current.emit('mark_as_read', { userId: selectedChat });

      // Optimistically update UI to remove badge
      setActiveChats(prev => prev.map(c =>
        c.userId === selectedChat ? { ...c, unread: 0 } : c
      ));
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedChat]);

  const handleDeleteChat = async (userId: string) => {
    if (!socket.current) return;

    const result = await Swal.fire({
      title: 'Xóa cuộc trò chuyện?',
      text: "Hành động này sẽ xóa toàn bộ tin nhắn với người dùng này.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#4b5563',
      confirmButtonText: 'Xóa ngay',
      cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
      socket.current.emit('delete_chat', { userId });
      Swal.fire({
        title: 'Đã xóa!',
        text: 'Cuộc trò chuyện đã được xóa.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
    }
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim() || !selectedChat || !socket.current) return;

    socket.current.emit('admin_reply', { userId: selectedChat, message: reply });

    setMessages((prev) => ({
      ...prev,
      [selectedChat]: [
        ...(prev[selectedChat] || []),
        { from: 'bot', message: reply, timestamp: new Date() },
      ],
    }));
    setReply('');
  };

  const getInitials = (name: string) => name.charAt(0).toUpperCase();

  return (
    <div className="admin-container h-[calc(100vh-20px)] animate-in fade-in duration-500 flex flex-col">
      <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">

        {/* Sidebar - Dark Theme */}
        <div className="md:w-80 bg-[#1e293b] rounded-2xl shadow-xl shadow-black/20 border border-gray-700 flex flex-col overflow-hidden transition-all duration-300">
          <div className="p-5 border-b border-gray-700 bg-[#1e293b]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-white text-lg">Tin nhắn</h2>
              <span className="bg-blue-900/50 text-blue-300 text-xs font-semibold px-2.5 py-1 rounded-full border border-blue-800">
                {activeChats.length}
              </span>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm..."
                className="w-full pl-9 pr-4 py-2 bg-[#0f172a] border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm text-gray-200 placeholder-gray-500"
              />
              <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 bg-[#1e293b]">
            {activeChats.length === 0 && (
              <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mb-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                </div>
                <p className="text-sm">Chưa có tin nhắn</p>
              </div>
            )}

            <div className="space-y-1">
              {activeChats.map((chat) => (
                <div
                  key={chat.userId}
                  onClick={() => setSelectedChat(chat.userId)}
                  className={`group p-3 rounded-xl cursor-pointer transition-all duration-200 border border-transparent relative flex items-center justify-between pr-2 ${selectedChat === chat.userId
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                    : 'hover:bg-[#334155] text-gray-300 hover:text-white'
                    }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border-2 ${selectedChat === chat.userId ? 'bg-white/20 border-white/10 text-white' : 'bg-gradient-to-br from-gray-700 to-gray-600 border-gray-500 text-gray-200'
                      }`}>
                      {getInitials(chat.name || 'Guest')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <span className={`font-semibold truncate text-sm block ${selectedChat === chat.userId ? 'text-white' : 'text-gray-200'}`}>{chat.name || 'Khách hàng'}</span>
                      </div>
                      <div className={`text-xs truncate mt-0.5 ${selectedChat === chat.userId ? 'text-blue-200' : 'text-gray-400'}`}>
                        {chat.lastMessage || `ID: ${chat.userId.substring(0, 8)}...`}
                      </div>
                    </div>
                  </div>

                  {/* Unread Badge or Delete Button */}
                  <div className="flex items-center gap-2">
                    {(chat.unread || 0) > 0 && selectedChat !== chat.userId && (
                      <div className="w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-[#1e293b] animate-pulse"></div>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteChat(chat.userId);
                      }}
                      className={`p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 ${selectedChat === chat.userId
                        ? 'text-blue-100 hover:bg-blue-500 hover:text-white'
                        : 'text-gray-400 hover:bg-red-500/20 hover:text-red-400'
                        }`}
                      title="Xóa cuộc trò chuyện"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Area - Dark Theme */}
        <div className="flex-1 bg-[#1e293b] rounded-2xl shadow-xl shadow-black/20 border border-gray-700 flex flex-col overflow-hidden relative">
          {selectedChat ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-gray-700 bg-[#1e293b] flex justify-between items-center z-10 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 p-[2px]">
                    <div className="w-full h-full bg-[#0f172a] rounded-full flex items-center justify-center">
                      <span className="font-bold text-transparent bg-clip-text bg-gradient-to-tr from-blue-400 to-indigo-400">
                        {getInitials(activeChats.find(c => c.userId === selectedChat)?.name || 'G')}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{activeChats.find(c => c.userId === selectedChat)?.name || 'Khách hàng'}</h3>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      <span className="text-xs text-green-400 font-medium">Đang trực tuyến</span>
                    </div>
                  </div>
                </div>
                {/* Actions */}
                <div className="flex gap-2">
                  <button className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-900/20 rounded-lg transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </button>
                  <button className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#0f172a]">
                <div className="flex justify-center">
                  <span className="text-xs font-medium text-gray-400 bg-gray-800/80 px-3 py-1 rounded-full border border-gray-700">Bắt đầu cuộc trò chuyện</span>
                </div>

                {(messages[selectedChat] || []).map((msg, idx) => {
                  const isAdmin = msg.from === 'bot' || msg.from === 'admin';
                  return (
                    <div key={idx} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'} group animate-in slide-in-from-bottom-2 duration-300`}>
                      <div className={`flex flex-col max-w-[70%] ${isAdmin ? 'items-end' : 'items-start'}`}>
                        <div
                          className={`px-5 py-3 shadow-sm text-[15px] leading-relaxed relative ${isAdmin
                            ? 'bg-blue-600 text-white rounded-2xl rounded-br-none'
                            : 'bg-[#334155] text-gray-100 border border-gray-600/50 shadow-black/10 rounded-2xl rounded-bl-none'
                            }`}
                        >
                          {msg.message}
                        </div>
                        <span className={`text-[10px] mt-1.5 px-1 opacity-0 group-hover:opacity-100 transition-opacity ${isAdmin ? 'text-gray-500' : 'text-gray-500'}`}>
                          {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 bg-[#1e293b] border-t border-gray-700">
                <form onSubmit={handleSendReply} className="flex gap-3 items-end bg-[#0f172a] p-1.5 rounded-2xl border border-gray-700 transition-colors focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/20">
                  <button type="button" className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded-xl transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                  </button>
                  <input
                    type="text"
                    className="flex-1 bg-transparent border-none focus:ring-0 text-gray-200 placeholder-gray-500 py-2.5 max-h-32"
                    placeholder="Nhập tin nhắn..."
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={!reply.trim()}
                    className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:shadow-none transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    <svg className="w-5 h-5 translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8 space-y-4 bg-[#0f172a]">
              <div className="w-32 h-32 bg-[#1e293b] rounded-full flex items-center justify-center animate-pulse border border-gray-700">
                <svg className="w-16 h-16 text-blue-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-300">Trợ lý khách hàng</h3>
                <p className="text-sm text-gray-500 mt-2">Chọn một khách hàng từ danh sách để bắt đầu hỗ trợ.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
