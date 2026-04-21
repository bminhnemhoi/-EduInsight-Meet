'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { UserRole } from './AuthContext'
import { database, BehaviorEntry } from '../lib/database'
import { logger } from '../lib/logger'

export interface MeetingParticipant {
  userId: string
  userName: string
  role: UserRole
  joinedAt: number
}

export interface Meeting {
  code: string
  creatorId: string
  participants: MeetingParticipant[]
  createdAt: number
}

interface MeetingContextType {
  createMeeting: (code: string, userId: string, userName: string, role: UserRole) => Promise<void>
  joinMeeting: (code: string, userId: string, userName: string, role: UserRole) => Promise<boolean>
  getMeeting: (code: string) => Meeting | null
  isTeacher: (code: string, userId: string) => boolean
  getStudents: (code: string) => MeetingParticipant[]
  currentMeetingId: string | null
  setCurrentMeetingId: (id: string | null) => void
  saveBehavior: (behavior: Omit<BehaviorEntry, 'id' | 'meetingId'>) => Promise<void>
  getBehaviors: (meetingId: string) => Promise<BehaviorEntry[]>
  getUserBehaviors: (meetingId: string, userId: string) => Promise<BehaviorEntry[]>
}

const MeetingContext = createContext<MeetingContextType | undefined>(undefined)

function loadMeetingsFromStorage(): Record<string, Meeting> {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem('meetings') || '{}')
  } catch {
    return {}
  }
}

function saveMeetingsToStorage(data: Record<string, Meeting>): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('meetings', JSON.stringify(data))
}

export function MeetingProvider({ children }: { children: ReactNode }) {
  const [meetings, setMeetings] = useState<Map<string, Meeting>>(new Map())
  const [currentMeetingId, setCurrentMeetingId] = useState<string | null>(null)
  const [isDbReady, setIsDbReady] = useState(false)

  // Initialize database
  useEffect(() => {
    database.init().then(success => {
      if (success) {
        logger.info('[MeetingContext] Database initialized')
        setIsDbReady(true)
      } else {
        logger.error('[MeetingContext] Failed to initialize database')
      }
    })
  }, [])

  const createMeeting = async (code: string, userId: string, userName: string, role: UserRole) => {
    const meeting: Meeting = {
      code,
      creatorId: userId,
      participants: [{
        userId,
        userName,
        role,
        joinedAt: Date.now()
      }],
      createdAt: Date.now()
    }
    
    setMeetings(prev => new Map(prev).set(code, meeting))
    
    const meetingsData = loadMeetingsFromStorage()
    meetingsData[code] = meeting
    saveMeetingsToStorage(meetingsData)

    // Save to IndexedDB
    if (isDbReady) {
      const meetingId = `meeting_${code}_${Date.now()}`
      setCurrentMeetingId(meetingId)
      
      await database.saveMeeting({
        id: meetingId,
        roomCode: code,
        teacherId: userId,
        teacherName: userName,
        startTime: Date.now(),
        participantCount: 1
      })
      
      logger.info('[MeetingContext] Meeting saved to DB:', meetingId)
    }
  }

  const joinMeeting = async (code: string, userId: string, userName: string, role: UserRole): Promise<boolean> => {
    let meeting = meetings.get(code)
    
    if (!meeting) {
      const meetingsData = loadMeetingsFromStorage()
      meeting = meetingsData[code]
      
      if (!meeting) {
        meeting = {
          code,
          creatorId: userId,
          participants: [],
          createdAt: Date.now()
        }
      }
    }

    // Check if user already joined
    if (meeting.participants.some(p => p.userId === userId)) {
      return true
    }

    // Add participant
    const newParticipant: MeetingParticipant = {
      userId,
      userName,
      role,
      joinedAt: Date.now()
    }

    meeting.participants.push(newParticipant)
    setMeetings(prev => new Map(prev).set(code, meeting))

    const meetingsData = loadMeetingsFromStorage()
    meetingsData[code] = meeting
    saveMeetingsToStorage(meetingsData)

    // Update participant count in DB
    if (isDbReady && currentMeetingId) {
      const dbMeeting = await database.getMeeting(currentMeetingId)
      if (dbMeeting) {
        dbMeeting.participantCount = meeting.participants.length
        await database.saveMeeting(dbMeeting)
      }
    }

    return true
  }

  const getMeeting = (code: string): Meeting | null => {
    const meeting = meetings.get(code)
    if (meeting) return meeting

    const meetingsData = loadMeetingsFromStorage()
    return meetingsData[code] || null
  }

  const isTeacher = (code: string, userId: string): boolean => {
    const meeting = getMeeting(code)
    if (!meeting) return false
    
    const participant = meeting.participants.find(p => p.userId === userId)
    return participant?.role === 'teacher'
  }

  const getStudents = (code: string): MeetingParticipant[] => {
    const meeting = getMeeting(code)
    if (!meeting) return []
    
    return meeting.participants.filter(p => p.role === 'student')
  }

  // Save behavior to database
  const saveBehavior = async (behavior: Omit<BehaviorEntry, 'id' | 'meetingId'>) => {
    if (!isDbReady || !currentMeetingId) {
      logger.warn('[MeetingContext] Cannot save behavior: DB not ready or no meeting')
      return
    }

    const behaviorEntry: BehaviorEntry = {
      id: `behavior_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      meetingId: currentMeetingId,
      ...behavior
    }

    await database.saveBehavior(behaviorEntry)
  }

  // Get all behaviors for a meeting
  const getBehaviors = async (meetingId: string): Promise<BehaviorEntry[]> => {
    if (!isDbReady) return []
    return database.getBehaviorsByMeeting(meetingId)
  }

  // Get behaviors for specific user in a meeting
  const getUserBehaviors = async (meetingId: string, userId: string): Promise<BehaviorEntry[]> => {
    if (!isDbReady) return []
    return database.getBehaviorsByUser(meetingId, userId)
  }

  return (
    <MeetingContext.Provider value={{
      createMeeting,
      joinMeeting,
      getMeeting,
      isTeacher,
      getStudents,
      currentMeetingId,
      setCurrentMeetingId,
      saveBehavior,
      getBehaviors,
      getUserBehaviors
    }}>
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
