import { logger } from './logger'

const SETTINGS_KEY = 'edu_insight_settings'

export interface Settings {
  aiEnabled: boolean
  autoRecord: boolean
  theme: 'light' | 'dark'
  detectionSensitivity?: number
  autoMute?: boolean
  /** Tier 1: enable MediaPipe FaceLandmarker for emotion + drowsiness fusion. */
  faceAnalysisEnabled?: boolean
  /** Tier 3: enable Gemini end-of-session recommendations in History. */
  aiRecommendationsEnabled?: boolean
}

const DEFAULT_SETTINGS: Settings = {
  aiEnabled: true,
  autoRecord: true,
  theme: 'light',
  detectionSensitivity: 0.5,
  autoMute: false,
  faceAnalysisEnabled: false,
  aiRecommendationsEnabled: false,
}

type Listener = (s: Settings) => void
const listeners = new Set<Listener>()

function read(): Settings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS
  } catch {
    return DEFAULT_SETTINGS
  }
}

function writeLocal(s: Settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s))
}

export const settingsStore = {
  getSettings: read,

  /**
   * Update settings. localStorage-only — subscribers (e.g. AIBehaviorDetector)
   * pick up the change synchronously.
   */
  updateSettings: (updates: Partial<Settings>) => {
    if (typeof window === 'undefined') return
    try {
      const next = { ...read(), ...updates }
      writeLocal(next)
      listeners.forEach((l) => l(next))
    } catch (e) {
      logger.warn('[settings] save failed:', e)
    }
  },

  subscribe: (listener: Listener) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}
