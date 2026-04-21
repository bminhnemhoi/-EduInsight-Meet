'use client'

import { useState } from 'react'
import Sidebar from './Sidebar'

interface Props {
    children: React.ReactNode
}

export default function DashboardLayout({ children }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <div className="dashboard-layout">
            {/* Hamburger button for mobile */}
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                style={{
                    position: 'fixed',
                    top: '1rem',
                    left: '1rem',
                    zIndex: 1000,
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '1.5rem',
                    boxShadow: 'var(--shadow-md)',
                    display: 'none',
                }}
                className="hamburger-btn"
                aria-label="Toggle menu"
            >
                ☰
            </button>

            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <main className="dashboard-main">
                {children}
            </main>

            <style jsx global>{`
                @media (max-width: 768px) {
                    .hamburger-btn {
                        display: block !important;
                    }
                    .sidebar {
                        position: fixed;
                        top: 0;
                        left: 0;
                        height: 100vh;
                    }
                    .dashboard-main {
                        margin-left: 0 !important;
                    }
                }
            `}</style>
        </div>
    )
}
