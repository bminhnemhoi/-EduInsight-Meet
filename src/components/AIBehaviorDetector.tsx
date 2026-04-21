'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { aiDetector, BehaviorResult } from '../lib/ai-detector'
import { logger } from '../lib/logger'
import { addBehaviorEntry } from './BehaviorHistoryPanel'
import { addStudentBehavior } from './StudentsBehaviorPanel'
import { settingsStore } from '../lib/settingsStore'
import { useMeeting } from '../contexts/MeetingContext'

interface Props {
  enabled?: boolean
  userId?: string
  userName?: string
  participantSid?: string
}

export default function AIBehaviorDetector({ enabled = true, userId, userName, participantSid }: Props) {
  const [behavior, setBehavior] = useState<BehaviorResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAIOn, setIsAIOn] = useState(() => {
     // Respect user settings initially, fallback to props
     if (typeof window !== 'undefined') {
        const settings = settingsStore.getSettings()
        return settings.aiEnabled && enabled
     }
     return enabled
  })
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  
  // Get meeting context for saving behaviors
  const { saveBehavior } = useMeeting()

  const findLocalVideo = useCallback((): HTMLVideoElement | null => {
    const videos = Array.from(document.querySelectorAll('video'))

    for (let i = 0; i < videos.length; i++) {
      const video = videos[i]

      if (!video.srcObject || video.readyState < 2 || video.videoWidth === 0) {
        continue
      }

      if (participantSid) {
        const container = video.closest('[data-lk-participant-sid]') ||
          video.closest('[data-lk-participant]') ||
          video.closest('[data-lk-participant-identity]')

        if (container) {
          const sid = container.getAttribute('data-lk-participant-sid') ||
            container.getAttribute('data-lk-participant') ||
            container.getAttribute('data-lk-participant-identity')

          if (sid === participantSid) return video
        }

        const videoSid = video.getAttribute('data-lk-participant-sid') ||
          video.getAttribute('data-participant-sid') ||
          video.getAttribute('data-participant-identity')

        if (videoSid === participantSid) return video

        if (!video.muted && i > 0) return video
      } else {
        if (video.muted) return video
        if (i === 0) return video
      }
    }
    return null
  }, [participantSid])

  const runDetection = useCallback(async () => {
    if (!isAIOn) return

    const video = videoRef.current || findLocalVideo()
    if (!video) return

    videoRef.current = video

    const result = await aiDetector.detect(video)
    if (!result) return

    setBehavior(result)

    // Add to in-memory history (for real-time display)
    addBehaviorEntry({
      label: result.label,
      emoji: result.emoji,
      type: result.type
    })

    if (userId && userName) {
      addStudentBehavior({
        userId,
        userName,
        label: result.label,
        emoji: result.emoji,
        color: result.color,
        timestamp: Date.now()
      })
      
      // Save to database (persistent storage)
      await saveBehavior({
        userId,
        userName,
        behavior: result.label,
        emoji: result.emoji,
        color: result.color,
        type: result.type,
        timestamp: Date.now()
      })
    }
  }, [isAIOn, findLocalVideo, userId, userName, saveBehavior])

  useEffect(() => {
    if (!isAIOn) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    const init = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const success = await aiDetector.initialize()
        if (!success) {
          setError('Không thể khởi tạo AI')
          setIsLoading(false)
          return
        }

        logger.info('[AI] Detector ready')
        setIsLoading(false)

        let retryCount = 0
        const maxRetries = 10

        const waitForVideo = () => {
          const video = findLocalVideo()

          if (video) {
            videoRef.current = video
            runDetection()
            intervalRef.current = setInterval(runDetection, 500)
          } else {
            retryCount++
            if (retryCount < maxRetries) {
              setTimeout(waitForVideo, 1000)
            } else {
              logger.warn('[AI] Could not find video after', maxRetries, 'retries')
            }
          }
        }

        setTimeout(waitForVideo, 2000)
      } catch (err) {
        logger.error('[AI] Init error:', err)
        setError('Lỗi khởi tạo AI')
        setIsLoading(false)
      }
    }

    init()

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isAIOn]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleAI = () => {
    setIsAIOn(!isAIOn)
    if (isAIOn) {
      setBehavior(null)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: participantSid ? -9999 : 70,
      left: participantSid ? -9999 : 16,
      zIndex: participantSid ? -1 : 1000,
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }}>
      {/* AI Status Badge */}
      {isAIOn && behavior && !isLoading && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.625rem 1rem',
            borderRadius: '12px',
            fontSize: '0.875rem',
            fontWeight: 600,
            background: 'var(--bg-primary)',
            color: behavior.color,
            border: `2px solid ${behavior.color}40`,
            boxShadow: 'var(--shadow-md)',
            animation: 'fadeIn 0.3s ease'
          }}
        >
          <span style={{ fontSize: '1.25rem' }}>{behavior.emoji}</span>
          <span>{behavior.label}</span>
        </div>
      )}

      {/* Loading State */}
      {isAIOn && isLoading && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.625rem 1rem',
            borderRadius: '12px',
            fontSize: '0.875rem',
            fontWeight: 600,
            background: 'var(--bg-primary)',
            color: '#6b7280',
            border: '2px solid rgba(107, 114, 128, 0.3)',
            boxShadow: 'var(--shadow-md)'
          }}
        >
          <span style={{ fontSize: '1.25rem', animation: 'spin 1s linear infinite' }}>⏳</span>
          <span>Đang tải AI...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div style={{
          padding: '0.5rem 1rem',
          borderRadius: '12px',
          fontSize: '0.75rem',
          background: 'rgba(239, 68, 68, 0.1)',
          color: 'var(--danger)',
          border: '1px solid rgba(239, 68, 68, 0.3)'
        }}>
          {error}
        </div>
      )}

      {/* AI Toggle Button */}
      <button
        onClick={toggleAI}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: isAIOn ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-secondary)',
          border: `1px solid ${isAIOn ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-color)'}`,
          borderRadius: '10px',
          padding: '0.5rem 0.875rem',
          color: isAIOn ? 'var(--success)' : 'var(--text-muted)',
          fontSize: '0.75rem',
          fontWeight: 500,
          cursor: 'pointer',
          boxShadow: 'var(--shadow-sm)',
          transition: 'all 0.2s'
        }}
      >
        <span>🤖</span>
        <span>AI {isAIOn ? 'ON' : 'OFF'}</span>
      </button>
    </div>
  )
}
