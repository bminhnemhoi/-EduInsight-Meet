'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { settingsStore } from '../../lib/settingsStore'
import { useAuth } from '../../contexts/AuthContext'
import { logger } from '../../lib/logger'

export default function SettingsPage() {
    const { user } = useAuth()
    const [aiEnabled, setAiEnabled] = useState(true)
    const [autoRecord, setAutoRecord] = useState(true)
    const [detectionSensitivity, setDetectionSensitivity] = useState(0.5)
    const [theme, setTheme] = useState<'light' | 'dark'>('light')
    const [autoMute, setAutoMute] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [saveMessage, setSaveMessage] = useState('')

    useEffect(() => {
        const s = settingsStore.getSettings()
        setAiEnabled(s.aiEnabled)
        setAutoRecord(s.autoRecord)
        setDetectionSensitivity(s.detectionSensitivity ?? 0.5)
        setTheme(s.theme)
        setAutoMute(s.autoMute ?? false)
    }, [user])

    const saveSettings = async () => {
        setIsSaving(true)
        setSaveMessage('')

        try {
            settingsStore.updateSettings({
                aiEnabled,
                autoRecord,
                detectionSensitivity,
                theme,
                autoMute,
            })

            setSaveMessage('✅ Đã lưu cài đặt')
            logger.info('[Settings] Saved')
            setTimeout(() => setSaveMessage(''), 2000)
        } catch (err) {
            logger.error('[Settings] Failed to save:', err)
            setSaveMessage('❌ Lỗi khi lưu')
        } finally {
            setIsSaving(false)
        }
    }

    const handleToggleAI = async (checked: boolean) => {
        setAiEnabled(checked)
        await saveSettings()
    }

    const handleToggleRecord = async (checked: boolean) => {
        setAutoRecord(checked)
        await saveSettings()
    }

    const handleToggleAutoMute = async (checked: boolean) => {
        setAutoMute(checked)
        await saveSettings()
    }

    const handleSensitivityChange = (value: number) => {
        setDetectionSensitivity(value)
    }

    const handleThemeChange = async (newTheme: 'light' | 'dark') => {
        setTheme(newTheme)
        // Apply theme immediately (you can implement theme switching logic here)
        document.documentElement.setAttribute('data-theme', newTheme)
        await saveSettings()
    }

    return (
        <DashboardLayout>
            <div className="container" style={{ maxWidth: '700px' }}>
                {/* Header */}
                <div style={{ marginBottom: '2rem' }}>
                    <h1 className="title" style={{ fontSize: '1.75rem', textAlign: 'left', marginBottom: '0.5rem' }}>
                        ⚙️ Cài đặt
                    </h1>
                    <p className="subtitle" style={{ textAlign: 'left', marginBottom: 0 }}>
                        Tùy chỉnh trải nghiệm của bạn
                    </p>
                </div>

                {/* Save Message */}
                {saveMessage && (
                    <div style={{
                        padding: '1rem',
                        marginBottom: '1rem',
                        borderRadius: '8px',
                        background: saveMessage.includes('✅') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: saveMessage.includes('✅') ? 'var(--success)' : 'var(--danger)',
                        textAlign: 'center',
                        fontWeight: 500
                    }}>
                        {saveMessage}
                    </div>
                )}

                {/* AI Settings */}
                <div className="card animate-fadeIn">
                    <h2 className="section-title">🤖 Cài đặt AI</h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.75rem',
                            background: 'var(--bg-secondary)',
                            borderRadius: '8px',
                            cursor: 'pointer'
                        }}>
                            <div>
                                <span style={{ fontWeight: 500 }}>Phát hiện hành vi tự động</span>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                    AI sẽ tự động phát hiện hành vi khi bật camera
                                </p>
                            </div>
                            <input
                                type="checkbox"
                                checked={aiEnabled}
                                onChange={(e) => handleToggleAI(e.target.checked)}
                                disabled={isSaving}
                                style={{ width: '20px', height: '20px', accentColor: 'var(--accent-primary)' }}
                            />
                        </label>

                        <div style={{
                            padding: '0.75rem',
                            background: 'var(--bg-secondary)',
                            borderRadius: '8px'
                        }}>
                            <div style={{ marginBottom: '0.5rem' }}>
                                <span style={{ fontWeight: 500 }}>Độ nhạy phát hiện</span>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                    Điều chỉnh mức độ nhạy của AI (0.1 = thấp, 1.0 = cao)
                                </p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <input
                                    type="range"
                                    min="0.1"
                                    max="1.0"
                                    step="0.1"
                                    value={detectionSensitivity}
                                    onChange={(e) => handleSensitivityChange(parseFloat(e.target.value))}
                                    onMouseUp={() => saveSettings()}
                                    onTouchEnd={() => saveSettings()}
                                    disabled={isSaving}
                                    style={{ flex: 1, accentColor: 'var(--accent-primary)' }}
                                />
                                <span style={{ fontWeight: 600, minWidth: '40px' }}>
                                    {detectionSensitivity.toFixed(1)}
                                </span>
                            </div>
                        </div>

                        <div style={{
                            padding: '0.75rem',
                            background: 'var(--bg-secondary)',
                            borderRadius: '8px',
                            opacity: 0.55,
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <span style={{ fontWeight: 500 }}>
                                        Lưu lịch sử tự động
                                        <span style={{ marginLeft: 8, fontSize: '0.6875rem', padding: '2px 6px', borderRadius: 4, background: 'rgba(107,114,128,0.2)', color: 'var(--text-muted)', fontWeight: 600 }}>
                                            SẮP CÓ
                                        </span>
                                    </span>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                        Hiện tại lịch sử luôn được lưu khi AI bật
                                    </p>
                                </div>
                                <input type="checkbox" disabled checked style={{ width: '20px', height: '20px' }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Meeting Settings */}
                <div className="card animate-fadeIn" style={{ animationDelay: '0.1s' }}>
                    <h2 className="section-title">🎥 Cài đặt cuộc họp</h2>

                    <div style={{
                        padding: '0.75rem',
                        background: 'var(--bg-secondary)',
                        borderRadius: '8px',
                        opacity: 0.55,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <span style={{ fontWeight: 500 }}>
                                    Tự động tắt mic khi vào
                                    <span style={{ marginLeft: 8, fontSize: '0.6875rem', padding: '2px 6px', borderRadius: 4, background: 'rgba(107,114,128,0.2)', color: 'var(--text-muted)', fontWeight: 600 }}>
                                        SẮP CÓ
                                    </span>
                                </span>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                    Hiện tại mic được giữ nguyên trạng thái từ trang chuẩn bị
                                </p>
                            </div>
                            <input type="checkbox" disabled checked={autoMute} style={{ width: '20px', height: '20px' }} />
                        </div>
                    </div>
                </div>

                {/* Display Settings */}
                <div className="card animate-fadeIn" style={{ animationDelay: '0.2s' }}>
                    <h2 className="section-title">
                        🎨 Giao diện
                        <span style={{ marginLeft: 8, fontSize: '0.6875rem', padding: '2px 6px', borderRadius: 4, background: 'rgba(107,114,128,0.2)', color: 'var(--text-muted)', fontWeight: 600 }}>
                            SẮP CÓ
                        </span>
                    </h2>
                    <div style={{ display: 'flex', gap: '0.5rem', opacity: 0.55 }}>
                        <button
                            disabled
                            style={{
                                flex: 1,
                                padding: '0.75rem',
                                borderRadius: '8px',
                                border: '2px solid var(--accent-primary)',
                                background: 'rgba(59, 130, 246, 0.1)',
                                color: 'var(--text-primary)',
                                fontWeight: 500,
                                cursor: 'not-allowed',
                            }}
                        >
                            ☀️ Sáng
                        </button>
                        <button
                            disabled
                            style={{
                                flex: 1,
                                padding: '0.75rem',
                                borderRadius: '8px',
                                border: '2px solid var(--border-color)',
                                background: 'var(--bg-secondary)',
                                color: 'var(--text-primary)',
                                fontWeight: 500,
                                cursor: 'not-allowed',
                            }}
                        >
                            🌙 Tối
                        </button>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                        Chế độ tối sẽ có ở phiên bản kế tiếp
                    </p>
                </div>

                {/* About */}
                <div className="card animate-fadeIn" style={{ animationDelay: '0.3s' }}>
                    <h2 className="section-title">ℹ️ Thông tin</h2>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        <p><strong>Edu Insight Meet</strong></p>
                        <p style={{ marginTop: '0.5rem' }}>Phiên bản: 1.0.0</p>
                        <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>
                            Ứng dụng họp video với AI phát hiện hành vi học tập.
                        </p>
                        <p style={{ marginTop: '0.25rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                            🔒 Dữ liệu lưu local trên trình duyệt của bạn; AI nhận diện chạy ngay trên thiết bị, không gửi video lên server
                        </p>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
