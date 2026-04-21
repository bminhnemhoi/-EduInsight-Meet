'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'

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
        }}
      >
        {/* Header */}
        <div className="sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
            <div className="logo-icon">🎓</div>
            <div>
              <h1 style={{ 
                fontSize: '1.125rem', 
                fontWeight: 700,
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
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
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
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

        {/* Footer */}
        <div style={{ 
          padding: '1rem 1.5rem', 
          borderTop: '1px solid var(--border-color)',
          fontSize: '0.75rem',
          color: 'var(--text-muted)'
        }}>
          <p>Powered by</p>
          <p style={{ marginTop: '0.25rem', color: 'var(--text-secondary)' }}>
            LiveKit • TensorFlow • MediaPipe
          </p>
        </div>
      </aside>
    </>
  )
}
