'use client'

import {
  useTracks,
  useParticipants,
  useLocalParticipant,
  useIsSpeaking,
  VideoTrack,
} from '@livekit/components-react'
import { Track, type Participant } from 'livekit-client'
import { getInitials, getAvatarColor } from '../lib/utils'

export default function VideoGrid() {
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare])
  const participants = useParticipants()
  const { localParticipant } = useLocalParticipant()

  const videoTracks = tracks.filter(t => t.source === Track.Source.Camera)
  const screenTracks = tracks.filter(t => t.source === Track.Source.ScreenShare)
  
  const localHasVideo = videoTracks.some(t => t.participant.sid === localParticipant?.sid)

  const participantsWithVideo = new Set(videoTracks.map(t => t.participant.sid))
  const participantsWithoutVideo = participants.filter(p => 
    !participantsWithVideo.has(p.sid) && p.sid !== localParticipant?.sid
  )

  const hasScreenShare = screenTracks.length > 0

  return (
    <div style={{
      display: 'flex',
      flexDirection: hasScreenShare ? 'column' : 'row',
      gap: '1rem',
      padding: '1rem',
      height: 'calc(100vh - 150px)',
      width: '100%',
      maxWidth: '100%',
      margin: '0'
    }}>
      {/* Screen Share - Full width at top if present */}
      {screenTracks.map((track) => (
        <div
          key={track.participant.sid + '-screen'}
          style={{
            position: 'relative',
            background: '#000',
            borderRadius: '20px',
            overflow: 'hidden',
            border: '2px solid var(--accent-primary)',
            boxShadow: 'var(--shadow-lg)',
            height: hasScreenShare ? '60vh' : 'auto',
            flex: hasScreenShare ? '0 0 auto' : 1
          }}
        >
          <VideoTrack
            trackRef={track}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain'
            }}
          />
          <div style={{
            position: 'absolute',
            top: '1rem',
            left: '1rem',
            background: 'rgba(59, 130, 246, 0.95)',
            backdropFilter: 'blur(10px)',
            padding: '0.5rem 1rem',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: 'var(--shadow-md)'
          }}>
            <span style={{ fontSize: '1rem' }}>🖥️</span>
            <span style={{ fontSize: '0.875rem', color: '#fff', fontWeight: 500 }}>
              {track.participant.name || track.participant.identity} đang chia sẻ màn hình
            </span>
          </div>
        </div>
      ))}

      {/* Video Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: participants.length > 1 ? 'repeat(auto-fit, minmax(300px, 1fr))' : '1fr',
        gap: '1rem',
        flex: 1,
        height: hasScreenShare ? '35vh' : 'auto',
        overflowY: hasScreenShare ? 'auto' : 'visible',
        width: '100%'
      }}>
      {/* Show local participant placeholder if no video */}
      {localParticipant && !localHasVideo && (
        <div
          style={{
            position: 'relative',
            background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
            borderRadius: '20px',
            overflow: 'hidden',
            border: '3px solid var(--accent-primary)',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '300px'
          }}
        >
          <div style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${getAvatarColor(localParticipant.name || localParticipant.identity)} 0%, ${getAvatarColor(localParticipant.name || localParticipant.identity)}dd 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.5rem',
            fontWeight: 600,
            color: '#fff',
            marginBottom: '1rem',
            boxShadow: 'var(--shadow-lg)'
          }}>
            {getInitials(localParticipant.name || localParticipant.identity)}
          </div>
          <p style={{ color: '#fff', fontSize: '1rem', fontWeight: 500 }}>
            {localParticipant.name || localParticipant.identity}
          </p>
          <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            📷 Camera đang tắt
          </p>
          
          <div style={{
            position: 'absolute',
            bottom: '1rem',
            left: '1rem',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            padding: '0.5rem 1rem',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: 'var(--shadow-md)'
          }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>
              {localParticipant.name || localParticipant.identity}
            </span>
            <span style={{
              fontSize: '0.625rem',
              background: 'var(--accent-primary)',
              padding: '2px 6px',
              borderRadius: '4px',
              color: '#fff'
            }}>
              Bạn
            </span>
          </div>
        </div>
      )}

      {/* Video tracks */}
      {videoTracks.map((track) => (
        <VideoTile
          key={track.participant.sid}
          track={track}
          isLocal={track.participant.sid === localParticipant?.sid}
        />
      ))}

      {/* Remote participants without video - show avatars */}
      {participantsWithoutVideo.map((participant) => (
        <div
          key={participant.sid}
          style={{
            position: 'relative',
            background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
            borderRadius: '24px',
            overflow: 'hidden',
            border: '2px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '300px',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)'
            e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.3)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.2)'
          }}
        >
          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${getAvatarColor(participant.name || participant.identity)} 0%, ${getAvatarColor(participant.name || participant.identity)}dd 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '3rem',
            fontWeight: 700,
            color: '#fff',
            marginBottom: '1.25rem',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.3)',
            border: '4px solid rgba(255, 255, 255, 0.2)'
          }}>
            {getInitials(participant.name || participant.identity)}
          </div>
          <p style={{ color: '#fff', fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            {participant.name || participant.identity}
          </p>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            background: 'rgba(107, 114, 128, 0.2)',
            borderRadius: '12px',
            backdropFilter: 'blur(8px)'
          }}>
            <span style={{ fontSize: '1.125rem' }}>📷</span>
            <p style={{ color: '#d1d5db', fontSize: '0.875rem', fontWeight: 500 }}>
              Camera đang tắt
            </p>
          </div>
          
          <div style={{
            position: 'absolute',
            bottom: '1rem',
            left: '1rem',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            padding: '0.5rem 1rem',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: 'var(--shadow-md)'
          }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>
              {participant.name || participant.identity}
            </span>
          </div>
        </div>
      ))}

      {/* Empty state when waiting for others */}
      {participants.length === 1 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(37, 99, 235, 0.08) 100%)',
          borderRadius: '24px',
          border: '2px dashed rgba(59, 130, 246, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.5rem',
          minHeight: '300px',
          padding: '2rem',
          animation: 'fadeIn 0.5s ease'
        }}>
          <div style={{ 
            fontSize: '5rem',
            animation: 'pulse 2s ease-in-out infinite',
            filter: 'drop-shadow(0 4px 8px rgba(59, 130, 246, 0.2))'
          }}>👥</div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ 
              color: 'var(--text-primary)', 
              fontSize: '1.125rem',
              fontWeight: 600,
              marginBottom: '0.5rem'
            }}>Đang chờ người khác tham gia...</p>
            <p style={{ 
              color: 'var(--text-muted)', 
              fontSize: '0.9375rem'
            }}>Chia sẻ mã phòng để mời bạn bè</p>
          </div>
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#3b82f6',
              animation: 'pulse 1.5s ease-in-out infinite'
            }}></div>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#3b82f6',
              animation: 'pulse 1.5s ease-in-out infinite 0.2s'
            }}></div>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#3b82f6',
              animation: 'pulse 1.5s ease-in-out infinite 0.4s'
            }}></div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

interface VideoTileProps {
  track: ReturnType<typeof useTracks>[number]
  isLocal: boolean
}

/**
 * Single video tile. Extracted so we can `useIsSpeaking(participant)` per
 * tile (hooks need to be at top level of a component). Renders a green
 * speaking ring when the participant is talking.
 */
function VideoTile({ track, isLocal }: VideoTileProps) {
  const isSpeaking = useIsSpeaking(track.participant as Participant)
  const speakingColor = '#22c55e'

  return (
    <div
      data-lk-participant-sid={track.participant.sid}
      data-lk-participant-identity={track.participant.identity}
      style={{
        position: 'relative',
        background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
        borderRadius: 16,
        overflow: 'hidden',
        border: isSpeaking
          ? `3px solid ${speakingColor}`
          : isLocal
            ? '2px solid rgba(59, 130, 246, 0.5)'
            : '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: isSpeaking
          ? `0 0 0 4px ${speakingColor}33, 0 6px 18px rgba(0,0,0,0.25)`
          : '0 6px 18px rgba(0,0,0,0.2)',
        minHeight: 240,
        aspectRatio: '16/9',
        transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
      }}
    >
      <VideoTrack
        trackRef={track as never}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: isLocal ? 'scaleX(-1)' : 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 10,
          left: 10,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(8px)',
          padding: '4px 10px',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          color: '#fff',
          fontSize: '0.8125rem',
          fontWeight: 500,
        }}
      >
        {isSpeaking && (
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: speakingColor,
              boxShadow: `0 0 6px ${speakingColor}`,
            }}
          />
        )}
        <span>{track.participant.name || track.participant.identity}</span>
        {isLocal && (
          <span
            style={{
              fontSize: '0.625rem',
              background: 'rgba(59, 130, 246, 0.6)',
              padding: '1px 6px',
              borderRadius: 4,
              fontWeight: 600,
            }}
          >
            Bạn
          </span>
        )}
      </div>
    </div>
  )
}
