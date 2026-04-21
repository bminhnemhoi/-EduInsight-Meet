export interface StudentBehavior {
  userId: string
  userName: string
  label: string
  emoji: string
  color: string
  timestamp: number
}

const STORAGE_KEY = 'edu_insight_behavior_history'
const MAX_HISTORY = 1000 // Store up to 1000 items

export const behaviorStore = {
  getBehaviors: (): StudentBehavior[] => {
    if (typeof window === 'undefined') return []
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  },

  addBehavior: (behavior: StudentBehavior) => {
    if (typeof window === 'undefined') return
    try {
      const current = behaviorStore.getBehaviors()
      const updated = [behavior, ...current].slice(0, MAX_HISTORY)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    } catch (e) {
      console.warn('Failed to save behavior history to localStorage', e)
    }
  },

  clearBehaviors: () => {
    if (typeof window === 'undefined') return
    localStorage.removeItem(STORAGE_KEY)
  },

  getStats: () => {
    const behaviors = behaviorStore.getBehaviors()
    
    let focused = 0
    let distracted = 0
    let sleeping = 0
    let warning = 0 // warning = distracted + sleeping + others
    let positive = 0 // positive = focused

    behaviors.forEach(b => {
      const label = b.label.toLowerCase()
      if (label.includes('tập trung') && !label.includes('mất tập trung')) {
        focused++
        positive++
      } else if (label.includes('mất tập trung')) {
        distracted++
        warning++
      } else if (label.includes('buồn ngủ')) {
        sleeping++
        warning++
      } else if (label.includes('cúi đầu') || label.includes('lắc đầu')) {
        warning++
      } else {
        positive++
      }
    })

    // Group meetings vaguely by hours 
    const meetingsSet = new Set(behaviors.map(b => new Date(b.timestamp).toDateString()))

    return {
      totalBehaviors: behaviors.length,
      meetingsCount: meetingsSet.size || 1, // Treat as 1 if no data to start
      positiveBehaviors: positive,
      warningBehaviors: warning,
      focused,
      distracted,
      sleeping
    }
  }
}
