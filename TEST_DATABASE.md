# 🧪 Test Database Implementation

## ✅ Đã hoàn thành

### 1. Tạo Database Layer (`src/lib/database.ts`)
- ✅ IndexedDB wrapper
- ✅ 3 stores: meetings, behaviors, settings
- ✅ CRUD operations đầy đủ
- ✅ Statistics helper

### 2. Cập nhật MeetingContext (`src/contexts/MeetingContext.tsx`)
- ✅ Tích hợp database
- ✅ Auto-init database khi app start
- ✅ Save meeting khi tạo/join
- ✅ Save behavior vào DB
- ✅ Get behaviors từ DB

### 3. Cập nhật AIBehaviorDetector (`src/components/AIBehaviorDetector.tsx`)
- ✅ Import useMeeting
- ✅ Call saveBehavior() mỗi khi detect
- ✅ Lưu vào DB + in-memory

---

## 🧪 Cách Test

### Test 1: Kiểm tra Database Init
```javascript
// Mở DevTools Console
// Chạy lệnh:
indexedDB.databases().then(dbs => console.log(dbs))

// Kết quả mong đợi:
// [{ name: "EduInsightDB", version: 1 }]
```

### Test 2: Tạo Meeting và Kiểm tra
```javascript
// 1. Đăng nhập Teacher
// 2. Tạo meeting mới
// 3. Mở DevTools → Application → IndexedDB → EduInsightDB → meetings
// 4. Xem có record mới không

// Hoặc chạy trong console:
const db = await indexedDB.open('EduInsightDB', 1)
// Xem data
```

### Test 3: Kiểm tra Behavior được lưu
```javascript
// 1. Join meeting với camera ON
// 2. Đợi AI detect (badge hiển thị)
// 3. Mở DevTools → Application → IndexedDB → EduInsightDB → behaviors
// 4. Xem có records mới mỗi 500ms không
```

### Test 4: Kiểm tra Persistence
```javascript
// 1. Join meeting, để AI chạy 1-2 phút
// 2. Refresh trang (F5)
// 3. Mở DevTools → Application → IndexedDB
// 4. Dữ liệu vẫn còn = SUCCESS ✅
```

---

## 🐛 Lỗi có thể gặp

### Lỗi 1: "useMeeting must be used within a MeetingProvider"
**Nguyên nhân:** Component không nằm trong MeetingProvider  
**Fix:** Kiểm tra `layout.tsx` có wrap MeetingProvider không

### Lỗi 2: "Cannot read property 'saveBehavior' of undefined"
**Nguyên nhân:** MeetingContext chưa init  
**Fix:** Đợi context ready trước khi call

### Lỗi 3: IndexedDB không mở được
**Nguyên nhân:** Browser không hỗ trợ hoặc private mode  
**Fix:** Dùng browser thường (không incognito)

---

## 📊 Kiểm tra Data Structure

### Meeting Record
```json
{
  "id": "meeting_ABC123_1234567890",
  "roomCode": "ABC123",
  "teacherId": "user_123",
  "teacherName": "Nguyễn Văn A",
  "startTime": 1234567890000,
  "endTime": null,
  "participantCount": 5
}
```

### Behavior Record
```json
{
  "id": "behavior_1234567890_abc123",
  "meetingId": "meeting_ABC123_1234567890",
  "userId": "user_456",
  "userName": "Trần Thị B",
  "behavior": "Đang lắng nghe",
  "emoji": "✅",
  "color": "#3b82f6",
  "type": "positive",
  "timestamp": 1234567890500
}
```

---

## 🎯 Next Steps

Sau khi test xong, tiếp tục:
1. ✅ **Priority 2:** Fix Analytics Page (kết nối DB)
2. ✅ **Priority 3:** Settings Page (lưu settings vào DB)
3. ✅ **Priority 4:** Test AI robustness

---

## 📝 Notes

- Database tự động init khi app start
- Mỗi meeting có unique ID: `meeting_{roomCode}_{timestamp}`
- Mỗi behavior có unique ID: `behavior_{timestamp}_{random}`
- Data không bị mất khi refresh (persistent)
- Có thể xem data trực tiếp trong DevTools

