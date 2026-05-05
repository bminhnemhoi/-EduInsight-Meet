import { NextRequest, NextResponse } from 'next/server'
import { AccessToken } from 'livekit-server-sdk'
import { logger } from '../../../../lib/logger'

// Guest token: anyone with the room code can join with just a display name.
// Modeled after Zoom/Meet/Jitsi where students click a link, type their
// name, and join — no account required.
//
// The room MUST already exist in `meetings` (created by an authenticated
// teacher). We don't verify that here for simplicity, but you can add a
// check later by looking up `meetings.room_code` via the public anon
// client. Without a matching meeting, behavior persistence is skipped
// regardless because guests are not in `meeting_participants`.

const MAX_NAME_LENGTH = 64
const MAX_ROOM_LENGTH = 64
const NAME_DISALLOWED = /[\x00-\x1F\x7F<>"\\]/
const SAFE_ROOM = /^[A-Za-z0-9_-]+$/

const RATE_WINDOW_MS = 30_000
const RATE_LIMIT = 30 // higher than auth flow because real classes have many guests
const recentRequests = new Map<string, number[]>()

function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return req.headers.get('x-real-ip') || 'unknown'
}

function rateLimited(ip: string): boolean {
  const now = Date.now()
  const cutoff = now - RATE_WINDOW_MS
  const hits = (recentRequests.get(ip) || []).filter((t) => t > cutoff)
  hits.push(now)
  recentRequests.set(ip, hits)
  return hits.length > RATE_LIMIT
}

function randomGuestId(): string {
  // Short random suffix; doesn't need to be cryptographically strong.
  const r = Math.random().toString(36).slice(2, 10)
  return `guest_${Date.now().toString(36)}_${r}`
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    if (rateLimited(ip)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { roomName, displayName } = body as {
      roomName?: unknown
      displayName?: unknown
    }

    if (typeof roomName !== 'string' || typeof displayName !== 'string') {
      return NextResponse.json(
        { error: 'roomName và displayName phải là chuỗi' },
        { status: 400 }
      )
    }

    const trimmedRoom = roomName.trim()
    const trimmedName = displayName.trim()

    if (
      trimmedRoom.length === 0 ||
      trimmedRoom.length > MAX_ROOM_LENGTH ||
      !SAFE_ROOM.test(trimmedRoom)
    ) {
      return NextResponse.json({ error: 'Mã phòng không hợp lệ' }, { status: 400 })
    }

    if (
      trimmedName.length === 0 ||
      trimmedName.length > MAX_NAME_LENGTH ||
      NAME_DISALLOWED.test(trimmedName)
    ) {
      return NextResponse.json(
        { error: 'Tên không hợp lệ' },
        { status: 400 }
      )
    }

    const apiKey = process.env.LIVEKIT_API_KEY?.trim()
    const apiSecret = process.env.LIVEKIT_API_SECRET?.trim()

    if (!apiKey || !apiSecret) {
      logger.error('Missing LIVEKIT_API_KEY or LIVEKIT_API_SECRET')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const guestId = randomGuestId()

    const at = new AccessToken(apiKey, apiSecret, {
      identity: guestId,
      name: trimmedName,
      ttl: '4h', // a normal class period
    })

    at.addGrant({
      room: trimmedRoom,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    })

    const token = await at.toJwt()
    logger.info(`[GUEST TOKEN] "${trimmedName}" → "${trimmedRoom}"`)

    return NextResponse.json({
      token,
      identity: guestId,
      displayName: trimmedName,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    logger.error('[GUEST TOKEN ERROR]', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
