'use client'

import { useMemo, useState } from 'react'

interface BehaviorView {
  id: string
  userId: string
  userName: string
  behavior: string
  emoji: string
  color: string
  type: 'positive' | 'negative' | 'neutral' | 'warning'
  timestamp: number
  bgColor?: string
}

interface Props {
  events: BehaviorView[]
  /** Limit per group (newest first) before "Hiện thêm". */
  itemsPerGroup?: number
}

/**
 * Compact timeline — replaces the previous "60 fat rows" view.
 *
 * Strategy:
 * - Group events by student (one collapsible section per student)
 * - Each student row shows aggregate counts so teacher can scan
 * - Expand to see compact 1-line entries (emoji + label + time)
 * - Default state: top 3 students with most events expanded; rest collapsed
 *
 * Why grouping: 40 students × 100 events each = 4000 raw rows.
 * Grouped: 40 collapsed sections that fit on one screen.
 */
export default function CompactTimeline({ events, itemsPerGroup = 8 }: Props) {
  // Group by user
  const grouped = useMemo(() => {
    const map = new Map<
      string,
      {
        userId: string
        userName: string
        events: BehaviorView[]
        positive: number
        negative: number
        warning: number
        neutral: number
      }
    >()
    for (const e of events) {
      let g = map.get(e.userId)
      if (!g) {
        g = {
          userId: e.userId,
          userName: e.userName,
          events: [],
          positive: 0,
          negative: 0,
          warning: 0,
          neutral: 0,
        }
        map.set(e.userId, g)
      }
      g.events.push(e)
      if (e.type === 'positive') g.positive++
      else if (e.type === 'negative') g.negative++
      else if (e.type === 'warning') g.warning++
      else g.neutral++
    }
    // Sort: most events first
    return Array.from(map.values()).sort(
      (a, b) => b.events.length - a.events.length
    )
  }, [events])

  // Default expanded: top 3 by event count
  const initialExpanded = useMemo(
    () => new Set(grouped.slice(0, 3).map((g) => g.userId)),
    [grouped]
  )
  const [expanded, setExpanded] = useState<Set<string>>(initialExpanded)
  // Per-group "show more" state — store count of items to render
  const [shownCounts, setShownCounts] = useState<Record<string, number>>({})

  const toggle = (userId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
  }

  if (grouped.length === 0) {
    return (
      <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Chưa có dữ liệu
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {grouped.map((g) => {
        const isOpen = expanded.has(g.userId)
        const shown = shownCounts[g.userId] ?? itemsPerGroup
        // Newest first
        const sortedEvents = [...g.events].sort(
          (a, b) => b.timestamp - a.timestamp
        )
        const visibleEvents = sortedEvents.slice(0, shown)
        const hasMore = sortedEvents.length > shown

        return (
          <div
            key={g.userId}
            style={{
              border: '1px solid var(--border-color)',
              borderRadius: 8,
              overflow: 'hidden',
              background: 'var(--bg-primary)',
            }}
          >
            {/* Header: clickable summary row */}
            <button
              onClick={() => toggle(g.userId)}
              style={{
                all: 'unset',
                cursor: 'pointer',
                width: '100%',
                padding: '0.625rem 0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: isOpen ? 'var(--bg-secondary)' : 'transparent',
                borderBottom: isOpen ? '1px solid var(--border-color)' : 'none',
                boxSizing: 'border-box',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: 14,
                  fontSize: '0.6875rem',
                  color: 'var(--text-muted)',
                  transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.15s ease',
                }}
              >
                ▶
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {g.userName}
                </div>
                <div
                  style={{
                    fontSize: '0.6875rem',
                    color: 'var(--text-muted)',
                    marginTop: 2,
                  }}
                >
                  {g.events.length} sự kiện
                </div>
              </div>
              {/* Stats pills */}
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                {g.positive > 0 && (
                  <Pill bg="rgba(16,185,129,0.15)" fg="#059669">
                    ✅ {g.positive}
                  </Pill>
                )}
                {g.warning > 0 && (
                  <Pill bg="rgba(245,158,11,0.15)" fg="#d97706">
                    ⚠️ {g.warning}
                  </Pill>
                )}
                {g.negative > 0 && (
                  <Pill bg="rgba(239,68,68,0.15)" fg="#dc2626">
                    ❌ {g.negative}
                  </Pill>
                )}
              </div>
            </button>

            {/* Expanded body */}
            {isOpen && (
              <div style={{ padding: '0.5rem 0.625rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {visibleEvents.map((e) => (
                    <div
                      key={e.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '0.3125rem 0.5rem',
                        borderRadius: 6,
                        fontSize: '0.8125rem',
                        borderLeft: `3px solid ${e.color}`,
                        marginBottom: 2,
                      }}
                    >
                      <span style={{ fontSize: '0.9375rem', flexShrink: 0 }}>
                        {e.emoji}
                      </span>
                      <span
                        style={{
                          color: e.color,
                          fontWeight: 500,
                          flex: 1,
                          minWidth: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {e.behavior}
                      </span>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontSize: '0.6875rem',
                          color: 'var(--text-muted)',
                          flexShrink: 0,
                        }}
                      >
                        {new Date(e.timestamp).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                    </div>
                  ))}
                </div>
                {hasMore && (
                  <button
                    onClick={() =>
                      setShownCounts((prev) => ({
                        ...prev,
                        [g.userId]: shown + itemsPerGroup,
                      }))
                    }
                    style={{
                      marginTop: 6,
                      width: '100%',
                      padding: '0.375rem',
                      background: 'transparent',
                      border: '1px dashed var(--border-color)',
                      borderRadius: 6,
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    Hiện thêm {Math.min(itemsPerGroup, sortedEvents.length - shown)} sự kiện
                  </button>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function Pill({
  bg,
  fg,
  children,
}: {
  bg: string
  fg: string
  children: React.ReactNode
}) {
  return (
    <span
      style={{
        background: bg,
        color: fg,
        padding: '2px 6px',
        borderRadius: 4,
        fontSize: '0.6875rem',
        fontWeight: 600,
      }}
    >
      {children}
    </span>
  )
}
