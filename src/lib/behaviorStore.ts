/**
 * In-memory behavior store, scoped to the CURRENT live meeting only.
 * Cleared on `reset()` (called when joining/leaving a room).
 *
 * Powers the in-room real-time panels and components like DistractionAlerts.
 * Cross-session persistence is not wired — users export CSV before leaving
 * if they want to keep a record.
 */

export interface StudentBehavior {
  userId: string
  userName: string
  label: string
  emoji: string
  color: string
  timestamp: number
}

const MAX_HISTORY = 1000

let memory: StudentBehavior[] = []

export const behaviorStore = {
  getBehaviors: (): StudentBehavior[] => memory,

  addBehavior: (behavior: StudentBehavior) => {
    memory = [behavior, ...memory].slice(0, MAX_HISTORY)
  },

  clearBehaviors: () => {
    memory = []
  },

  /** Reset on meeting boundary. */
  reset: () => {
    memory = []
  },
}
