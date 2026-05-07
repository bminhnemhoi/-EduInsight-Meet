'use client'

import {
  createContext,
  useContext,
  useState,
  ReactNode,
} from 'react'
import { UserRole } from './AuthContext'
import { behaviorStore } from '../lib/behaviorStore'
import { voiceActivityStore } from '../lib/voiceActivity'

interface BehaviorPayload {
  userId: string
  userName: string
  behavior: string
  emoji: string
  color: string
  type: 'positive' | 'negative' | 'neutral' | 'warning'
  timestamp: number
}

export interface MeetingResult {
  ok: boolean
  error?: string
}

interface MeetingContextType {
  createMeeting: (
    code: string,
    userId: string,
    userName: string,
    role: UserRole
  ) => Promise<MeetingResult>
  joinMeeting: (
    code: string,
    userId: string,
    userName: string,
    role: UserRole
  ) => Promise<MeetingResult>
  currentMeetingId: string | null
  setCurrentMeetingId: (id: string | null) => void
  saveBehavior: (b: BehaviorPayload) => Promise<void>
}

const MeetingContext = createContext<MeetingContextType | undefined>(undefined)

/**
 * Local-only meeting context. Live behavior labels are kept in
 * `behaviorStore` (in-memory) so the in-room panels and CSV export work.
 * No network round-trip is needed to start or join a meeting.
 *
 * Cross-session history persistence is intentionally not wired — users
 * who want to keep a record export CSV before leaving the meeting.
 */
export function MeetingProvider({ children }: { children: ReactNode }) {
  const [currentMeetingId, setCurrentMeetingId] = useState<string | null>(null)

  const createMeeting: MeetingContextType['createMeeting'] = async (code) => {
    setCurrentMeetingId(code)
    behaviorStore.reset()
    voiceActivityStore.reset()
    return { ok: true }
  }

  const joinMeeting: MeetingContextType['joinMeeting'] = async (code) => {
    setCurrentMeetingId(code)
    behaviorStore.reset()
    voiceActivityStore.reset()
    return { ok: true }
  }

  const saveBehavior: MeetingContextType['saveBehavior'] = async () => {
    // No-op: behaviors live in `behaviorStore` (in-memory). The receiver
    // and the local detector both push there directly.
  }

  return (
    <MeetingContext.Provider
      value={{
        createMeeting,
        joinMeeting,
        currentMeetingId,
        setCurrentMeetingId,
        saveBehavior,
      }}
    >
      {children}
    </MeetingContext.Provider>
  )
}

export function useMeeting() {
  const context = useContext(MeetingContext)
  if (context === undefined) {
    throw new Error('useMeeting must be used within a MeetingProvider')
  }
  return context
}
