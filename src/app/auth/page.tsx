'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth, UserRole, TEST_ACCOUNT_HINTS } from '../../contexts/AuthContext'

export default function AuthPage() {
  const router = useRouter()
  const { login, register } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student' as UserRole
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [progressMsg, setProgressMsg] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setProgressMsg('')
    setLoading(true)

    // Progressive feedback so user knows the app isn't frozen on slow links.
    const t1 = setTimeout(() => setProgressMsg('Đang kết nối...'), 2000)
    const t2 = setTimeout(
      () => setProgressMsg('Mạng hơi chậm, đang chờ...'),
      6000
    )
    const t3 = setTimeout(
      () => setProgressMsg('Vẫn đang thử... bạn có thể đợi hoặc kiểm tra mạng.'),
      15000
    )
    const clearProgress = () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      setProgressMsg('')
    }

    try {
      if (isLogin) {
        const result = await login(formData.email, formData.password)
        if (!result.ok) {
          setError(result.error || 'Đăng nhập thất bại')
        } else {
          router.push('/dashboard')
        }
      } else {
        if (!formData.name.trim()) {
          setError('Vui lòng nhập họ tên')
          setLoading(false)
          return
        }
        const result = await register(
          formData.name,
          formData.email,
          formData.password,
          formData.role
        )
        if (!result.ok) {
          setError(result.error || 'Đăng ký thất bại')
        } else if (result.needsEmailConfirmation) {
          setError(
            'Đăng ký thành công. Vui lòng kiểm tra email để xác thực, sau đó đăng nhập.'
          )
          setIsLogin(true)
        } else {
          router.push('/dashboard')
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra')
    } finally {
      clearProgress()
      setLoading(false)
    }
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '1rem',
        padding: '2rem',
        maxWidth: '440px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1a202c', marginBottom: '0.5rem' }}>
            🎓 Edu Insight Meet
          </h1>
          <p style={{ color: '#718096' }}>
            {isLogin ? 'Đăng nhập vào tài khoản' : 'Tạo tài khoản mới'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#4a5568', marginBottom: '0.5rem' }}>
                Họ và tên
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nguyễn Văn A"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  transition: 'all 0.2s'
                }}
                required={!isLogin}
              />
            </div>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#4a5568', marginBottom: '0.5rem' }}>
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="example@email.com"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e2e8f0',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                transition: 'all 0.2s'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#4a5568', marginBottom: '0.5rem' }}>
              Mật khẩu
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e2e8f0',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                transition: 'all 0.2s'
              }}
              required
              minLength={6}
            />
          </div>

          {!isLogin && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#4a5568', marginBottom: '0.5rem' }}>
                Vai trò
              </label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <label style={{ 
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0.75rem',
                  border: `2px solid ${formData.role === 'student' ? '#667eea' : '#e2e8f0'}`,
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  background: formData.role === 'student' ? '#f0f4ff' : 'white',
                  transition: 'all 0.2s'
                }}>
                  <input
                    type="radio"
                    name="role"
                    value="student"
                    checked={formData.role === 'student'}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    style={{ marginRight: '0.5rem' }}
                  />
                  <span style={{ fontWeight: '500' }}>👨‍🎓 Học sinh</span>
                </label>
                <label style={{ 
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0.75rem',
                  border: `2px solid ${formData.role === 'teacher' ? '#667eea' : '#e2e8f0'}`,
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  background: formData.role === 'teacher' ? '#f0f4ff' : 'white',
                  transition: 'all 0.2s'
                }}>
                  <input
                    type="radio"
                    name="role"
                    value="teacher"
                    checked={formData.role === 'teacher'}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    style={{ marginRight: '0.5rem' }}
                  />
                  <span style={{ fontWeight: '500' }}>👨‍🏫 Giáo viên</span>
                </label>
              </div>
            </div>
          )}

          {error && (
            <div style={{ 
              padding: '0.75rem',
              background: '#fee',
              border: '1px solid #fcc',
              borderRadius: '0.5rem',
              color: '#c33',
              fontSize: '0.875rem',
              marginBottom: '1rem'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.875rem',
              background: loading ? '#a0aec0' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {loading ? 'Đang xử lý...' : (isLogin ? 'Đăng nhập' : 'Đăng ký')}
          </button>

          {progressMsg && (
            <div
              style={{
                marginTop: '0.625rem',
                padding: '0.5rem 0.75rem',
                fontSize: '0.8125rem',
                color: '#5a67d8',
                background: 'rgba(102, 126, 234, 0.08)',
                borderRadius: '0.375rem',
                textAlign: 'center',
              }}
            >
              {progressMsg}
            </div>
          )}
        </form>

        {isLogin && (
          <div
            style={{
              marginTop: '1.25rem',
              paddingTop: '1rem',
              borderTop: '1px solid #edf2f7',
            }}
          >
            <p
              style={{
                fontSize: '0.75rem',
                color: '#a0aec0',
                marginBottom: '0.625rem',
                textAlign: 'center',
              }}
            >
              Tài khoản test có sẵn (click để dùng):
            </p>
            <div style={{ display: 'grid', gap: '0.375rem' }}>
              {TEST_ACCOUNT_HINTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      email: acc.email,
                      password: acc.password,
                    })
                  }
                  style={{
                    padding: '0.5rem 0.75rem',
                    background: '#f7fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 6,
                    fontSize: '0.8125rem',
                    color: '#2d3748',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 8,
                  }}
                  title={`Email: ${acc.email}\nMật khẩu: ${acc.password}`}
                >
                  <span>
                    {acc.role === 'teacher' ? '👨‍🏫' : '🧒'} {acc.name}
                  </span>
                  <code
                    style={{
                      fontSize: '0.6875rem',
                      color: '#718096',
                      fontFamily: 'monospace',
                    }}
                  >
                    {acc.email}
                  </code>
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: '1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button
            onClick={() => {
              setIsLogin(!isLogin)
              setError('')
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#667eea',
              cursor: 'pointer',
              fontSize: '0.875rem',
              textDecoration: 'underline'
            }}
          >
            {isLogin ? 'Chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Đăng nhập'}
          </button>
        </div>
      </div>
    </div>
  )
}
