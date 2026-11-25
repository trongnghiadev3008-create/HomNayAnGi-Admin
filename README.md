# 👑 Hôm Nay Ăn Gì? — Web Admin Dashboard

Trang quản trị Web Admin xây dựng bằng **React 18 + Vite + TypeScript + Tailwind CSS + Axios + Recharts**, thiết kế theo ngôn ngữ **Luxury Dark Mode (`#121212`, `#1E1E1E`) & Gold (`#D4AF37`)** đồng bộ với ứng dụng Android và kết nối trực tiếp tới Backend REST API (`https://homnayangi-backend.onrender.com/api`).

## ✨ Tính năng chính

1. **Đăng nhập Quản trị (`/login`):**
   - Gọi `POST /auth/login` trên `VITE_API_URL`, kiểm tra quyền `ADMIN`.
   - Lưu JWT vào `localStorage` (`token`) và tự động đính kèm header `Authorization: Bearer <token>` qua **Axios Request Interceptor**.
2. **Tổng quan Dashboard (`/dashboard`):**
   - Gọi `GET /admin/stats` hiển thị 4 thẻ KPI tổng quan (Tổng Món ăn, Tổng Hội viên, Tổng Lượt quay Gacha, Tổng Yêu thích).
   - Biểu đồ cột phân bổ 5 bậc độ hiếm chuẩn từ `THƯỜNG` → `HIẾM` → `SỬ THI` → `HUYỀN THOẠI` → `CỔ VẬT`, biểu đồ cơ cấu nhóm bữa ăn và Bảng xếp hạng Top món quay trúng nhiều nhất.
3. **Quản lý Món ăn (`/foods`):**
   - Bảng danh sách thực đơn từ `GET /foods` kèm tìm kiếm tiếng Việt (có dấu & không dấu), lọc theo nhóm bữa ăn, độ hiếm, món chay/mặn, sắp xếp và phân trang mượt mà.
   - Modal Thêm/Sửa món ăn (`POST /foods`, `PUT /foods/:id`).
   - Xác nhận Xóa món ăn (`DELETE /foods/:id`).
   - Modal **Import hàng loạt từ file `foods.json`** (chọn tệp từ máy tính hoặc nạp bộ 365 món chuẩn, tự động đối chiếu ID tránh trùng lặp).
4. **Quản lý Người dùng (`/users`):**
   - Hiển thị danh sách hội viên, vai trò, trạng thái liên kết và thống kê số lượt quay Gacha kèm nhật ký quay thưởng gần đây.

## 🌐 Biến môi trường (Vercel / Local)

Sao chép `.env.example` thành `.env` (hoặc khai báo trên Vercel Dashboard):

```env
VITE_API_URL=https://homnayangi-backend.onrender.com/api
```

## 🚀 Chạy dự án

```bash
# Cài đặt thư viện
npm install

# Kiểm tra build Production
npm run build

# Khởi chạy ở cổng 5173
npm run dev
```

- Tài khoản Admin mặc định (từ Backend Seed): `admin@homnayangi.vn` / `Admin@123`
