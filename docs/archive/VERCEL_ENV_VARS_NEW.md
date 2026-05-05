# 🔑 ENVIRONMENT VARIABLES MỚI - VERCEL

## ✅ API KEYS ĐÃ CẬP NHẬT!

Bạn đã dán API keys mới. Đây là thông tin cần add vào Vercel:

---

## 🎯 ADD VÀO VERCEL NGAY

### Bước 1: Vào Vercel Environment Variables
Link: https://vercel.com/bminhnemhois-projects/eduinsight-meet/settings/environment-variables

### Bước 2: Xóa biến cũ (nếu có)
- Xóa `LIVEKIT_API_KEY` cũ
- Xóa `LIVEKIT_API_SECRET` cũ
- Xóa `NEXT_PUBLIC_LIVEKIT_URL` cũ

### Bước 3: Add 3 biến MỚI

**Biến 1:**
```
Key: LIVEKIT_API_KEY
Value: APIxovbb867DpkY
Environment: Production, Preview, Development (chọn cả 3)
```

**Biến 2:**
```
Key: LIVEKIT_API_SECRET
Value: 1xtmzqsI3KC6dFDV0NI0pVpAoVGMO3faSGUi8ePh8GP
Environment: Production, Preview, Development (chọn cả 3)
```

**Biến 3:**
```
Key: NEXT_PUBLIC_LIVEKIT_URL
Value: wss://eduinsight-9divqm70.livekit.cloud
Environment: Production, Preview, Development (chọn cả 3)
```

### Bước 4: Redeploy
1. Vào: https://vercel.com/bminhnemhois-projects/eduinsight-meet
2. Click tab "Deployments"
3. Click "..." trên deployment mới nhất
4. Click "Redeploy"
5. ✅ DONE!

---

## 📋 COPY-PASTE NHANH

Để copy nhanh, dùng format này:

```
LIVEKIT_API_KEY=APIxovbb867DpkY
LIVEKIT_API_SECRET=1xtmzqsI3KC6dFDV0NI0pVpAoVGMO3faSGUi8ePh8GP
NEXT_PUBLIC_LIVEKIT_URL=wss://eduinsight-9divqm70.livekit.cloud
```

---

## 🌐 URL SAU KHI DEPLOY

```
https://eduinsight-meet.vercel.app
```

hoặc

```
https://eduinsight-meet-xxxxx.vercel.app
```

---

## 🧪 TEST NGAY

### Test 1: Mở URL
Vào URL Vercel

### Test 2: Tạo Meeting
1. Click "Tạo cuộc họp mới"
2. Copy mã phòng

### Test 3: Join từ máy khác
1. Mở URL trên điện thoại (4G)
2. Nhập mã phòng
3. ✅ Thấy nhau = SUCCESS!

---

## ✅ CHECKLIST

- [x] API keys mới đã được cập nhật
- [x] Code đã push lên GitHub
- [ ] Add 3 env vars vào Vercel (BẠN LÀM)
- [ ] Redeploy (BẠN LÀM)
- [ ] Test URL hoạt động

---

**🎉 Chỉ còn 2 phút nữa là xong!**

**Làm ngay:** https://vercel.com/bminhnemhois-projects/eduinsight-meet/settings/environment-variables
