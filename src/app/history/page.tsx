'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import EngagementChart from '../../components/EngagementChart'
import MeetingInsights from '../../components/MeetingInsights'
import SessionRecommendations from '../../components/SessionRecommendations'
import CompactTimeline from '../../components/CompactTimeline'
import { buildBehaviorCSV, downloadCSV } from '../../lib/export'
import { behaviorStore } from '../../lib/behaviorStore'
import { classifyBehavior } from '../../lib/utils'

interface MeetingView {
    id: string
    roomCode: string
    teacherName: string
    startTime: number
    endTime?: number
    participantCount: number
}

interface BehaviorView {
    id: string
    userId: string
    userName: string
    behavior: string
    emoji: string
    color: string
    type: 'positive' | 'negative' | 'neutral' | 'warning'
    timestamp: number
    bgColor?: string
}

export default function HistoryPage() {
    const [stats, setStats] = useState({
        meetingsCount: 0,
        totalBehaviors: 0,
        positiveBehaviors: 0,
        negativeBehaviors: 0,
        warningBehaviors: 0,
        neutralBehaviors: 0
    })
    const [meetings, setMeetings] = useState<MeetingView[]>([])
    const [selectedMeeting, setSelectedMeeting] = useState<string | null>(null)
    const [behaviors, setBehaviors] = useState<BehaviorView[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all')

    // Load behaviors of the CURRENT session from in-memory store.
    // Cross-session history is not persisted in the local-auth model — if
    // the user wants to keep a record, they export CSV before leaving the
    // meeting room.
    useEffect(() => {
        loadCurrentSession()
    }, [])

    useEffect(() => {
        if (selectedMeeting) loadCurrentSession()
    }, [selectedMeeting])

    const loadCurrentSession = () => {
        setIsLoading(true)
        const all = behaviorStore.getBehaviors()
        if (all.length === 0) {
            setMeetings([])
            setBehaviors([])
            setStats({
                meetingsCount: 0,
                totalBehaviors: 0,
                positiveBehaviors: 0,
                negativeBehaviors: 0,
                warningBehaviors: 0,
                neutralBehaviors: 0,
            })
            setIsLoading(false)
            return
        }

        // Build a single virtual "current session" entry from the in-memory store.
        const sorted = [...all].sort((a, b) => a.timestamp - b.timestamp)
        const start = sorted[0].timestamp
        const end = sorted[sorted.length - 1].timestamp
        const teacherName = 'Buổi học hiện tại'

        const adapted: BehaviorView[] = sorted.map((b, i) => {
            const cls = classifyBehavior(b.label)
            const type: BehaviorView['type'] =
                cls === 'focused'
                    ? 'positive'
                    : cls === 'distracted'
                        ? 'warning'
                        : cls === 'sleeping'
                            ? 'negative'
                            : 'neutral'
            return {
                id: `${b.userId}-${b.timestamp}-${i}`,
                userId: b.userId,
                userName: b.userName,
                behavior: b.label,
                emoji: b.emoji,
                color: b.color,
                type,
                timestamp: b.timestamp,
            }
        })

        const userIds = new Set(adapted.map((a) => a.userId))
        const meetingView: MeetingView = {
            id: 'current_session',
            roomCode: 'live',
            teacherName,
            startTime: start,
            endTime: end,
            participantCount: userIds.size,
        }

        let pos = 0, neg = 0, warn = 0, neu = 0
        for (const a of adapted) {
            if (a.type === 'positive') pos++
            else if (a.type === 'negative') neg++
            else if (a.type === 'warning') warn++
            else neu++
        }

        setMeetings([meetingView])
        setSelectedMeeting('current_session')
        setBehaviors(adapted)
        setStats({
            meetingsCount: 1,
            totalBehaviors: adapted.length,
            positiveBehaviors: pos,
            negativeBehaviors: neg,
            warningBehaviors: warn,
            neutralBehaviors: neu,
        })
        setIsLoading(false)
    }

    const getFilteredMeetings = () => {
        const now = Date.now()
        const oneDayMs = 24 * 60 * 60 * 1000

        switch (dateFilter) {
            case 'today':
                return meetings.filter(m => now - m.startTime < oneDayMs)
            case 'week':
                return meetings.filter(m => now - m.startTime < 7 * oneDayMs)
            case 'month':
                return meetings.filter(m => now - m.startTime < 30 * oneDayMs)
            default:
                return meetings
        }
    }

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const formatDuration = (start: number, end?: number) => {
        const duration = (end || Date.now()) - start
        const minutes = Math.floor(duration / 60000)
        return `${minutes} phút`
    }

    const filteredMeetings = getFilteredMeetings()

    return (
        <DashboardLayout>
            <div className="container" style={{ maxWidth: '1200px' }}>
                {/* Header */}
                <div style={{ marginBottom: '2rem' }}>
                    <h1 className="title" style={{ fontSize: '1.75rem', textAlign: 'left', marginBottom: '0.5rem' }}>
                        📊 Lịch sử & Phân tích
                    </h1>
                    <p className="subtitle" style={{ textAlign: 'left', marginBottom: 0 }}>
                        Theo dõi lịch sử phát hiện hành vi trong các cuộc họp
                    </p>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
                        <div>Đang tải dữ liệu...</div>
                    </div>
                )}

                {/* No Data State */}
                {!isLoading && meetings.length === 0 && (
                    <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                        <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Chưa có dữ liệu</h3>
                        <p style={{ color: 'var(--text-muted)' }}>
                            Tham gia một cuộc họp để bắt đầu ghi lại lịch sử hành vi
                        </p>
                    </div>
                )}

                {/* Stats Overview */}
                {!isLoading && meetings.length > 0 && (
                    <>
                        <div className="card animate-fadeIn" style={{ marginBottom: '1.5rem' }}>
                            <h2 className="section-title">📈 Tổng quan</h2>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                                gap: '1rem',
                                marginTop: '1rem'
                            }}>
                                <div style={{
                                    padding: '1rem',
                                    background: 'var(--bg-secondary)',
                                    borderRadius: '12px',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                                        {stats.meetingsCount}
                                    </div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Buổi học</div>
                                </div>
                                <div style={{
                                    padding: '1rem',
                                    background: 'var(--bg-secondary)',
                                    borderRadius: '12px',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                        {stats.totalBehaviors}
                                    </div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Tổng hành vi</div>
                                </div>
                                <div style={{
                                    padding: '1rem',
                                    background: 'var(--bg-secondary)',
                                    borderRadius: '12px',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--success)' }}>
                                        {stats.positiveBehaviors}
                                    </div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Tích cực</div>
                                </div>
                                <div style={{
                                    padding: '1rem',
                                    background: 'var(--bg-secondary)',
                                    borderRadius: '12px',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--warning)' }}>
                                        {stats.warningBehaviors}
                                    </div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Cảnh báo</div>
                                </div>
                                <div style={{
                                    padding: '1rem',
                                    background: 'var(--bg-secondary)',
                                    borderRadius: '12px',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--danger)' }}>
                                        {stats.negativeBehaviors}
                                    </div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Tiêu cực</div>
                                </div>
                            </div>
                        </div>

                        {/* Date Filter */}
                        <div className="card" style={{ marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <button
                                    onClick={() => setDateFilter('all')}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border-color)',
                                        background: dateFilter === 'all' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                                        color: dateFilter === 'all' ? 'white' : 'var(--text-primary)',
                                        cursor: 'pointer',
                                        fontSize: '0.875rem',
                                        fontWeight: 500
                                    }}
                                >
                                    Tất cả
                                </button>
                                <button
                                    onClick={() => setDateFilter('today')}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border-color)',
                                        background: dateFilter === 'today' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                                        color: dateFilter === 'today' ? 'white' : 'var(--text-primary)',
                                        cursor: 'pointer',
                                        fontSize: '0.875rem',
                                        fontWeight: 500
                                    }}
                                >
                                    Hôm nay
                                </button>
                                <button
                                    onClick={() => setDateFilter('week')}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border-color)',
                                        background: dateFilter === 'week' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                                        color: dateFilter === 'week' ? 'white' : 'var(--text-primary)',
                                        cursor: 'pointer',
                                        fontSize: '0.875rem',
                                        fontWeight: 500
                                    }}
                                >
                                    7 ngày
                                </button>
                                <button
                                    onClick={() => setDateFilter('month')}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border-color)',
                                        background: dateFilter === 'month' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                                        color: dateFilter === 'month' ? 'white' : 'var(--text-primary)',
                                        cursor: 'pointer',
                                        fontSize: '0.875rem',
                                        fontWeight: 500
                                    }}
                                >
                                    30 ngày
                                </button>
                            </div>
                        </div>

                        {/* Meetings List */}
                        <div className="card" style={{ marginBottom: '1.5rem' }}>
                            <h2 className="section-title">📅 Danh sách buổi học ({filteredMeetings.length})</h2>
                            <div style={{ marginTop: '1rem' }}>
                                {filteredMeetings.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                        Không có buổi học nào trong khoảng thời gian này
                                    </div>
                                ) : (
                                    filteredMeetings.map((meeting) => (
                                        <div
                                            key={meeting.id}
                                            onClick={() => setSelectedMeeting(meeting.id)}
                                            style={{
                                                padding: '1rem',
                                                marginBottom: '0.5rem',
                                                borderRadius: '8px',
                                                border: `2px solid ${selectedMeeting === meeting.id ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                                                background: selectedMeeting === meeting.id ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-secondary)',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                                                        🏫 Phòng: {meeting.roomCode}
                                                    </div>
                                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                                        👨‍🏫 {meeting.teacherName} • 👥 {meeting.participantCount} người
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                                        🕐 {formatDate(meeting.startTime)} • ⏱️ {formatDuration(meeting.startTime, meeting.endTime)}
                                                    </div>
                                                </div>
                                                {selectedMeeting === meeting.id && (
                                                    <div style={{ color: 'var(--accent-primary)', fontSize: '1.5rem' }}>✓</div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Insights */}
                        {selectedMeeting && behaviors.length > 0 && (
                            <div className="card animate-fadeIn" style={{ marginBottom: '1.5rem' }}>
                                <h2 className="section-title">💡 Insights</h2>
                                <div style={{ marginTop: '1rem' }}>
                                    <MeetingInsights events={behaviors} />
                                </div>
                            </div>
                        )}

                        {/* Tier 3: Gemini AI Recommendations */}
                        {selectedMeeting && behaviors.length > 0 && (() => {
                            const meeting = meetings.find(m => m.id === selectedMeeting)
                            const durationMs = meeting
                                ? (meeting.endTime ?? Date.now()) - meeting.startTime
                                : 0
                            return (
                                <SessionRecommendations
                                    events={behaviors}
                                    meetingDurationMs={durationMs}
                                />
                            )
                        })()}

                        {/* Engagement Chart */}
                        {selectedMeeting && behaviors.length > 0 && (
                            <div className="card animate-fadeIn" style={{ marginBottom: '1.5rem' }}>
                                <h2 className="section-title">📈 Biểu đồ tập trung theo thời gian</h2>
                                <div style={{ marginTop: '1rem' }}>
                                    <EngagementChart events={behaviors.map(b => ({ timestamp: b.timestamp, type: b.type }))} />
                                </div>
                            </div>
                        )}

                        {/* Behavior Timeline */}
                        {selectedMeeting && behaviors.length > 0 && (
                            <div className="card">
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <h2 className="section-title" style={{ marginBottom: 0 }}>
                                        📜 Timeline hành vi ({behaviors.length})
                                    </h2>
                                    <button
                                        onClick={() => {
                                            const meeting = meetings.find(m => m.id === selectedMeeting)
                                            const title = meeting
                                                ? `Phòng ${meeting.roomCode} - ${meeting.teacherName}`
                                                : 'Báo cáo'
                                            const csv = buildBehaviorCSV(
                                                title,
                                                behaviors.map(b => ({
                                                    timestamp: b.timestamp,
                                                    userName: b.userName,
                                                    behavior: b.behavior,
                                                    type: b.type,
                                                }))
                                            )
                                            const filename = meeting
                                                ? `bao-cao-${meeting.roomCode}-${new Date(meeting.startTime).toISOString().slice(0, 10)}.csv`
                                                : `bao-cao-${Date.now()}.csv`
                                            downloadCSV(filename, csv)
                                        }}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontSize: '0.875rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.375rem',
                                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                                        }}
                                        title="Tải file CSV để gửi phụ huynh / báo cáo nhà trường"
                                    >
                                        📥 Xuất CSV
                                    </button>
                                </div>
                                <div style={{ marginTop: '1rem', maxHeight: '600px', overflowY: 'auto' }}>
                                    <CompactTimeline events={behaviors} />
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </DashboardLayout>
    )
}
