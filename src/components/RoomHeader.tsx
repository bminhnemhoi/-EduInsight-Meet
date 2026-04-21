'use client'

interface Props {
  isConnected: boolean
  showHistory: boolean
  onToggleHistory: () => void
}

export default function RoomHeader({ isConnected, showHistory, onToggleHistory }: Props) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      padding: '0.75rem 1.5rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      zIndex: 100,
      borderBottom: '1px solid var(--border-color)',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ fontSize: '1.5rem' }}>🎓</span>
        <span style={{
          fontWeight: 600,
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Edu Insight Meet
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{
          background: isConnected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
          border: `1px solid ${isConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
          padding: '0.375rem 0.75rem',
          borderRadius: '20px',
          fontSize: '0.75rem',
          color: isConnected ? 'var(--success)' : 'var(--warning)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem'
        }}>
          <span style={{
            width: '6px',
            height: '6px',
            background: isConnected ? 'var(--success)' : 'var(--warning)',
            borderRadius: '50%',
            animation: 'pulse 2s infinite'
          }} />
          {isConnected ? 'Đã kết nối' : 'Đang kết nối...'}
        </div>

        <button
          onClick={onToggleHistory}
          style={{
            background: showHistory ? 'var(--accent-light)' : 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '0.5rem 0.75rem',
            fontSize: '0.75rem',
            color: showHistory ? 'var(--accent-primary)' : 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem'
          }}
        >
          📊 {showHistory ? 'Ẩn' : 'Hiện'} Analytics
        </button>
      </div>
    </div>
  )
}
