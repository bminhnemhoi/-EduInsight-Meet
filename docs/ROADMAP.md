# Roadmap

Trạng thái hiện tại: **local-only mode**, MVP demo-ready cho lớp học.

## Đã hoàn thành ✅

### Foundation
- AI architecture đúng với privacy-by-design: mỗi participant chạy MoveNet
  trên video của chính mình; teacher subscribe label qua LiveKit data
  channel, không nhận remote video frame
- Transition-based persistence (giảm ~95% writes vs naive 2fps×N)
- AI label commit ngay khi đổi (không filter confidence, không yêu cầu
  N-frame stability — đã thử và làm chậm rõ rệt)
- Adaptive FPS [350ms, 1500ms] tự điều chỉnh theo CPU
- AI badge compact ở góc dưới-trái (không che video)

### Auth + meeting flow
- Local PBKDF2 password + 4 test accounts seed sẵn (gv1/gv2/hs1/hs2)
- `/api/meet/token` (auth) + `/api/meet/guest-token` (anonymous)
- `/join/[code]` cho học sinh vào không cần đăng ký (chỉ nhập tên)
- Tạo phòng → hiện share link copy-able cho teacher

### In-room
- LiveKit room + VideoTile có speaking indicator (viền xanh)
- ControlBar gọn (mic, cam, share, copy code, rời phòng)
- Distraction alert toast khi học sinh phân tâm >2 phút

### History
- In-memory current session display
- EngagementChart SVG (memoized)
- MeetingInsights — peak focus, top distractions, best/least engaged
  (memoized)
- CSV export (UTF-8 BOM, mở Excel đúng tiếng Việt)

## Phase 1 thử rồi revert (đã archive)

Đã thử setup Supabase backend (Phase 1), nhưng:
- Login từ VN → Tokyo timeout không chấp nhận được trên mạng yếu
- Bắt học sinh đăng ký mới vào lớp = UX tệ
- User pause, yêu cầu quay về local-only

Code Supabase đã xoá hoàn toàn. Có thể revisit khi cần persist
cross-device thật, nhưng cần thiết kế lại flow auth (cache session,
không round-trip mỗi lần load).

## Đã thử FAIL (không lặp lại)

- **Downsample video 256×192 trước MoveNet** — tăng tốc nhưng giảm độ
  chính xác keypoint, AI tệ rõ rệt. MoveNet tự resize internal tốt hơn.
- **Filter MIN_CONFIDENCE = 0.45–0.7** — chặn label commit, AI im lặng.
- **Yêu cầu 2 frame liên tiếp giống nhau** — tăng delay, label flip
  không bao giờ commit.
- **Push Supabase auth làm core dependency** — mạng VN→Tokyo chậm, login
  timeout 15s rồi 30s.

## Tiếp theo — nếu đi cuộc thi (Tech Startup Challenger 2026)

### Phải có (blocker)
- [ ] Pitch deck 10–12 slides
- [ ] Video demo 2-3 phút (kịch bản đã có ở `KichBan_Video_3_Phut.md`)
- [ ] Deploy URL public (Vercel free tier)

### Nên có
- [ ] Rewrite paper Tiếng Việt — bỏ từ ngữ khoa trương, đặt lại số liệu
  thật (hoặc xoá Macro-F1 claim nếu chưa đo)
- [ ] Logo/branding tối thiểu

### Có thể (lợi thế)
- [ ] Eval AI có dataset thật + confusion matrix (30–50 clip có nhãn)
- [ ] PDF report đẹp (parent-friendly)
- [ ] Wire dark mode hoặc xoá toggle "SẮP CÓ"

## Quality polish có thể làm trong code (không động flow)

- Bug list (xem từ smoke test): hiện chưa có bug critical đã biết
- 4 npm vulnerabilities (2 moderate, 2 high) — chạy `npm audit` xem
  có cần fix không (transitive deps thường không phá build)
- `meeting/` route có vẻ trùng `dashboard/` — verify cần thiết hay xoá
- Mobile responsive cho `/meet/[code]/room` (hiện desktop-first)
