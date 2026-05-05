'use client'

import { useEffect } from 'react'
import {
  useRoomContext,
  useLocalParticipant,
} from '@livekit/components-react'
import type { RemoteParticipant, DataPacket_Kind } from 'livekit-client'
import {
  BEHAVIOR_TOPIC,
  decodeBehaviorMessage,
} from '../lib/behaviorChannel'
import { addStudentBehavior } from './StudentsBehaviorPanel'
import { useMeeting } from '../contexts/MeetingContext'
import { logger } from '../lib/logger'

/**
 * Subscribes to behavior label broadcasts from remote participants.
 * Mounted by the teacher; the teacher itself does not run AI on remote video.
 *
 * Persists transitions to IndexedDB on the teacher side too, so reports stay
 * complete even if a student disconnects mid-session before their last write
 * has flushed.
 */
export default function BehaviorReceiver() {
  const room = useRoomContext()
  const { localParticipant } = useLocalParticipant()
  const { saveBehavior } = useMeeting()

  useEffect(() => {
    if (!room) return

    const handleData = (
      payload: Uint8Array,
      participant?: RemoteParticipant,
      _kind?: DataPacket_Kind,
      topic?: string
    ) => {
      if (topic !== BEHAVIOR_TOPIC) return
      const msg = decodeBehaviorMessage(payload)
      if (!msg) return

      // Ignore loopback (shouldn't happen, but safe)
      if (participant && participant.sid === localParticipant?.sid) return

      addStudentBehavior({
        userId: msg.userId,
        userName: msg.userName,
        label: msg.label,
        emoji: msg.emoji,
        color: msg.color,
        timestamp: msg.timestamp,
      })

      // Mirror persistence on the teacher side. Best-effort.
      saveBehavior({
        userId: msg.userId,
        userName: msg.userName,
        behavior: msg.label,
        emoji: msg.emoji,
        color: msg.color,
        type: msg.type,
        timestamp: msg.timestamp,
      }).catch((err) => logger.warn('[BehaviorReceiver] save failed:', err))
    }

    room.on('dataReceived', handleData)
    logger.info('[BehaviorReceiver] subscribed')

    return () => {
      room.off('dataReceived', handleData)
    }
  }, [room, localParticipant, saveBehavior])

  return null
}
