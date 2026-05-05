# 🚀 HƯỚNG DẪN DEPLOY CHI TIẾT - TỪNG BƯỚC

## ✅ TRẠNG THÁI: CODE ĐÃ SẴN SÀNG!

Tôi đã commit code, bây giờ bạn cần:
1. Push lên GitHub (hoặc)
2. Deploy trực tiếp từ local

---

## 🎯 OPTION 1: PUSH LÊN GITHUB RỒI DEPLOY (KHUYẾN NGHỊ)

### Bước 1: Fix GitHub Permission
Bạn đang gặp lỗi permission. Fix bằng cách:

#### Cách 1A: Dùng GitHub Desktop (DỄ NHẤT)
1. Mở **GitHub Desktop**
2. File → Add Local Repository
3. Chọn folder `Final_Edu`
4. Click "Publish repository"
5. ✅ DONE!

#### Cách 1B: Dùng Personal Access Token
```bash
# 1. Tạo token tại: https://github.com/settings/tokens
# Click "Generate new token (classic)"
# Chọn: repo (full control)
# Copy token

# 2. Push với token
cd Final_Edu
git push https://YOUR_TOKEN@github.com/anhdoandeptrai/Final_Edu.git main
```

### Bước 2: Deploy từ Vercel
1. Vào **https://vercel.com/signup**
2. Login with GitHub
3. Import "Final_Edu" repository
4. Add Environment Variables:
   ```
   LIVEKIT_API_KEY = APINyY453oo6tdJ
   LIVEKIT_API_SECRET = hTXlYi4v3WeL6RlM0sner1uoevQtgPEKASvKYuQfLLcC
   NEXT_PUBLIC_LIVEKIT_URL = wss://eduinsight-9divqm70.livekit.cloud
   ```
5. Click "Deploy"
6. ✅ DONE!

---

## 🎯 OPTION 2: DEPLOY TRỰC TIẾP TỪ LOCAL (NHANH HƠN)

### Bước 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Bước 2: Login Vercel
```bash
vercel login
```
Nhập email → Check email → Click link xác nhận

### Bước 3: Deploy
```bash
cd Final_Edu
vercel
```

Trả lời các câu hỏi:
```
? Set up and deploy? Y
? Which scope? [Your account]
? Link to existing project? N
? What's your project's name? edu-insight-meet
? In which directory is your code located? ./
```

### Bước 4: Add Environment Variables
```bash
# Add từng biến
vercel env add LIVEKIT_API_KEY production
# Paste: APINyY453oo6tdJ

vercel env add LIVEKIT_API_SECRET production
# Paste: hTXlYi4v3WeL6RlM0sner1uoevQtgPEKASvKYuQfLLcC

vercel env add NEXT_PUBLIC_LIVEKIT_URL production
# Paste: wss://eduinsight-9divqm70.livekit.cloud
```

### Bước 5: Deploy Production
```bash
vercel --prod
```

✅ DONE! Vercel sẽ cho bạn URL:
```
https://edu-insight-meet.vercel.app
```

---

## 🎯 OPTION 3: DEPLOY QUA VERCEL DASHBOARD (KHÔNG CẦN GIT)

### Bước 1: Zip Project
1. Vào folder `Final_Edu`
2. Chọn tất cả files (trừ `node_modules`, `.next`)
3. Zip lại thành `final-edu.zip`

### Bước 2: Upload lên Vercel
1. Vào **https://vercel.com/new**
2. Chọn "Import from ZIP"
3. Upload `final-edu.zip`
4. Add Environment Variables (như trên)
5. Deploy

---

## 🧪 TEST SAU KHI DEPLOY

### 1. Mở URL
```
https://your-project.vercel.app
```

### 2. Test Basic Flow
1. ✅ Trang chủ load
2. ✅ Click "Tạo cuộc họp mới"
3. ✅ Copy mã phòng
4. ✅ Mở tab mới → Join với mã phòng
5. ✅ Bật camera → Thấy video
6. ✅ AI detection hoạt động

### 3. Test Cross-Network
- **Máy 1 (laptop WiFi):** Tạo meeting
- **Máy 2 (điện thoại 4G):** Join meeting
- ✅ Cả 2 thấy nhau = SUCCESS!

---

## 🔧 TROUBLESHOOTING

### Lỗi: "Build failed"
**Xem logs:**
```bash
vercel logs
```

**Thường là:** TypeScript errors

**Fix:**
```bash
npm run build
# Fix errors
vercel --prod
```

### Lỗi: "Token error"
**Nguyên nhân:** Chưa add env vars

**Fix:**
```bash
vercel env add LIVEKIT_API_KEY production
vercel env add LIVEKIT_API_SECRET production
vercel env add NEXT_PUBLIC_LIVEKIT_URL production

vercel --prod
```

### Lỗi: "Module not found"
**Fix:**
```bash
rm -rf node_modules package-lock.json
npm install
vercel --prod
```

---

## 📊 THÔNG TIN QUAN TRỌNG

### Environment Variables (QUAN TRỌNG):
```
LIVEKIT_API_KEY=APINyY453oo6tdJ
LIVEKIT_API_SECRET=hTXlYi4v3WeL6RlM0sner1uoevQtgPEKASvKYuQfLLcC
NEXT_PUBLIC_LIVEKIT_URL=wss://eduinsight-9divqm70.livekit.cloud
```

**LƯU Ý:** 
- `NEXT_PUBLIC_LIVEKIT_URL` phải có `wss://` (2 chữ s)
- Không có dấu cách thừa
- Không có dấu ngoặc kép

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

## 🎯 KHUYẾN NGHỊ

### Nếu bạn quen Git:
→ **Option 1** (Push GitHub → Deploy Vercel)

### Nếu bạn chưa quen Git:
→ **Option 2** (Deploy trực tiếp với Vercel CLI)

### Nếu gặp vấn đề:
→ **Option 3** (Upload ZIP)

---

## 📞 CẦN TRỢ GIÚP?

### Nếu gặp lỗi GitHub Permission:
1. Dùng GitHub Desktop (dễ nhất)
2. Hoặc tạo Personal Access Token
3. Hoặc deploy trực tiếp (Option 2)

### Nếu gặp lỗi Vercel:
1. Check logs: `vercel logs`
2. Check env vars
3. Rebuild: `vercel --prod`

---

## 🚀 BƯỚC TIẾP THEO

Sau khi deploy thành công:

### 1. Share URL
```
https://your-project.vercel.app
```

### 2. Test kỹ
- Test với 2 máy khác mạng
- Test AI detection
- Test analytics

### 3. Tạo Video Demo
- Screen recording
- Show features
- Show AI detection

### 4. Tạo Pitch Deck
- Problem
- Solution  
- Demo
- Market

---

## ✅ CHECKLIST

- [ ] Code đã commit
- [ ] Push lên GitHub (hoặc deploy trực tiếp)
- [ ] Deploy lên Vercel
- [ ] Add 3 environment variables
- [ ] Test URL hoạt động
- [ ] Test với 2 máy khác mạng
- [ ] AI detection hoạt động
- [ ] Analytics hoạt động

---

**🎉 Chúc bạn deploy thành công!**

**Nếu cần trợ giúp, hãy hỏi tôi!** 😊
