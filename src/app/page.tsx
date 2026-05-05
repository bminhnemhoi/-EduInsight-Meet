'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'

export default function HomePage() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    if (isLoading) return
    if (isAuthenticated) {
      router.push('/dashboard')
    } else {
      router.push('/auth')
    }
  }, [isAuthenticated, isLoading, router])

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <div style={{ color: 'white', fontSize: '1.125rem' }}>Đang tải...</div>
    </div>
  )
}
