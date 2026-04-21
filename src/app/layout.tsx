import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '../contexts/AuthContext'
import { MeetingProvider } from '../contexts/MeetingContext'
import ErrorBoundary from '../components/ErrorBoundary'

export const metadata: Metadata = {
  title: 'Edu Insight Meet',
  description: 'Real-time video meeting for education',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <ErrorBoundary>
          <AuthProvider>
            <MeetingProvider>
              {children}
            </MeetingProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
