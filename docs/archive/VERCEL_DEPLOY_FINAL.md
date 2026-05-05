# 🚀 DEPLOY LÊN VERCEL - BƯỚC CUỐI CÙNG

## ✅ CODE ĐÃ Ở TRÊN GITHUB!

Repository: https://github.com/bminhnemhoi/-EduInsight-Meet

---

## 🎯 DEPLOY NGAY (3 PHÚT)

### Bước 1: Vào Vercel
Mở: **https://vercel.com/signup**

### Bước 2: Login
Click "Continue with GitHub"

### Bước 3: Import Project
1. Click "Add New..." → "Project"
2. Tìm repository: **-EduInsight-Meet**
3. Click "Import"

### Bước 4: Configure
**Framework:** Next.js (auto-detect)  
**Root Directory:** `./`  
**Build Command:** `npm run build`  
**Output Directory:** `.next`

### Bước 5: Environment Variables
Click "Environment Variables" và add 3 biến:

```
Name: LIVEKIT_API_KEY
Value: APINyY453oo6tdJ

Name: LIVEKIT_API_SECRET
Value: hTXlYi4v3WeL6RlM0sner1uoevQtgPEKASvKYuQfLLcC

Name: NEXT_PUBLIC_LIVEKIT_URL
Value: wss://eduinsight-9divqm70.livekit.cloud
```

**QUAN TRỌNG:** Copy chính xác, không có dấu cách thừa!

### Bước 6: Deploy
Click "Deploy" → Đợi 2-3 phút → ✅ DONE!

---

## 🌐 URL CỦA BẠN

Sau khi deploy, Vercel sẽ cho URL:
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
Vào URL Vercel vừa được tạo

### Test 2: Tạo Meeting
1. Click "Tạo cuộc họp mới"
2. Copy mã phòng

### Test 3: Join từ máy khác
1. Mở URL trên điện thoại (4G)
2. Nhập mã phòng
3. ✅ Thấy nhau = SUCCESS!

---

## 🔧 NẾU GẶP LỖI

### Lỗi: Build failed
1. Vào Vercel Dashboard
2. Deployments → Click deployment failed
3. Xem logs
4. Thường là thiếu env vars → Add lại

### Lỗi: Token error
1. Check 3 env vars đã add chưa
2. Check `NEXT_PUBLIC_LIVEKIT_URL` có `wss://` không
3. Redeploy

---

## 📊 THÔNG TIN QUAN TRỌNG

### Environment Variables (COPY CHÍNH XÁC):
```
LIVEKIT_API_KEY=APINyY453oo6tdJ
LIVEKIT_API_SECRET=hTXlYi4v3WeL6RlM0sner1uoevQtgPEKASvKYuQfLLcC
NEXT_PUBLIC_LIVEKIT_URL=wss://eduinsight-9divqm70.livekit.cloud
```

### Test Accounts:
```
Teacher: teacher@test.com / teacher123
Student: student@test.com / student123
```

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

## 🎯 SAU KHI DEPLOY

### 1. Share URL
```
https://your-url.vercel.app
```

### 2. Test với 2 máy
- Máy 1 (laptop): Tạo meeting
- Máy 2 (điện thoại): Join meeting
- ✅ Video call hoạt động!

### 3. Demo AI Detection
- Bật camera
- AI sẽ detect hành vi
- Xem trong panel bên trái

---

## ✅ CHECKLIST

- [x] Code đã push lên GitHub
- [ ] Login Vercel với GitHub
- [ ] Import repository
- [ ] Add 3 environment variables
- [ ] Deploy
- [ ] Test URL hoạt động
- [ ] Test với 2 máy khác mạng

---

**🎉 Chỉ còn 3 phút nữa là xong!**

**Vào ngay:** https://vercel.com/signup
