const SETTINGS_KEY = 'edu_insight_settings'

export interface Settings {
    aiEnabled: boolean
    autoRecord: boolean
    theme: 'light' | 'dark'
    detectionSensitivity?: number
}

const DEFAULT_SETTINGS: Settings = {
    aiEnabled: true,
    autoRecord: true,
    theme: 'light',
    detectionSensitivity: 0.5
}

export const settingsStore = {
    getSettings: (): Settings => {
        if (typeof window === 'undefined') return DEFAULT_SETTINGS
        try {
            const data = localStorage.getItem(SETTINGS_KEY)
            return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS
        } catch {
            return DEFAULT_SETTINGS
        }
    },

    updateSettings: (updates: Partial<Settings>) => {
        if (typeof window === 'undefined') return
        try {
            const current = settingsStore.getSettings()
            const updated = { ...current, ...updates }
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated))
        } catch (e) {
            console.warn('Failed to save settings', e)
        }
    }
}
