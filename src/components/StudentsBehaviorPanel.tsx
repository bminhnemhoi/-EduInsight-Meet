'use client'

import { useState, useEffect, useMemo } from 'react'
import { getInitials, classifyBehavior, formatTimeVN, formatTimeShortVN } from '../lib/utils'
import { behaviorStore } from '../lib/behaviorStore'
import { voiceActivityStore, formatSpeakingTime } from '../lib/voiceActivity'

export interface StudentBehavior {
  userId: string
  userName: string
  label: string
  emoji: string
  color: string
  timestamp: number
}

export interface Participant {
  sid: string
  identity: string
  name?: string
}

let listeners: Array<() => void> = []

export function addStudentBehavior(behavior: StudentBehavior) {
  behaviorStore.addBehavior(behavior)
  listeners.forEach(listener => listener())
}

export function subscribeToStudentBehaviors(listener: () => void) {
  listeners.push(listener)
  return () => {
    listeners = listeners.filter(l => l !== listener)
  }
}

export function getStudentBehaviors() {
  return behaviorStore.getBehaviors()
}

interface Props {
  participants?: Participant[]
}

type SortMode = 'attention' | 'name' | 'engagement'

/**
 * Teacher's class overview panel — designed to scale to 30-40 students.
 *
 * Layout:
 * - Header: collapse + search + sort dropdown + filter chip
 * - Top stats strip: focused / distracted / sleeping counts
 * - Compact card GRID (responsive 2-3 columns) with avatar, name, status,
 *   engagement bar
 * - Click card → side drawer slides in with full timeline (replaces the
 *   old "replace whole content" pattern)
 *
 * Why grid: 40 students × 1 row each = 40 scrolling rows = teacher can't
 * scan. 40 cards in a 3-col grid = ~14 rows, each card glanceable.
 */
export default function StudentsBehaviorPanel({ participants = [] }: Props) {
  const [behaviors, setBehaviors] = useState<StudentBehavior[]>([])
  const [isExpanded, setIsExpanded] = useState(true)
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortMode, setSortMode] = useState<SortMode>('attention')
  const [showOnlyAttention, setShowOnlyAttention] = useState(false)

  useEffect(() => {
    setBehaviors([...getStudentBehaviors()])
    const unsubscribe = subscribeToStudentBehaviors(() => {
      setBehaviors([...getStudentBehaviors()])
    })
    return unsubscribe
  }, [])

  // Build per-student aggregate (latest label + engagement % over session)
  const studentsAggregate = useMemo(() => {
    const map = new Map<
      string,
      {
        userId: string
        userName: string
        latestLabel: string
        latestEmoji: string
        latestColor: string
        latestTimestamp: number
        focusedPct: number
        eventCount: number
      }
    >()

    // First pass: latest behavior + counts
    behaviors.forEach((b) => {
      const existing = map.get(b.userId)
      if (!existing) {
        map.set(b.userId, {
          userId: b.userId,
          userName: b.userName,
          latestLabel: b.label,
          latestEmoji: b.emoji,
          latestColor: b.color,
          latestTimestamp: b.timestamp,
          focusedPct: 0,
          eventCount: 0,
        })
      }
    })

    // Compute engagement %
    for (const [userId, entry] of map.entries()) {
      const userEvents = behaviors.filter((b) => b.userId === userId)
      const focused = userEvents.filter(
        (e) => classifyBehavior(e.label) === 'focused'
      ).length
      entry.eventCount = userEvents.length
      entry.focusedPct =
        userEvents.length > 0
          ? Math.round((focused / userEvents.length) * 100)
          : 0
    }

    // Merge LiveKit participants who haven't sent any behavior yet
    participants.forEach((p) => {
      if (!map.has(p.sid)) {
        map.set(p.sid, {
          userId: p.sid,
          userName: p.name || p.identity,
          latestLabel: 'Chưa phát hiện',
          latestEmoji: '👤',
          latestColor: '#9ca3af',
          latestTimestamp: Date.now(),
          focusedPct: 0,
          eventCount: 0,
        })
      }
    })

    return Array.from(map.values())
  }, [behaviors, participants])

  // Apply search + filter + sort
  const visibleStudents = useMemo(() => {
    let list = studentsAggregate

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter((s) => s.userName.toLowerCase().includes(q))
    }

    if (showOnlyAttention) {
      list = list.filter((s) => {
        const cls = classifyBehavior(s.latestLabel)
        return cls === 'distracted' || cls === 'sleeping' || s.focusedPct < 50
      })
    }

    const sorted = [...list]
    switch (sortMode) {
      case 'name':
        sorted.sort((a, b) => a.userName.localeCompare(b.userName, 'vi'))
        break
      case 'engagement':
        sorted.sort((a, b) => b.focusedPct - a.focusedPct)
        break
      case 'attention':
      default:
        // Attention-first: those with concerning behaviors at top
        sorted.sort((a, b) => {
          const score = (s: typeof a) => {
            const cls = classifyBehavior(s.latestLabel)
            if (cls === 'sleeping') return 0
            if (cls === 'distracted') return 1
            if (s.focusedPct < 50) return 2
            return 3 + s.focusedPct / 100
          }
          return score(a) - score(b)
        })
    }
    return sorted
  }, [studentsAggregate, searchQuery, sortMode, showOnlyAttention])

  const stats = useMemo(() => ({
    total: studentsAggregate.length,
    focused: studentsAggregate.filter(
      (s) => classifyBehavior(s.latestLabel) === 'focused'
    ).length,
    distracted: studentsAggregate.filter(
      (s) => classifyBehavior(s.latestLabel) === 'distracted'
    ).length,
    sleeping: studentsAggregate.filter(
      (s) => classifyBehavior(s.latestLabel) === 'sleeping'
    ).length,
  }), [studentsAggregate])

  const selectedStudent = selectedStudentId
    ? studentsAggregate.find((s) => s.userId === selectedStudentId)
    : null

  const PANEL_WIDTH = 380

  return (
    <>
      {/* Main panel */}
      <div
        style={{
          position: 'fixed',
          top: 70,
          right: 16,
          zIndex: 1000,
          width: isExpanded ? PANEL_WIDTH : 'auto',
          maxHeight: 'calc(100vh - 100px)',
          background: 'var(--bg-primary)',
          borderRadius: 16,
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          transition: 'all 0.25s ease',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '0.75rem 1rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.125rem' }}>👥</span>
            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>
              Học sinh ({stats.total})
            </span>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '0.75rem',
              padding: '0.25rem 0.5rem',
              borderRadius: 6,
            }}
            title={isExpanded ? 'Thu gọn' : 'Mở rộng'}
          >
            {isExpanded ? '▼' : '◀'}
          </button>
        </div>

        {isExpanded && (
          <>
            {/* Stats strip */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 8,
                padding: '0.625rem 0.75rem',
                borderBottom: '1px solid var(--border-color)',
              }}
            >
              <MiniStat color="#10b981" value={stats.focused} label="Tập trung" />
              <MiniStat color="#fbbf24" value={stats.distracted} label="Phân tâm" />
              <MiniStat color="#ef4444" value={stats.sleeping} label="Buồn ngủ" />
            </div>

            {/* Controls */}
            <div
              style={{
                padding: '0.625rem 0.75rem',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="🔍 Tìm theo tên..."
                style={{
                  width: '100%',
                  padding: '0.375rem 0.625rem',
                  borderRadius: 6,
                  border: '1px solid var(--border-color)',
                  fontSize: '0.8125rem',
                  background: 'var(--bg-secondary)',
                }}
              />
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <select
                  value={sortMode}
                  onChange={(e) => setSortMode(e.target.value as SortMode)}
                  style={{
                    flex: 1,
                    padding: '0.375rem 0.5rem',
                    borderRadius: 6,
                    border: '1px solid var(--border-color)',
                    fontSize: '0.75rem',
                    background: 'var(--bg-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  <option value="attention">Ưu tiên cần chú ý</option>
                  <option value="name">Theo tên (A-Z)</option>
                  <option value="engagement">Theo % tập trung</option>
                </select>
                <button
                  onClick={() => setShowOnlyAttention(!showOnlyAttention)}
                  style={{
                    padding: '0.375rem 0.625rem',
                    borderRadius: 6,
                    border: `1px solid ${showOnlyAttention ? '#ef4444' : 'var(--border-color)'}`,
                    background: showOnlyAttention
                      ? 'rgba(239, 68, 68, 0.1)'
                      : 'var(--bg-secondary)',
                    color: showOnlyAttention ? '#dc2626' : 'var(--text-secondary)',
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                  title="Chỉ hiện học sinh cần chú ý (phân tâm/buồn ngủ/<50% tập trung)"
                >
                  {showOnlyAttention ? '✓ ' : ''}⚠️ Cần chú ý
                </button>
              </div>
            </div>

            {/* Grid of student cards */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '0.625rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 8,
                alignContent: 'start',
              }}
            >
              {visibleStudents.length === 0 ? (
                <div
                  style={{
                    gridColumn: '1 / -1',
                    padding: '1.25rem 0.75rem',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '0.8125rem',
                  }}
                >
                  {studentsAggregate.length === 0 ? (
                    <>
                      <div style={{ fontSize: '1.75rem', marginBottom: 4 }}>👥</div>
                      <div>Đang đợi học sinh tham gia...</div>
                    </>
                  ) : (
                    <>Không có học sinh nào khớp filter</>
                  )}
                </div>
              ) : (
                visibleStudents.map((s) => (
                  <StudentCard
                    key={s.userId}
                    student={s}
                    isSelected={s.userId === selectedStudentId}
                    onClick={() =>
                      setSelectedStudentId(
                        s.userId === selectedStudentId ? null : s.userId
                      )
                    }
                  />
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Side drawer for student detail */}
      {isExpanded && selectedStudent && (
        <StudentDetailDrawer
          student={selectedStudent}
          allBehaviors={behaviors}
          onClose={() => setSelectedStudentId(null)}
          rightOffset={PANEL_WIDTH + 32}
        />
      )}
    </>
  )
}

function MiniStat({
  color,
  value,
  label,
}: {
  color: string
  value: number
  label: string
}) {
  return (
    <div
      style={{
        padding: '0.375rem',
        background: `${color}15`,
        borderRadius: 6,
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '1.125rem', fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', marginTop: 1 }}>
        {label}
      </div>
    </div>
  )
}

function StudentCard({
  student,
  isSelected,
  onClick,
}: {
  student: {
    userId: string
    userName: string
    latestLabel: string
    latestEmoji: string
    latestColor: string
    focusedPct: number
    eventCount: number
  }
  isSelected: boolean
  onClick: () => void
}) {
  const cls = classifyBehavior(student.latestLabel)
  const engagementColor =
    student.focusedPct >= 70 ? '#10b981'
    : student.focusedPct >= 40 ? '#f59e0b'
    : '#ef4444'
  const stateBadge =
    cls === 'focused' ? { color: '#10b981', text: 'Tập trung' }
    : cls === 'distracted' ? { color: '#f59e0b', text: 'Phân tâm' }
    : cls === 'sleeping' ? { color: '#ef4444', text: 'Buồn ngủ' }
    : { color: '#9ca3af', text: '—' }

  return (
    <button
      onClick={onClick}
      style={{
        all: 'unset',
        cursor: 'pointer',
        padding: '0.625rem',
        background: isSelected ? 'rgba(102, 126, 234, 0.1)' : 'var(--bg-secondary)',
        border: `1.5px solid ${isSelected ? '#667eea' : 'transparent'}`,
        borderRadius: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        transition: 'all 0.15s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${student.latestColor} 0%, ${student.latestColor}cc 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 600,
            fontSize: '0.8125rem',
            flexShrink: 0,
            position: 'relative',
          }}
        >
          {getInitials(student.userName)}
          <div
            style={{
              position: 'absolute',
              bottom: -2,
              right: -2,
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: 'var(--bg-primary)',
              fontSize: '0.625rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {student.latestEmoji}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={student.userName}
          >
            {student.userName}
          </div>
          <div
            style={{
              fontSize: '0.6875rem',
              color: stateBadge.color,
              fontWeight: 500,
            }}
          >
            {stateBadge.text}
          </div>
        </div>
      </div>

      {/* Engagement bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <div
          style={{
            flex: 1,
            height: 4,
            background: 'rgba(0, 0, 0, 0.06)',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${student.focusedPct}%`,
              height: '100%',
              background: engagementColor,
              transition: 'width 0.3s ease',
            }}
          />
        </div>
        <span
          style={{
            fontSize: '0.625rem',
            fontWeight: 700,
            color: engagementColor,
            minWidth: 26,
            textAlign: 'right',
          }}
        >
          {student.focusedPct}%
        </span>
      </div>
    </button>
  )
}

function StudentDetailDrawer({
  student,
  allBehaviors,
  onClose,
  rightOffset,
}: {
  student: {
    userId: string
    userName: string
    latestLabel: string
    latestEmoji: string
    latestColor: string
    focusedPct: number
  }
  allBehaviors: StudentBehavior[]
  onClose: () => void
  rightOffset: number
}) {
  const userEvents = allBehaviors.filter((b) => b.userId === student.userId)
  const distracted = userEvents.filter(
    (e) => classifyBehavior(e.label) === 'distracted'
  ).length
  const sleeping = userEvents.filter(
    (e) => classifyBehavior(e.label) === 'sleeping'
  ).length
  const total = userEvents.length || 1
  const distractedPct = Math.round((distracted / total) * 100)
  const sleepingPct = Math.round((sleeping / total) * 100)

  const va = voiceActivityStore.forIdentity(student.userId)
  const sessionMs = voiceActivityStore.sessionDurationMs()
  const speakPct =
    va && sessionMs > 0 ? Math.round((va.totalSpeakingMs / sessionMs) * 100) : 0

  const recentEvents = userEvents.slice(0, 15)

  return (
    <div
      style={{
        position: 'fixed',
        top: 70,
        right: rightOffset,
        zIndex: 999,
        width: 320,
        maxHeight: 'calc(100vh - 100px)',
        background: 'var(--bg-primary)',
        borderRadius: 16,
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideInRight 0.2s ease',
      }}
    >
      {/* Drawer header */}
      <div
        style={{
          padding: '0.875rem 1rem',
          background: `linear-gradient(135deg, ${student.latestColor} 0%, ${student.latestColor}cc 100%)`,
          color: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.9375rem',
            }}
          >
            {getInitials(student.userName)}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>
              {student.userName}
            </div>
            <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>
              {student.latestEmoji} {student.latestLabel}
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            color: '#fff',
            borderRadius: 6,
            padding: '0.25rem 0.5rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
          }}
          title="Đóng"
        >
          ✕
        </button>
      </div>

      {/* Stats grid */}
      <div
        style={{
          padding: '0.75rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 6,
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <div
          style={{
            padding: '0.5rem',
            background: 'rgba(16, 185, 129, 0.1)',
            borderRadius: 6,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#10b981' }}>
            {student.focusedPct}%
          </div>
          <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>
            Tập trung
          </div>
        </div>
        <div
          style={{
            padding: '0.5rem',
            background: 'rgba(245, 158, 11, 0.1)',
            borderRadius: 6,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f59e0b' }}>
            {distractedPct}%
          </div>
          <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>
            Phân tâm
          </div>
        </div>
        <div
          style={{
            padding: '0.5rem',
            background: 'rgba(239, 68, 68, 0.1)',
            borderRadius: 6,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#ef4444' }}>
            {sleepingPct}%
          </div>
          <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>
            Buồn ngủ
          </div>
        </div>
      </div>

      {/* Voice activity */}
      {va && va.totalSpeakingMs >= 500 && (
        <div
          style={{
            padding: '0.5rem 0.75rem',
            background: 'rgba(59, 130, 246, 0.06)',
            borderBottom: '1px solid var(--border-color)',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>🗣️ Đã nói: <strong>{formatSpeakingTime(va.totalSpeakingMs)}</strong></span>
          <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
            {speakPct}%
          </span>
        </div>
      )}

      {/* Recent timeline */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0.625rem 0.75rem',
        }}
      >
        <div
          style={{
            fontSize: '0.6875rem',
            fontWeight: 600,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            marginBottom: 6,
          }}
        >
          📊 Lịch sử ({userEvents.length})
        </div>
        {recentEvents.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '1rem',
              color: 'var(--text-muted)',
              fontSize: '0.75rem',
            }}
          >
            Chưa có dữ liệu
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {recentEvents.map((h, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '0.375rem 0.5rem',
                  background: 'var(--bg-secondary)',
                  borderRadius: 6,
                  borderLeft: `3px solid ${h.color}`,
                }}
              >
                <span style={{ fontSize: '0.875rem' }}>{h.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: h.color,
                      fontWeight: 500,
                    }}
                  >
                    {h.label}
                  </div>
                  <div
                    style={{
                      fontSize: '0.625rem',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {formatTimeShortVN(h.timestamp)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
