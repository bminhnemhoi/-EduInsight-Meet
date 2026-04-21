'use client'

import {
  useParticipants,
  useLocalParticipant,
} from '@livekit/components-react'
import dynamic from 'next/dynamic'

const AIBehaviorDetector = dynamic(
  () => import('./AIBehaviorDetector'),
  { ssr: false }
)

const StudentsBehaviorPanel = dynamic(
  () => import('./StudentsBehaviorPanel'),
  { ssr: false }
)

interface MeetSettings {
  userName: string
  cameraEnabled: boolean
  micEnabled: boolean
  userRole?: 'teacher' | 'student'
  userId?: string
}

/** Renders AI detectors for all participants (for teacher) or self (for student) */
export function AIDetectionManager({ settings }: { settings: MeetSettings }) {
  const participants = useParticipants()
  const { localParticipant } = useLocalParticipant()
  
  // AI luôn hiển thị VÀ phân tích ngay cả khi 1 người
  const shouldAnalyze = true
  
  if (settings.userRole === 'student') {
    return (
      <AIBehaviorDetector 
        enabled={shouldAnalyze} 
        userId={settings.userId}
        userName={settings.userName}
      />
    )
  }
  
  if (settings.userRole === 'teacher') {
    return (
      <>
        {participants.map((participant) => {
          if (participant.sid === localParticipant?.sid) return null
          
          return (
            <AIBehaviorDetector
              key={participant.sid}
              enabled={shouldAnalyze}
              userId={participant.sid}
              userName={participant.name || participant.identity}
              participantSid={participant.sid}
            />
          )
        })}
      </>
    )
  }
  
  return null
}

/** Wrapper to pass filtered participants to StudentsBehaviorPanel */
export function StudentsBehaviorPanelWrapper() {
  const participants = useParticipants()
  const { localParticipant } = useLocalParticipant()
  
  const remoteParticipants = participants.filter(p => p.sid !== localParticipant?.sid)
  
  return <StudentsBehaviorPanel participants={remoteParticipants} />
}
