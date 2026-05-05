'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react'
import {
  hashPassword,
  verifyPassword,
  isPasswordRecord,
  type PasswordRecord,
} from '../lib/crypto'

export type UserRole = 'teacher' | 'student'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
}

export interface AuthResult {
  ok: boolean
  error?: string
  needsEmailConfirmation?: boolean
}

interface StoredUser extends User {
  password: PasswordRecord | string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<AuthResult>
  register: (
    name: string,
    email: string,
    password: string,
    role: UserRole
  ) => Promise<AuthResult>
  logout: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const USERS_KEY = 'users'
const USER_KEY = 'user'
const SEEDED_FLAG = 'edu_test_accounts_seeded_v1'

/**
 * Test accounts pre-seeded into localStorage on first load. Lets the user
 * click into a working account immediately without going through email
 * confirmation, password reset, etc.
 *
 * To reset: clear site data in DevTools → Application → Storage.
 */
const TEST_ACCOUNTS: Array<{
  id: string
  email: string
  name: string
  role: UserRole
  password: string
}> = [
  { id: 'seed_t1', email: 'gv1@test.local', name: 'Cô Lan',         role: 'teacher', password: 'test1234' },
  { id: 'seed_t2', email: 'gv2@test.local', name: 'Thầy Nam',       role: 'teacher', password: 'test1234' },
  { id: 'seed_s1', email: 'hs1@test.local', name: 'Học sinh An',    role: 'student', password: 'test1234' },
  { id: 'seed_s2', email: 'hs2@test.local', name: 'Học sinh Bình',  role: 'student', password: 'test1234' },
]

export const TEST_ACCOUNT_HINTS = TEST_ACCOUNTS.map((a) => ({
  email: a.email,
  password: a.password,
  name: a.name,
  role: a.role,
}))

function readUsers(): StoredUser[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]')
  } catch {
    return []
  }
}

function writeUsers(users: StoredUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

async function seedTestAccountsIfNeeded(): Promise<void> {
  if (typeof window === 'undefined') return
  if (localStorage.getItem(SEEDED_FLAG)) return
  try {
    const users = readUsers()
    let mutated = false
    for (const acc of TEST_ACCOUNTS) {
      if (!users.some((u) => u.email === acc.email)) {
        const hashed = await hashPassword(acc.password)
        users.push({
          id: acc.id,
          email: acc.email,
          name: acc.name,
          role: acc.role,
          password: hashed,
        })
        mutated = true
      }
    }
    if (mutated) writeUsers(users)
    localStorage.setItem(SEEDED_FLAG, '1')
  } catch {
    /* non-critical */
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      await seedTestAccountsIfNeeded()
      if (!mounted) return
      const stored = localStorage.getItem(USER_KEY)
      if (stored) {
        try {
          setUser(JSON.parse(stored))
        } catch {
          localStorage.removeItem(USER_KEY)
        }
      }
      setIsLoading(false)
    })()
    return () => {
      mounted = false
    }
  }, [])

  const register: AuthContextType['register'] = async (
    name,
    email,
    password,
    role
  ) => {
    try {
      const users = readUsers()
      if (users.some((u) => u.email === email)) {
        return { ok: false, error: 'Email đã tồn tại' }
      }

      const passwordRecord = await hashPassword(password)
      const newUser: StoredUser = {
        id: 'u_' + Date.now().toString(36),
        name,
        email,
        password: passwordRecord,
        role,
      }
      users.push(newUser)
      writeUsers(users)

      const { password: _pw, ...userWithoutPassword } = newUser
      setUser(userWithoutPassword)
      localStorage.setItem(USER_KEY, JSON.stringify(userWithoutPassword))

      return { ok: true }
    } catch (e) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : 'Lỗi đăng ký',
      }
    }
  }

  const login: AuthContextType['login'] = async (email, password) => {
    try {
      const users = readUsers()
      const idx = users.findIndex((u) => u.email === email)
      if (idx < 0) {
        return { ok: false, error: 'Email hoặc mật khẩu không đúng' }
      }
      const found = users[idx]
      let ok = false

      if (isPasswordRecord(found.password)) {
        ok = await verifyPassword(password, found.password)
      } else if (typeof found.password === 'string') {
        // Legacy plaintext: accept once, then upgrade to hashed format.
        ok = found.password === password
        if (ok) {
          users[idx] = { ...found, password: await hashPassword(password) }
          writeUsers(users)
        }
      }

      if (!ok) return { ok: false, error: 'Email hoặc mật khẩu không đúng' }

      const { password: _pw, ...userWithoutPassword } = users[idx]
      setUser(userWithoutPassword)
      localStorage.setItem(USER_KEY, JSON.stringify(userWithoutPassword))
      return { ok: true }
    } catch (e) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : 'Lỗi đăng nhập',
      }
    }
  }

  const logout = async () => {
    setUser(null)
    localStorage.removeItem(USER_KEY)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
