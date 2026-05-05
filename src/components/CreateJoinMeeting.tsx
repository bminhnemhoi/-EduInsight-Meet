'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { nanoid } from 'nanoid'

interface CreateResult {
  ok: boolean
  error?: string
}

interface Props {
  /**
   * Called when a meeting is created. May return a promise; if the promise
   * resolves to { ok: false }, navigation is aborted and the error is shown.
   */
  onCreateMeeting?: (code: string) => Promise<CreateResult | void> | void
  createTitle?: string
  createDescription?: string
}

/**
 * Extracts a room code from either a raw code or a full join/meet URL.
 * Lets users paste the entire link from Zalo without confusion.
 */
function extractRoomCode(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) return ''
  const match = trimmed.match(/\/(?:join|meet)\/([A-Za-z0-9_-]+)/)
  if (match) return match[1]
  return trimmed
}

export default function CreateJoinMeeting({
  onCreateMeeting,
  createTitle = '🚀 Tạo cuộc họp mới',
  createDescription = 'Tạo phòng họp và chia sẻ link cho học sinh',
}: Props) {
  const router = useRouter()
  const [meetingCode, setMeetingCode] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState('')

  // After successful create, show share panel instead of navigating
  // immediately. Teacher can copy the link, send to class, then click
  // "Vào phòng" themselves.
  const [createdCode, setCreatedCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleCreate = async () => {
    setError('')
    setIsCreating(true)
    try {
      const code = nanoid(10)
      const result = await onCreateMeeting?.(code)
      if (result && result.ok === false) {
        setError(result.error || 'Không thể tạo phòng')
        return
      }
      setCreatedCode(code)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi tạo phòng')
    } finally {
      setIsCreating(false)
    }
  }

  const shareUrl = createdCode
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/join/${createdCode}`
    : ''

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard blocked */
    }
  }

  const handleEnterRoom = () => {
    if (createdCode) router.push(`/meet/${createdCode}`)
  }

  const handleNewMeeting = () => {
    setCreatedCode(null)
    setCopied(false)
    setError('')
  }

  const handleJoin = () => {
    const code = extractRoomCode(meetingCode)
    if (code) {
      // Authenticated user joining their own / colleague's meeting.
      router.push(`/meet/${code}`)
    }
  }

  return (
    <>
      {/* Create / Share Meeting */}
      <div className="card animate-fadeIn">
        {createdCode ? (
          <>
            <h2 className="section-title">✅ Phòng đã sẵn sàng</h2>
            <p
              style={{
                color: 'var(--text-muted)',
                fontSize: '0.875rem',
                marginBottom: '1rem',
              }}
            >
              Gửi link này cho học sinh qua Zalo, Messenger... Học sinh KHÔNG cần
              đăng ký, chỉ cần click link và nhập tên là vào.
            </p>

            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                marginBottom: '0.75rem',
              }}
            >
              <input
                type="text"
                className="input"
                value={shareUrl}
                readOnly
                onFocus={(e) => e.currentTarget.select()}
                style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.875rem' }}
              />
              <button
                onClick={handleCopy}
                className="btn btn-secondary"
                style={{
                  whiteSpace: 'nowrap',
                  padding: '0.625rem 1rem',
                  background: copied ? 'rgba(16,185,129,0.15)' : undefined,
                  color: copied ? '#10b981' : undefined,
                  borderColor: copied ? 'rgba(16,185,129,0.4)' : undefined,
                }}
              >
                {copied ? '✓ Đã copy' : '📋 Copy'}
              </button>
            </div>

            <div
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                marginBottom: '1rem',
                padding: '0.5rem 0.75rem',
                background: 'var(--bg-secondary)',
                borderRadius: 6,
              }}
            >
              Mã phòng: <strong style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>{createdCode}</strong>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={handleEnterRoom} className="btn btn-primary" style={{ flex: 2 }}>
                🚪 Vào phòng ngay
              </button>
              <button onClick={handleNewMeeting} className="btn btn-secondary" style={{ flex: 1 }}>
                Tạo phòng khác
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="section-title">{createTitle}</h2>
            <p
              style={{
                color: 'var(--text-muted)',
                fontSize: '0.875rem',
                marginBottom: '1rem',
              }}
            >
              {createDescription}
            </p>
            <button className="btn btn-primary" onClick={handleCreate} disabled={isCreating}>
              {isCreating ? (
                <>
                  <span className="animate-pulse">⏳</span>
                  Đang tạo...
                </>
              ) : (
                <>
                  <span>➕</span>
                  Tạo cuộc họp
                </>
              )}
            </button>
            {error && (
              <p
                style={{
                  marginTop: '0.75rem',
                  color: 'var(--danger)',
                  fontSize: '0.8125rem',
                }}
              >
                {error}
              </p>
            )}
          </>
        )}
      </div>

      {/* Join existing */}
      <div className="card animate-fadeIn" style={{ animationDelay: '0.1s' }}>
        <h2 className="section-title">🔗 Tham gia phòng có sẵn</h2>
        <p
          style={{
            color: 'var(--text-muted)',
            fontSize: '0.875rem',
            marginBottom: '1rem',
          }}
        >
          Dán link đầy đủ hoặc chỉ mã phòng
        </p>
        <input
          type="text"
          className="input"
          placeholder="https://… /join/abc1234567 hoặc abc1234567"
          value={meetingCode}
          onChange={(e) => setMeetingCode(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
        />
        <button
          className="btn btn-secondary"
          onClick={handleJoin}
          disabled={!extractRoomCode(meetingCode)}
        >
          <span>🚪</span>
          Tham gia
        </button>
      </div>
    </>
  )
}
