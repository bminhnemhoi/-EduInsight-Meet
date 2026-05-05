# 🚀 DEPLOY VERCEL - BẠN CẦN LÀM

## ✅ ĐÃ HOÀN THÀNH:
- ✅ Code đã push lên GitHub
- ✅ Vercel CLI đã cài đặt
- ✅ Bạn đã login Vercel thành công
- ✅ Project đã được link: `eduinsight-meet`

## ⚠️ CẦN LÀM TIẾP:

Vì Vercel CLI cần input interactive (tôi không thể tự động), bạn cần làm 1 trong 2 cách:

---

## 🎯 CÁCH 1: QUA VERCEL DASHBOARD (DỄ NHẤT - 2 PHÚT)

### Bước 1: Vào Vercel Dashboard
Mở: https://vercel.com/bminhnemhois-projects/eduinsight-meet/settings/environment-variables

### Bước 2: Add Environment Variables
Click "Add New" và thêm 3 biến:

**Variable 1:**
```
Key: LIVEKIT_API_KEY
Value: APINyY453oo6tdJ
Environment: Production, Preview, Development (chọn cả 3)
```

**Variable 2:**
```
Key: LIVEKIT_API_SECRET
Value: hTXlYi4v3WeL6RlM0sner1uoevQtgPEKASvKYuQfLLcC
Environment: Production, Preview, Development (chọn cả 3)
```

**Variable 3:**
```
Key: NEXT_PUBLIC_LIVEKIT_URL
Value: wss://eduinsight-9divqm70.livekit.cloud
Environment: Production, Preview, Development (chọn cả 3)
```

### Bước 3: Redeploy
1. Vào: https://vercel.com/bminhnemhois-projects/eduinsight-meet
2. Click "Deployments"
3. Click "..." trên deployment mới nhất
4. Click "Redeploy"
5. ✅ DONE!

---

## 🎯 CÁCH 2: QUA TERMINAL (3 PHÚT)

Mở terminal và chạy:

```bash
cd Final_Edu

# Add env var 1
vercel env add LIVEKIT_API_KEY production
# Khi hỏi value, paste: APINyY453oo6tdJ

# Add env var 2
vercel env add LIVEKIT_API_SECRET production
# Khi hỏi value, paste: hTXlYi4v3WeL6RlM0sner1uoevQtgPEKASvKYuQfLLcC

# Add env var 3
vercel env add NEXT_PUBLIC_LIVEKIT_URL production
# Khi hỏi value, paste: wss://eduinsight-9divqm70.livekit.cloud

# Deploy
vercel --prod
```

---

## 🌐 URL CỦA BẠN

Sau khi deploy, URL sẽ là:
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

## 📊 THÔNG TIN QUAN TRỌNG

### Environment Variables (COPY CHÍNH XÁC):
```
LIVEKIT_API_KEY=APINyY453oo6tdJ
LIVEKIT_API_SECRET=hTXlYi4v3WeL6RlM0sner1uoevQtgPEKASvKYuQfLLcC
NEXT_PUBLIC_LIVEKIT_URL=wss://eduinsight-9divqm70.livekit.cloud
```

### Project Info:
- **Project Name:** eduinsight-meet
- **GitHub Repo:** https://github.com/bminhnemhoi/-EduInsight-Meet
- **Vercel Dashboard:** https://vercel.com/bminhnemhois-projects/eduinsight-meet

---

## ✅ CHECKLIST

- [x] Code đã push lên GitHub
- [x] Vercel CLI đã cài
- [x] Đã login Vercel
- [x] Project đã được tạo
- [ ] Add 3 environment variables (BẠN LÀM)
- [ ] Redeploy (BẠN LÀM)
- [ ] Test URL hoạt động

---

**🎉 Chỉ còn 2 phút nữa là xong!**

**Làm ngay:** https://vercel.com/bminhnemhois-projects/eduinsight-meet/settings/environment-variables
