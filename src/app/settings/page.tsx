'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { settingsStore } from '../../lib/settingsStore'
import { database, UserSettings } from '../../lib/database'
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
        loadSettings()
    }, [user])

    const loadSettings = async () => {
        try {
            await database.init()
            
            if (user?.id) {
                // Try to load from database first
                const dbSettings = await database.getSettings(user.id)
                
                if (dbSettings) {
                    setAiEnabled(dbSettings.aiEnabled)
                    setAutoRecord(dbSettings.recordingEnabled)
                    setDetectionSensitivity(dbSettings.detectionSensitivity)
                    setTheme(dbSettings.theme)
                    setAutoMute(dbSettings.autoMute)
                    logger.info('[Settings] Loaded from database')
                } else {
                    // Fallback to localStorage
                    const localSettings = settingsStore.getSettings()
                    setAiEnabled(localSettings.aiEnabled)
                    setAutoRecord(localSettings.autoRecord)
                    logger.info('[Settings] Loaded from localStorage')
                }
            }
        } catch (err) {
            logger.error('[Settings] Failed to load:', err)
        }
    }

    const saveSettings = async () => {
        if (!user?.id) return
        
        setIsSaving(true)
        setSaveMessage('')
        
        try {
            const settings: UserSettings = {
                userId: user.id,
                aiEnabled,
                detectionSensitivity,
                theme,
                autoMute,
                recordingEnabled: autoRecord
            }
            
            // Save to database
            await database.saveSettings(settings)
            
            // Also save to localStorage for quick access
            settingsStore.updateSettings({
                aiEnabled,
                autoRecord,
                detectionSensitivity,
                theme
            })
            
            setSaveMessage('✅ Đã lưu cài đặt')
            logger.info('[Settings] Saved successfully')
            
            // Clear message after 2 seconds
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
                                <span style={{ fontWeight: 500 }}>Lưu lịch sử tự động</span>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                    Tự động lưu lịch sử hành vi vào database
                                </p>
                            </div>
                            <input
                                type="checkbox"
                                checked={autoRecord}
                                onChange={(e) => handleToggleRecord(e.target.checked)}
                                disabled={isSaving}
                                style={{ width: '20px', height: '20px', accentColor: 'var(--accent-primary)' }}
                            />
                        </label>
                    </div>
                </div>

                {/* Meeting Settings */}
                <div className="card animate-fadeIn" style={{ animationDelay: '0.1s' }}>
                    <h2 className="section-title">🎥 Cài đặt cuộc họp</h2>
                    
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
                            <span style={{ fontWeight: 500 }}>Tự động tắt mic khi vào</span>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                Mic sẽ tự động tắt khi tham gia cuộc họp
                            </p>
                        </div>
                        <input
                            type="checkbox"
                            checked={autoMute}
                            onChange={(e) => handleToggleAutoMute(e.target.checked)}
                            disabled={isSaving}
                            style={{ width: '20px', height: '20px', accentColor: 'var(--accent-primary)' }}
                        />
                    </label>
                </div>

                {/* Display Settings */}
                <div className="card animate-fadeIn" style={{ animationDelay: '0.2s' }}>
                    <h2 className="section-title">🎨 Giao diện</h2>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            onClick={() => handleThemeChange('light')}
                            disabled={isSaving}
                            style={{
                                flex: 1,
                                padding: '0.75rem',
                                borderRadius: '8px',
                                border: `2px solid ${theme === 'light' ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                                background: theme === 'light' ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-secondary)',
                                color: 'var(--text-primary)',
                                cursor: 'pointer',
                                fontWeight: 500,
                                transition: 'all 0.2s'
                            }}
                        >
                            ☀️ Sáng
                        </button>
                        <button
                            onClick={() => handleThemeChange('dark')}
                            disabled={isSaving}
                            style={{
                                flex: 1,
                                padding: '0.75rem',
                                borderRadius: '8px',
                                border: `2px solid ${theme === 'dark' ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                                background: theme === 'dark' ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-secondary)',
                                color: 'var(--text-primary)',
                                cursor: 'pointer',
                                fontWeight: 500,
                                transition: 'all 0.2s'
                            }}
                        >
                            🌙 Tối
                        </button>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                        Đang sử dụng: {theme === 'light' ? 'Giao diện sáng' : 'Giao diện tối'}
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
                            💾 Dữ liệu lưu an toàn trên thiết bị của bạn (IndexedDB)
                        </p>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
