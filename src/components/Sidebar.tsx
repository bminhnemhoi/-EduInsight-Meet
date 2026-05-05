'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getInitials, getAvatarColor } from '../lib/utils'

interface NavItem {
  icon: string
  label: string
  href: string
}

const navItems: NavItem[] = [
  { icon: '🏠', label: 'Trang chủ', href: '/' },
  { icon: '📹', label: 'Cuộc họp', href: '/meeting' },
  { icon: '📊', label: 'Lịch sử & Phân tích', href: '/history' },
  { icon: '⚙️', label: 'Cài đặt', href: '/settings' },
]

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export default function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleLinkClick = () => {
    if (isMobile && onClose) {
      onClose()
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push('/auth')
  }

  return (
    <>
      {/* Overlay for mobile */}
      {isMobile && isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 998,
          }}
          onClick={onClose}
        />
      )}

      <aside
        className="sidebar"
        style={{
          transform: isMobile && !isOpen ? 'translateX(-100%)' : 'translateX(0)',
          transition: 'transform 0.3s ease',
          zIndex: 999,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div className="sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
            <div className="logo-icon">🎓</div>
            <div>
              <h1
                style={{
                  fontSize: '1.125rem',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Edu Insight
              </h1>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                AI-Powered Learning
              </p>
            </div>
          </div>

          {/* Close button for mobile */}
          {isMobile && (
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                padding: '0.5rem',
                color: 'var(--text-secondary)',
              }}
              aria-label="Close menu"
            >
              ✕
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav" style={{ flex: 1 }}>
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-item ${isActive ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                <span className="sidebar-item-icon">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* User profile + logout */}
        {user && (
          <div
            style={{
              padding: '0.875rem 1.25rem',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${getAvatarColor(user.name)} 0%, ${getAvatarColor(user.name)}dd 100%)`,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.9375rem',
                flexShrink: 0,
              }}
              title={user.email}
            >
              {getInitials(user.name)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {user.name}
              </div>
              <div
                style={{
                  fontSize: '0.6875rem',
                  color: 'var(--text-muted)',
                }}
              >
                {user.role === 'teacher' ? '👨‍🏫 Giáo viên' : '👨‍🎓 Học sinh'}
              </div>
            </div>
            <button
              onClick={handleLogout}
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
                borderRadius: '8px',
                padding: '0.375rem 0.625rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                flexShrink: 0,
              }}
              title="Đăng xuất"
            >
              ↩
            </button>
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            padding: '0.75rem 1.25rem',
            borderTop: '1px solid var(--border-color)',
            fontSize: '0.6875rem',
            color: 'var(--text-muted)',
            textAlign: 'center',
          }}
        >
          LiveKit · TensorFlow.js
        </div>
      </aside>
    </>
  )
}
