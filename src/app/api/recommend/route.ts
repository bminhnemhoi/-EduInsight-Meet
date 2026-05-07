import { NextRequest, NextResponse } from 'next/server'
import { logger } from '../../../lib/logger'

/**
 * Tier 3: Gemini-powered end-of-session recommendations.
 *
 * Client posts a compact text summary of the meeting (engagement timeline,
 * per-student stats, voice activity). Server forwards to Gemini 2.5 Flash
 * with a structured prompt and returns parsed JSON to the client.
 *
 * Privacy: only TEXT is sent to Gemini. No video frames, no face data, no
 * audio. The summary itself is generated client-side from in-memory stats.
 *
 * Free-tier friendly: a typical request is ~1-3k tokens in, ~500 tokens
 * out → comfortable inside the 1500/day Gemini Flash free quota.
 */

const GEMINI_MODEL = process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

const RATE_WINDOW_MS = 60_000
const RATE_LIMIT = 10
const recentRequests = new Map<string, number[]>()

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}

function rateLimited(ip: string): boolean {
  const now = Date.now()
  const cutoff = now - RATE_WINDOW_MS
  const hits = (recentRequests.get(ip) || []).filter((t) => t > cutoff)
  hits.push(now)
  recentRequests.set(ip, hits)
  return hits.length > RATE_LIMIT
}

const TEACHER_PROMPT = `Bạn là trợ lý sư phạm AI cho giáo viên Việt Nam dạy online.
Bạn nhận được tóm tắt 1 buổi học bao gồm: timeline engagement, danh sách học sinh, hành vi quan sát được, thời gian phát biểu.

NHIỆM VỤ: Trả lời JSON đúng schema sau (không markdown, không text giải thích bên ngoài JSON):
{
  "overallEngagement": <số 0-100>,
  "summary": "<1-2 câu tóm tắt buổi học>",
  "keyMoments": [
    { "timeOffset": "<vd: phút 12-15>", "observation": "<gì xảy ra>", "suggestion": "<đề xuất cụ thể>" }
  ],
  "perStudentInsights": [
    { "name": "<tên>", "pattern": "<mẫu hành vi>", "recommendation": "<gợi ý cá nhân hoá>" }
  ],
  "nextSessionTips": ["<gợi ý 1>", "<gợi ý 2>", "<gợi ý 3>"]
}

GUIDELINES:
- Tối đa 3 keyMoments, 5 perStudentInsights, 3 nextSessionTips
- Mỗi field <= 200 ký tự, ngôn ngữ Tiếng Việt tự nhiên
- Đề xuất phải CỤ THỂ và có ích (không generic như "tăng tương tác")
- Nếu data không đủ kết luận, trả "summary" giải thích lý do và mảng rỗng cho keyMoments/perStudentInsights/nextSessionTips`

const STUDENT_PROMPT = `Bạn là gia sư AI thân thiện đang giúp 1 học sinh Việt Nam tự nhìn lại buổi học vừa qua của em.
Bạn nhận được tóm tắt hành vi và mức độ tập trung CỦA RIÊNG học sinh này trong 1 buổi học online.

NHIỆM VỤ: Trả lời JSON đúng schema sau (không markdown, không text bên ngoài JSON):
{
  "overallEngagement": <số 0-100, là engagement % của riêng em>,
  "summary": "<1-2 câu tóm tắt buổi học của em, giọng văn động viên, ngôi 'em'>",
  "keyMoments": [
    { "timeOffset": "<vd: phút 5-10>", "observation": "<em đã làm gì>", "suggestion": "<gợi ý cải thiện cho em>" }
  ],
  "perStudentInsights": [
    { "name": "<tên em>", "pattern": "<mẫu hành vi tốt/cần cải thiện>", "recommendation": "<gợi ý cá nhân>" }
  ],
  "nextSessionTips": ["<bí quyết 1 cho em>", "<bí quyết 2>", "<bí quyết 3>"]
}

GUIDELINES:
- Giọng văn ấm áp, khích lệ, gọi học sinh là "em"
- Tối đa 3 keyMoments, 1 perStudentInsights (chỉ về em), 3 nextSessionTips
- Tip phải hành động được (vd "thử giải lao 5 phút sau mỗi 25 phút"), không phải lời khuyên chung chung
- Nếu thấy hành vi tốt, KHEN cụ thể; nếu cần cải thiện, gợi ý nhẹ nhàng không phán xét`

interface SessionSummary {
  durationMinutes?: number
  totalParticipants?: number
  engagementTimeline?: Array<{ minute: number; positivePct: number }>
  students?: Array<{
    name: string
    focusedPct: number
    distractedPct: number
    sleepingPct: number
    speakingTimeSec: number
    behaviors: string[]
  }>
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    if (rateLimited(ip)) {
      return NextResponse.json({ error: 'Quá nhiều yêu cầu' }, { status: 429 })
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim()
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            'GEMINI_API_KEY chưa được cấu hình trên server. Hãy lấy key tại https://aistudio.google.com/apikey và thêm vào Vercel env.',
        },
        { status: 503 }
      )
    }

    const body = (await req.json().catch(() => null)) as {
      summary?: SessionSummary
      mode?: 'teacher' | 'student'
    } | null
    if (!body || typeof body !== 'object' || !body.summary) {
      return NextResponse.json(
        { error: 'Body phải có field "summary"' },
        { status: 400 }
      )
    }

    const mode: 'teacher' | 'student' =
      body.mode === 'student' ? 'student' : 'teacher'
    const systemPrompt = mode === 'student' ? STUDENT_PROMPT : TEACHER_PROMPT

    // Format the summary as plain text — keeps the prompt small and clear.
    const userPrompt = formatSummaryAsText(body.summary)

    const geminiRes = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.4,
          // 2048 leaves room for full Vietnamese output (≈ 1.5x token-per-char
          // vs English) with all sections populated. 1024 was getting cut.
          maxOutputTokens: 2048,
        },
      }),
    })

    if (!geminiRes.ok) {
      const errText = await geminiRes.text()
      logger.error('[recommend] Gemini error', geminiRes.status, errText)
      return NextResponse.json(
        { error: `Gemini API lỗi (${geminiRes.status})`, detail: errText.slice(0, 500) },
        { status: 502 }
      )
    }

    const data = (await geminiRes.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> }
      }>
    }
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) {
      return NextResponse.json(
        { error: 'Gemini trả về response rỗng' },
        { status: 502 }
      )
    }

    let parsed
    try {
      parsed = JSON.parse(text)
    } catch {
      logger.warn('[recommend] Gemini returned non-JSON, raw:', text.slice(0, 300))
      return NextResponse.json(
        { error: 'Gemini trả về không đúng JSON', raw: text.slice(0, 500) },
        { status: 502 }
      )
    }

    return NextResponse.json({ ok: true, recommendations: parsed })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error'
    logger.error('[recommend] Unhandled', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

function formatSummaryAsText(s: SessionSummary): string {
  const lines: string[] = []
  if (s.durationMinutes != null)
    lines.push(`Thời lượng buổi học: ${s.durationMinutes} phút`)
  if (s.totalParticipants != null)
    lines.push(`Số người tham gia: ${s.totalParticipants}`)

  if (s.engagementTimeline && s.engagementTimeline.length > 0) {
    lines.push('')
    lines.push('Timeline mức độ tập trung (% positive theo phút):')
    for (const point of s.engagementTimeline) {
      lines.push(`  - Phút ${point.minute}: ${point.positivePct}%`)
    }
  }

  if (s.students && s.students.length > 0) {
    lines.push('')
    lines.push('Chi tiết học sinh:')
    for (const st of s.students) {
      lines.push(
        `  • ${st.name}: tập trung ${st.focusedPct}%, mất tập trung ${st.distractedPct}%, buồn ngủ ${st.sleepingPct}%, đã nói ${Math.round(st.speakingTimeSec)} giây`
      )
      if (st.behaviors.length > 0) {
        lines.push(
          `    Hành vi quan sát: ${st.behaviors.slice(0, 5).join(', ')}`
        )
      }
    }
  }

  return lines.join('\n')
}
