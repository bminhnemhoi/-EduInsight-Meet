# 🚀 HƯỚNG DẪN DEPLOY LÊN VERCEL

## ✅ DỰ ÁN ĐÃ SẴN SÀNG DEPLOY!

Dự án hiện tại **ĐÃ ĐỦ DÙNG** và sẵn sàng deploy lên Vercel.

---

## 📋 CHUẨN BỊ

### 1. Kiểm tra code
```bash
cd Final_Edu

# Build thử local
npm run build

# Nếu build thành công → OK!
```

### 2. Commit code lên GitHub (nếu chưa)
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

---

## 🚀 DEPLOY LÊN VERCEL

### Cách 1: Deploy qua Vercel Dashboard (KHUYẾN NGHỊ - DỄ NHẤT)

#### Bước 1: Tạo tài khoản Vercel
1. Vào https://vercel.com
2. Click "Sign Up"
3. Chọn "Continue with GitHub"
4. Authorize Vercel

#### Bước 2: Import Project
1. Click "Add New..." → "Project"
2. Chọn repository "Final_Edu"
3. Click "Import"

#### Bước 3: Configure Project
```
Framework Preset: Next.js
Root Directory: ./
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

#### Bước 4: Add Environment Variables
Click "Environment Variables" và thêm:

```
LIVEKIT_API_KEY = APINyY453oo6tdJ
LIVEKIT_API_SECRET = hTXlYi4v3WeL6RlM0sner1uoevQtgPEKASvKYuQfLLcC
NEXT_PUBLIC_LIVEKIT_URL = wss://eduinsight-9divqm70.livekit.cloud
```

**QUAN TRỌNG:** Đây là credentials thật của bạn, đã lấy từ `.env.local`

#### Bước 5: Deploy
1. Click "Deploy"
2. Đợi 2-3 phút
3. ✅ DONE!

#### Bước 6: Lấy URL
Vercel sẽ cho bạn URL như:
```
https://final-edu-xxxxx.vercel.app
```

---

### Cách 2: Deploy qua Vercel CLI (NHANH HƠN)

#### Bước 1: Install Vercel CLI
```bash
npm install -g vercel
```

#### Bước 2: Login
```bash
vercel login
```

#### Bước 3: Deploy
```bash
cd Final_Edu
vercel
```

Trả lời các câu hỏi:
```
? Set up and deploy "~/Final_Edu"? [Y/n] Y
? Which scope do you want to deploy to? [Your account]
? Link to existing project? [y/N] N
? What's your project's name? edu-insight-meet
? In which directory is your code located? ./
```

#### Bước 4: Add Environment Variables
```bash
vercel env add LIVEKIT_API_KEY
# Paste: APINyY453oo6tdJ

vercel env add LIVEKIT_API_SECRET
# Paste: hTXlYi4v3WeL6RlM0sner1uoevQtgPEKASvKYuQfLLcC

vercel env add NEXT_PUBLIC_LIVEKIT_URL
# Paste: wss://eduinsight-9divqm70.livekit.cloud
```

#### Bước 5: Deploy lại với env vars
```bash
vercel --prod
```

✅ DONE!

---

## 🧪 TEST SAU KHI DEPLOY

### 1. Mở URL Vercel
```
https://your-project.vercel.app
```

### 2. Test flow:
1. ✅ Trang chủ load được
2. ✅ Login/Register hoạt động
3. ✅ Tạo meeting
4. ✅ Join meeting
5. ✅ Video/Audio hoạt động
6. ✅ AI detection hoạt động

### 3. Test cross-network (2 máy khác mạng):
- **Máy 1 (WiFi):** Tạo meeting → Copy mã phòng
- **Máy 2 (4G):** Join meeting → Nhập mã phòng
- ✅ Cả 2 nhìn thấy nhau = SUCCESS!

---

## 🔧 TROUBLESHOOTING

### Lỗi: "Build failed"
**Nguyên nhân:** TypeScript errors

**Fix:**
```bash
# Check errors
npm run build

# Fix errors, then deploy lại
vercel --prod
```

### Lỗi: "Token error" sau khi deploy
**Nguyên nhân:** Chưa set environment variables

**Fix:**
1. Vào Vercel Dashboard
2. Project Settings → Environment Variables
3. Add 3 variables (xem Bước 4 ở trên)
4. Redeploy

### Lỗi: "Connection failed"
**Nguyên nhân:** LiveKit URL sai

**Fix:**
1. Check `NEXT_PUBLIC_LIVEKIT_URL` có đúng không
2. Phải là `wss://` (không phải `https://`)
3. Redeploy

---

## 📊 VERCEL DASHBOARD

Sau khi deploy, bạn có thể:
- ✅ Xem logs
- ✅ Xem analytics
- ✅ Xem deployments history
- ✅ Custom domain
- ✅ Environment variables

---

## 🌐 CUSTOM DOMAIN (OPTIONAL)

### Nếu bạn có domain (VD: eduinsight.com):

1. Vào Vercel Dashboard
2. Project Settings → Domains
3. Add Domain: `eduinsight.com`
4. Update DNS records theo hướng dẫn
5. ✅ DONE!

---

## 💰 CHI PHÍ

### Vercel:
- **Free tier:** 
  - 100GB bandwidth/month
  - Unlimited deployments
  - Automatic HTTPS
  - Global CDN
  - **ĐỦ cho demo và cuộc thi!**

### LiveKit Cloud:
- **Free tier:**
  - 50GB bandwidth/month
  - Unlimited rooms
  - **ĐỦ cho demo và cuộc thi!**

**Tổng chi phí: $0** 🎉

---

## 🎯 SAU KHI DEPLOY

### 1. Share URL với team/giám khảo
```
https://your-project.vercel.app
```

### 2. Tạo test accounts
```
Teacher:
- Email: teacher@test.com
- Password: teacher123

Student:
- Email: student@test.com
- Password: student123
```

### 3. Quay video demo
- Screen recording
- Test với 2 máy
- Show AI detection
- Show analytics

### 4. Tạo Pitch Deck
- Problem
- Solution
- Demo
- Market
- Team

---

## 🚀 DEPLOY NGAY!

### Quick Start (5 phút):
```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy
cd Final_Edu
vercel

# 4. Add env vars (theo hướng dẫn trên)

# 5. Deploy production
vercel --prod

# ✅ DONE!
```

---

## 📞 HỖ TRỢ

Nếu gặp vấn đề:
1. Check Vercel logs
2. Check browser console
3. Check LiveKit dashboard
4. Hỏi tôi! 😊

---

**🎉 Chúc bạn deploy thành công!**
