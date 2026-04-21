/**
 * Shared utility functions — eliminates code duplication across components.
 */

/** Get first letter of name for avatar display */
export function getInitials(name: string): string {
  return (name || 'U').charAt(0).toUpperCase()
}

/** Generate consistent avatar color based on name */
export function getAvatarColor(name: string): string {
  const colors = [
    '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b',
    '#10b981', '#06b6d4', '#6366f1', '#8b5cf6'
  ]
  const index = name ? name.charCodeAt(0) % colors.length : 0
  return colors[index]
}

/** Classify behavior label into category */
export function classifyBehavior(label: string): 'focused' | 'distracted' | 'sleeping' | 'unknown' {
  const focused = ['Tập trung', 'Đang lắng nghe', 'Giơ tay', 'Gật đầu']
  const distracted = ['Mất tập trung', 'Cúi đầu', 'Nghiêng đầu', 'Lắc đầu']
  const sleeping = ['Đang ngủ', 'Buồn ngủ']

  if (focused.includes(label)) return 'focused'
  if (distracted.includes(label)) return 'distracted'
  if (sleeping.includes(label)) return 'sleeping'
  return 'unknown'
}

/** Format Date to Vietnamese time string (HH:MM:SS) */
export function formatTimeVN(date: Date | number): string {
  const d = typeof date === 'number' ? new Date(date) : date
  return d.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

/** Format Date to short Vietnamese time string (HH:MM) */
export function formatTimeShortVN(date: Date | number): string {
  const d = typeof date === 'number' ? new Date(date) : date
  return d.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}
