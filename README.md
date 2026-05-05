# Edu-Insight Meet

Video call cho lớp học có AI nhận diện hành vi học sinh, chạy hoàn toàn
trên trình duyệt. LiveKit (WebRTC) + TensorFlow.js MoveNet.

## Quick start

```bash
npm install
cp .env.example .env.local       # điền LiveKit credentials
npm run dev                      # http://localhost:3010
```

Lấy LiveKit credentials free tại <https://cloud.livekit.io>. Hướng dẫn chi
tiết: [LIVEKIT_SETUP.md](LIVEKIT_SETUP.md).

## Tài khoản test có sẵn

Khi mở `/auth` lần đầu, 4 account được tự seed vào localStorage. Click
panel quick-fill để login ngay (không cần gõ tay):

| Email | Mật khẩu | Vai trò |
|-------|----------|---------|
| `gv1@test.local` | `test1234` | Giáo viên |
| `gv2@test.local` | `test1234` | Giáo viên |
| `hs1@test.local` | `test1234` | Học sinh |
| `hs2@test.local` | `test1234` | Học sinh |

## Stack

- Next.js 16 + React 18 + TypeScript
- LiveKit Cloud (WebRTC SFU + TURN, hosted)
- TensorFlow.js + MoveNet — chạy **trên trình duyệt** (không gửi video lên server)
- localStorage cho auth, in-memory cho session state

## Kiến trúc

Mỗi participant chạy MoveNet trên **video của chính mình**, phát label
(không phải frame) qua LiveKit data channel. Teacher tổng hợp label mà
không bao giờ xử lý video remote cho AI. Chi tiết:
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Test 2 máy khác mạng

```bash
npx ngrok http 3010
```

Ngrok cho 1 URL public. Mở URL đó trên 2 máy (laptop wifi + điện thoại
4G chẳng hạn), tạo phòng ở máy 1, join bằng cùng code/link ở máy 2.

## Tài liệu

- [docs/TESTING.md](docs/TESTING.md) — guide test thống nhất duy nhất
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — kiến trúc + privacy model
- [docs/ROADMAP.md](docs/ROADMAP.md) — roadmap + những gì đã thử FAIL

## Layout

```
src/
├── app/         Next.js routes (auth, dashboard, history, settings, meet/[code], join/[code], api/meet/...)
├── components/  AIBehaviorDetector, VideoGrid, ControlBar, EngagementChart, MeetingInsights, ...
├── contexts/    AuthContext, MeetingContext
└── lib/         ai-detector, behaviorChannel, behaviorStore, crypto, settingsStore, export, utils, logger
```
