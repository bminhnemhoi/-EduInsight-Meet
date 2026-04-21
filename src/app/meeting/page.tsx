'use client'

import DashboardLayout from '../../components/DashboardLayout'
import CreateJoinMeeting from '../../components/CreateJoinMeeting'

export default function MeetingPage() {
    return (
        <DashboardLayout>
            <div className="container" style={{ maxWidth: '600px' }}>
                {/* Header */}
                <div style={{ marginBottom: '2rem' }}>
                    <h1 className="title" style={{ fontSize: '1.75rem', textAlign: 'left', marginBottom: '0.5rem' }}>
                        📹 Cuộc họp
                    </h1>
                    <p className="subtitle" style={{ textAlign: 'left', marginBottom: 0 }}>
                        Bắt đầu hoặc tham gia cuộc họp video
                    </p>
                </div>

                {/* Create & Join Meeting (reusable component) */}
                <CreateJoinMeeting />

                {/* Recent Meetings Placeholder */}
                <div className="card animate-fadeIn" style={{ animationDelay: '0.2s' }}>
                    <h2 className="section-title">🕒 Cuộc họp gần đây</h2>
                    <div style={{
                        textAlign: 'center',
                        padding: '2rem 1rem',
                        color: 'var(--text-muted)'
                    }}>
                        <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>📭</span>
                        <p style={{ fontSize: '0.875rem' }}>Chưa có cuộc họp nào</p>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
