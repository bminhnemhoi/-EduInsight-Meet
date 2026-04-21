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
      background: 'rgba(255, 255, 255, 0.98)',
      backdropFilter: 'blur(24px)',
      padding: '1rem 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      zIndex: 100,
      borderBottom: '1px solid rgba(59, 130, 246, 0.1)',
      boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '14px',
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)'
        }}>
          🎓
        </div>
        <span style={{
          fontSize: '1.25rem',
          fontWeight: 700,
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.02em'
        }}>
          EduInsight Meet
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{
          background: isConnected 
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.2) 100%)'
            : 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.2) 100%)',
          border: `2px solid ${isConnected ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
          padding: '0.5rem 1rem',
          borderRadius: '14px',
          fontSize: '0.875rem',
          fontWeight: 600,
          color: isConnected ? '#10b981' : '#f59e0b',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          boxShadow: isConnected
            ? '0 4px 12px rgba(16, 185, 129, 0.2)'
            : '0 4px 12px rgba(245, 158, 11, 0.2)'
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            background: isConnected ? '#10b981' : '#f59e0b',
            borderRadius: '50%',
            boxShadow: `0 0 8px ${isConnected ? '#10b981' : '#f59e0b'}`,
            animation: 'pulse 2s ease-in-out infinite'
          }} />
          {isConnected ? 'Đã kết nối' : 'Đang kết nối...'}
        </div>

        <button
          onClick={onToggleHistory}
          style={{
            background: showHistory 
              ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.2) 100%)'
              : 'linear-gradient(135deg, rgba(107, 114, 128, 0.1) 0%, rgba(75, 85, 99, 0.15) 100%)',
            border: `2px solid ${showHistory ? 'rgba(59, 130, 246, 0.4)' : 'rgba(107, 114, 128, 0.3)'}`,
            borderRadius: '14px',
            padding: '0.5rem 1rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: showHistory ? 'var(--accent-primary)' : 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.3s ease',
            boxShadow: showHistory
              ? '0 4px 12px rgba(59, 130, 246, 0.2)'
              : '0 2px 8px rgba(0, 0, 0, 0.08)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = showHistory
              ? '0 6px 16px rgba(59, 130, 246, 0.3)'
              : '0 4px 12px rgba(0, 0, 0, 0.12)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = showHistory
              ? '0 4px 12px rgba(59, 130, 246, 0.2)'
              : '0 2px 8px rgba(0, 0, 0, 0.08)'
          }}
        >
          <span style={{ fontSize: '1.125rem' }}>📊</span>
          <span>{showHistory ? 'Ẩn' : 'Hiện'} Analytics</span>
        </button>
      </div>
    </div>
  )
}
