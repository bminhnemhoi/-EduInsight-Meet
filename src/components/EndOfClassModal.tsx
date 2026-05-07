'use client'

import { useState, useMemo } from 'react'
import { behaviorStore } from '../lib/behaviorStore'
import { voiceActivityStore, formatSpeakingTime } from '../lib/voiceActivity'
import { settingsStore } from '../lib/settingsStore'
import { classifyBehavior } from '../lib/utils'
import { buildBehaviorCSV, downloadCSV } from '../lib/export'
import { logger } from '../lib/logger'

interface KeyMoment {
  timeOffset: string
  observation: string
  suggestion: string
}

interface PerStudentInsight {
  name: string
  pattern: string
  recommendation: string
}

interface Recommendations {
  overallEngagement: number
  summary: string
  keyMoments: KeyMoment[]
  perStudentInsights: PerStudentInsight[]
  nextSessionTips: string[]
}

interface Props {
  /** Vai trò của user hiện tại — quyết định scope phân tích. */
  role: 'teacher' | 'student'
  /** ID + name của user hiện tại — dùng để lọc data khi role=student. */
  currentUserId?: string
  currentUserName?: string
  /** Tên người kết thúc buổi học (hiện trong header). */
  endedBy: string
  meetingStartedAt: number
  /** Click "Đóng & rời phòng" — parent disconnects + navigates. */
  onClose: () => void
}

/**
 * Full-screen modal hiện khi giáo viên kết thúc buổi học.
 * - Teacher: phân tích cả lớp + tip cho buổi sau
 * - Student: phân tích cá nhân + bí quyết cải thiện
 */
export default function EndOfClassModal({
  role,
  currentUserId,
  currentUserName,
  endedBy,
  meetingStartedAt,
  onClose,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<Recommendations | null>(null)

  // Snapshot stats from behaviorStore at modal mount time. behaviorStore
  // resets when leaving room, so we read here while it still has data.
  const stats = useMemo(() => {
    const all = behaviorStore.getBehaviors()
    const filtered =
      role === 'student' && currentUserId
        ? all.filter((b) => b.userId === currentUserId)
        : all

    const userIds = new Set(filtered.map((b) => b.userId))
    const positive = filtered.filter(
      (b) => classifyBehavior(b.label) === 'focused'
    ).length
    const distracted = filtered.filter(
      (b) => classifyBehavior(b.label) === 'distracted'
    ).length
    const sleeping = filtered.filter(
      (b) => classifyBehavior(b.label) === 'sleeping'
    ).length
    const total = filtered.length || 1

    const durationMs = Date.now() - meetingStartedAt

    // Per-student or self speaking time
    const speakingMs =
      role === 'student' && currentUserId
        ? voiceActivityStore.forIdentity(currentUserId)?.totalSpeakingMs ?? 0
        : voiceActivityStore.all().reduce((s, r) => s + r.totalSpeakingMs, 0)

    return {
      events: filtered,
      participantsCount: userIds.size,
      durationMs,
      durationMinutes: Math.max(1, Math.round(durationMs / 60_000)),
      focusedPct: Math.round((positive / total) * 100),
      distractedPct: Math.round((distracted / total) * 100),
      sleepingPct: Math.round((sleeping / total) * 100),
      speakingMs,
    }
  }, [role, currentUserId, meetingStartedAt])

  const aiEnabled = settingsStore.getSettings().aiRecommendationsEnabled

  const handleAnalyze = async () => {
    setLoading(true)
    setError('')
    setResult(null)
    try {
      // Build a per-user or whole-class summary for Gemini
      const all = behaviorStore.getBehaviors()
      const sorted = [...all].sort((a, b) => a.timestamp - b.timestamp)
      const start = sorted[0]?.timestamp ?? meetingStartedAt
      const end = sorted[sorted.length - 1]?.timestamp ?? Date.now()
      const durationMin = Math.max(
        1,
        Math.round((end - start) / 60_000)
      )

      // Engagement timeline buckets (1-min)
      const buckets: { positive: number; total: number }[] = Array.from(
        { length: durationMin },
        () => ({ positive: 0, total: 0 })
      )
      const target =
        role === 'student' && currentUserId
          ? sorted.filter((e) => e.userId === currentUserId)
          : sorted
      for (const e of target) {
        const idx = Math.min(
          durationMin - 1,
          Math.floor((e.timestamp - start) / 60_000)
        )
        buckets[idx].total += 1
        if (classifyBehavior(e.label) === 'focused') buckets[idx].positive += 1
      }
      const engagementTimeline = buckets.map((b, i) => ({
        minute: i + 1,
        positivePct: b.total > 0 ? Math.round((b.positive / b.total) * 100) : 0,
      }))

      // Per-student aggregation
      const byUser = new Map<
        string,
        {
          name: string
          focused: number
          distracted: number
          sleeping: number
          total: number
          behaviors: string[]
        }
      >()
      for (const e of target) {
        let agg = byUser.get(e.userId)
        if (!agg) {
          agg = {
            name: e.userName,
            focused: 0,
            distracted: 0,
            sleeping: 0,
            total: 0,
            behaviors: [],
          }
          byUser.set(e.userId, agg)
        }
        agg.total += 1
        const cls = classifyBehavior(e.label)
        if (cls === 'focused') agg.focused += 1
        else if (cls === 'distracted') agg.distracted += 1
        else if (cls === 'sleeping') agg.sleeping += 1
        if (!agg.behaviors.includes(e.label)) agg.behaviors.push(e.label)
      }
      const students = Array.from(byUser.entries()).map(([id, s]) => {
        const va = voiceActivityStore.forIdentity(id)
        return {
          name: s.name,
          focusedPct: s.total > 0 ? Math.round((s.focused / s.total) * 100) : 0,
          distractedPct:
            s.total > 0 ? Math.round((s.distracted / s.total) * 100) : 0,
          sleepingPct:
            s.total > 0 ? Math.round((s.sleeping / s.total) * 100) : 0,
          speakingTimeSec: va ? Math.round(va.totalSpeakingMs / 1000) : 0,
          behaviors: s.behaviors,
        }
      })

      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: role,
          summary: {
            durationMinutes: durationMin,
            totalParticipants: students.length,
            engagementTimeline,
            students,
          },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`)
      setResult(data.recommendations as Recommendations)
    } catch (err) {
      logger.error('[EndOfClass] analyze failed:', err)
      setError(err instanceof Error ? err.message : 'Lỗi không xác định')
    } finally {
      setLoading(false)
    }
  }

  const handleExportCSV = () => {
    const rows = stats.events.map((b) => ({
      timestamp: b.timestamp,
      userName: b.userName,
      behavior: b.label,
      type: classifyBehavior(b.label),
    }))
    const title = role === 'student' && currentUserName
      ? `Bao cao ca nhan - ${currentUserName}`
      : 'Bao cao buoi hoc'
    const csv = buildBehaviorCSV(title, rows)
    const filename = `bao-cao-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}.csv`
    downloadCSV(filename, csv)
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 20,
          maxWidth: 720,
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.5rem 1.75rem',
            borderBottom: '1px solid #e2e8f0',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
          }}
        >
          <div style={{ fontSize: '0.8125rem', opacity: 0.9, marginBottom: 4 }}>
            🔔 Buổi học đã kết thúc
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
            {role === 'student' ? 'Tổng kết của em' : 'Tổng kết buổi học'}
          </h2>
          <div style={{ fontSize: '0.8125rem', opacity: 0.85, marginTop: 6 }}>
            Kết thúc bởi: {endedBy} · {stats.durationMinutes} phút
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '1.5rem 1.75rem' }}>
          {/* Stats grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: 12,
              marginBottom: '1.25rem',
            }}
          >
            <StatCard
              label="Tập trung"
              value={`${stats.focusedPct}%`}
              color="#10b981"
            />
            <StatCard
              label="Mất tập trung"
              value={`${stats.distractedPct}%`}
              color="#f59e0b"
            />
            <StatCard
              label="Buồn ngủ"
              value={`${stats.sleepingPct}%`}
              color="#ef4444"
            />
            <StatCard
              label={role === 'student' ? 'Em nói' : 'Tổng nói'}
              value={formatSpeakingTime(stats.speakingMs)}
              color="#3b82f6"
            />
          </div>

          {/* AI Analysis section */}
          {aiEnabled ? (
            <div style={{ marginTop: '0.5rem' }}>
              {!result && !loading && (
                <button
                  onClick={handleAnalyze}
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    background:
                      'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 10,
                    fontSize: '0.9375rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(139, 92, 246, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  ✨{' '}
                  {role === 'student'
                    ? 'Xem phân tích cá nhân (AI)'
                    : 'Xem phân tích AI cho lớp'}
                </button>
              )}

              {loading && (
                <div
                  style={{
                    padding: '1.25rem',
                    background: 'rgba(139, 92, 246, 0.08)',
                    borderRadius: 10,
                    textAlign: 'center',
                    color: '#7c3aed',
                  }}
                >
                  ⏳ Đang phân tích buổi học...
                </div>
              )}

              {error && (
                <div
                  style={{
                    padding: '0.75rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: 10,
                    color: '#dc2626',
                    fontSize: '0.875rem',
                  }}
                >
                  {error}
                </div>
              )}

              {result && <RecommendationsDisplay result={result} role={role} />}
            </div>
          ) : (
            <div
              style={{
                padding: '0.875rem 1rem',
                background: '#f8fafc',
                border: '1px dashed #cbd5e1',
                borderRadius: 10,
                fontSize: '0.8125rem',
                color: '#64748b',
                textAlign: 'center',
              }}
            >
              💡 Bật "Khuyến nghị AI" trong Cài đặt để xem phân tích Gemini
            </div>
          )}

          {/* Actions */}
          <div
            style={{
              display: 'flex',
              gap: 10,
              marginTop: '1.25rem',
              paddingTop: '1rem',
              borderTop: '1px solid #e2e8f0',
            }}
          >
            <button
              onClick={handleExportCSV}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: '#f1f5f9',
                color: '#475569',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              📥 Tải báo cáo CSV
            </button>
            <button
              onClick={onClose}
              style={{
                flex: 2,
                padding: '0.75rem',
                background:
                  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.35)',
              }}
            >
              Đóng & rời phòng
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string
  value: string
  color: string
}) {
  return (
    <div
      style={{
        padding: '0.875rem',
        background: `${color}10`,
        border: `1px solid ${color}33`,
        borderRadius: 10,
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '1.375rem', fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: '0.6875rem', color: '#64748b', marginTop: 2 }}>
        {label}
      </div>
    </div>
  )
}

function RecommendationsDisplay({
  result,
  role,
}: {
  result: Recommendations
  role: 'teacher' | 'student'
}) {
  return (
    <div style={{ marginTop: '0.75rem' }}>
      <div
        style={{
          padding: '0.875rem 1rem',
          background:
            'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(124, 58, 237, 0.08) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.25)',
          borderRadius: 10,
          marginBottom: '0.875rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 12,
            marginBottom: 6,
          }}
        >
          <div
            style={{ fontSize: '1.875rem', fontWeight: 800, color: '#7c3aed' }}
          >
            {result.overallEngagement}%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            {role === 'student' ? 'Tập trung của em' : 'Engagement chung'}
          </div>
        </div>
        <div style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>
          {result.summary}
        </div>
      </div>

      {result.keyMoments?.length > 0 && (
        <Section title="🎯 Khoảnh khắc đáng chú ý" color="#8b5cf6">
          {result.keyMoments.map((m, i) => (
            <div
              key={i}
              style={{
                padding: '0.625rem 0.875rem',
                background: '#fafafa',
                borderLeft: '3px solid #8b5cf6',
                borderRadius: 6,
                marginBottom: 6,
              }}
            >
              <div
                style={{
                  fontSize: '0.6875rem',
                  color: '#7c3aed',
                  fontWeight: 700,
                  marginBottom: 3,
                }}
              >
                {m.timeOffset}
              </div>
              <div style={{ fontSize: '0.8125rem', marginBottom: 3 }}>
                {m.observation}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                💡 {m.suggestion}
              </div>
            </div>
          ))}
        </Section>
      )}

      {result.perStudentInsights?.length > 0 && (
        <Section
          title={role === 'student' ? '🎓 Đánh giá cá nhân' : '👥 Theo từng học sinh'}
          color="#3b82f6"
        >
          {result.perStudentInsights.map((p, i) => (
            <div
              key={i}
              style={{
                padding: '0.625rem 0.875rem',
                background: '#fafafa',
                borderRadius: 6,
                marginBottom: 6,
              }}
            >
              <div
                style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 3 }}
              >
                {p.name}
              </div>
              <div
                style={{ fontSize: '0.75rem', color: '#475569', marginBottom: 3 }}
              >
                {p.pattern}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                💡 {p.recommendation}
              </div>
            </div>
          ))}
        </Section>
      )}

      {result.nextSessionTips?.length > 0 && (
        <Section
          title={role === 'student' ? '🚀 Bí quyết cho em' : '🚀 Cho buổi sau'}
          color="#10b981"
        >
          <ul style={{ paddingLeft: '1.25rem', margin: 0 }}>
            {result.nextSessionTips.map((tip, i) => (
              <li key={i} style={{ fontSize: '0.8125rem', marginBottom: 4 }}>
                {tip}
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  )
}

function Section({
  title,
  color,
  children,
}: {
  title: string
  color: string
  children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: '0.875rem' }}>
      <h3
        style={{
          fontSize: '0.8125rem',
          fontWeight: 700,
          color,
          marginBottom: 6,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  )
}
