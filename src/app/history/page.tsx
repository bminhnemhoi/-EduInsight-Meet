'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import BehaviorHistoryPanel from '../../components/BehaviorHistoryPanel'
import { database, BehaviorEntry, Meeting } from '../../lib/database'
import { logger } from '../../lib/logger'

export default function HistoryPage() {
    const [stats, setStats] = useState({
        meetingsCount: 0,
        totalBehaviors: 0,
        positiveBehaviors: 0,
        negativeBehaviors: 0,
        warningBehaviors: 0,
        neutralBehaviors: 0
    })
    const [meetings, setMeetings] = useState<Meeting[]>([])
    const [selectedMeeting, setSelectedMeeting] = useState<string | null>(null)
    const [behaviors, setBehaviors] = useState<BehaviorEntry[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all')

    // Load meetings and stats
    useEffect(() => {
        loadData()
    }, [])

    // Load behaviors when meeting selected
    useEffect(() => {
        if (selectedMeeting) {
            loadBehaviors(selectedMeeting)
        }
    }, [selectedMeeting])

    const loadData = async () => {
        setIsLoading(true)
        try {
            await database.init()
            
            // Get all meetings
            const allMeetings = await database.getAllMeetings()
            setMeetings(allMeetings)
            
            // Calculate overall stats from all meetings
            let totalPositive = 0
            let totalNegative = 0
            let totalWarning = 0
            let totalNeutral = 0
            let totalBehaviors = 0
            
            for (const meeting of allMeetings) {
                const meetingStats = await database.getStatistics(meeting.id)
                totalPositive += meetingStats.positiveCount
                totalNegative += meetingStats.negativeCount
                totalWarning += meetingStats.warningCount
                totalNeutral += meetingStats.neutralCount
                totalBehaviors += meetingStats.totalBehaviors
            }
            
            setStats({
                meetingsCount: allMeetings.length,
                totalBehaviors,
                positiveBehaviors: totalPositive,
                negativeBehaviors: totalNegative,
                warningBehaviors: totalWarning,
                neutralBehaviors: totalNeutral
            })
            
            // Auto-select most recent meeting
            if (allMeetings.length > 0) {
                setSelectedMeeting(allMeetings[0].id)
            }
            
            logger.info('[History] Loaded', allMeetings.length, 'meetings')
        } catch (err) {
            logger.error('[History] Failed to load data:', err)
        } finally {
            setIsLoading(false)
        }
    }

    const loadBehaviors = async (meetingId: string) => {
        try {
            const meetingBehaviors = await database.getBehaviorsByMeeting(meetingId)
            setBehaviors(meetingBehaviors)
            logger.info('[History] Loaded', meetingBehaviors.length, 'behaviors for meeting', meetingId)
        } catch (err) {
            logger.error('[History] Failed to load behaviors:', err)
        }
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

                        {/* Behavior Timeline */}
                        {selectedMeeting && behaviors.length > 0 && (
                            <div className="card">
                                <h2 className="section-title">📜 Timeline hành vi ({behaviors.length})</h2>
                                <div style={{ marginTop: '1rem', maxHeight: '600px', overflowY: 'auto' }}>
                                    {behaviors.map((behavior, index) => (
                                        <div
                                            key={behavior.id}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '1rem',
                                                padding: '0.75rem',
                                                marginBottom: '0.5rem',
                                                borderRadius: '8px',
                                                background: behavior.bgColor || 'var(--bg-secondary)',
                                                border: `1px solid ${behavior.color}40`
                                            }}
                                        >
                                            <div style={{ fontSize: '1.5rem' }}>{behavior.emoji}</div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600, color: behavior.color }}>
                                                    {behavior.behavior}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                    {behavior.userName} • {new Date(behavior.timestamp).toLocaleTimeString('vi-VN')}
                                                </div>
                                            </div>
                                            <div style={{
                                                fontSize: '0.75rem',
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '4px',
                                                background: behavior.type === 'positive' ? 'rgba(16, 185, 129, 0.2)' :
                                                           behavior.type === 'negative' ? 'rgba(239, 68, 68, 0.2)' :
                                                           behavior.type === 'warning' ? 'rgba(245, 158, 11, 0.2)' :
                                                           'rgba(100, 116, 139, 0.2)',
                                                color: behavior.type === 'positive' ? 'var(--success)' :
                                                       behavior.type === 'negative' ? 'var(--danger)' :
                                                       behavior.type === 'warning' ? 'var(--warning)' :
                                                       'var(--text-muted)'
                                            }}>
                                                {behavior.type === 'positive' ? '✅ Tích cực' :
                                                 behavior.type === 'negative' ? '❌ Tiêu cực' :
                                                 behavior.type === 'warning' ? '⚠️ Cảnh báo' :
                                                 '➖ Trung lập'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </DashboardLayout>
    )
}
