# 🧪 HƯỚNG DẪN TEST DỰ ÁN

## ✅ Server đã chạy thành công!

```
✓ Next.js 16.1.6 (webpack)
- Local:   http://localhost:3000
- Network: http://192.168.89.162:3000
✓ Ready in 1807ms
```

---

## 🚀 BƯỚC 1: MỞ TRÌNH DUYỆT

### Cách 1: Trên máy local
```
http://localhost:3000
```

### Cách 2: Từ máy khác (cùng mạng)
```
http://192.168.89.162:3000
```

---

## 🧪 BƯỚC 2: TEST FLOW HOÀN CHỈNH

### Test 1: Đăng ký & Đăng nhập
1. Mở http://localhost:3000
2. Click "Đăng ký" (nếu chưa có tài khoản)
3. Nhập:
   - Email: `teacher@test.com`
   - Password: `teacher123`
   - Role: **Teacher**
4. Click "Đăng ký"
5. Đăng nhập với tài khoản vừa tạo

**Kết quả mong đợi:**
- ✅ Chuyển đến Dashboard
- ✅ Thấy "Tạo cuộc họp mới"

---

### Test 2: Tạo Meeting (Teacher)
1. Sau khi đăng nhập Teacher
2. Click "Tạo cuộc họp mới"
3. Nhập tên: `Test Meeting`
4. Click "Tạo"
5. **Copy mã phòng** (ví dụ: `ABC123`)

**Kết quả mong đợi:**
- ✅ Hiển thị mã phòng
- ✅ Có nút "Tham gia"

---

### Test 3: Join Meeting (Teacher)
1. Click "Tham gia"
2. Cho phép Camera & Microphone
3. Click "Join Meeting"

**Kết quả mong đợi:**
- ✅ Vào phòng họp
- ✅ Thấy video của mình
- ✅ Thấy badge AI (góc trái trên)
- ✅ Badge hiển thị hành vi (ví dụ: "✅ Đang lắng nghe")

---

### Test 4: Join Meeting (Student - Tab mới)
1. Mở tab mới (Ctrl+Shift+N - Incognito)
2. Vào http://localhost:3000
3. Đăng ký/Đăng nhập Student:
   - Email: `student@test.com`
   - Password: `student123`
   - Role: **Student**
4. Click "Tham gia cuộc họp"
5. Nhập mã phòng: `ABC123`
6. Cho phép Camera & Microphone
7. Click "Join"

**Kết quả mong đợi:**
- ✅ Vào phòng họp
- ✅ Thấy video của Teacher
- ✅ Thấy video của mình
- ✅ Badge AI hiển thị hành vi

---

### Test 5: AI Detection
1. Trong phòng họp (cả Teacher và Student)
2. Quan sát badge AI (góc trái trên)
3. Thử các hành động:
   - **Nhìn thẳng vào camera** → "✅ Đang lắng nghe"
   - **Quay đầu sang bên** → "👀 Mất tập trung"
   - **Cúi đầu xuống** → "📱 Cúi đầu"
   - **Giơ tay lên** → "✋ Giơ tay"
   - **Gật đầu** → "👍 Gật đầu"

**Kết quả mong đợi:**
- ✅ Badge thay đổi mỗi 500ms
- ✅ Emoji và label chính xác
- ✅ Màu sắc thay đổi theo hành vi

---

### Test 6: Teacher Dashboard
1. Ở tab Teacher
2. Quan sát panel bên phải
3. Xem danh sách học sinh
4. Click vào tên học sinh

**Kết quả mong đợi:**
- ✅ Thấy danh sách học sinh
- ✅ Thấy hành vi hiện tại của từng học sinh
- ✅ Click vào học sinh → Xem timeline chi tiết

---

### Test 7: History Page
1. Rời khỏi meeting (click "Leave")
2. Vào menu → Click "Lịch sử"
3. Xem statistics

**Kết quả mong đợi:**
- ✅ Thấy số buổi học: 1
- ✅ Thấy tổng hành vi: X
- ✅ Thấy positive/negative/warning
- ✅ Thấy danh sách meetings
- ✅ Click meeting → Xem timeline

---

### Test 8: Date Filter
1. Ở trang History
2. Click các nút filter:
   - "Tất cả"
   - "Hôm nay"
   - "7 ngày"
   - "30 ngày"

**Kết quả mong đợi:**
- ✅ Danh sách meetings thay đổi
- ✅ Chỉ hiển thị meetings trong khoảng thời gian

---

### Test 9: Settings Page
1. Vào menu → Click "Cài đặt"
2. Toggle "Phát hiện hành vi tự động"
3. Kéo slider "Độ nhạy phát hiện"
4. Click theme "🌙 Tối"

**Kết quả mong đợi:**
- ✅ Hiển thị "✅ Đã lưu cài đặt"
- ✅ Settings được lưu
- ✅ Refresh trang → Settings vẫn còn

---

### Test 10: Data Persistence
1. Sau khi test xong
2. **Refresh trang** (F5)
3. Vào "Lịch sử"

**Kết quả mong đợi:**
- ✅ Dữ liệu vẫn còn
- ✅ Statistics không bị reset về 0
- ✅ Meetings vẫn hiển thị

---

## 🔍 KIỂM TRA INDEXEDDB

### Cách 1: Chrome DevTools
1. Mở DevTools (F12)
2. Tab "Application"
3. Sidebar → "IndexedDB"
4. Mở "EduInsightDB"
5. Xem 3 stores:
   - **meetings** - Danh sách buổi học
   - **behaviors** - Lịch sử hành vi
   - **settings** - Cài đặt người dùng

**Kết quả mong đợi:**
- ✅ Database tồn tại
- ✅ Có data trong các stores
- ✅ Data có cấu trúc đúng

---

## 🐛 TROUBLESHOOTING

### Lỗi 1: "Cannot connect to server"
**Nguyên nhân:** Server chưa chạy  
**Fix:**
```bash
npm run dev
```

### Lỗi 2: "Camera/Mic permission denied"
**Nguyên nhân:** Browser chặn  
**Fix:** Click icon 🔒 trên address bar → Allow camera/mic

### Lỗi 3: "AI badge không hiển thị"
**Nguyên nhân:** Camera chưa bật  
**Fix:** Bật camera trong meeting

### Lỗi 4: "Statistics hiển thị 0"
**Nguyên nhân:** Chưa có data  
**Fix:** Join meeting với camera, đợi AI detect

### Lỗi 5: "IndexedDB không có data"
**Nguyên nhân:** Private/Incognito mode  
**Fix:** Dùng browser thường (không incognito)

---

## ✅ CHECKLIST TEST

### Tính năng cơ bản:
- [ ] Đăng ký/Đăng nhập
- [ ] Tạo meeting
- [ ] Join meeting
- [ ] Video/Audio hoạt động
- [ ] Screen share (nếu có)

### AI Detection:
- [ ] Badge hiển thị
- [ ] Hành vi thay đổi theo thời gian thực
- [ ] Emoji chính xác
- [ ] Màu sắc đúng

### Teacher Dashboard:
- [ ] Thấy danh sách học sinh
- [ ] Thấy hành vi từng học sinh
- [ ] Click học sinh → Timeline

### History Page:
- [ ] Statistics hiển thị đúng
- [ ] Date filter hoạt động
- [ ] Meeting list hiển thị
- [ ] Timeline chi tiết

### Settings Page:
- [ ] AI toggle hoạt động
- [ ] Sensitivity slider
- [ ] Theme switcher
- [ ] Auto-save

### Data Persistence:
- [ ] Refresh → Data vẫn còn
- [ ] IndexedDB có data
- [ ] Settings persist

---

## 📊 KẾT QUẢ MONG ĐỢI

Sau khi test xong, bạn nên thấy:

### IndexedDB:
```
EduInsightDB
├── meetings (1 record)
│   └── meeting_ABC123_1234567890
├── behaviors (50-100 records)
│   └── behavior_1234567890_abc123
└── settings (1 record)
    └── user_123
```

### History Page:
```
📊 Tổng quan
- Buổi học: 1
- Tổng hành vi: 87
- Tích cực: 62 (71%)
- Cảnh báo: 18 (21%)
- Tiêu cực: 7 (8%)
```

---

## 🎥 VIDEO DEMO (Gợi ý)

Nếu cần quay video demo:

1. **Intro (10s):** "Edu Insight Meet - Video call với AI"
2. **Teacher tạo meeting (20s):** Tạo phòng, copy mã
3. **Student join (20s):** Nhập mã, vào phòng
4. **AI detection (30s):** Thử các hành vi, badge thay đổi
5. **Teacher dashboard (20s):** Xem danh sách học sinh
6. **History (20s):** Xem statistics, timeline
7. **Settings (10s):** Toggle AI, theme
8. **Outro (10s):** "Cảm ơn đã xem!"

**Tổng:** 2 phút 20 giây

---

## 📝 GHI CHÚ

- Server phải chạy trước khi test
- Cần 2 tabs/browsers để test Teacher + Student
- Camera/Mic phải được allow
- IndexedDB không hoạt động trong Incognito (một số browser)
- AI detection chạy mỗi 500ms

---

**Good luck testing! 🚀**

