# Edu-Insight Meet — Architecture

App video call cho lớp học có AI nhận diện hành vi. Local-only mode (không
backend). Tất cả state ở phía client.

## High-level

```
┌──────────────┐     audio/video (SFU)        ┌──────────────┐
│  Học sinh    │◀────────────────────────────▶│  Giáo viên   │
│  Browser     │                              │  /Học sinh B │
│              │                              │  Browser     │
│  • MoveNet   │  data channel (JSON labels)  │              │
│    chạy trên │─────────────────────────────▶│  • Subscribe │
│    video     │                              │    labels    │
│    cá nhân   │                              │  • Hiển thị  │
│  • Phát label│                              │    realtime  │
└──────────────┘                              └──────────────┘
       │                                              │
       └──── LiveKit Cloud (WebRTC SFU + TURN) ───────┘
       │                                              │
       └────  Next.js API (cấp LiveKit token) ────────┘
```

## Privacy-by-design

Mỗi participant chạy MoveNet (`@tensorflow-models/pose-detection`) trên
video **của chính mình**. Giáo viên không nhận hay xử lý frame video của
học sinh để chạy AI — chỉ nhận label đã được phát qua LiveKit data channel
(`topic: "edu-insight.behavior.v1"`).

Dữ liệu sinh trắc giữ trên thiết bị, là tính chất gốc của hệ thống chứ
không phải bổ sung sau.

## Auth & identity

Local-only. `AuthContext` lưu `users[]` trong `localStorage`, password băm
bằng PBKDF2-SHA256 (`src/lib/crypto.ts`). Khi mở `/auth` lần đầu, 4 tài
khoản test được seed sẵn (`gv1`/`gv2`/`hs1`/`hs2 @test.local`, password
`test1234`) để test nhanh.

Token API (`/api/meet/token`) chỉ validate format input rồi cấp LiveKit JWT
— không xác thực user thực sự (vì auth chỉ ở phía client). Đủ cho
demo/single-device. Khi cần production thực sự, đẩy auth lên backend (đề
xuất Supabase / Auth.js) và verify JWT ở token API trước khi cấp.

`/api/meet/guest-token` cho phép join qua link `/join/[code]` không cần
đăng ký — flow giống Zoom/Meet.

## Data flow per session

1. Login (localStorage). Hoặc bypass = vào thẳng `/join/[code]` qua share
   link.
2. Tạo / vào phòng. `MeetingContext` chỉ giữ `currentMeetingId` in-memory,
   không có DB write.
3. `POST /api/meet/token` (auth) hoặc `/api/meet/guest-token` (anon) trả
   về LiveKit token cho `roomName`.
4. `LiveKitRoom` connect tới LiveKit Cloud (SFU + TURN tự built-in).
5. `AIBehaviorDetector` chạy MoveNet trên video local ở ~2fps (adaptive
   theo CPU — `intervalMsRef` tự điều chỉnh trong [350ms, 1500ms]).
6. Khi label thay đổi:
   - Phát `BehaviorMessageV1` qua data channel
     (`src/lib/behaviorChannel.ts`).
   - Lưu vào `behaviorStore` in-memory.
7. Giáo viên mount `BehaviorReceiver` để subscribe topic, đẩy vào cùng
   `behaviorStore` (qua `addStudentBehavior`).
8. `DistractionAlerts` (chỉ teacher) theo dõi `behaviorStore` và toast
   cảnh báo khi học sinh ở trạng thái `negative`/`sleeping` >2 phút.
9. Vào History thấy chart + insights của session hiện tại. Ra khỏi
   browser = mất data. **Xuất CSV trước khi rời** nếu muốn lưu.

## Component map

| Layer            | Files                                                     |
|------------------|-----------------------------------------------------------|
| Auth             | `contexts/AuthContext.tsx`, `lib/crypto.ts`               |
| Meeting state    | `contexts/MeetingContext.tsx`                             |
| AI inference     | `lib/ai-detector.ts`, `components/AIBehaviorDetector.tsx` |
| Wire protocol    | `lib/behaviorChannel.ts`                                  |
| Teacher receive  | `components/BehaviorReceiver.tsx`                         |
| Live store       | `lib/behaviorStore.ts` (in-memory, current session)       |
| LiveKit token    | `app/api/meet/token/route.ts` (auth path)                 |
|                  | `app/api/meet/guest-token/route.ts` (anonymous path)      |
| Room shell       | `app/meet/[code]/room/page.tsx`                           |
| Guest prejoin    | `app/join/[code]/page.tsx`                                |
| History          | `app/history/page.tsx` + `components/EngagementChart.tsx` |
|                  | + `components/MeetingInsights.tsx`                        |
| CSV export       | `lib/export.ts`                                           |
| Distraction alert| `components/DistractionAlerts.tsx`                        |

## Why transition-based logging

Naive 2 fps × N học sinh = ~216k row IndexedDB cho 1 buổi 60 phút × 30 hs.
Giải pháp: chỉ commit khi **label thay đổi**, giảm ~95% writes mà giữ
nguyên mọi state transition có ý nghĩa cho report.

## Known limitations

- AI là rule-based heuristics trên 17 keypoint MoveNet. Không phải Deep
  Learning classification. Không có dataset có nhãn để đo Macro-F1 thực.
- Không persistent cross-session: data mất khi đóng tab. Dùng CSV export
  để giữ.
- `/auth` localStorage không phù hợp production (XSS exfiltrate được).
- Settings page có 3 toggle "SẮP CÓ" (auto-record, auto-mute, dark mode)
  — UI có nhưng chưa wire logic.
