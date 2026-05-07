'use client'

import { useState } from 'react'
import {
  TrackToggle,
  useRoomContext,
} from '@livekit/components-react'
import { Track } from 'livekit-client'
import { logger } from '../lib/logger'

interface Props {
  roomCode: string
  onDisconnect: () => void
  /** Teacher-only: shown next to disconnect button. Triggers end-of-class
   * broadcast to all participants. */
  onEndClass?: () => void
}

export default function ControlBar({ roomCode, onDisconnect, onEndClass }: Props) {
  const [copied, setCopied] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const room = useRoomContext()

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDisconnect = async () => {
    if (isDisconnecting) return
    setIsDisconnecting(true)
    
    try {
      const localParticipant = room.localParticipant
      if (localParticipant) {
        const tracks = localParticipant.getTrackPublications()
        tracks.forEach((publication) => {
          if (publication.track) {
            publication.track.stop()
          }
        })
      }
      
      await room.disconnect()
      onDisconnect()
    } catch (err) {
      logger.error('Disconnect error:', err)
      onDisconnect()
    }
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'rgba(255, 255, 255, 0.98)',
      backdropFilter: 'blur(24px)',
      borderTop: '1px solid rgba(59, 130, 246, 0.1)',
      padding: '1.25rem',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '1.25rem',
      zIndex: 100,
      boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.08)'
    }}>
      {/* Room Code */}
      <button
        onClick={copyCode}
        title="Copy mã phòng"
        style={{
          background: copied ? 'rgba(16, 185, 129, 0.12)' : 'rgba(59, 130, 246, 0.08)',
          border: `1px solid ${copied ? 'rgba(16, 185, 129, 0.35)' : 'rgba(59, 130, 246, 0.3)'}`,
          borderRadius: 26,
          padding: '0 1rem',
          height: 52,
          color: copied ? '#059669' : 'var(--accent-primary)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: '0.875rem',
          fontFamily: 'monospace',
          fontWeight: 600,
          transition: 'all 0.18s ease',
        }}
      >
        <span style={{ fontSize: '0.9375rem' }}>{copied ? '✓' : '📋'}</span>
        {copied ? 'Đã copy' : roomCode}
      </button>

      {/* Mic Toggle */}
      <div style={{ position: 'relative' }}>
        <TrackToggle
          source={Track.Source.Microphone}
          className="control-toggle-btn"
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.375rem',
            transition: 'all 0.18s ease',
            background: '#ffffff',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
          }}
        />
      </div>

      {/* Camera Toggle */}
      <div style={{ position: 'relative' }}>
        <TrackToggle
          source={Track.Source.Camera}
          className="control-toggle-btn"
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.375rem',
            transition: 'all 0.18s ease',
            background: '#ffffff',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
          }}
        />
      </div>

      {/* Screen Share Toggle */}
      <div style={{ position: 'relative' }}>
        <TrackToggle
          source={Track.Source.ScreenShare}
          className="control-toggle-btn"
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            border: '2px solid rgba(59, 130, 246, 0.2)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.75rem',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            color: 'var(--text-primary)',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
          }}
        />
      </div>

      {/* Custom Disconnect Button */}
      {onEndClass && (
        <button
          onClick={onEndClass}
          style={{
            height: 52,
            padding: '0 1rem',
            borderRadius: 26,
            border: 'none',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            fontSize: '0.875rem',
            fontWeight: 600,
            color: '#fff',
            boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
            transition: 'all 0.18s ease',
          }}
          title="Kết thúc buổi học cho cả lớp"
        >
          <span style={{ fontSize: '1rem' }}>🔔</span>
          Kết thúc buổi
        </button>
      )}

      <button
        onClick={handleDisconnect}
        disabled={isDisconnecting}
        style={{
          height: 52,
          padding: '0 1.125rem',
          borderRadius: 26,
          border: 'none',
          background: isDisconnecting
            ? '#9ca3af'
            : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          cursor: isDisconnecting ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          fontSize: '0.9375rem',
          fontWeight: 600,
          color: '#fff',
          boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)',
          transition: 'all 0.18s ease',
        }}
        title="Rời phòng (chỉ bạn rời, lớp vẫn tiếp tục)"
      >
        <span style={{ fontSize: '1.125rem' }}>{isDisconnecting ? '⏳' : '📵'}</span>
        Rời phòng
      </button>
    </div>
  )
}
