/**
 * Per-participant voice activity tracking.
 *
 * LiveKit emits `participant.audioLevel` continuously while connected. We
 * sample it at room-tick rate, count any frame above SPEAKING_THRESHOLD as
 * "speaking", and accumulate seconds per participant identity.
 *
 * Pure in-memory state, scoped to a meeting. Reset on meeting boundary
 * via `voiceActivityStore.reset()`.
 */

const SPEAKING_THRESHOLD = 0.05 // 0..1, lower = more sensitive
const SAMPLE_INTERVAL_MS = 200

interface ActivityRecord {
  identity: string
  displayName: string
  totalSpeakingMs: number
  lastSpokeAt: number | null
}

const records = new Map<string, ActivityRecord>()
let sessionStartedAt: number | null = null

export const voiceActivityStore = {
  /** Mark the start of a session so percentages are computed correctly. */
  start(): void {
    sessionStartedAt = Date.now()
    records.clear()
  },

  /** Record a single audio-level sample for a participant. */
  sample(identity: string, displayName: string, audioLevel: number): void {
    if (sessionStartedAt === null) sessionStartedAt = Date.now()

    let rec = records.get(identity)
    if (!rec) {
      rec = {
        identity,
        displayName,
        totalSpeakingMs: 0,
        lastSpokeAt: null,
      }
      records.set(identity, rec)
    } else if (rec.displayName !== displayName) {
      // Display name can change if user updates their LiveKit identity
      rec.displayName = displayName
    }

    if (audioLevel > SPEAKING_THRESHOLD) {
      rec.totalSpeakingMs += SAMPLE_INTERVAL_MS
      rec.lastSpokeAt = Date.now()
    }
  },

  /** Get all participants' speaking stats. */
  all(): ActivityRecord[] {
    return Array.from(records.values())
  },

  /** Get speaking stats for one participant. */
  forIdentity(identity: string): ActivityRecord | undefined {
    return records.get(identity)
  },

  /** Total session duration in ms (since first sample). */
  sessionDurationMs(): number {
    return sessionStartedAt === null ? 0 : Date.now() - sessionStartedAt
  },

  /** Reset all records — call when leaving / joining a new meeting. */
  reset(): void {
    records.clear()
    sessionStartedAt = null
  },

  /** Sample interval used by callers to schedule consistent ticks. */
  SAMPLE_INTERVAL_MS,
}

/** Format speaking time as "X phút Y giây" or "X giây" for short windows. */
export function formatSpeakingTime(ms: number): string {
  const totalSec = Math.round(ms / 1000)
  if (totalSec < 60) return `${totalSec} giây`
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  if (sec === 0) return `${min} phút`
  return `${min} phút ${sec} giây`
}
