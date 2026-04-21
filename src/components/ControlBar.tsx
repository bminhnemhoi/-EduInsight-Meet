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
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid var(--border-color)',
      padding: '1rem',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '1rem',
      zIndex: 100,
      boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.05)'
    }}>
      {/* Room Code */}
      <button
        onClick={copyCode}
        style={{
          background: 'var(--accent-light)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '12px',
          padding: '0.75rem 1rem',
          color: 'var(--accent-primary)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.875rem',
          fontFamily: 'monospace',
          fontWeight: 600
        }}
      >
        <span>{copied ? '✓ Đã copy' : `📋 ${roomCode}`}</span>
      </button>

      {/* Mic Toggle */}
      <TrackToggle
        source={Track.Source.Microphone}
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          border: '2px solid var(--border-color)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          transition: 'all 0.2s',
          background: 'var(--bg-primary)'
        }}
      />

      {/* Camera Toggle */}
      <TrackToggle
        source={Track.Source.Camera}
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          border: '2px solid var(--border-color)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          transition: 'all 0.2s',
          background: 'var(--bg-primary)'
        }}
      />

      {/* Screen Share Toggle */}
      <TrackToggle
        source={Track.Source.ScreenShare}
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          border: '2px solid var(--border-color)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          background: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
          transition: 'all 0.2s'
        }}
      />

      {/* Custom Disconnect Button */}
      <button
        onClick={handleDisconnect}
        disabled={isDisconnecting}
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          border: 'none',
          background: isDisconnecting 
            ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
            : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          cursor: isDisconnecting ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          color: '#fff',
          boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)',
          transition: 'all 0.2s'
        }}
        title="Rời phòng"
      >
        {isDisconnecting ? '⏳' : '📞'}
      </button>
    </div>
  )
}
