# Test guide — duy nhất

Đây là tài liệu test thống nhất. **Bỏ qua mọi guide cũ trong `docs/archive/`**.

---

## Setup 1 lần

```bash
cd Final_Edu
npm install
npm run dev    # chạy ở http://localhost:3010
```

Mở browser → `http://localhost:3010`.

---

## Tài khoản test có sẵn

Khi mở trang `/auth` lần đầu, 4 tài khoản được tự động seed vào localStorage. Click vào nút quick-fill là vào ngay (không cần gõ tay):

| Email | Mật khẩu | Vai trò |
|-------|----------|---------|
| `gv1@test.local` | `test1234` | Giáo viên |
| `gv2@test.local` | `test1234` | Giáo viên |
| `hs1@test.local` | `test1234` | Học sinh |
| `hs2@test.local` | `test1234` | Học sinh |

> Reset trạng thái: F12 → Application → Storage → **Clear site data** → reload.

---

## Test flow chuẩn (2 browser, 1 máy)

### Bước 1 — Giáo viên tạo phòng (Browser 1: Chrome)

1. Vào `http://localhost:3010` → tự redirect `/auth`
2. Click nút **👨‍🏫 Cô Lan** ở panel test → form tự fill
3. Click **Đăng nhập** → vào `/dashboard`
4. Click **➕ Tạo cuộc họp**
5. Hiện panel **"✅ Phòng đã sẵn sàng"** → click **📋 Copy** để copy link
6. Click **🚪 Vào phòng ngay** → cho phép camera/mic → vào phòng

### Bước 2 — Học sinh vào phòng (Browser 2: Edge / Chrome incognito)

1. Mở browser khác (KHÁC để 2 session độc lập)
2. **Paste link đã copy** vào address bar (dạng `http://localhost:3010/join/abc1234567`)
3. Trang prejoin hiện camera + ô **Tên của bạn**
4. Gõ `An` → click **🚀 Tham gia**
5. Vào phòng — không đăng ký, không gì hết

### Bước 3 — Kiểm tra trong phòng

| Quan sát | Kỳ vọng |
|----------|---------|
| Browser 1 thấy Browser 2 | Video tile của An xuất hiện |
| Khi An nói | Border xanh quanh video An (speaking indicator) |
| AI badge ở góc dưới-trái | Hiển thị label hiện tại (vd "Đang lắng nghe") |
| Cử động đầu (cúi/ngẩng/nghiêng) | Label đổi sau ~1 giây |
| Panel "Học sinh" góc trên-phải (chỉ teacher) | Hiện An với label real-time |
| Mất tập trung > 2 phút | Toast cảnh báo cho teacher |

### Bước 4 — History sau buổi học

1. Browser 1 (teacher) → click nút **📵 Rời phòng**
2. Sidebar → **📊 Lịch sử & Phân tích**
3. Phải thấy panel:
   - **💡 Insights**: peak focus, top distractions, best/least engaged
   - **📈 Biểu đồ tập trung theo thời gian**: chart SVG
   - **📜 Timeline hành vi**: list các transition
4. Click **📥 Xuất CSV** → tải về file CSV mở Excel được, có dấu tiếng Việt đúng

> Lưu ý: lịch sử chỉ giữ data của session vừa rồi (in-memory). Đóng browser = mất. Nếu muốn lưu, **xuất CSV trước khi rời phòng** hoặc trước khi đóng browser.

---

## Test mạng / 2 máy khác

Để test 2 máy ở 2 mạng khác nhau (ví dụ laptop wifi nhà + điện thoại 4G):

```bash
npx ngrok http 3010
```

Ngrok sẽ cho 1 URL public dạng `https://abc123.ngrok.io`. Dùng URL này thay `http://localhost:3010` trên cả 2 máy. Việc còn lại y hệt flow trên.

---

## Khi gặp lỗi — hỏi gì cho tôi

Nếu lỗi, gửi:

1. **Bước nào fail** (vd "Bước 2.4: click Tham gia → trắng màn hình")
2. **Console errors** (F12 → tab Console → screenshot)
3. **Network errors** (F12 → Network → request fail nào, status code)
4. **Dev server log** — tôi đọc trực tiếp được nếu bạn báo lỗi đang xảy ra

Đừng paste thuần text "không vào được" — luôn kèm context cụ thể.

---

## Reset hoàn toàn

Nếu cần reset từ đầu (test fresh state):

```
F12 → Application → Storage → Clear site data
```

Reload trang → seed lại tài khoản test → vào lại `/auth`.
