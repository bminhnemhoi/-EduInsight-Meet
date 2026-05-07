'use client'

import { useEffect } from 'react'
import {
  useRoomContext,
  useParticipants,
} from '@livekit/components-react'
import { voiceActivityStore } from '../lib/voiceActivity'

/**
 * Tier 2: passive tracker that polls LiveKit's per-participant
 * `audioLevel` and accumulates total speaking time in voiceActivityStore.
 *
 * Renders nothing. Should be mounted once inside the room (any role).
 * Resets on mount/unmount so each meeting gets a fresh slate.
 */
export default function VoiceActivityTracker() {
  const room = useRoomContext()
  const participants = useParticipants()

  useEffect(() => {
    voiceActivityStore.start()

    const interval = setInterval(() => {
      // Sample local + remote participants
      const local = room.localParticipant
      if (local) {
        voiceActivityStore.sample(
          local.identity,
          local.name || local.identity,
          local.audioLevel ?? 0
        )
      }
      for (const p of participants) {
        if (p.identity === local?.identity) continue
        voiceActivityStore.sample(
          p.identity,
          p.name || p.identity,
          p.audioLevel ?? 0
        )
      }
    }, voiceActivityStore.SAMPLE_INTERVAL_MS)

    return () => {
      clearInterval(interval)
    }
  }, [room, participants])

  return null
}
