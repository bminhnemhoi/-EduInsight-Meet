'use client'

import {
  useTracks,
  useParticipants,
  useLocalParticipant,
  VideoTrack,
} from '@livekit/components-react'
import { Track } from 'livekit-client'
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
        <div
          key={track.participant.sid}
          data-lk-participant-sid={track.participant.sid}
          data-lk-participant-identity={track.participant.identity}
          style={{
            position: 'relative',
            background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
            borderRadius: '20px',
            overflow: 'hidden',
            border: track.participant.sid === localParticipant?.sid
              ? '3px solid var(--accent-primary)'
              : '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-lg)',
            minHeight: '300px',
            aspectRatio: '16/9'
          }}
        >
          <VideoTrack
            trackRef={track}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: track.participant.sid === localParticipant?.sid ? 'scaleX(-1)' : 'none'
            }}
          />
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
              {track.participant.name || track.participant.identity}
            </span>
            {track.participant.sid === localParticipant?.sid && (
              <span style={{
                fontSize: '0.625rem',
                background: 'var(--accent-primary)',
                padding: '2px 6px',
                borderRadius: '4px',
                color: '#fff'
              }}>
                Bạn
              </span>
            )}
          </div>
          <div style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'rgba(255, 255, 255, 0.9)',
            padding: '0.25rem 0.5rem',
            borderRadius: '6px',
            fontSize: '0.75rem',
            color: 'var(--success)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            ● HD
          </div>
        </div>
      ))}

      {/* Remote participants without video - show avatars */}
      {participantsWithoutVideo.map((participant) => (
        <div
          key={participant.sid}
          style={{
            position: 'relative',
            background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
            borderRadius: '20px',
            overflow: 'hidden',
            border: '1px solid var(--border-color)',
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
            background: `linear-gradient(135deg, ${getAvatarColor(participant.name || participant.identity)} 0%, ${getAvatarColor(participant.name || participant.identity)}dd 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.5rem',
            fontWeight: 600,
            color: '#fff',
            marginBottom: '1rem',
            boxShadow: 'var(--shadow-lg)'
          }}>
            {getInitials(participant.name || participant.identity)}
          </div>
          <p style={{ color: '#fff', fontSize: '1rem', fontWeight: 500 }}>
            {participant.name || participant.identity}
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
              {participant.name || participant.identity}
            </span>
          </div>
        </div>
      ))}

      {/* Empty state when waiting for others */}
      {participants.length === 1 && (
        <div style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          borderRadius: '20px',
          border: '2px dashed var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          minHeight: '300px'
        }}>
          <div style={{ fontSize: '4rem' }}>👥</div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Đang chờ người khác tham gia...</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Chia sẻ mã phòng để mời</p>
        </div>
      )}
      </div>
    </div>
  )
}
