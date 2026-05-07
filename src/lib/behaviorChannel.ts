/**
 * Wire protocol for behavior labels published over LiveKit Data Channel.
 *
 * Each participant runs AI on their OWN local video (privacy-by-design),
 * then broadcasts only the resulting label as a small JSON payload. Teachers
 * subscribe and aggregate without ever processing remote video frames.
 */

export const BEHAVIOR_TOPIC = 'edu-insight.behavior.v1'
export const CLASS_CONTROL_TOPIC = 'edu-insight.class-control.v1'

export interface BehaviorMessageV1 {
  v: 1
  topic: typeof BEHAVIOR_TOPIC
  userId: string
  userName: string
  label: string
  emoji: string
  color: string
  type: 'positive' | 'negative' | 'neutral' | 'warning'
  timestamp: number
}

/**
 * Teacher broadcasts this when clicking "Kết thúc buổi học". All clients
 * (teacher + students) listen and pop up the EndOfClassModal so everyone
 * sees the same wrap-up moment.
 */
export interface ClassEndedMessageV1 {
  v: 1
  topic: typeof CLASS_CONTROL_TOPIC
  action: 'class_ended'
  endedBy: string
  endedAt: number
}

export function encodeBehaviorMessage(msg: BehaviorMessageV1): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(msg))
}

export function encodeClassEnded(msg: ClassEndedMessageV1): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(msg))
}

export function decodeClassEnded(payload: Uint8Array): ClassEndedMessageV1 | null {
  try {
    const parsed = JSON.parse(new TextDecoder().decode(payload))
    if (
      parsed &&
      parsed.v === 1 &&
      parsed.topic === CLASS_CONTROL_TOPIC &&
      parsed.action === 'class_ended' &&
      typeof parsed.endedBy === 'string' &&
      typeof parsed.endedAt === 'number'
    ) {
      return parsed as ClassEndedMessageV1
    }
    return null
  } catch {
    return null
  }
}

export function decodeBehaviorMessage(payload: Uint8Array): BehaviorMessageV1 | null {
  try {
    const text = new TextDecoder().decode(payload)
    const parsed = JSON.parse(text)
    if (
      parsed &&
      parsed.v === 1 &&
      parsed.topic === BEHAVIOR_TOPIC &&
      typeof parsed.userId === 'string' &&
      typeof parsed.userName === 'string' &&
      typeof parsed.label === 'string' &&
      typeof parsed.emoji === 'string' &&
      typeof parsed.color === 'string' &&
      typeof parsed.timestamp === 'number' &&
      ['positive', 'negative', 'neutral', 'warning'].includes(parsed.type)
    ) {
      return parsed as BehaviorMessageV1
    }
    return null
  } catch {
    return null
  }
}
