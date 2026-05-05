'use client'

import { useState, useEffect, useRef, useCallback, FormEvent } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { logger } from '../../../lib/logger'

interface DeviceStatus {
  camera: 'checking' | 'ok' | 'error'
  microphone: 'checking' | 'ok' | 'error'
}

/**
 * Guest join page — anyone with the room code can land here, type a name,
 * and enter the meeting. No account, no login. This is the link teachers
 * share with their class on Zalo / Messenger / wherever.
 */
export default function GuestJoinPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const code = params.code as string

  // Initial state must match between server and client to avoid React
  // hydration warnings. The pre-fill (from query params + localStorage) is
  // applied in a useEffect after mount.
  const [name, setName] = useState('')

  const userRole: 'teacher' | 'student' =
    searchParams?.get('as') === 'teacher' ? 'teacher' : 'student'

  useEffect(() => {
    if (typeof window === 'undefined') return
    const fromQuery = searchParams?.get('name') ?? ''
    if (fromQuery) {
      setName(fromQuery)
      return
    }
    try {
      const stored = localStorage.getItem('edu_last_display_name')
      if (stored) setName(stored)
    } catch {
      /* localStorage may be blocked */
    }
    // Run once per page; query param + localStorage are read on mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>({
    camera: 'checking',
    microphone: 'checking',
  })
  const [cameraEnabled, setCameraEnabled] = useState(true)
  const [micEnabled, setMicEnabled] = useState(true)
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState('')

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const checkDevices = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      setDeviceStatus({ camera: 'ok', microphone: 'ok' })
    } catch {
      try {
        const v = await navigator.mediaDevices.getUserMedia({ video: true })
        streamRef.current = v
        if (videoRef.current) videoRef.current.srcObject = v
        setDeviceStatus((prev) => ({ ...prev, camera: 'ok' }))
      } catch {
        setDeviceStatus((prev) => ({ ...prev, camera: 'error' }))
      }
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true })
        setDeviceStatus((prev) => ({ ...prev, microphone: 'ok' }))
      } catch {
        setDeviceStatus((prev) => ({ ...prev, microphone: 'error' }))
      }
    }
  }, [])

  useEffect(() => {
    checkDevices()
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
      }
    }
  }, [checkDevices])

  const toggleCamera = () => {
    const t = streamRef.current?.getVideoTracks()[0]
    if (t) {
      t.enabled = !t.enabled
      setCameraEnabled(t.enabled)
    }
  }

  const toggleMic = () => {
    const t = streamRef.current?.getAudioTracks()[0]
    if (t) {
      t.enabled = !t.enabled
      setMicEnabled(t.enabled)
    }
  }

  const handleJoin = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!name.trim()) {
      setError('Vui lòng nhập tên của bạn')
      return
    }
    setIsJoining(true)
    try {
      // Stop the preview stream so the room can take over the camera.
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
      if (videoRef.current) videoRef.current.srcObject = null

      sessionStorage.setItem(
        'meetSettings',
        JSON.stringify({
          guest: true,
          userName: name.trim(),
          cameraEnabled,
          micEnabled,
          userRole,
        })
      )

      // Remember the display name for next time.
      try {
        localStorage.setItem('edu_last_display_name', name.trim())
      } catch {
        /* localStorage may be blocked; non-critical */
      }

      router.push(`/meet/${code}/room`)
    } catch (err) {
      logger.error('[Join] Failed:', err)
      setError(err instanceof Error ? err.message : 'Lỗi khi tham gia')
      setIsJoining(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        padding: '2rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div className="container" style={{ maxWidth: '480px' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: 4,
            }}
          >
            🎓 Edu Insight Meet
          </h1>
          <div
            style={{
              fontSize: '0.875rem',
              color: 'var(--text-muted)',
              marginBottom: 8,
            }}
          >
            {userRole === 'teacher'
              ? 'Bạn đang tạo phòng:'
              : 'Bạn đang vào phòng:'}
          </div>
          <div
            style={{
              fontFamily: 'monospace',
              fontSize: '1.25rem',
              fontWeight: 700,
              color: 'var(--accent-primary)',
              padding: '0.375rem 1rem',
              background: 'rgba(59, 130, 246, 0.1)',
              borderRadius: 8,
              display: 'inline-block',
            }}
          >
            {code}
          </div>
        </div>

        <form onSubmit={handleJoin}>
          <div className="card">
            <div style={{ position: 'relative' }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="preview-video"
                style={{ transform: 'scaleX(-1)' }}
              />
              {!cameraEnabled && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(31, 41, 55, 0.9)',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#9ca3af',
                  }}
                >
                  <span style={{ fontSize: '3rem' }}>📷</span>
                </div>
              )}
            </div>

            <div className="device-status">
              <div className="status-item">
                <span
                  className={`status-dot ${
                    deviceStatus.camera === 'ok'
                      ? 'ok'
                      : deviceStatus.camera === 'error'
                        ? 'error'
                        : ''
                  }`}
                />
                <span>Camera</span>
              </div>
              <div className="status-item">
                <span
                  className={`status-dot ${
                    deviceStatus.microphone === 'ok'
                      ? 'ok'
                      : deviceStatus.microphone === 'error'
                        ? 'error'
                        : ''
                  }`}
                />
                <span>Mic</span>
              </div>
            </div>

            <div className="controls-row">
              <button
                type="button"
                className={`control-btn ${cameraEnabled ? 'active' : 'muted'}`}
                onClick={toggleCamera}
                title={cameraEnabled ? 'Tắt camera' : 'Bật camera'}
              >
                {cameraEnabled ? '📹' : '🚫'}
              </button>
              <button
                type="button"
                className={`control-btn ${micEnabled ? 'active' : 'muted'}`}
                onClick={toggleMic}
                title={micEnabled ? 'Tắt mic' : 'Bật mic'}
              >
                {micEnabled ? '🎤' : '🔇'}
              </button>
            </div>

            <input
              type="text"
              className="input"
              placeholder="Nhập tên hiển thị của bạn..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={64}
              autoFocus
              style={{ marginTop: '1rem' }}
            />

            {error && (
              <div
                style={{
                  padding: '0.75rem',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '0.5rem',
                  color: 'var(--danger)',
                  fontSize: '0.875rem',
                  marginTop: '0.75rem',
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isJoining || !name.trim()}
              style={{ marginTop: '1rem' }}
            >
              {isJoining ? (
                <>
                  <span className="animate-pulse">⏳</span>
                  Đang vào phòng...
                </>
              ) : (
                <>
                  <span>🚀</span>
                  Tham gia
                </>
              )}
            </button>

            <div
              style={{
                marginTop: '0.875rem',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                textAlign: 'center',
              }}
            >
              Đã có tài khoản giáo viên?{' '}
              <a
                href="/auth"
                style={{ color: 'var(--accent-primary)' }}
              >
                Đăng nhập
              </a>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
