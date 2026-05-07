'use client'

import { useEffect, useRef, useState } from 'react'
import {
  useRoomContext,
  useLocalParticipant,
} from '@livekit/components-react'
import { ConnectionState, type RemoteParticipant, type DataPacket_Kind } from 'livekit-client'
import {
  CLASS_CONTROL_TOPIC,
  encodeClassEnded,
  decodeClassEnded,
} from '../lib/behaviorChannel'
import { logger } from '../lib/logger'
import dynamic from 'next/dynamic'

const EndOfClassModal = dynamic(() => import('./EndOfClassModal'), { ssr: false })

interface Props {
  role: 'teacher' | 'student'
  userId?: string
  userName?: string
  /** Click "Đóng & rời phòng" trong modal — parent disconnects + navigates. */
  onDisconnect: () => void
  /** Children render the in-room UI (ControlBar etc). We pass an
   *  `onEndClass` handler down via render-prop pattern. */
  children: (handlers: { onEndClass: () => void }) => React.ReactNode
}

/**
 * Coordinates the "end of class" experience:
 *  - Teacher click → broadcast ClassEnded message → all participants see modal
 *  - Student receives → modal pops up automatically
 *  - Modal Close → disconnect + navigate
 *
 * Tracks meetingStartedAt locally (mount time) so the modal can show
 * accurate session duration regardless of who joined when.
 */
export default function EndOfClassController({
  role,
  userId,
  userName,
  onDisconnect,
  children,
}: Props) {
  const room = useRoomContext()
  const { localParticipant } = useLocalParticipant()
  const [showModal, setShowModal] = useState(false)
  const [endedBy, setEndedBy] = useState<string>('')
  const startedAtRef = useRef<number>(Date.now())

  // Subscribe to class-control broadcasts from any participant.
  useEffect(() => {
    if (!room) return
    const handler = (
      payload: Uint8Array,
      _participant?: RemoteParticipant,
      _kind?: DataPacket_Kind,
      topic?: string
    ) => {
      if (topic !== CLASS_CONTROL_TOPIC) return
      const msg = decodeClassEnded(payload)
      if (!msg) return
      logger.info('[EndOfClass] received broadcast from', msg.endedBy)
      setEndedBy(msg.endedBy || 'Giáo viên')
      setShowModal(true)
    }
    room.on('dataReceived', handler)
    return () => {
      room.off('dataReceived', handler)
    }
  }, [room])

  const handleEndClass = () => {
    if (role !== 'teacher') return
    if (!confirm('Kết thúc buổi học cho cả lớp? Mọi người sẽ thấy bảng tổng kết.')) {
      return
    }
    if (room.state === ConnectionState.Connected) {
      try {
        const payload = encodeClassEnded({
          v: 1,
          topic: CLASS_CONTROL_TOPIC,
          action: 'class_ended',
          endedBy: userName || localParticipant?.name || 'Giáo viên',
          endedAt: Date.now(),
        })
        room.localParticipant
          .publishData(payload, { reliable: true, topic: CLASS_CONTROL_TOPIC })
          ?.catch((e) => logger.warn('[EndOfClass] broadcast publish failed:', e))
      } catch (e) {
        logger.warn('[EndOfClass] broadcast threw:', e)
      }
    }
    // Show modal locally too — broadcast loopback is not guaranteed.
    setEndedBy(userName || 'Giáo viên')
    setShowModal(true)
  }

  return (
    <>
      {children({ onEndClass: handleEndClass })}
      {showModal && (
        <EndOfClassModal
          role={role}
          currentUserId={userId}
          currentUserName={userName}
          endedBy={endedBy}
          meetingStartedAt={startedAtRef.current}
          onClose={() => {
            setShowModal(false)
            onDisconnect()
          }}
        />
      )}
    </>
  )
}
