# OURFLIX ❤️ — Nền tảng xem phim cá nhân hóa cho Cặp đôi

Ứng dụng web xem phim trực tuyến phong cách Netflix Dark Mode cao cấp, thiết kế riêng cho cặp đôi **Trà My ❤️ Thiên Phát**. 

- **Chi phí vận hành:** 0 đồng (Chạy trên **Vercel Free Tier** + **Supabase Free Tier**).
- **Kho phim:** 24/7 tự động từ KKPhim API (`https://phimapi.com`) và OPhim API (`https://ophim1.com`).
- **Trải nghiệm:** 100% không quảng cáo, trình phát thuần `hls.js` phát luồng `.m3u8` gốc trực tiếp, không sử dụng `<iframe>` hay `link_embed`.
- **Đồng bộ thời gian thực:** Lịch sử xem dở xuyên thiết bị, Góc Couple, Kho của Em và chế độ **Xem chung thời gian thực (Watch Party)** qua Supabase Realtime WebSocket.

---

## 🚀 Hướng dẫn cài đặt & Khởi chạy nhanh

### 1. Cài đặt Dependencies
```bash
npm install
```

### 2. Thiết lập Database trên Supabase
1. Đăng ký/đăng nhập tài khoản miễn phí tại [supabase.com](https://supabase.com).
2. Tạo một dự án mới (New Project).
3. Mở mục **SQL Editor**, mở file [supabase/schema.sql](file:///Users/paradox/Downloads/Ourflix/supabase/schema.sql), sao chép toàn bộ nội dung và dán vào rồi bấm **Run**.
4. Vào **Project Settings -> API**, lấy 2 thông số:
   - `Project URL`
   - `anon / public API Key`

### 3. Cấu hình biến môi trường
Tạo file `.env.local` ở thư mục gốc (hoặc cấu hình Environment Variables trên Vercel):
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

### 4. Khởi chạy ở chế độ phát triển
```bash
npm run dev
```
Mở trình duyệt tại [http://localhost:3000](http://localhost:3000).

---

## 🔒 Mã PIN & Hồ sơ người xem
- **Mã PIN bảo mật riêng từng người:**
  - **Trà My** (Avatar màu đỏ `#E50914`): PIN **`2409`**
  - **Thiên Phát** (Avatar màu xanh `#2563EB`): PIN **`3009`**

---

## 🌟 Các tính năng nổi bật

1. **Cổng bảo mật PIN chuẩn Netflix:**
   - Khi vào trang web, hiển thị màn hình chọn Profile "Ai đang xem?".
   - Yêu cầu nhập đúng mã PIN 4 số (`2409`) mới mở khóa vào hệ thống và kết nối Supabase.
2. **Badge đếm ngày yêu & Lời nhắn ghim Hero Banner:**
   - Tự động tính số ngày yêu nhau từ trường `anniversary_date` trên Supabase.
   - Hộp lời nhắn cặp đôi ghim trực tiếp trên Hero Banner, có thể bấm vào chỉnh sửa nhanh và đồng bộ tức thì lên màn hình của người kia.
3. **Đồng bộ tiến độ xem dở ("Xem tiếp cùng nhau 🍿"):**
   - Mỗi 5 giây xem phim, trình phát tự động `upsert` thời gian xem lên bảng `watch_history` trên Supabase.
   - Khi mở lại, thẻ phim hiển thị thanh phần trăm màu đỏ, tên tập và người vừa xem. Bấm vào là phát tiếp ngay đúng giây đã lưu.
4. **Góc Couple 💖 & Kho của Em 🔖:**
   - Cho phép đính kèm lời nhắn yêu thương khi thêm phim.
   - Danh sách đồng bộ Realtime hai chiều tức thì.
5. **Trình phát `.m3u8` chất lượng cao & Chế độ Xem chung (Watch Party):**
   - Tự xây dựng trên `hls.js` và Safari native HLS.
   - Nút bật/tắt **`👩‍❤️‍👨 Xem chung Realtime`**: Khi bật, các thao tác Play, Pause, Tua video (Seek) hoặc Chuyển tập được truyền qua Supabase Broadcast Channel (`room:ourflix-watch-party`), giúp 2 người ở xa xem cùng một nhịp với độ trễ tính bằng mili-giây!
   - Nút **`Đổi Server Dự Phòng (OPhim)`** phòng khi luồng KKPhim bị nghẽn.
