'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { nanoid } from 'nanoid'

interface Props {
  /** Called when a meeting is created, receives the generated code */
  onCreateMeeting?: (code: string) => void
  /** Title for the create section */
  createTitle?: string
  /** Description for the create section */
  createDescription?: string
}

export default function CreateJoinMeeting({
  onCreateMeeting,
  createTitle = '🚀 Tạo cuộc họp mới',
  createDescription = 'Tạo phòng họp ngay lập tức với mã duy nhất'
}: Props) {
  const router = useRouter()
  const [meetingCode, setMeetingCode] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const handleCreate = async () => {
    setIsCreating(true)
    const code = nanoid(10)
    onCreateMeeting?.(code)
    router.push(`/meet/${code}`)
  }

  const handleJoin = () => {
    if (meetingCode.trim()) {
      router.push(`/meet/${meetingCode.trim()}`)
    }
  }

  return (
    <>
      {/* Create Meeting */}
      <div className="card animate-fadeIn">
        <h2 className="section-title">{createTitle}</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
          {createDescription}
        </p>
        <button
          className="btn btn-primary"
          onClick={handleCreate}
          disabled={isCreating}
        >
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
      </div>

      {/* Join Meeting */}
      <div className="card animate-fadeIn" style={{ animationDelay: '0.1s' }}>
        <h2 className="section-title">🔗 Tham gia cuộc họp</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
          Nhập mã phòng để tham gia cuộc họp hiện có
        </p>
        <input
          type="text"
          className="input"
          placeholder="Nhập mã cuộc họp..."
          value={meetingCode}
          onChange={(e) => setMeetingCode(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
        />
        <button
          className="btn btn-secondary"
          onClick={handleJoin}
          disabled={!meetingCode.trim()}
        >
          <span>🚪</span>
          Tham gia
        </button>
      </div>
    </>
  )
}
