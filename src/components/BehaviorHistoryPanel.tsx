'use client'

import { useState, useEffect } from 'react'
import { formatTimeVN } from '../lib/utils'

import { behaviorStore } from '../lib/behaviorStore'

export interface BehaviorHistoryEntry {
    id: string
    timestamp: Date
    label: string
    emoji: string
    type: 'positive' | 'negative' | 'neutral' | 'warning'
}

let historyListeners: (() => void)[] = []

export function addBehaviorEntry(entry: Omit<BehaviorHistoryEntry, 'id' | 'timestamp'>) {
    // Already stored in behaviorStore via AIBehaviorDetector's addStudentBehavior
    historyListeners.forEach(listener => listener())
}

export function clearHistory() {
    behaviorStore.clearBehaviors()
    historyListeners.forEach(listener => listener())
}

export function getHistory(): BehaviorHistoryEntry[] {
    const rawBehaviors = behaviorStore.getBehaviors()
    return rawBehaviors.map(b => ({
      id: b.timestamp.toString(),
      timestamp: new Date(b.timestamp),
      label: b.label,
      emoji: b.emoji,
      type: 'neutral' // Map safely
    }))
}

interface Props {
    maxEntries?: number
    showClearButton?: boolean
}

export default function BehaviorHistoryPanel({ maxEntries = 10, showClearButton = true }: Props) {
    const [entries, setEntries] = useState<BehaviorHistoryEntry[]>([])
    const [isExpanded, setIsExpanded] = useState(true)

    useEffect(() => {
        const updateEntries = () => {
            setEntries(getHistory().slice(0, maxEntries))
        }

        updateEntries()
        historyListeners.push(updateEntries)

        // Poll for updates across components every 2s
        const pollInterval = setInterval(updateEntries, 2000)

        return () => {
            historyListeners = historyListeners.filter(l => l !== updateEntries)
            clearInterval(pollInterval)
        }
    }, [maxEntries])

    return (
        <div className="history-panel">
            <div className="history-panel-header">
                <h3 className="history-panel-title">
                    <span>📊</span>
                    <span>Lịch sử Hành vi</span>
                </h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {showClearButton && entries.length > 0 && (
                        <button
                            onClick={clearHistory}
                            style={{
                                background: 'none',
                                border: '1px solid var(--border-color)',
                                borderRadius: '6px',
                                padding: '0.375rem 0.75rem',
                                fontSize: '0.75rem',
                                color: 'var(--text-muted)',
                                cursor: 'pointer'
                            }}
                        >
                            Xóa
                        </button>
                    )}
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        style={{
                            background: 'none',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                            padding: '0.375rem 0.75rem',
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                            cursor: 'pointer'
                        }}
                    >
                        {isExpanded ? '▲' : '▼'}
                    </button>
                </div>
            </div>

            {isExpanded && (
                <>
                    {entries.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '2rem 1rem',
                            color: 'var(--text-muted)'
                        }}>
                            <span style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'block' }}>📝</span>
                            <p style={{ fontSize: '0.875rem' }}>Chưa có dữ liệu hành vi</p>
                            <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Bật AI để bắt đầu phát hiện</p>
                        </div>
                    ) : (
                        <table className="history-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '30%' }}>Thời gian</th>
                                    <th>Hành vi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {entries.map((entry) => (
                                    <tr key={entry.id}>
                                        <td style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>
                                            {formatTimeVN(entry.timestamp)}
                                        </td>
                                        <td>
                                            <span className={`history-badge ${entry.type}`}>
                                                <span>{entry.emoji}</span>
                                                <span>{entry.label}</span>
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </>
            )}
        </div>
    )
}
