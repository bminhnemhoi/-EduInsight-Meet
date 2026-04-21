# 🚀 HƯỚNG DẪN DEPLOY LÊN VERCEL

## ✅ TRẠNG THÁI: SẴN SÀNG DEPLOY

Dự án đã được cấu hình sẵn cho Vercel và **SẴN SÀNG** test với 2 máy khác mạng.

---

## 🎯 KHẢ NĂNG SAU KHI DEPLOY

### ✅ Có thể làm được:
- ✅ Test với 2 máy **khác mạng** (4G + WiFi)
- ✅ Test với điện thoại + laptop
- ✅ Test từ bất kỳ đâu trên thế giới
- ✅ Video call HD real-time
- ✅ AI detection hoạt động
- ✅ HTTPS (bảo mật)
- ✅ Domain miễn phí (.vercel.app)

### ⚠️ Lưu ý:
- IndexedDB vẫn lưu **local** (mỗi máy có data riêng)
- Không sync data giữa devices
- Cần LiveKit Cloud (đã có - miễn phí)

---

## 🚀 CÁCH 1: DEPLOY VỚI VERCEL (KHUYẾN NGHỊ)

### Bước 1: Cài Vercel CLI (1 phút)
```bash
npm install -g vercel
```

### Bước 2: Login Vercel (30 giây)
```bash
vercel login
```
- Chọn email hoặc GitHub
- Xác thực trong browser

### Bước 3: Deploy (2 phút)
```bash
cd Final_Edu
vercel
```

**Trả lời các câu hỏi:**
```
? Set up and deploy "Final_Edu"? [Y/n] Y
? Which scope? [Your account]
? Link to existing project? [y/N] N
? What's your project's name? edu-insight-meet
? In which directory is your code located? ./
? Want to override the settings? [y/N] N
```

### Bước 4: Thêm Environment Variables (2 phút)

**Cách 1: Qua CLI**
```bash
vercel env add LIVEKIT_API_KEY
# Paste API Key từ LiveKit Cloud

vercel env add LIVEKIT_API_SECRET
# Paste API Secret

vercel env add NEXT_PUBLIC_LIVEKIT_URL
# Paste WebSocket URL
```

**Cách 2: Qua Dashboard**
1. Vào https://vercel.com/dashboard
2. Chọn project `edu-insight-meet`
3. Settings → Environment Variables
4. Thêm 3 biến:
   - `LIVEKIT_API_KEY`
   - `LIVEKIT_API_SECRET`
   - `NEXT_PUBLIC_LIVEKIT_URL`

### Bước 5: Deploy lại (30 giây)
```bash
vercel --prod
```

### Bước 6: Lấy URL
```
✅ Production: https://edu-insight-meet.vercel.app
```

---

## 🧪 TEST VỚI 2 MÁY KHÁC MẠNG

### Scenario 1: Laptop (WiFi) + Điện thoại (4G)

**Máy 1 (Laptop - WiFi):**
1. Mở: https://edu-insight-meet.vercel.app
2. Đăng nhập Teacher
3. Tạo meeting
4. Copy mã phòng: `ABC123`

**Máy 2 (Điện thoại - 4G):**
1. Mở: https://edu-insight-meet.vercel.app
2. Đăng nhập Student
3. Nhập mã: `ABC123`
4. Join meeting

**Kết quả:**
- ✅ Cả 2 thấy nhau
- ✅ Video call HD
- ✅ AI detection hoạt động
- ✅ Không lag (LiveKit có TURN servers)

---

### Scenario 2: 2 Laptop khác thành phố

**Máy 1 (Hà Nội):**
- Mở URL → Tạo meeting

**Máy 2 (TP.HCM):**
- Mở URL → Join meeting

**Kết quả:**
- ✅ Kết nối thành công
- ✅ Latency thấp (~50-100ms)
- ✅ LiveKit tự động chọn server gần nhất

---

### Scenario 3: Demo cho cuộc thi

**Bạn (Presenter):**
- Laptop → Tạo meeting
- Share URL + mã phòng

**Ban giám khảo:**
- Điện thoại/Laptop → Join meeting
- Xem demo real-time

---

## 🌐 CÁCH 2: DEPLOY VỚI GITHUB + VERCEL (TỰ ĐỘNG)

### Bước 1: Push code lên GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/edu-insight-meet.git
git push -u origin main
```

### Bước 2: Import vào Vercel
1. Vào https://vercel.com/new
2. Import Git Repository
3. Chọn repo `edu-insight-meet`
4. Thêm Environment Variables (3 biến)
5. Click "Deploy"

### Bước 3: Auto-deploy
- Mỗi lần push code → Tự động deploy
- Preview URL cho mỗi PR
- Production URL cố định

---

## 📊 SO SÁNH DEPLOYMENT OPTIONS

| Tính năng | Local (localhost) | Vercel Deploy |
|-----------|-------------------|---------------|
| **Test cùng mạng** | ✅ Có | ✅ Có |
| **Test khác mạng** | ❌ Không | ✅ Có |
| **HTTPS** | ❌ Không | ✅ Có |
| **Domain** | localhost:3000 | .vercel.app |
| **Tốc độ** | Nhanh | Nhanh |
| **Chi phí** | $0 | $0 (Free tier) |
| **Setup** | 0 phút | 5 phút |

---

## 🔒 BẢO MẬT

### Environment Variables trên Vercel:
- ✅ Được mã hóa
- ✅ Không hiển thị trong logs
- ✅ Chỉ accessible trong build/runtime
- ✅ Không commit vào Git

### HTTPS:
- ✅ Tự động SSL certificate
- ✅ Bảo mật end-to-end
- ✅ Camera/Mic chỉ hoạt động trên HTTPS

---

## 💰 CHI PHÍ

### Vercel Free Tier:
- ✅ **100GB bandwidth/tháng**
- ✅ **Unlimited deployments**
- ✅ **Automatic HTTPS**
- ✅ **Global CDN**
- ✅ **Serverless Functions**

### LiveKit Cloud Free Tier:
- ✅ **10,000 phút/tháng**
- ✅ **TURN servers**
- ✅ **Global edge network**

### Tổng chi phí: **$0** (đủ cho demo/cuộc thi)

---

## 🎯 CHECKLIST TRƯỚC KHI DEPLOY

- [ ] Code không có lỗi TypeScript
- [ ] `npm run build` thành công
- [ ] File `.env.local` có đầy đủ credentials
- [ ] LiveKit credentials đúng
- [ ] Test local thành công
- [ ] Git repo sạch (không có secrets)

---

## 🧪 TEST SAU KHI DEPLOY

### Test 1: Basic functionality
- [ ] Mở URL production
- [ ] Đăng ký/Đăng nhập
- [ ] Tạo meeting
- [ ] Join meeting
- [ ] Video/Audio hoạt động

### Test 2: Cross-network
- [ ] Laptop (WiFi) + Điện thoại (4G)
- [ ] Cả 2 thấy nhau
- [ ] AI detection hoạt động
- [ ] Không lag

### Test 3: Performance
- [ ] Page load < 3s
- [ ] Video latency < 200ms
- [ ] AI detection smooth
- [ ] No console errors

---

## 🐛 TROUBLESHOOTING

### Lỗi 1: "Build failed"
**Nguyên nhân:** TypeScript errors  
**Fix:**
```bash
npx tsc --noEmit
# Fix errors
vercel --prod
```

### Lỗi 2: "Environment variables not found"
**Nguyên nhân:** Chưa thêm env vars  
**Fix:** Thêm qua Vercel Dashboard → Settings → Environment Variables

### Lỗi 3: "LiveKit connection failed"
**Nguyên nhân:** Env vars sai  
**Fix:** Kiểm tra lại credentials từ LiveKit Cloud

### Lỗi 4: "Camera not working"
**Nguyên nhân:** Không phải HTTPS  
**Fix:** Vercel tự động có HTTPS, không cần fix

---

## 📱 TEST VỚI MOBILE

### iOS (Safari):
- ✅ Video call hoạt động
- ✅ AI detection hoạt động
- ⚠️ Cần allow camera/mic

### Android (Chrome):
- ✅ Video call hoạt động
- ✅ AI detection hoạt động
- ⚠️ Cần allow camera/mic

---

## 🎥 DEMO CHO CUỘC THI

### Setup:
1. Deploy lên Vercel
2. Lấy URL: `https://edu-insight-meet.vercel.app`
3. Tạo 2 tài khoản test:
   - Teacher: `demo-teacher@test.com`
   - Student: `demo-student@test.com`

### Trong buổi demo:
1. **Laptop:** Đăng nhập Teacher → Tạo meeting
2. **Điện thoại:** Đăng nhập Student → Join meeting
3. **Show:** Video call + AI detection real-time
4. **Highlight:** Dashboard, Analytics, Settings

---

## 🚀 DEPLOY NGAY (5 PHÚT)

```bash
# 1. Cài Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy
cd Final_Edu
vercel

# 4. Thêm env vars
vercel env add LIVEKIT_API_KEY
vercel env add LIVEKIT_API_SECRET
vercel env add NEXT_PUBLIC_LIVEKIT_URL

# 5. Deploy production
vercel --prod

# 6. Lấy URL
# ✅ https://edu-insight-meet.vercel.app
```

---

## ✅ KẾT LUẬN

### Dự án SẴN SÀNG deploy và test với 2 máy khác mạng:

- ✅ **Cấu hình Vercel:** Đã có
- ✅ **LiveKit Cloud:** Đã có
- ✅ **HTTPS:** Tự động
- ✅ **TURN servers:** Có sẵn (LiveKit)
- ✅ **Global CDN:** Có sẵn (Vercel)
- ✅ **Chi phí:** $0

### Chỉ cần:
1. Deploy lên Vercel (5 phút)
2. Test với 2 máy khác mạng
3. Demo cho cuộc thi

---

**Ready to deploy! 🚀**

