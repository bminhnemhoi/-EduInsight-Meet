# ⚡ QUICK FIX - Lỗi "Token error"

## 🔴 LỖI

```
[ROOM] Token error: Server configuration error
api/meet/token: 500 (Internal Server Error)
```

---

## ✅ NGUYÊN NHÂN

**Thiếu cấu hình LiveKit API credentials**

---

## 🚀 GIẢI PHÁP (5 PHÚT)

### 1. Đăng ký LiveKit Cloud (MIỄN PHÍ)
👉 https://cloud.livekit.io

### 2. Tạo project mới
- Tên: `edu-insight-meet`
- Region: **Singapore** (tốt nhất cho VN)

### 3. Copy 3 giá trị:
```
API Key:        APIxxxxxxxx
API Secret:     xxxxxxxxxxxxxxxx
WebSocket URL:  wss://your-project.livekit.cloud
```

### 4. Mở file `.env.local` và thay thế:
```env
LIVEKIT_API_KEY=APIxxxxxxxx
LIVEKIT_API_SECRET=xxxxxxxxxxxxxxxx
NEXT_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud
```

### 5. Restart server:
```bash
# Dừng server (Ctrl+C)
npm run dev
```

### 6. Test lại:
👉 http://localhost:3000

---

## ✅ KẾT QUẢ

- ✅ Không còn lỗi "Token error"
- ✅ Video call hoạt động
- ✅ AI detection hoạt động

---

## 📄 CHI TIẾT

Xem file **`SETUP_LIVEKIT.md`** để biết hướng dẫn chi tiết.

---

**Thời gian:** 5 phút  
**Chi phí:** $0 (miễn phí 10,000 phút/tháng)

