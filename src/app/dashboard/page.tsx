'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '../../components/DashboardLayout'
import CreateJoinMeeting from '../../components/CreateJoinMeeting'
import { useAuth } from '../../contexts/AuthContext'
import { useMeeting } from '../../contexts/MeetingContext'

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoading, logout } = useAuth()
  const { createMeeting } = useMeeting()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      }}>
        <div style={{ color: 'var(--text-muted)' }}>Đang xác thực...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const handleCreateMeeting = async (code: string) => {
    return createMeeting(code, user.id, user.name, user.role)
  }

  const handleLogout = async () => {
    await logout()
    router.push('/auth')
  }

  return (
    <DashboardLayout>
      <div className="container" style={{ paddingTop: '1rem', maxWidth: '540px' }}>
        {/* User Info */}
        <div style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '1rem',
          padding: '1.5rem',
          color: 'white',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.25rem' }}>
                {user.role === 'teacher' ? '👨‍🏫 Giáo viên' : '👨‍🎓 Học sinh'}
              </p>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                {user.name}
              </h2>
              <p style={{ fontSize: '0.875rem', opacity: 0.8 }}>
                {user.email}
              </p>
            </div>
            <button
              onClick={handleLogout}
              style={{
                padding: '0.5rem 1rem',
                background: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '0.5rem',
                color: 'white',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              Đăng xuất
            </button>
          </div>
        </div>

        {/* Welcome Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 className="title" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
            Chào mừng trở lại! 👋
          </h1>
          <p className="subtitle" style={{ marginBottom: 0 }}>
            Bắt đầu hoặc tham gia cuộc họp video với AI tracking
          </p>
        </div>

        {/* Create & Join Meeting */}
        <CreateJoinMeeting
          onCreateMeeting={handleCreateMeeting}
          createTitle="🚀 Tạo cuộc họp mới"
          createDescription={
            user.role === 'teacher'
              ? 'Tạo phòng học và mời học sinh tham gia'
              : 'Tạo phòng họp và mời người khác tham gia'
          }
        />

        {/* Features */}
        <div className="card animate-fadeIn" style={{ animationDelay: '0.2s' }}>
          <h2 className="section-title">✨ Tính năng</h2>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            <div className="feature-item">
              <div className="feature-icon">🎥</div>
              <span>Video call HD real-time</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🤖</div>
              <span>
                {user.role === 'teacher' 
                  ? 'AI phân tích hành vi tất cả học sinh' 
                  : 'AI phát hiện hành vi học tập'}
              </span>
            </div>
            <div className="feature-item">
              <div className="feature-icon">📊</div>
              <span>
                {user.role === 'teacher'
                  ? 'Dashboard tổng quan lớp học'
                  : 'Theo dõi tiến độ học tập'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
