'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRoomContext } from '@livekit/components-react'
import { aiDetector, BehaviorResult } from '../lib/ai-detector'
import { faceDetector, emotionLabel, type FaceSignals } from '../lib/face-detector'
import { logger } from '../lib/logger'
import { settingsStore } from '../lib/settingsStore'
import { useMeeting } from '../contexts/MeetingContext'
import { ConnectionState } from 'livekit-client'
import {
  BEHAVIOR_TOPIC,
  encodeBehaviorMessage,
  type BehaviorMessageV1,
} from '../lib/behaviorChannel'

interface Props {
  enabled?: boolean
  userId?: string
  userName?: string
}

/**
 * Combine MoveNet's pose-based result with optional MediaPipe face signals.
 * Strategy:
 *   - If eyes have been closed for ≥2s (drowsiness EAR), upgrade label to
 *     "Đang ngủ" (more reliable than pose alone).
 *   - Append a small emotion suffix to listening/focus labels so teachers
 *     see the emotional tone (e.g. "Đang lắng nghe · Vui 😊").
 *   - Pose label otherwise wins.
 *
 * The function is pure — pass face=null to short-circuit and return the
 * pose result unchanged. This keeps the baseline pipeline unaffected when
 * the face detector hasn't loaded or the user disabled the feature.
 */
function fuseFaceIntoBehavior(
  pose: BehaviorResult,
  face: FaceSignals | null
): BehaviorResult {
  if (!face) return pose

  // Eye-closure-driven drowsiness override. We don't track time-window here
  // (that requires component state), but a single instantaneous closed-eye
  // is a stronger signal than the pose heuristic, so override regardless.
  if (face.eyesClosed) {
    return {
      label: 'Đang ngủ',
      emoji: '😴',
      color: '#a855f7',
      bgColor: 'rgba(168, 85, 247, 0.2)',
      type: 'negative',
      confidence: 0.9,
    }
  }

  // Emotion suffix only on neutral/positive pose labels — don't confuse a
  // "Cúi đầu" warning by appending "Vui".
  if (face.emotion !== 'neutral' && face.emotionIntensity > 0.35) {
    const { label: emoLabel, emoji: emoEmoji } = emotionLabel(face.emotion)
    if (emoLabel && (pose.type === 'positive' || pose.type === 'neutral')) {
      return {
        ...pose,
        label: `${pose.label} · ${emoLabel}`,
        emoji: `${pose.emoji}${emoEmoji}`,
      }
    }
  }

  return pose
}

/**
 * Runs MoveNet on the LOCAL participant's own video and broadcasts the
 * resulting behavior label to the room over a LiveKit data channel.
 *
 * Only writes to IndexedDB on label transitions to avoid hammering storage.
 * Teachers should not mount this for remote participants — they receive
 * labels via BehaviorReceiver instead.
 */
export default function AIBehaviorDetector({
  enabled = true,
  userId,
  userName,
}: Props) {
  const [behavior, setBehavior] = useState<BehaviorResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAIOn, setIsAIOn] = useState(() => {
    if (typeof window !== 'undefined') {
      const settings = settingsStore.getSettings()
      return settings.aiEnabled && enabled
    }
    return enabled
  })

  // React to settings changes from the Settings page in real time.
  useEffect(() => {
    return settingsStore.subscribe((s) => {
      setIsAIOn(s.aiEnabled && enabled)
      // Sensitivity is read on each detection via settingsStore.getSettings(),
      // so no state update needed here — the next frame will pick it up.
    })
  }, [enabled])
  const [error, setError] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const committedLabelRef = useRef<string | null>(null)
  // Adaptive interval: starts at 500ms, scales up if pose inference takes
  // long (slow device or thermal throttle), back down when fast.
  const intervalMsRef = useRef(500)
  const MIN_INTERVAL = 350
  const MAX_INTERVAL = 1500

  const room = useRoomContext()
  const { saveBehavior } = useMeeting()

  // Find the local participant's own video element. This is unambiguous:
  // LiveKit always mutes its own published video, so we just look for a video
  // tag whose srcObject is a local stream.
  const findLocalVideo = useCallback((): HTMLVideoElement | null => {
    const videos = Array.from(document.querySelectorAll('video'))
    for (const video of videos) {
      if (
        video.srcObject &&
        video.muted && // local published track is always muted in <video>
        video.readyState >= 2 &&
        video.videoWidth > 0
      ) {
        return video
      }
    }
    return null
  }, [])

  const broadcastBehavior = useCallback(
    (result: BehaviorResult, uid: string, uname: string) => {
      // Skip if room is no longer connected. Race window: user clicks
      // disconnect → room starts tearing down → AI loop still ticking →
      // publishData would throw "PC manager is closed".
      if (room.state !== ConnectionState.Connected) return

      try {
        const msg: BehaviorMessageV1 = {
          v: 1,
          topic: BEHAVIOR_TOPIC,
          userId: uid,
          userName: uname,
          label: result.label,
          emoji: result.emoji,
          color: result.color,
          type: result.type,
          timestamp: Date.now(),
        }
        const payload = encodeBehaviorMessage(msg)
        const p = room.localParticipant.publishData(payload, {
          reliable: false,
          topic: BEHAVIOR_TOPIC,
        })
        // publishData returns a promise; swallow rejections that arrive
        // after a connection drop so they don't propagate to React's
        // unhandled-rejection handler.
        if (p && typeof (p as Promise<unknown>).catch === 'function') {
          ;(p as Promise<unknown>).catch((err) => {
            logger.warn('[AI] publishData rejected:', err)
          })
        }
      } catch (err) {
        logger.warn('[AI] Broadcast failed:', err)
      }
    },
    [room]
  )

  const runDetection = useCallback(async () => {
    if (!isAIOn) return
    const video = videoRef.current || findLocalVideo()
    if (!video) return
    videoRef.current = video

    const t0 = performance.now()
    const result = await aiDetector.detect(video)
    const elapsed = performance.now() - t0

    // Adapt next interval based on inference cost: aim to keep CPU under
    // ~30% by spacing inferences 3× the cost. Clamp to sane bounds.
    const target = Math.max(MIN_INTERVAL, Math.min(MAX_INTERVAL, elapsed * 3))
    // Smooth so adaptation isn't jumpy.
    intervalMsRef.current = intervalMsRef.current * 0.7 + target * 0.3

    if (!result) return

    // Optional Tier 1 enhancement: fuse face signals (emotion + drowsiness
    // from EAR) into the pose-based label. Gated by Settings toggle so the
    // baseline MoveNet pipeline is unaffected when off.
    const settings = settingsStore.getSettings()
    let face: FaceSignals | null = null
    if (settings.faceAnalysisEnabled && faceDetector.isReady()) {
      face = faceDetector.detect(video, performance.now())
    }

    const fused = fuseFaceIntoBehavior(result, face)

    setBehavior(fused)

    // Commit transition immediately when the label changes — no smoothing
    // or confidence gate, so the badge tracks MoveNet output as quickly as
    // it can detect.
    if (fused.label === committedLabelRef.current) return
    committedLabelRef.current = fused.label

    if (userId && userName) {
      broadcastBehavior(fused, userId, userName)

      await saveBehavior({
        userId,
        userName,
        behavior: fused.label,
        emoji: fused.emoji,
        color: fused.color,
        type: fused.type,
        timestamp: Date.now(),
      })
    }
  }, [isAIOn, findLocalVideo, userId, userName, saveBehavior, broadcastBehavior])

  useEffect(() => {
    if (!isAIOn) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      return
    }

    let cancelled = false

    // Stop the loop the moment the room disconnects. Without this the loop
    // keeps ticking briefly while LiveKit tears down its peer connection,
    // and any in-flight publishData throws "PC manager is closed".
    const onDisconnected = () => {
      cancelled = true
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
    room.on('disconnected', onDisconnected)

    // Self-rescheduling loop using setTimeout so each tick can use the latest
    // adaptive interval value.
    const tick = async () => {
      if (cancelled) return
      await runDetection()
      if (cancelled) return
      timeoutRef.current = setTimeout(tick, intervalMsRef.current)
    }

    const init = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const success = await aiDetector.initialize()
        if (!success) {
          if (!cancelled) {
            setError('Không thể khởi tạo AI')
            setIsLoading(false)
          }
          return
        }
        if (cancelled) return
        setIsLoading(false)
        logger.info('[AI] Detector ready')

        // Lazy-init face detector in the background if user has it enabled.
        // Doesn't block pose detection — face signals fuse in once ready.
        if (settingsStore.getSettings().faceAnalysisEnabled) {
          faceDetector.initialize().catch((err) => {
            logger.warn('[FaceDetector] init failed:', err)
          })
        }

        let retries = 0
        const maxRetries = 10
        const waitForVideo = () => {
          if (cancelled) return
          const video = findLocalVideo()
          if (video) {
            videoRef.current = video
            tick()
          } else if (retries++ < maxRetries) {
            setTimeout(waitForVideo, 1000)
          } else {
            logger.warn('[AI] Could not find local video after retries')
          }
        }
        setTimeout(waitForVideo, 2000)
      } catch (err) {
        logger.error('[AI] Init error:', err)
        if (!cancelled) {
          setError('Lỗi khởi tạo AI')
          setIsLoading(false)
        }
      }
    }
    init()

    return () => {
      cancelled = true
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      room.off('disconnected', onDisconnected)
    }
  }, [isAIOn]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleAI = () => {
    setIsAIOn((prev) => {
      const next = !prev
      if (!next) {
        setBehavior(null)
        committedLabelRef.current = null
      }
      return next
    })
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 110,
        left: 16,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        alignItems: 'flex-start',
      }}
    >
      {isAIOn && !isLoading && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.375rem 0.75rem',
            borderRadius: '999px',
            fontSize: '0.8125rem',
            fontWeight: 600,
            background: behavior
              ? `${behavior.color}1a`
              : 'rgba(59, 130, 246, 0.12)',
            color: behavior ? behavior.color : '#3b82f6',
            border: `1px solid ${behavior ? behavior.color + '55' : 'rgba(59, 130, 246, 0.35)'}`,
            backdropFilter: 'blur(8px)',
            transition: 'background 0.25s ease, color 0.25s ease, border-color 0.25s ease',
          }}
        >
          <span style={{ fontSize: '1rem' }}>
            {behavior ? behavior.emoji : '🤖'}
          </span>
          <span>{behavior ? behavior.label : 'Đang phân tích...'}</span>
        </div>
      )}

      {isAIOn && isLoading && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.375rem 0.75rem',
            borderRadius: '999px',
            fontSize: '0.8125rem',
            fontWeight: 600,
            background: 'rgba(139, 92, 246, 0.12)',
            color: '#8b5cf6',
            border: '1px solid rgba(139, 92, 246, 0.35)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <span style={{ fontSize: '0.9375rem', animation: 'spin 1s linear infinite' }}>
            ⏳
          </span>
          <span>Đang khởi động AI...</span>
        </div>
      )}

      {error && (
        <div
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '12px',
            fontSize: '0.75rem',
            background: 'rgba(239, 68, 68, 0.1)',
            color: 'var(--danger)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
          }}
        >
          {error}
        </div>
      )}

      <button
        onClick={toggleAI}
        title={isAIOn ? 'Tắt AI nhận diện' : 'Bật AI nhận diện'}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          background: isAIOn
            ? 'rgba(16, 185, 129, 0.15)'
            : 'rgba(107, 114, 128, 0.12)',
          border: `1px solid ${isAIOn ? 'rgba(16, 185, 129, 0.4)' : 'rgba(107, 114, 128, 0.3)'}`,
          borderRadius: '999px',
          padding: '0.25rem 0.625rem',
          color: isAIOn ? '#059669' : '#6b7280',
          fontSize: '0.6875rem',
          fontWeight: 600,
          cursor: 'pointer',
          backdropFilter: 'blur(8px)',
          letterSpacing: '0.04em',
        }}
      >
        <span style={{ fontSize: '0.8125rem' }}>🤖</span>
        AI {isAIOn ? 'ON' : 'OFF'}
      </button>
    </div>
  )
}
