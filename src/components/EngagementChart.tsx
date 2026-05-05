'use client'

import { memo, useMemo } from 'react'

interface BehaviorPoint {
  timestamp: number
  type: 'positive' | 'negative' | 'neutral' | 'warning'
}

interface Props {
  events: BehaviorPoint[]
  /** Bucket size in milliseconds. Default 60s. */
  bucketMs?: number
  /** Chart height in px. */
  height?: number
}

/**
 * Lightweight SVG sparkline showing the share of `positive` behavior events
 * across the meeting's timeline. No external chart deps — keeps bundle size
 * small and avoids hydration friction.
 */
function EngagementChartImpl({
  events,
  bucketMs = 60_000,
  height = 140,
}: Props) {
  // Heavy bucket math runs only when `events` (or bucketMs) actually changes.
  // Without this, scrolling or unrelated state updates re-bucketed every render.
  const computed = useMemo(() => {
    if (events.length === 0) return null
    const sorted = [...events].sort((a, b) => a.timestamp - b.timestamp)
    const start = sorted[0].timestamp
    const end = sorted[sorted.length - 1].timestamp
    const span = Math.max(end - start, bucketMs)

    const bucketCount = Math.max(1, Math.ceil(span / bucketMs))
    const buckets: { positive: number; total: number }[] = Array.from(
      { length: bucketCount },
      () => ({ positive: 0, total: 0 })
    )
    for (const e of sorted) {
      const idx = Math.min(
        bucketCount - 1,
        Math.floor((e.timestamp - start) / bucketMs)
      )
      buckets[idx].total += 1
      if (e.type === 'positive') buckets[idx].positive += 1
    }
    let prev = 0
    const series = buckets.map((b) => {
      if (b.total === 0) return prev
      const pct = (b.positive / b.total) * 100
      prev = pct
      return pct
    })
    return { start, end, series }
  }, [events, bucketMs])

  if (!computed) {
    return (
      <div
        style={{
          padding: '2rem',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.875rem',
        }}
      >
        Chưa có dữ liệu để vẽ biểu đồ
      </div>
    )
  }

  const { start, end, series } = computed

  // SVG dimensions
  const width = 800 // viewBox; scales with container via preserveAspectRatio
  const padX = 40
  const padY = 20
  const innerW = width - padX * 2
  const innerH = height - padY * 2

  const xAt = (i: number) =>
    padX + (series.length === 1 ? innerW / 2 : (i / (series.length - 1)) * innerW)
  const yAt = (v: number) => padY + innerH - (v / 100) * innerH

  const linePoints = series.map((v, i) => `${xAt(i)},${yAt(v)}`).join(' ')
  const areaPath = `M ${xAt(0)},${yAt(0)} L ${linePoints
    .split(' ')
    .join(' L ')} L ${xAt(series.length - 1)},${yAt(0)} Z`

  const avgEngagement =
    series.reduce((s, v) => s + v, 0) / Math.max(1, series.length)

  return (
    <div style={{ width: '100%' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: '0.5rem',
        }}
      >
        <span
          style={{
            fontSize: '0.875rem',
            color: 'var(--text-muted)',
            fontWeight: 500,
          }}
        >
          % tập trung trung bình:{' '}
          <span style={{ color: '#10b981', fontWeight: 700 }}>
            {avgEngagement.toFixed(0)}%
          </span>
        </span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {series.length} mốc · mỗi mốc {Math.round(bucketMs / 1000)}s
        </span>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        style={{ width: '100%', height: `${height}px`, display: 'block' }}
      >
        {/* Grid lines at 25/50/75% */}
        {[25, 50, 75].map((p) => (
          <line
            key={p}
            x1={padX}
            x2={width - padX}
            y1={yAt(p)}
            y2={yAt(p)}
            stroke="rgba(0,0,0,0.06)"
            strokeWidth={1}
            strokeDasharray="4 4"
          />
        ))}
        {/* Y-axis labels */}
        {[0, 50, 100].map((p) => (
          <text
            key={p}
            x={padX - 6}
            y={yAt(p) + 4}
            textAnchor="end"
            fontSize="10"
            fill="var(--text-muted)"
          >
            {p}%
          </text>
        ))}

        {/* Filled area */}
        <path
          d={areaPath}
          fill="url(#engagementGradient)"
          stroke="none"
        />

        {/* Line */}
        <polyline
          points={linePoints}
          fill="none"
          stroke="#10b981"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Defs */}
        <defs>
          <linearGradient id="engagementGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.6875rem',
          color: 'var(--text-muted)',
          marginTop: '0.25rem',
          paddingLeft: padX,
          paddingRight: padX,
        }}
      >
        <span>{new Date(start).toLocaleTimeString('vi-VN')}</span>
        <span>{new Date(end).toLocaleTimeString('vi-VN')}</span>
      </div>
    </div>
  )
}

const EngagementChart = memo(EngagementChartImpl)
export default EngagementChart
