'use client'

import { useParticipants, useLocalParticipant } from '@livekit/components-react'
import dynamic from 'next/dynamic'

const AIBehaviorDetector = dynamic(() => import('./AIBehaviorDetector'), {
  ssr: false,
})

const BehaviorReceiver = dynamic(() => import('./BehaviorReceiver'), {
  ssr: false,
})

const DistractionAlerts = dynamic(() => import('./DistractionAlerts'), {
  ssr: false,
})

const VoiceActivityTracker = dynamic(() => import('./VoiceActivityTracker'), {
  ssr: false,
})

const StudentsBehaviorPanel = dynamic(() => import('./StudentsBehaviorPanel'), {
  ssr: false,
})

interface MeetSettings {
  userName: string
  cameraEnabled: boolean
  micEnabled: boolean
  userRole?: 'teacher' | 'student'
  userId?: string
}

/**
 * Mounts the AI pipeline appropriate to the current role:
 * - Everyone runs MoveNet on their OWN local video (privacy-by-design).
 * - Teachers additionally subscribe to remote participants' broadcasted labels
 *   via the LiveKit data channel (no remote-video processing on teacher CPU).
 */
export function AIDetectionManager({ settings }: { settings: MeetSettings }) {
  return (
    <>
      <AIBehaviorDetector
        enabled={true}
        userId={settings.userId}
        userName={settings.userName}
      />
      <VoiceActivityTracker />
      {settings.userRole === 'teacher' && (
        <>
          <BehaviorReceiver />
          <DistractionAlerts />
        </>
      )}
    </>
  )
}

/** Wrapper to pass remote participants to the teacher's class overview panel. */
export function StudentsBehaviorPanelWrapper() {
  const participants = useParticipants()
  const { localParticipant } = useLocalParticipant()

  const remoteParticipants = participants.filter(
    (p) => p.sid !== localParticipant?.sid
  )

  return <StudentsBehaviorPanel participants={remoteParticipants} />
}
