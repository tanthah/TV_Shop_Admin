# TV Shop Admin

Trang quản trị (Admin Portal) cho hệ thống TV Shop.

##  Công Nghệ Sử Dụng

### Frontend (`/frontend`)
*   **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
*   **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
*   **State Management**: Redux Toolkit
*   **HTTP Client**: Axios
*   **UI Components**: React Hook Form, React Toastify, SweetAlert2, React ChartJS 2
*   **Real-time**: Socket.io Client

### Backend (`/backend`)
*   **Framework**: [NestJS 11](https://nestjs.com/)
*   **Database**: MongoDB (via Mongoose)
*   **Real-time**: Socket.io Gateway
*   **Authentication**: JWT, Passport
*   **Cloud Storage**: Cloudinary (cho ảnh sản phẩm, avatar)

##  Cài Đặt & Chạy Dự Án

### Yêu cầu tiên quyết
*   Node.js (v18 trở lên)
*   MongoDB (đang chạy cục bộ hoặc trên cloud)

### 1. Khởi chạy Backend (Port 5001)

```bash
cd backend
npm install

# Tạo file .env nếu chưa có (xem mẫu bên dưới)

# Chạy ở chế độ phát triển (Watch mode)
npm run start:dev
```

**Mẫu file `.env` cho Backend:**
```env
MONGO_URI=mongodb://localhost:27017/UTE_Shop
PORT=5001
JWT_SECRET=TV_SHOP_SECRET_KEY
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
ADMIN_FRONTEND_ORIGIN=http://localhost:3001
```

### 2. Khởi chạy Frontend (Port 3001)

```bash
cd frontend
npm install

# Tạo file .env.local
# NEXT_PUBLIC_ADMIN_API_BASE_URL=http://localhost:5001

# Chạy server development
npm run dev
```

Truy cập Admin Portal tại: [http://localhost:3001](http://localhost:3001)

##  Tính Năng Chính
*   **Dashboard**: Thống kê doanh thu, đơn hàng, khách hàng mới.
*   **Quản lý Sản phẩm**: Thêm, sửa, xóa, tìm kiếm, lọc sản phẩm.
*   **Quản lý Đơn hàng**: Xem chi tiết, cập nhật trạng thái đơn hàng (Mới, Đang giao, Hoàn tất...).
*   **Quản lý Người dùng**: Xem danh sách, chi tiết người dùng, khóa/mở khóa tài khoản.
*   **Quản lý Khuyến mãi**: Tạo mã giảm giá (Coupon).
*   **Chat Hỗ trợ**: Chat trực tiếp với khách hàng từ Admin Panel.
