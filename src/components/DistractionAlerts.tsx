'use client'

import { useEffect, useRef, useState } from 'react'
import { subscribeToStudentBehaviors } from './StudentsBehaviorPanel'
import { behaviorStore } from '../lib/behaviorStore'
import { classifyBehavior } from '../lib/utils'

const ALERT_AFTER_MS = 120_000 // 2 minutes
const DEDUP_COOLDOWN_MS = 300_000 // don't re-alert same student for 5 min

interface Toast {
  id: string
  userId: string
  userName: string
  message: string
  createdAt: number
}

interface UserNegativeWindow {
  userName: string
  windowStart: number
  lastAlertAt: number
}

/**
 * Watches the in-room behavior stream and pops a toast at the teacher's
 * screen when a student has been in a negative state continuously for
 * more than ALERT_AFTER_MS. Each student is rate-limited so the teacher
 * isn't spammed.
 *
 * Mounted only on the teacher side — see AIDetectionManager.
 */
export default function DistractionAlerts() {
  const [toasts, setToasts] = useState<Toast[]>([])
  const negativeStateRef = useRef(new Map<string, UserNegativeWindow>())

  useEffect(() => {
    const evaluate = () => {
      const all = behaviorStore.getBehaviors()
      const seen = new Set<string>()
      const state = negativeStateRef.current
      const now = Date.now()

      // Walk newest-first, keep only the latest record per user.
      for (const b of all) {
        if (seen.has(b.userId)) continue
        seen.add(b.userId)

        const cls = classifyBehavior(b.label)
        const isNeg = cls === 'distracted' || cls === 'sleeping'

        const cur = state.get(b.userId)
        if (isNeg) {
          if (!cur) {
            state.set(b.userId, {
              userName: b.userName,
              windowStart: b.timestamp,
              lastAlertAt: 0,
            })
          } else {
            cur.userName = b.userName
            const duration = now - cur.windowStart
            const cooledDown = now - cur.lastAlertAt > DEDUP_COOLDOWN_MS
            if (duration >= ALERT_AFTER_MS && cooledDown) {
              cur.lastAlertAt = now
              const t: Toast = {
                id: `${b.userId}-${now}`,
                userId: b.userId,
                userName: b.userName,
                message: `${b.userName} có vẻ mất tập trung hơn ${Math.round(
                  duration / 60000
                )} phút`,
                createdAt: now,
              }
              setToasts((prev) => [...prev, t])
              // Auto-dismiss after 8s
              setTimeout(() => {
                setToasts((prev) => prev.filter((x) => x.id !== t.id))
              }, 8000)
            }
          }
        } else {
          // Reset window once student returns to positive/neutral.
          if (cur) state.delete(b.userId)
        }
      }

      // Clean up stale entries for users that no longer appear.
      for (const userId of state.keys()) {
        if (!seen.has(userId)) state.delete(userId)
      }
    }

    evaluate()
    const unsub = subscribeToStudentBehaviors(evaluate)
    // Also tick on a timer so the 2-min threshold fires even if no new
    // event arrives for a steady-state distracted student.
    const interval = setInterval(evaluate, 15_000)

    return () => {
      unsub()
      clearInterval(interval)
    }
  }, [])

  if (toasts.length === 0) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 80,
        right: 16,
        zIndex: 1100,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        maxWidth: 320,
        pointerEvents: 'none',
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            background:
              'linear-gradient(135deg, rgba(245, 158, 11, 0.95) 0%, rgba(217, 119, 6, 0.95) 100%)',
            color: '#fff',
            padding: '0.875rem 1rem',
            borderRadius: 12,
            boxShadow: '0 12px 28px rgba(245, 158, 11, 0.35)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.625rem',
            backdropFilter: 'blur(10px)',
            animation: 'fadeIn 0.25s ease',
            pointerEvents: 'auto',
          }}
        >
          <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 700, marginBottom: 2 }}>
              Cần chú ý
            </div>
            <div style={{ fontSize: '0.8125rem', lineHeight: 1.4 }}>
              {t.message}
            </div>
          </div>
          <button
            onClick={() =>
              setToasts((prev) => prev.filter((x) => x.id !== t.id))
            }
            style={{
              background: 'transparent',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '1rem',
              lineHeight: 1,
              padding: 0,
              opacity: 0.8,
            }}
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
