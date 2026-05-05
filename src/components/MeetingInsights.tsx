'use client'

import { memo, useMemo } from 'react'

interface Behavior {
  userId: string
  userName: string
  behavior: string
  type: 'positive' | 'negative' | 'neutral' | 'warning'
  timestamp: number
}

interface Props {
  events: Behavior[]
}

interface UserStats {
  userId: string
  userName: string
  total: number
  positive: number
}

interface PeakWindow {
  startMs: number
  engagementPct: number
}

const FIVE_MIN = 5 * 60 * 1000

function findPeakWindow(events: Behavior[]): PeakWindow | null {
  if (events.length === 0) return null
  const sorted = [...events].sort((a, b) => a.timestamp - b.timestamp)
  const start = sorted[0].timestamp
  const end = sorted[sorted.length - 1].timestamp
  if (end - start < FIVE_MIN) {
    // Too short for windowed analysis; just return overall positive ratio.
    const pos = sorted.filter((e) => e.type === 'positive').length
    return { startMs: 0, engagementPct: (pos / sorted.length) * 100 }
  }

  let bestStart = 0
  let bestPct = -1
  // Slide a 5-minute window every 30s.
  const step = 30_000
  for (let t = start; t + FIVE_MIN <= end; t += step) {
    const inWin = sorted.filter(
      (e) => e.timestamp >= t && e.timestamp < t + FIVE_MIN
    )
    if (inWin.length === 0) continue
    const pos = inWin.filter((e) => e.type === 'positive').length
    const pct = (pos / inWin.length) * 100
    if (pct > bestPct) {
      bestPct = pct
      bestStart = t - start
    }
  }
  return bestPct < 0 ? null : { startMs: bestStart, engagementPct: bestPct }
}

function topDistractionLabels(events: Behavior[]): { label: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const e of events) {
    if (e.type === 'negative' || e.type === 'warning') {
      counts.set(e.behavior, (counts.get(e.behavior) || 0) + 1)
    }
  }
  return Array.from(counts, ([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
}

function userStats(events: Behavior[]): UserStats[] {
  const m = new Map<string, UserStats>()
  for (const e of events) {
    let s = m.get(e.userId)
    if (!s) {
      s = { userId: e.userId, userName: e.userName, total: 0, positive: 0 }
      m.set(e.userId, s)
    }
    s.total += 1
    if (e.type === 'positive') s.positive += 1
  }
  return Array.from(m.values()).filter((s) => s.total >= 3)
}

function formatOffset(ms: number): string {
  if (ms < 60_000) return `${Math.round(ms / 1000)} giây`
  return `phút ${Math.round(ms / 60_000)}`
}

/**
 * Heuristic insights surfaced from a single meeting's behavior events.
 * Designed to give teachers quick takeaways without making them dig
 * through the timeline.
 */
function MeetingInsightsImpl({ events }: Props) {
  // Heavy aggregation; recompute only when events change.
  const computed = useMemo(() => {
    if (events.length === 0) return null
    const peak = findPeakWindow(events)
    const distractions = topDistractionLabels(events)
    const users = userStats(events)
    const mostEngaged =
      users.length > 0
        ? users
            .map((u) => ({ ...u, pct: (u.positive / u.total) * 100 }))
            .sort((a, b) => b.pct - a.pct)[0]
        : null
    const leastEngaged =
      users.length > 1
        ? users
            .map((u) => ({ ...u, pct: (u.positive / u.total) * 100 }))
            .sort((a, b) => a.pct - b.pct)[0]
        : null
    return { peak, distractions, mostEngaged, leastEngaged }
  }, [events])

  if (!computed) return null
  const { peak, distractions, mostEngaged, leastEngaged } = computed

  const cards: { title: string; body: string; icon: string; color: string }[] = []

  if (peak) {
    cards.push({
      title: 'Khoảnh khắc tập trung cao nhất',
      body: peak.startMs === 0
        ? `Cả buổi đạt mức tập trung trung bình ${peak.engagementPct.toFixed(0)}%`
        : `Bắt đầu khoảng ${formatOffset(peak.startMs)} — ${peak.engagementPct.toFixed(0)}% học sinh tập trung trong 5 phút sau đó`,
      icon: '🎯',
      color: '#10b981',
    })
  }

  if (distractions.length > 0) {
    cards.push({
      title: 'Phân tâm phổ biến nhất',
      body: distractions
        .map((d) => `${d.label} (${d.count} lần)`)
        .join(', '),
      icon: '⚠️',
      color: '#f59e0b',
    })
  }

  if (mostEngaged) {
    cards.push({
      title: 'Tập trung tốt nhất',
      body: `${mostEngaged.userName} — ${mostEngaged.pct.toFixed(0)}% tích cực`,
      icon: '⭐',
      color: '#3b82f6',
    })
  }

  if (leastEngaged && leastEngaged.userId !== mostEngaged?.userId) {
    cards.push({
      title: 'Cần chú ý',
      body: `${leastEngaged.userName} — ${leastEngaged.pct.toFixed(0)}% tích cực; có thể cần hỗ trợ thêm`,
      icon: '🔍',
      color: '#ef4444',
    })
  }

  if (cards.length === 0) return null

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '0.75rem',
      }}
    >
      {cards.map((c, i) => (
        <div
          key={i}
          style={{
            padding: '0.875rem 1rem',
            background: `${c.color}10`,
            border: `1px solid ${c.color}33`,
            borderLeft: `4px solid ${c.color}`,
            borderRadius: 12,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.375rem',
            }}
          >
            <span style={{ fontSize: '1.125rem' }}>{c.icon}</span>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: c.color,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              {c.title}
            </span>
          </div>
          <div
            style={{
              fontSize: '0.875rem',
              color: 'var(--text-primary)',
              lineHeight: 1.4,
            }}
          >
            {c.body}
          </div>
        </div>
      ))}
    </div>
  )
}

const MeetingInsights = memo(MeetingInsightsImpl)
export default MeetingInsights
