# 🚀 CẢI TIẾN CHỨC NĂNG (FEATURES)

**Mục tiêu:** Thêm các tính năng mới để tăng giá trị sản phẩm

---

## 📊 PHÂN TÍCH CHỨC NĂNG HIỆN TẠI

### ✅ Đã có:
- Video conferencing HD
- AI behavior detection (9 behaviors)
- Teacher dashboard
- Student behavior history
- Analytics & statistics
- Settings management
- Data persistence (IndexedDB)
- Screen sharing

### ❌ Chưa có:
- Recording & Playback
- Attendance tracking
- Quiz/Poll trong meeting
- Whiteboard
- Breakout rooms
- File sharing
- Calendar integration
- Email notifications
- Reports export
- Multi-language

---

## 🎯 ĐỀ XUẤT CHỨC NĂNG MỚI - THEO ƯU TIÊN

### 🔥 PRIORITY 1: Attendance Tracking (CRITICAL)
**Tại sao:** Giáo viên cần điểm danh tự động

**Chức năng:**
- ✅ Auto-track khi học sinh join
- ✅ Track thời gian join/leave
- ✅ Track total duration
- ✅ Late/Early leave detection
- ✅ Export attendance report (CSV/PDF)
- ✅ Attendance percentage calculation

**Use case:**
```
Giáo viên tạo meeting lúc 8:00 AM
- Học sinh A join 8:05 AM → Late 5 phút
- Học sinh B join 8:00 AM → On time
- Học sinh C join 8:15 AM → Late 15 phút
- Học sinh A leave 9:30 AM → Early leave (class ends 10:00)

Report:
┌─────────────┬──────────┬──────────┬──────────┬────────────┐
│ Tên         │ Join     │ Leave    │ Duration │ Status     │
├─────────────┼──────────┼──────────┼──────────┼────────────┤
│ Học sinh A  │ 8:05 AM  │ 9:30 AM  │ 1h 25m   │ Late/Early │
│ Học sinh B  │ 8:00 AM  │ 10:00 AM │ 2h 00m   │ On time    │
│ Học sinh C  │ 8:15 AM  │ 10:00 AM │ 1h 45m   │ Late       │
└─────────────┴──────────┴──────────┴──────────┴────────────┘
```

**Implementation:**
```typescript
// src/lib/attendance.ts
interface AttendanceRecord {
  userId: string
  userName: string
  joinTime: number
  leaveTime?: number
  duration?: number
  status: 'on-time' | 'late' | 'early-leave' | 'absent'
  lateMinutes?: number
}

export class AttendanceTracker {
  private records = new Map<string, AttendanceRecord>()
  private meetingStartTime: number
  
  constructor(startTime: number) {
    this.meetingStartTime = startTime
  }
  
  trackJoin(userId: string, userName: string) {
    const now = Date.now()
    const lateMinutes = Math.max(0, (now - this.meetingStartTime) / 60000)
    
    this.records.set(userId, {
      userId,
      userName,
      joinTime: now,
      status: lateMinutes > 5 ? 'late' : 'on-time',
      lateMinutes: lateMinutes > 5 ? lateMinutes : undefined
    })
    
    // Save to database
    database.saveAttendance(this.records.get(userId)!)
  }
  
  trackLeave(userId: string, meetingEndTime: number) {
    const record = this.records.get(userId)
    if (!record) return
    
    const now = Date.now()
    record.leaveTime = now
    record.duration = (now - record.joinTime) / 60000 // minutes
    
    // Check early leave (>10 minutes before end)
    if (now < meetingEndTime - 600000) {
      record.status = 'early-leave'
    }
    
    // Update database
    database.updateAttendance(record)
  }
  
  getReport(): AttendanceRecord[] {
    return Array.from(this.records.values())
  }
  
  exportCSV(): string {
    const records = this.getReport()
    const csv = [
      ['Tên', 'Thời gian vào', 'Thời gian ra', 'Thời lượng', 'Trạng thái', 'Trễ (phút)'],
      ...records.map(r => [
        r.userName,
        new Date(r.joinTime).toLocaleString(),
        r.leaveTime ? new Date(r.leaveTime).toLocaleString() : 'Đang trong phòng',
        r.duration ? `${Math.floor(r.duration)}m` : '-',
        r.status,
        r.lateMinutes?.toFixed(0) || '-'
      ])
    ].map(row => row.join(',')).join('\n')
    
    return csv
  }
}
```

**UI Component:**
```typescript
// src/components/AttendancePanel.tsx
export function AttendancePanel({ meetingId }: { meetingId: string }) {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  
  return (
    <div className="attendance-panel">
      <h3>📋 Điểm danh ({records.length})</h3>
      
      <div className="attendance-stats">
        <div className="stat">
          <span>✅ Đúng giờ</span>
          <span>{records.filter(r => r.status === 'on-time').length}</span>
        </div>
        <div className="stat">
          <span>⏰ Trễ</span>
          <span>{records.filter(r => r.status === 'late').length}</span>
        </div>
        <div className="stat">
          <span>⚠️ Về sớm</span>
          <span>{records.filter(r => r.status === 'early-leave').length}</span>
        </div>
      </div>
      
      <table className="attendance-table">
        <thead>
          <tr>
            <th>Tên</th>
            <th>Vào</th>
            <th>Ra</th>
            <th>Thời lượng</th>
            <th>Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {records.map(record => (
            <tr key={record.userId}>
              <td>{record.userName}</td>
              <td>{formatTime(record.joinTime)}</td>
              <td>{record.leaveTime ? formatTime(record.leaveTime) : '...'}</td>
              <td>{record.duration ? `${Math.floor(record.duration)}m` : '...'}</td>
              <td>
                <span className={`status-badge status-${record.status}`}>
                  {getStatusLabel(record.status)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <button onClick={exportAttendance}>
        📥 Xuất báo cáo
      </button>
    </div>
  )
}
```

**Thời gian:** 1-2 ngày  
**Impact:** ⭐⭐⭐⭐⭐

---

### 🔥 PRIORITY 2: Quiz/Poll trong Meeting (HIGH)
**Tại sao:** Giáo viên cần kiểm tra hiểu bài real-time

**Chức năng:**
- ✅ Create quiz/poll during meeting
- ✅ Multiple choice questions
- ✅ Real-time results
- ✅ Timer for quiz
- ✅ Auto-grade
- ✅ Show correct answers
- ✅ Export results

**Use case:**
```
Giáo viên: "Các em làm quiz này nhé!"
[Tạo quiz: "2 + 2 = ?" với 4 options]

Học sinh A chọn: 4 ✅
Học sinh B chọn: 5 ❌
Học sinh C chọn: 4 ✅

Kết quả real-time:
A: 25% (1 người)
B: 0% (0 người)
C: 75% (3 người) ✅ Đúng
D: 0% (0 người)
```

**Implementation:**
```typescript
// src/lib/quiz.ts
interface Quiz {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  duration: number // seconds
  createdAt: number
  responses: Map<string, number> // userId -> selectedOption
}

export class QuizManager {
  private activeQuiz: Quiz | null = null
  
  createQuiz(question: string, options: string[], correctAnswer: number, duration: number) {
    this.activeQuiz = {
      id: nanoid(),
      question,
      options,
      correctAnswer,
      duration,
      createdAt: Date.now(),
      responses: new Map()
    }
    
    // Broadcast to all participants via LiveKit Data Channel
    this.broadcastQuiz(this.activeQuiz)
    
    // Auto-close after duration
    setTimeout(() => {
      this.closeQuiz()
    }, duration * 1000)
  }
  
  submitAnswer(userId: string, selectedOption: number) {
    if (!this.activeQuiz) return
    
    this.activeQuiz.responses.set(userId, selectedOption)
    
    // Broadcast updated results
    this.broadcastResults()
  }
  
  closeQuiz() {
    if (!this.activeQuiz) return
    
    const results = this.getResults()
    
    // Save to database
    database.saveQuizResults(this.activeQuiz.id, results)
    
    // Broadcast final results with correct answer
    this.broadcastFinalResults(results)
    
    this.activeQuiz = null
  }
  
  getResults() {
    if (!this.activeQuiz) return null
    
    const total = this.activeQuiz.responses.size
    const correct = Array.from(this.activeQuiz.responses.values())
      .filter(answer => answer === this.activeQuiz!.correctAnswer)
      .length
    
    const optionCounts = new Array(this.activeQuiz.options.length).fill(0)
    this.activeQuiz.responses.forEach(answer => {
      optionCounts[answer]++
    })
    
    return {
      total,
      correct,
      correctPercentage: (correct / total) * 100,
      optionCounts,
      optionPercentages: optionCounts.map(count => (count / total) * 100)
    }
  }
}
```

**UI Component:**
```typescript
// src/components/QuizPanel.tsx
export function QuizPanel({ quiz, onSubmit }: { quiz: Quiz, onSubmit: (answer: number) => void }) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState(quiz.duration)
  
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(t => Math.max(0, t - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [])
  
  return (
    <div className="quiz-panel">
      <div className="quiz-header">
        <h3>📝 Quiz</h3>
        <div className="timer">⏱️ {timeLeft}s</div>
      </div>
      
      <div className="quiz-question">
        {quiz.question}
      </div>
      
      <div className="quiz-options">
        {quiz.options.map((option, index) => (
          <button
            key={index}
            className={`quiz-option ${selectedOption === index ? 'selected' : ''}`}
            onClick={() => setSelectedOption(index)}
            disabled={timeLeft === 0}
          >
            <span className="option-letter">{String.fromCharCode(65 + index)}</span>
            <span className="option-text">{option}</span>
          </button>
        ))}
      </div>
      
      <button
        className="btn btn-primary"
        onClick={() => selectedOption !== null && onSubmit(selectedOption)}
        disabled={selectedOption === null || timeLeft === 0}
      >
        Gửi câu trả lời
      </button>
    </div>
  )
}

// Teacher view - Results
export function QuizResults({ results }: { results: QuizResults }) {
  return (
    <div className="quiz-results">
      <h3>📊 Kết quả Quiz</h3>
      
      <div className="results-summary">
        <div className="stat">
          <span>Tổng số</span>
          <span>{results.total}</span>
        </div>
        <div className="stat">
          <span>Đúng</span>
          <span className="text-success">{results.correct}</span>
        </div>
        <div className="stat">
          <span>Tỷ lệ</span>
          <span>{results.correctPercentage.toFixed(1)}%</span>
        </div>
      </div>
      
      <div className="results-chart">
        {results.optionPercentages.map((percentage, index) => (
          <div key={index} className="result-bar">
            <span className="option-label">{String.fromCharCode(65 + index)}</span>
            <div className="bar-container">
              <div 
                className="bar-fill" 
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="percentage">{percentage.toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

**Thời gian:** 2-3 ngày  
**Impact:** ⭐⭐⭐⭐⭐

---

### 🔥 PRIORITY 3: Whiteboard (HIGH)
**Tại sao:** Giáo viên cần vẽ/giải thích

**Chức năng:**
- ✅ Collaborative whiteboard
- ✅ Drawing tools (pen, eraser, shapes)
- ✅ Text tool
- ✅ Colors & sizes
- ✅ Undo/Redo
- ✅ Clear all
- ✅ Save as image
- ✅ Real-time sync

**Implementation:**
```typescript
// Use Excalidraw or Tldraw library
import { Excalidraw } from '@excalidraw/excalidraw'

export function WhiteboardPanel() {
  const [excalidrawAPI, setExcalidrawAPI] = useState(null)
  
  const handleChange = (elements, appState) => {
    // Broadcast changes via LiveKit Data Channel
    broadcastWhiteboardUpdate(elements, appState)
  }
  
  return (
    <div className="whiteboard-panel">
      <Excalidraw
        ref={setExcalidrawAPI}
        onChange={handleChange}
        initialData={{
          elements: [],
          appState: { viewBackgroundColor: '#ffffff' }
        }}
      />
    </div>
  )
}
```

**Thời gian:** 2-3 ngày (nếu dùng library)  
**Impact:** ⭐⭐⭐⭐

---

### 🔥 PRIORITY 4: Recording & Playback (MEDIUM)
**Tại sao:** Học sinh muốn xem lại bài giảng

**Chức năng:**
- ✅ Record meeting (video + audio)
- ✅ Record screen share
- ✅ Record AI detections
- ✅ Cloud storage (S3/Firebase)
- ✅ Playback with timeline
- ✅ Download recording
- ✅ Share recording link

**Implementation:**
```typescript
// Use LiveKit Recording API
import { RoomServiceClient } from 'livekit-server-sdk'

export async function startRecording(roomName: string) {
  const client = new RoomServiceClient(
    process.env.LIVEKIT_API_URL!,
    process.env.LIVEKIT_API_KEY!,
    process.env.LIVEKIT_API_SECRET!
  )
  
  const recording = await client.startRoomCompositeEgress(roomName, {
    file: {
      filepath: `recordings/${roomName}-${Date.now()}.mp4`
    },
    layout: 'grid'
  })
  
  return recording
}

export async function stopRecording(egressId: string) {
  const client = new RoomServiceClient(...)
  await client.stopEgress(egressId)
}
```

**Note:** LiveKit Recording cần LiveKit Cloud Pro plan ($29/month) hoặc self-hosted

**Thời gian:** 3-4 ngày  
**Impact:** ⭐⭐⭐⭐

---

### 🔥 PRIORITY 5: Breakout Rooms (MEDIUM)
**Tại sao:** Group work

**Chức năng:**
- ✅ Create multiple breakout rooms
- ✅ Auto-assign or manual assign
- ✅ Timer for breakout
- ✅ Broadcast message to all rooms
- ✅ Teacher can join any room
- ✅ Return to main room

**Implementation:**
```typescript
// src/lib/breakout.ts
interface BreakoutRoom {
  id: string
  name: string
  participants: string[]
  roomCode: string
}

export class BreakoutManager {
  private rooms: BreakoutRoom[] = []
  
  createRooms(count: number, participants: string[]) {
    // Create N rooms
    for (let i = 0; i < count; i++) {
      this.rooms.push({
        id: nanoid(),
        name: `Room ${i + 1}`,
        participants: [],
        roomCode: generateRoomCode()
      })
    }
    
    // Auto-assign participants
    this.autoAssign(participants)
  }
  
  autoAssign(participants: string[]) {
    participants.forEach((userId, index) => {
      const roomIndex = index % this.rooms.length
      this.rooms[roomIndex].participants.push(userId)
    })
  }
  
  moveParticipant(userId: string, toRoomId: string) {
    // Remove from current room
    this.rooms.forEach(room => {
      room.participants = room.participants.filter(id => id !== userId)
    })
    
    // Add to new room
    const room = this.rooms.find(r => r.id === toRoomId)
    if (room) {
      room.participants.push(userId)
    }
  }
  
  broadcastMessage(message: string) {
    // Send message to all breakout rooms
    this.rooms.forEach(room => {
      sendMessageToRoom(room.roomCode, message)
    })
  }
  
  closeAllRooms() {
    // Return all participants to main room
    this.rooms.forEach(room => {
      room.participants.forEach(userId => {
        redirectToMainRoom(userId)
      })
    })
    
    this.rooms = []
  }
}
```

**Thời gian:** 3-4 ngày  
**Impact:** ⭐⭐⭐

---

### 🔥 PRIORITY 6: File Sharing (MEDIUM)
**Tại sao:** Chia sẻ tài liệu trong meeting

**Chức năng:**
- ✅ Upload files (PDF, images, docs)
- ✅ Preview files
- ✅ Download files
- ✅ File list panel
- ✅ Max file size limit

**Implementation:**
```typescript
// src/lib/file-sharing.ts
export async function uploadFile(file: File, meetingId: string) {
  // Upload to Firebase Storage or S3
  const storageRef = ref(storage, `meetings/${meetingId}/${file.name}`)
  const snapshot = await uploadBytes(storageRef, file)
  const downloadURL = await getDownloadURL(snapshot.ref)
  
  // Save metadata to database
  await database.saveFile({
    meetingId,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    downloadURL,
    uploadedBy: currentUser.id,
    uploadedAt: Date.now()
  })
  
  // Broadcast to all participants
  broadcastFileShared(downloadURL, file.name)
  
  return downloadURL
}
```

**Thời gian:** 1-2 ngày  
**Impact:** ⭐⭐⭐

---

### 🔥 PRIORITY 7: Raise Hand Queue (LOW)
**Tại sao:** Quản lý học sinh muốn phát biểu

**Chức năng:**
- ✅ Raise hand button
- ✅ Queue list (FIFO)
- ✅ Teacher can call on student
- ✅ Auto-unmute when called
- ✅ Notification sound

**Implementation:**
```typescript
// src/lib/raise-hand.ts
interface RaiseHandEntry {
  userId: string
  userName: string
  timestamp: number
}

export class RaiseHandManager {
  private queue: RaiseHandEntry[] = []
  
  raiseHand(userId: string, userName: string) {
    // Check if already in queue
    if (this.queue.some(entry => entry.userId === userId)) {
      return
    }
    
    this.queue.push({
      userId,
      userName,
      timestamp: Date.now()
    })
    
    // Notify teacher
    notifyTeacher(`${userName} giơ tay`)
    
    // Broadcast updated queue
    this.broadcastQueue()
  }
  
  lowerHand(userId: string) {
    this.queue = this.queue.filter(entry => entry.userId !== userId)
    this.broadcastQueue()
  }
  
  callOnStudent(userId: string) {
    const entry = this.queue.find(e => e.userId === userId)
    if (!entry) return
    
    // Remove from queue
    this.lowerHand(userId)
    
    // Notify student
    notifyStudent(userId, 'Giáo viên đã gọi bạn phát biểu')
    
    // Auto-unmute (if teacher has permission)
    unmuteParticipant(userId)
  }
  
  getQueue(): RaiseHandEntry[] {
    return this.queue.sort((a, b) => a.timestamp - b.timestamp)
  }
}
```

**UI Component:**
```typescript
export function RaiseHandQueue({ queue, onCallStudent }: Props) {
  return (
    <div className="raise-hand-queue">
      <h3>✋ Giơ tay ({queue.length})</h3>
      
      {queue.length === 0 ? (
        <p className="empty-state">Chưa có ai giơ tay</p>
      ) : (
        <ul className="queue-list">
          {queue.map((entry, index) => (
            <li key={entry.userId} className="queue-item">
              <span className="queue-number">{index + 1}</span>
              <span className="queue-name">{entry.userName}</span>
              <span className="queue-time">{formatTimeAgo(entry.timestamp)}</span>
              <button 
                className="btn-call"
                onClick={() => onCallStudent(entry.userId)}
              >
                📞 Gọi
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

**Thời gian:** 0.5-1 ngày  
**Impact:** ⭐⭐⭐

---

### 🔥 PRIORITY 8: Calendar Integration (LOW)
**Tại sao:** Schedule meetings trước

**Chức năng:**
- ✅ Schedule meeting
- ✅ Recurring meetings
- ✅ Email reminders
- ✅ Google Calendar sync
- ✅ iCal export

**Thời gian:** 2-3 ngày  
**Impact:** ⭐⭐

---

### 🔥 PRIORITY 9: Multi-language Support (LOW)
**Tại sao:** International users

**Chức năng:**
- ✅ Vietnamese (default)
- ✅ English
- ✅ Auto-detect browser language
- ✅ Language switcher

**Implementation:**
```typescript
// Use next-intl or react-i18next
import { useTranslations } from 'next-intl'

export function Component() {
  const t = useTranslations('Meeting')
  
  return (
    <div>
      <h1>{t('title')}</h1>
      <button>{t('join')}</button>
    </div>
  )
}
```

**Thời gian:** 2-3 ngày  
**Impact:** ⭐⭐

---

## 📋 ROADMAP KHUYẾN NGHỊ

### 🚀 PHASE 1: Core Features (Week 1-2)
**Mục tiêu:** Thêm features quan trọng nhất

**Week 1:**
- Day 1-2: Attendance Tracking (Priority 1)
- Day 3-5: Quiz/Poll (Priority 2)

**Week 2:**
- Day 6-8: Whiteboard (Priority 3)
- Day 9-10: Raise Hand Queue (Priority 7)

**Kết quả:** 4 features mới, impact cao

---

### 🎯 PHASE 2: Advanced Features (Week 3-4)
**Mục tiêu:** Thêm features nâng cao

**Week 3:**
- Day 11-14: Recording & Playback (Priority 4)

**Week 4:**
- Day 15-18: Breakout Rooms (Priority 5)
- Day 19-20: File Sharing (Priority 6)

**Kết quả:** 3 features nâng cao

---

### 🌟 PHASE 3: Polish (Week 5)
**Mục tiêu:** Hoàn thiện

- Calendar Integration (Priority 8)
- Multi-language (Priority 9)
- Bug fixes
- Performance optimization

---

## 💡 KHUYẾN NGHỊ

### Làm NGAY (Week 1-2):
1. ✅ **Attendance Tracking** (1-2 ngày) - CRITICAL
2. ✅ **Quiz/Poll** (2-3 ngày) - HIGH IMPACT
3. ✅ **Raise Hand Queue** (0.5-1 ngày) - QUICK WIN

**Lý do:**
- Đây là 3 features quan trọng nhất cho giáo dục
- Tương đối dễ implement
- Impact cao
- Tổng thời gian: ~5 ngày

### Làm SAU (Week 3-4):
4. ✅ Whiteboard
5. ✅ Recording & Playback
6. ✅ File Sharing

### Làm NẾU CÓ THỜI GIAN:
7. Breakout Rooms
8. Calendar Integration
9. Multi-language

---

## 🎯 SO SÁNH VỚI COMPETITORS

### Zoom:
- ✅ Có: Recording, Breakout rooms, Whiteboard, Polls
- ❌ Không có: AI behavior detection

### Google Meet:
- ✅ Có: Recording, Polls, Captions
- ❌ Không có: AI behavior detection, Whiteboard

### **Edu Insight Meet (sau khi cải thiện):**
- ✅ Có: AI behavior detection (UNIQUE)
- ✅ Có: Attendance tracking (UNIQUE)
- ✅ Có: Quiz/Poll
- ✅ Có: Whiteboard
- ✅ Có: Raise hand queue
- ⏳ Sắp có: Recording, Breakout rooms

**Competitive Advantage:** AI + Education-focused features

---

## 🚀 BẮT ĐẦU TỪ ĐÂU?

Tôi khuyến nghị bắt đầu với **Attendance Tracking** vì:
1. ✅ Quan trọng nhất (giáo viên cần nhất)
2. ✅ Tương đối dễ implement (1-2 ngày)
3. ✅ Impact cao
4. ✅ Không phụ thuộc external services

**Hoặc** bắt đầu với **Raise Hand Queue** (0.5-1 ngày) để có kết quả nhanh!

---

## 📊 BẠN MUỐN LÀM GÌ TIẾP?

1. 🚀 **Implement Attendance Tracking** (1-2 ngày, critical)
2. 📝 **Implement Quiz/Poll** (2-3 ngày, high impact)
3. ✋ **Implement Raise Hand Queue** (0.5-1 ngày, quick win)
4. 🎨 **Implement Whiteboard** (2-3 ngày, impressive)
5. 📊 **Xem code example chi tiết** cho một feature

Hãy cho tôi biết bạn muốn bắt đầu từ đâu! 😊
