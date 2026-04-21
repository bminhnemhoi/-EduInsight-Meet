// IndexedDB wrapper for storing meeting and behavior data
import { logger } from './logger'

const DB_NAME = 'EduInsightDB'
const DB_VERSION = 1

// Database stores
const STORES = {
  MEETINGS: 'meetings',
  BEHAVIORS: 'behaviors',
  SETTINGS: 'settings'
}

export interface Meeting {
  id: string
  roomCode: string
  teacherId: string
  teacherName: string
  startTime: number
  endTime?: number
  participantCount: number
}

export interface BehaviorEntry {
  id: string
  meetingId: string
  userId: string
  userName: string
  behavior: string
  emoji: string
  color: string
  bgColor?: string
  type: 'positive' | 'negative' | 'neutral' | 'warning'
  timestamp: number
}

export interface UserSettings {
  userId: string
  aiEnabled: boolean
  detectionSensitivity: number
  theme: 'light' | 'dark'
  autoMute: boolean
  recordingEnabled: boolean
}

class Database {
  private db: IDBDatabase | null = null

  async init(): Promise<boolean> {
    if (this.db) return true

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => {
        logger.error('[DB] Failed to open database:', request.error)
        reject(false)
      }

      request.onsuccess = () => {
        this.db = request.result
        logger.info('[DB] Database opened successfully')
        resolve(true)
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create meetings store
        if (!db.objectStoreNames.contains(STORES.MEETINGS)) {
          const meetingStore = db.createObjectStore(STORES.MEETINGS, { keyPath: 'id' })
          meetingStore.createIndex('roomCode', 'roomCode', { unique: false })
          meetingStore.createIndex('teacherId', 'teacherId', { unique: false })
          meetingStore.createIndex('startTime', 'startTime', { unique: false })
        }

        // Create behaviors store
        if (!db.objectStoreNames.contains(STORES.BEHAVIORS)) {
          const behaviorStore = db.createObjectStore(STORES.BEHAVIORS, { keyPath: 'id' })
          behaviorStore.createIndex('meetingId', 'meetingId', { unique: false })
          behaviorStore.createIndex('userId', 'userId', { unique: false })
          behaviorStore.createIndex('timestamp', 'timestamp', { unique: false })
          behaviorStore.createIndex('meetingUser', ['meetingId', 'userId'], { unique: false })
        }

        // Create settings store
        if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
          db.createObjectStore(STORES.SETTINGS, { keyPath: 'userId' })
        }

        logger.info('[DB] Database schema created')
      }
    })
  }

  // ==================== MEETINGS ====================

  async saveMeeting(meeting: Meeting): Promise<boolean> {
    if (!this.db) await this.init()
    if (!this.db) return false

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([STORES.MEETINGS], 'readwrite')
      const store = transaction.objectStore(STORES.MEETINGS)
      const request = store.put(meeting)

      request.onsuccess = () => {
        logger.info('[DB] Meeting saved:', meeting.id)
        resolve(true)
      }

      request.onerror = () => {
        logger.error('[DB] Failed to save meeting:', request.error)
        resolve(false)
      }
    })
  }

  async getMeeting(meetingId: string): Promise<Meeting | null> {
    if (!this.db) await this.init()
    if (!this.db) return null

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([STORES.MEETINGS], 'readonly')
      const store = transaction.objectStore(STORES.MEETINGS)
      const request = store.get(meetingId)

      request.onsuccess = () => {
        resolve(request.result || null)
      }

      request.onerror = () => {
        logger.error('[DB] Failed to get meeting:', request.error)
        resolve(null)
      }
    })
  }

  async getAllMeetings(): Promise<Meeting[]> {
    if (!this.db) await this.init()
    if (!this.db) return []

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([STORES.MEETINGS], 'readonly')
      const store = transaction.objectStore(STORES.MEETINGS)
      const request = store.getAll()

      request.onsuccess = () => {
        const meetings = request.result || []
        // Sort by startTime descending (newest first)
        meetings.sort((a, b) => b.startTime - a.startTime)
        resolve(meetings)
      }

      request.onerror = () => {
        logger.error('[DB] Failed to get all meetings:', request.error)
        resolve([])
      }
    })
  }

  async updateMeetingEndTime(meetingId: string, endTime: number): Promise<boolean> {
    const meeting = await this.getMeeting(meetingId)
    if (!meeting) return false

    meeting.endTime = endTime
    return this.saveMeeting(meeting)
  }

  // ==================== BEHAVIORS ====================

  async saveBehavior(behavior: BehaviorEntry): Promise<boolean> {
    if (!this.db) await this.init()
    if (!this.db) return false

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([STORES.BEHAVIORS], 'readwrite')
      const store = transaction.objectStore(STORES.BEHAVIORS)
      const request = store.put(behavior)

      request.onsuccess = () => {
        resolve(true)
      }

      request.onerror = () => {
        logger.error('[DB] Failed to save behavior:', request.error)
        resolve(false)
      }
    })
  }

  async getBehaviorsByMeeting(meetingId: string): Promise<BehaviorEntry[]> {
    if (!this.db) await this.init()
    if (!this.db) return []

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([STORES.BEHAVIORS], 'readonly')
      const store = transaction.objectStore(STORES.BEHAVIORS)
      const index = store.index('meetingId')
      const request = index.getAll(meetingId)

      request.onsuccess = () => {
        const behaviors = request.result || []
        // Sort by timestamp ascending
        behaviors.sort((a, b) => a.timestamp - b.timestamp)
        resolve(behaviors)
      }

      request.onerror = () => {
        logger.error('[DB] Failed to get behaviors:', request.error)
        resolve([])
      }
    })
  }

  async getBehaviorsByUser(meetingId: string, userId: string): Promise<BehaviorEntry[]> {
    if (!this.db) await this.init()
    if (!this.db) return []

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([STORES.BEHAVIORS], 'readonly')
      const store = transaction.objectStore(STORES.BEHAVIORS)
      const index = store.index('meetingUser')
      const request = index.getAll([meetingId, userId])

      request.onsuccess = () => {
        const behaviors = request.result || []
        behaviors.sort((a, b) => a.timestamp - b.timestamp)
        resolve(behaviors)
      }

      request.onerror = () => {
        logger.error('[DB] Failed to get user behaviors:', request.error)
        resolve([])
      }
    })
  }

  async getBehaviorsByDateRange(startDate: number, endDate: number): Promise<BehaviorEntry[]> {
    if (!this.db) await this.init()
    if (!this.db) return []

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([STORES.BEHAVIORS], 'readonly')
      const store = transaction.objectStore(STORES.BEHAVIORS)
      const index = store.index('timestamp')
      const range = IDBKeyRange.bound(startDate, endDate)
      const request = index.getAll(range)

      request.onsuccess = () => {
        resolve(request.result || [])
      }

      request.onerror = () => {
        logger.error('[DB] Failed to get behaviors by date:', request.error)
        resolve([])
      }
    })
  }

  // ==================== SETTINGS ====================

  async saveSettings(settings: UserSettings): Promise<boolean> {
    if (!this.db) await this.init()
    if (!this.db) return false

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([STORES.SETTINGS], 'readwrite')
      const store = transaction.objectStore(STORES.SETTINGS)
      const request = store.put(settings)

      request.onsuccess = () => {
        logger.info('[DB] Settings saved for user:', settings.userId)
        resolve(true)
      }

      request.onerror = () => {
        logger.error('[DB] Failed to save settings:', request.error)
        resolve(false)
      }
    })
  }

  async getSettings(userId: string): Promise<UserSettings | null> {
    if (!this.db) await this.init()
    if (!this.db) return null

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([STORES.SETTINGS], 'readonly')
      const store = transaction.objectStore(STORES.SETTINGS)
      const request = store.get(userId)

      request.onsuccess = () => {
        resolve(request.result || null)
      }

      request.onerror = () => {
        logger.error('[DB] Failed to get settings:', request.error)
        resolve(null)
      }
    })
  }

  // ==================== STATISTICS ====================

  async getStatistics(meetingId: string): Promise<{
    totalBehaviors: number
    positiveCount: number
    negativeCount: number
    neutralCount: number
    warningCount: number
    byBehavior: Record<string, number>
    byUser: Record<string, number>
  }> {
    const behaviors = await this.getBehaviorsByMeeting(meetingId)

    const stats = {
      totalBehaviors: behaviors.length,
      positiveCount: 0,
      negativeCount: 0,
      neutralCount: 0,
      warningCount: 0,
      byBehavior: {} as Record<string, number>,
      byUser: {} as Record<string, number>
    }

    behaviors.forEach(b => {
      // Count by type
      if (b.type === 'positive') stats.positiveCount++
      else if (b.type === 'negative') stats.negativeCount++
      else if (b.type === 'neutral') stats.neutralCount++
      else if (b.type === 'warning') stats.warningCount++

      // Count by behavior label
      stats.byBehavior[b.behavior] = (stats.byBehavior[b.behavior] || 0) + 1

      // Count by user
      stats.byUser[b.userId] = (stats.byUser[b.userId] || 0) + 1
    })

    return stats
  }

  // ==================== CLEANUP ====================

  async clearAllData(): Promise<boolean> {
    if (!this.db) await this.init()
    if (!this.db) return false

    try {
      const stores = [STORES.MEETINGS, STORES.BEHAVIORS, STORES.SETTINGS]
      const transaction = this.db.transaction(stores, 'readwrite')

      for (const storeName of stores) {
        const store = transaction.objectStore(storeName)
        store.clear()
      }

      return new Promise((resolve) => {
        transaction.oncomplete = () => {
          logger.info('[DB] All data cleared')
          resolve(true)
        }
        transaction.onerror = () => {
          logger.error('[DB] Failed to clear data')
          resolve(false)
        }
      })
    } catch (err) {
      logger.error('[DB] Error clearing data:', err)
      return false
    }
  }
}

// Export singleton instance
export const database = new Database()
