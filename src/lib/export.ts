/**
 * Client-side CSV export helpers.
 *
 * CSV is RFC 4180 quoted: each field is wrapped in double quotes, and
 * embedded double quotes are doubled. UTF-8 BOM prepended so Excel opens
 * Vietnamese diacritics correctly.
 */

export interface BehaviorExportRow {
  timestamp: number
  userName: string
  behavior: string
  type: string
}

function csvField(v: unknown): string {
  const s = v == null ? '' : String(v)
  return `"${s.replace(/"/g, '""')}"`
}

function csvRow(values: unknown[]): string {
  return values.map(csvField).join(',')
}

export function buildBehaviorCSV(
  meetingTitle: string,
  rows: BehaviorExportRow[]
): string {
  const header = csvRow(['Thời gian', 'Học sinh', 'Hành vi', 'Loại'])
  const lines = rows.map((r) =>
    csvRow([
      new Date(r.timestamp).toLocaleString('vi-VN'),
      r.userName,
      r.behavior,
      r.type,
    ])
  )
  const meta = `# ${meetingTitle} — xuất ${new Date().toLocaleString('vi-VN')}`
  return '﻿' + meta + '\n' + header + '\n' + lines.join('\n') + '\n'
}

export function downloadCSV(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  // Defer revoke so the browser has time to start the download.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
