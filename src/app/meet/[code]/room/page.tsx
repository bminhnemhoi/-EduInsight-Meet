'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  LiveKitRoom,
  RoomAudioRenderer,
} from '@livekit/components-react'
import dynamic from 'next/dynamic'
import { logger } from '../../../../lib/logger'
import VideoGrid from '../../../../components/VideoGrid'
import ControlBar from '../../../../components/ControlBar'
import RoomHeader from '../../../../components/RoomHeader'
import ErrorBoundary from '../../../../components/ErrorBoundary'
import { AIDetectionManager, StudentsBehaviorPanelWrapper } from '../../../../components/AIDetectionManager'
import EndOfClassController from '../../../../components/EndOfClassController'

const BehaviorHistoryPanel = dynamic(
  () => import('../../../../components/BehaviorHistoryPanel'),
  { ssr: false }
)

interface MeetSettings {
  userName: string
  cameraEnabled: boolean
  micEnabled: boolean
  userRole?: 'teacher' | 'student'
  userId?: string
  /** True for anonymous join via /join/[code] — no login required. */
  guest?: boolean
}

// Room Content Component
function RoomContent({ settings, code }: { settings: MeetSettings; code: string }) {
  const router = useRouter()
  const [token, setToken] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [showHistory, setShowHistory] = useState(true)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function fetchToken() {
      const isGuest = !!settings.guest
      const endpoint = isGuest ? '/api/meet/guest-token' : '/api/meet/token'
      const body = isGuest
        ? { roomName: code, displayName: settings.userName }
        : { roomName: code, participantName: settings.userName }

      const maxAttempts = 3
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
          if (cancelled) return
          setToken(data.token)
          logger.info('[ROOM] Token acquired (guest:', isGuest, ')')
          return
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error'
          logger.error(`[ROOM] Token attempt ${attempt}/${maxAttempts}:`, message)
          if (attempt === maxAttempts) {
            if (!cancelled) setError(message)
            return
          }
          await new Promise((r) => setTimeout(r, 500 * attempt))
        }
      }
    }

    fetchToken()
    return () => {
      cancelled = true
    }
  }, [code, settings.userName])

  const handleDisconnect = useCallback(() => {
    sessionStorage.removeItem('meetSettings')
    router.push('/')
  }, [router])

  const handleConnected = useCallback(() => {
    setIsConnected(true)
    logger.info('[ROOM] Connected')
  }, [])

  const handleError = useCallback((err: Error) => {
    logger.error('[ROOM] Connection error:', err.message)
  }, [])

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div className="card" style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>❌</div>
          <h2 style={{ color: 'var(--danger)', marginBottom: '1rem' }}>Không thể kết nối</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{error}</p>
          <button className="btn btn-secondary" onClick={() => router.push('/')}>
            ← Quay lại trang chủ
          </button>
        </div>
      </div>
    )
  }

  if (!token) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '1.5rem',
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          border: '4px solid var(--accent-light)',
          borderTopColor: 'var(--accent-primary)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>Đang kết nối...</p>
      </div>
    )
  }

  const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || ''

  return (
    <LiveKitRoom
      token={token}
      serverUrl={livekitUrl}
      video={settings.cameraEnabled}
      audio={settings.micEnabled}
      onConnected={handleConnected}
      onDisconnected={handleDisconnect}
      onError={handleError}
      connect={true}
      options={{
        adaptiveStream: true,
        dynacast: true,
        videoCaptureDefaults: {
          resolution: { width: 1280, height: 720, frameRate: 30 }
        },
        audioCaptureDefaults: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      }}
      style={{ height: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}
    >
      <RoomHeader
        isConnected={isConnected}
        showHistory={showHistory}
        onToggleHistory={() => setShowHistory(!showHistory)}
      />

      {/* Main Content Area */}
      <div style={{
        display: 'flex',
        paddingTop: '60px',
        paddingBottom: '90px',
        height: '100vh'
      }}>
        <div style={{ flex: 1 }}>
          <VideoGrid />
        </div>

        {showHistory && (
          <div style={{
            width: '320px',
            padding: '1rem',
            overflowY: 'auto',
            borderLeft: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)'
          }}>
            {settings.userRole === 'student' ? (
              <BehaviorHistoryPanel maxEntries={15} />
            ) : (
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
                Xem phân tích học sinh ở panel bên phải
              </div>
            )}
          </div>
        )}
      </div>

      <AIDetectionManager settings={settings} />

      {settings.userRole === 'teacher' && <StudentsBehaviorPanelWrapper />}

      <EndOfClassController
        role={settings.userRole === 'teacher' ? 'teacher' : 'student'}
        userId={settings.userId}
        userName={settings.userName}
        onDisconnect={handleDisconnect}
      >
        {({ onEndClass }) => (
          <ControlBar
            roomCode={code}
            onDisconnect={handleDisconnect}
            onEndClass={settings.userRole === 'teacher' ? onEndClass : undefined}
          />
        )}
      </EndOfClassController>

      <RoomAudioRenderer />

      <style jsx global>{`
        /* LiveKit component overrides */
        [data-lk-theme="default"] {
          --lk-bg: transparent;
        }
        .lk-button-group {
          display: none;
        }
      `}</style>
    </LiveKitRoom>
  )
}

// Main Page Component
export default function RoomPage() {
  const router = useRouter()
  const params = useParams()
  const code = params.code as string
  const [settings, setSettings] = useState<MeetSettings | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    const stored = sessionStorage.getItem('meetSettings')
    if (!stored) {
      // No setup data → bounce to the guest join page so anyone landing
      // here (refresh, copied URL) gets a sane prejoin flow regardless of
      // whether they are logged in.
      router.push(`/join/${code}`)
      return
    }
    setSettings(JSON.parse(stored) as MeetSettings)
  }, [code, router, mounted])

  if (!mounted || !settings) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
      }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
      </div>
    )
  }

  return (
    <ErrorBoundary
      fallback={
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            padding: '2rem',
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '2rem',
              maxWidth: '440px',
              textAlign: 'center',
              boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Phòng họp gặp lỗi
            </h2>
            <p
              style={{ color: '#6b7280', marginBottom: '1.5rem', fontSize: '0.875rem' }}
            >
              Có thể do mất kết nối hoặc AI bị lỗi. Bạn có thể tải lại hoặc về trang chủ.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Tải lại
              </button>
              <button
                onClick={() => (window.location.href = '/')}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#e5e7eb',
                  color: '#1f2937',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Trang chủ
              </button>
            </div>
          </div>
        </div>
      }
    >
      <RoomContent settings={settings} code={code} />
    </ErrorBoundary>
  )
}
