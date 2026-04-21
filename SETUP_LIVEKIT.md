# 🔧 HƯỚNG DẪN CÀI ĐẶT LIVEKIT (BẮT BUỘC)

## ❌ LỖI HIỆN TẠI

```
[ROOM] Token error: Server configuration error
Failed to load resource: the server responded with a status of 500
```

**Nguyên nhân:** Thiếu cấu hình LiveKit API credentials

---

## ✅ GIẢI PHÁP: CẤU HÌNH LIVEKIT CLOUD (MIỄN PHÍ)

### Bước 1: Đăng ký LiveKit Cloud (2 phút)

1. Truy cập: **https://cloud.livekit.io**
2. Click **"Sign Up"** (góc phải trên)
3. Đăng ký bằng:
   - Email + Password
   - Hoặc Google Account
   - Hoặc GitHub Account
4. Xác thực email (check inbox)

---

### Bước 2: Tạo Project (1 phút)

1. Sau khi đăng nhập, click **"Create Project"**
2. Nhập tên project: `edu-insight-meet` (hoặc tên bạn thích)
3. Chọn region gần nhất:
   - **Singapore** (tốt nhất cho Việt Nam)
   - Hoặc **Tokyo**
   - Hoặc **US-West**
4. Click **"Create"**

---

### Bước 3: Lấy API Credentials (1 phút)

1. Trong project dashboard, tìm phần **"API Keys"** hoặc **"Settings"**
2. Bạn sẽ thấy 3 thông tin:

```
API Key:        APIxxxxxxxxxxxxxxxx
API Secret:     xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
WebSocket URL:  wss://your-project-name.livekit.cloud
```

3. **Copy cả 3 giá trị này**

---

### Bước 4: Cập nhật file `.env.local` (1 phút)

1. Mở file **`Final_Edu/.env.local`** (đã tạo sẵn)
2. Thay thế các giá trị:

```env
# Thay thế bằng giá trị thực từ LiveKit Cloud
LIVEKIT_API_KEY=APIxxxxxxxxxxxxxxxx
LIVEKIT_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_LIVEKIT_URL=wss://your-project-name.livekit.cloud
```

**Ví dụ thực tế:**
```env
LIVEKIT_API_KEY=APIabcd1234efgh5678
LIVEKIT_API_SECRET=Kz9x8y7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g
NEXT_PUBLIC_LIVEKIT_URL=wss://edu-insight-abc123.livekit.cloud
```

3. **Lưu file** (Ctrl+S)

---

### Bước 5: Khởi động lại server (30 giây)

1. **Dừng server hiện tại:**
   - Trong terminal: `Ctrl+C`

2. **Khởi động lại:**
   ```bash
   npm run dev
   ```

3. **Đợi server ready:**
   ```
   ✓ Ready in 1807ms
   ```

---

### Bước 6: Test lại (1 phút)

1. Mở browser: **http://localhost:3000**
2. Tạo meeting
3. Join meeting
4. Cho phép Camera/Mic

**Kết quả mong đợi:**
- ✅ Không còn lỗi "Token error"
- ✅ Video hiển thị
- ✅ AI badge hoạt động

---

## 🎁 GÓI MIỄN PHÍ LIVEKIT CLOUD

### Bạn được:
- ✅ **10,000 phút/tháng** miễn phí
- ✅ **Không cần thẻ tín dụng**
- ✅ **Không giới hạn số phòng**
- ✅ **Không giới hạn số người tham gia**
- ✅ **TURN servers** (cho NAT traversal)
- ✅ **Global edge network**
- ✅ **Recording** (nếu cần)

### Đủ cho:
- 200 buổi học x 50 phút
- Hoặc 100 buổi học x 100 phút
- Hoặc demo/test không giới hạn

---

## 🔍 KIỂM TRA CẤU HÌNH

### Cách 1: Kiểm tra file .env.local
```bash
# Mở file và xem
cat .env.local
```

**Phải thấy:**
```env
LIVEKIT_API_KEY=API... (không phải "your_api_key_here")
LIVEKIT_API_SECRET=... (không phải "your_api_secret_here")
NEXT_PUBLIC_LIVEKIT_URL=wss://... (không phải "your-project.livekit.cloud")
```

### Cách 2: Kiểm tra trong code
Mở DevTools Console, chạy:
```javascript
console.log(process.env.NEXT_PUBLIC_LIVEKIT_URL)
```

**Phải thấy:** `wss://your-actual-project.livekit.cloud`  
**KHÔNG phải:** `undefined` hoặc `wss://your-project.livekit.cloud`

---

## 🐛 TROUBLESHOOTING

### Lỗi 1: "Token error" vẫn còn sau khi cấu hình
**Nguyên nhân:** Server chưa restart  
**Fix:**
```bash
# Dừng server (Ctrl+C)
# Chạy lại
npm run dev
```

### Lỗi 2: "Invalid API Key"
**Nguyên nhân:** Copy sai API Key  
**Fix:**
- Vào LiveKit Cloud dashboard
- Copy lại API Key (chính xác)
- Paste vào .env.local
- Restart server

### Lỗi 3: "Invalid API Secret"
**Nguyên nhân:** Copy sai API Secret  
**Fix:**
- API Secret rất dài (~40-50 ký tự)
- Copy toàn bộ, không bỏ sót
- Không có khoảng trắng đầu/cuối

### Lỗi 4: "Connection failed"
**Nguyên nhân:** Sai WebSocket URL  
**Fix:**
- URL phải bắt đầu bằng `wss://`
- Không có `/` ở cuối
- Ví dụ đúng: `wss://my-project.livekit.cloud`
- Ví dụ sai: `https://my-project.livekit.cloud/`

### Lỗi 5: File .env.local không được load
**Nguyên nhân:** Tên file sai  
**Fix:**
- Phải là `.env.local` (có dấu chấm đầu)
- Không phải `.env` hoặc `env.local`
- Phải ở thư mục gốc `Final_Edu/`

---

## 📋 CHECKLIST

Trước khi test, đảm bảo:

- [ ] Đã đăng ký LiveKit Cloud
- [ ] Đã tạo project
- [ ] Đã copy API Key
- [ ] Đã copy API Secret
- [ ] Đã copy WebSocket URL
- [ ] Đã paste vào `.env.local`
- [ ] Đã lưu file
- [ ] Đã restart server
- [ ] Server hiển thị "✓ Ready"
- [ ] Không còn lỗi "Token error"

---

## 🎯 SAU KHI CẤU HÌNH XONG

Bạn có thể:
1. ✅ Tạo meeting
2. ✅ Join meeting
3. ✅ Video call HD
4. ✅ AI detection
5. ✅ Screen sharing
6. ✅ Recording (nếu cần)

---

## 💡 LƯU Ý BẢO MẬT

### ⚠️ QUAN TRỌNG:
- **KHÔNG** commit file `.env.local` lên Git
- **KHÔNG** chia sẻ API Key/Secret công khai
- **KHÔNG** đăng lên GitHub/GitLab
- File `.gitignore` đã được cấu hình để bỏ qua `.env.local`

### ✅ AN TOÀN:
- Chỉ lưu trên máy local
- Nếu cần chia sẻ, dùng `.env.example` (không có giá trị thật)
- Nếu bị lộ, regenerate API Key trên LiveKit dashboard

---

## 📞 HỖ TRỢ

### Nếu vẫn gặp vấn đề:

1. **Check logs:**
   - Mở DevTools Console
   - Tìm lỗi màu đỏ
   - Copy error message

2. **Check server logs:**
   - Xem terminal chạy `npm run dev`
   - Tìm lỗi

3. **LiveKit Documentation:**
   - https://docs.livekit.io
   - https://docs.livekit.io/realtime/quickstarts/nextjs/

4. **LiveKit Community:**
   - https://livekit.io/community

---

## 🎉 HOÀN TẤT

Sau khi cấu hình xong, bạn có thể:
- ✅ Test đầy đủ tính năng
- ✅ Demo cho cuộc thi
- ✅ Quay video demo
- ✅ Deploy lên Vercel (nếu cần)

---

**Thời gian tổng:** ~5 phút  
**Chi phí:** $0 (miễn phí)  
**Khó khăn:** ⭐ (rất dễ)

**Good luck! 🚀**

