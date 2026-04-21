# 🚀 DEPLOY NGAY - 5 PHÚT

## ✅ DỰ ÁN ĐÃ SẴN SÀNG!

Dự án của bạn **ĐÃ ĐỦ DÙNG** và có thể deploy ngay!

---

## 🎯 CÁCH NHANH NHẤT: VERCEL DASHBOARD

### Bước 1: Đăng ký Vercel (1 phút)
1. Mở trình duyệt
2. Vào: **https://vercel.com/signup**
3. Click "Continue with GitHub"
4. Authorize Vercel

### Bước 2: Import Project (1 phút)
1. Click "Add New..." → "Project"
2. Tìm repository "Final_Edu"
3. Click "Import"

### Bước 3: Configure (2 phút)
**Framework Preset:** Next.js (auto-detect)  
**Root Directory:** `./`  
**Build Command:** `npm run build` (auto)  
**Output Directory:** `.next` (auto)

**Environment Variables:** Click "Add" và thêm 3 biến:

```
Name: LIVEKIT_API_KEY
Value: APINyY453oo6tdJ

Name: LIVEKIT_API_SECRET
Value: hTXlYi4v3WeL6RlM0sner1uoevQtgPEKASvKYuQfLLcC

Name: NEXT_PUBLIC_LIVEKIT_URL
Value: wss://eduinsight-9divqm70.livekit.cloud
```

### Bước 4: Deploy (1 phút)
1. Click "Deploy"
2. Đợi 2-3 phút
3. ✅ XONG!

---

## 🌐 URL CỦA BẠN

Sau khi deploy, Vercel sẽ cho URL:
```
https://final-edu-xxxxx.vercel.app
```

hoặc

```
https://edu-insight-meet.vercel.app
```

---

## 🧪 TEST NGAY

### Test 1: Mở URL
```
https://your-url.vercel.app
```

### Test 2: Tạo meeting
1. Login (hoặc skip)
2. Click "Tạo cuộc họp mới"
3. Copy mã phòng

### Test 3: Join từ máy khác
1. Mở URL trên điện thoại (4G)
2. Nhập mã phòng
3. ✅ Thấy nhau = SUCCESS!

---

## 🔧 NẾU GẶP LỖI

### Lỗi: Build failed
**Fix:** 
1. Vào Vercel Dashboard
2. Deployments → Click vào deployment failed
3. Xem logs
4. Thường là thiếu env vars

### Lỗi: Token error
**Fix:**
1. Vào Project Settings
2. Environment Variables
3. Check 3 biến đã add chưa
4. Redeploy

### Lỗi: Connection failed
**Fix:**
1. Check `NEXT_PUBLIC_LIVEKIT_URL`
2. Phải là `wss://` (có 2 chữ s)
3. Redeploy

---

## 📊 THÔNG TIN QUAN TRỌNG

### LiveKit Credentials (đã có):
```
API Key: APINyY453oo6tdJ
API Secret: hTXlYi4v3WeL6RlM0sner1uoevQtgPEKASvKYuQfLLcC
WebSocket URL: wss://eduinsight-9divqm70.livekit.cloud
```

### Test Accounts:
```
Teacher:
- Email: teacher@test.com
- Password: teacher123

Student:
- Email: student@test.com
- Password: student123
```

---

## 🎯 SAU KHI DEPLOY

### 1. Share URL
Gửi URL cho team/giám khảo:
```
https://your-url.vercel.app
```

### 2. Test với 2 máy
- Máy 1: Tạo meeting
- Máy 2: Join meeting
- ✅ Video call hoạt động!

### 3. Demo AI Detection
- Bật camera
- AI sẽ detect hành vi
- Xem trong panel bên trái

---

## 💰 CHI PHÍ

**Vercel Free Tier:**
- ✅ 100GB bandwidth/month
- ✅ Unlimited deployments
- ✅ Automatic HTTPS
- ✅ Global CDN

**LiveKit Free Tier:**
- ✅ 50GB bandwidth/month
- ✅ Unlimited rooms

**Tổng: $0** 🎉

---

## 🚀 BẮT ĐẦU NGAY!

1. Mở: **https://vercel.com/signup**
2. Login with GitHub
3. Import "Final_Edu"
4. Add 3 env vars
5. Deploy
6. ✅ DONE!

**Thời gian: 5 phút**

---

## 📞 CẦN TRỢ GIÚP?

Nếu gặp vấn đề:
1. Check Vercel logs
2. Check browser console (F12)
3. Hỏi tôi! 😊

---

**🎉 Chúc bạn deploy thành công!**

**URL sau khi deploy:** `https://your-project.vercel.app`
