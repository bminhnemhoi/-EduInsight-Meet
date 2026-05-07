'use client'

import { useState } from 'react'
import { settingsStore } from '../lib/settingsStore'
import { voiceActivityStore } from '../lib/voiceActivity'
import { classifyBehavior } from '../lib/utils'
import { logger } from '../lib/logger'

interface BehaviorView {
  userId: string
  userName: string
  behavior: string
  type: 'positive' | 'negative' | 'neutral' | 'warning'
  timestamp: number
}

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
  events: BehaviorView[]
  meetingDurationMs: number
}

/**
 * Tier 3: card on the History page. Click "Phân tích" → POST behavior
 * summary to /api/recommend → server forwards to Gemini → returns
 * structured suggestions for the teacher.
 *
 * Hidden when settings.aiRecommendationsEnabled is off so users who don't
 * want LLM-driven analysis aren't bothered.
 */
export default function SessionRecommendations({
  events,
  meetingDurationMs,
}: Props) {
  const enabled =
    typeof window !== 'undefined' &&
    settingsStore.getSettings().aiRecommendationsEnabled
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<Recommendations | null>(null)

  if (!enabled) return null

  if (events.length === 0) return null

  const buildSummary = () => {
    // Group events by 1-minute buckets for the timeline
    const sorted = [...events].sort((a, b) => a.timestamp - b.timestamp)
    const start = sorted[0].timestamp
    const end = sorted[sorted.length - 1].timestamp
    const durationMs = Math.max(meetingDurationMs, end - start, 60_000)
    const durationMin = Math.max(1, Math.round(durationMs / 60_000))

    const buckets: { positive: number; total: number }[] = Array.from(
      { length: durationMin },
      () => ({ positive: 0, total: 0 })
    )
    for (const e of sorted) {
      const idx = Math.min(
        durationMin - 1,
        Math.floor((e.timestamp - start) / 60_000)
      )
      buckets[idx].total += 1
      if (e.type === 'positive') buckets[idx].positive += 1
    }
    const engagementTimeline = buckets.map((b, i) => ({
      minute: i + 1,
      positivePct: b.total > 0 ? Math.round((b.positive / b.total) * 100) : 0,
    }))

    // Per-student aggregation
    const byStudent = new Map<
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
    for (const e of sorted) {
      let agg = byStudent.get(e.userId)
      if (!agg) {
        agg = {
          name: e.userName,
          focused: 0,
          distracted: 0,
          sleeping: 0,
          total: 0,
          behaviors: [],
        }
        byStudent.set(e.userId, agg)
      }
      agg.total += 1
      const cls = classifyBehavior(e.behavior)
      if (cls === 'focused') agg.focused += 1
      else if (cls === 'distracted') agg.distracted += 1
      else if (cls === 'sleeping') agg.sleeping += 1
      if (!agg.behaviors.includes(e.behavior)) agg.behaviors.push(e.behavior)
    }
    const students = Array.from(byStudent.entries()).map(([id, s]) => {
      const va = voiceActivityStore.forIdentity(id)
      return {
        name: s.name,
        focusedPct: s.total > 0 ? Math.round((s.focused / s.total) * 100) : 0,
        distractedPct:
          s.total > 0 ? Math.round((s.distracted / s.total) * 100) : 0,
        sleepingPct: s.total > 0 ? Math.round((s.sleeping / s.total) * 100) : 0,
        speakingTimeSec: va ? Math.round(va.totalSpeakingMs / 1000) : 0,
        behaviors: s.behaviors,
      }
    })

    return {
      durationMinutes: durationMin,
      totalParticipants: students.length,
      engagementTimeline,
      students,
    }
  }

  const handleAnalyze = async () => {
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const summary = buildSummary()
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || `HTTP ${res.status}`)
      }
      setResult(data.recommendations as Recommendations)
    } catch (err) {
      logger.error('[Recommend] failed:', err)
      setError(err instanceof Error ? err.message : 'Lỗi không xác định')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card animate-fadeIn" style={{ marginBottom: '1.5rem' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.5rem',
        }}
      >
        <h2 className="section-title" style={{ marginBottom: 0 }}>
          🤖 Khuyến nghị AI (Gemini)
        </h2>
        {!result && (
          <button
            onClick={handleAnalyze}
            disabled={loading}
            style={{
              padding: '0.5rem 1rem',
              background: loading
                ? '#a0aec0'
                : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {loading ? '⏳ Đang phân tích...' : '✨ Phân tích buổi học'}
          </button>
        )}
      </div>

      {!result && !error && !loading && (
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
          Click để Gemini đọc engagement timeline và đưa ra khuyến nghị cụ thể cho lần dạy sau.
          Chỉ gửi text tóm tắt, không có video hay ảnh khuôn mặt.
        </p>
      )}

      {error && (
        <div
          style={{
            marginTop: '0.75rem',
            padding: '0.75rem',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 8,
            color: 'var(--danger)',
            fontSize: '0.8125rem',
          }}
        >
          {error}
        </div>
      )}

      {result && (
        <div style={{ marginTop: '0.75rem' }}>
          {/* Overall engagement + summary */}
          <div
            style={{
              padding: '1rem',
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(124, 58, 237, 0.08) 100%)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              borderRadius: 12,
              marginBottom: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
              <div style={{ fontSize: '2.25rem', fontWeight: 700, color: '#7c3aed' }}>
                {result.overallEngagement}%
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Mức độ tập trung tổng thể
              </div>
            </div>
            <div style={{ fontSize: '0.9375rem', lineHeight: 1.5 }}>{result.summary}</div>
          </div>

          {/* Key moments */}
          {result.keyMoments && result.keyMoments.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: 8, color: 'var(--text-secondary)' }}>
                🎯 Khoảnh khắc đáng chú ý
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {result.keyMoments.map((m, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '0.625rem 0.875rem',
                      background: 'var(--bg-secondary)',
                      borderLeft: '3px solid #8b5cf6',
                      borderRadius: 6,
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', color: '#7c3aed', fontWeight: 600, marginBottom: 4 }}>
                      {m.timeOffset}
                    </div>
                    <div style={{ fontSize: '0.875rem', marginBottom: 4 }}>{m.observation}</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      💡 {m.suggestion}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Per student insights */}
          {result.perStudentInsights && result.perStudentInsights.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: 8, color: 'var(--text-secondary)' }}>
                👥 Theo từng học sinh
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {result.perStudentInsights.map((p, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '0.625rem 0.875rem',
                      background: 'var(--bg-secondary)',
                      borderRadius: 6,
                    }}
                  >
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 4 }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                      {p.pattern}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      💡 {p.recommendation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next session tips */}
          {result.nextSessionTips && result.nextSessionTips.length > 0 && (
            <div>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: 8, color: 'var(--text-secondary)' }}>
                🚀 Cho buổi sau
              </h3>
              <ul style={{ paddingLeft: '1.25rem', margin: 0 }}>
                {result.nextSessionTips.map((tip, i) => (
                  <li key={i} style={{ fontSize: '0.875rem', marginBottom: 4 }}>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={() => {
              setResult(null)
              setError('')
            }}
            style={{
              marginTop: '0.75rem',
              padding: '0.375rem 0.75rem',
              background: 'transparent',
              border: '1px solid var(--border-color)',
              borderRadius: 6,
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            Phân tích lại
          </button>
        </div>
      )}
    </div>
  )
}
