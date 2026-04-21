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
}

export default function ControlBar({ roomCode, onDisconnect }: Props) {
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
        style={{
          background: copied 
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.2) 100%)'
            : 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.15) 100%)',
          border: `2px solid ${copied ? 'rgba(16, 185, 129, 0.4)' : 'rgba(59, 130, 246, 0.4)'}`,
          borderRadius: '16px',
          padding: '0.875rem 1.25rem',
          color: copied ? '#10b981' : 'var(--accent-primary)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.625rem',
          fontSize: '0.9375rem',
          fontFamily: 'monospace',
          fontWeight: 700,
          transition: 'all 0.3s ease',
          boxShadow: copied 
            ? '0 4px 16px rgba(16, 185, 129, 0.2)'
            : '0 4px 16px rgba(59, 130, 246, 0.2)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = copied
            ? '0 6px 20px rgba(16, 185, 129, 0.3)'
            : '0 6px 20px rgba(59, 130, 246, 0.3)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = copied
            ? '0 4px 16px rgba(16, 185, 129, 0.2)'
            : '0 4px 16px rgba(59, 130, 246, 0.2)'
        }}
      >
        <span style={{ fontSize: '1.125rem' }}>{copied ? '✓' : '📋'}</span>
        <span>{copied ? 'Đã copy!' : roomCode}</span>
      </button>

      {/* Mic Toggle */}
      <div style={{ position: 'relative' }}>
        <TrackToggle
          source={Track.Source.Microphone}
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
            transition: 'all 0.3s ease',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
          }}
        />
      </div>

      {/* Camera Toggle */}
      <div style={{ position: 'relative' }}>
        <TrackToggle
          source={Track.Source.Camera}
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
            transition: 'all 0.3s ease',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
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
      <button
        onClick={handleDisconnect}
        disabled={isDisconnecting}
        style={{
          width: '68px',
          height: '68px',
          borderRadius: '50%',
          border: 'none',
          background: isDisconnecting 
            ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
            : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          cursor: isDisconnecting ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.875rem',
          color: '#fff',
          boxShadow: isDisconnecting
            ? '0 4px 16px rgba(107, 114, 128, 0.3)'
            : '0 6px 20px rgba(239, 68, 68, 0.5)',
          transition: 'all 0.3s ease',
          transform: 'rotate(135deg)'
        }}
        onMouseEnter={(e) => {
          if (!isDisconnecting) {
            e.currentTarget.style.transform = 'rotate(135deg) scale(1.1)'
            e.currentTarget.style.boxShadow = '0 8px 28px rgba(239, 68, 68, 0.6)'
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'rotate(135deg) scale(1)'
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.5)'
        }}
        title="Rời phòng"
      >
        {isDisconnecting ? '⏳' : '📞'}
      </button>
    </div>
  )
}
