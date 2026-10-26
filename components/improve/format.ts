export function formatDuration(ms: number | null | undefined) {
  if (ms == null || ms <= 0 || Number.isNaN(ms)) return '—'

  const totalSeconds = ms / 1000
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const secondsText = seconds.toFixed(1).padStart(4, '0')

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secondsText}`
  }

  return `${minutes}:${secondsText}`
}

export function formatSignedDuration(ms: number | null | undefined) {
  if (ms == null || Number.isNaN(ms)) return '—'
  const prefix = ms > 0 ? '+' : ms < 0 ? '-' : ''
  return `${prefix}${formatDuration(Math.abs(ms))}`
}

export function formatPercent(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return '—'
  return `${(value * 100).toFixed(1)}%`
}

export function formatRelativeTime(timestamp: number | null | undefined) {
  if (!timestamp) return 'Unknown'

  const deltaSeconds = Math.max(0, Math.floor(Date.now() / 1000) - timestamp)
  const units = [
    { label: 'year', seconds: 31_536_000 },
    { label: 'month', seconds: 2_592_000 },
    { label: 'day', seconds: 86_400 },
    { label: 'hour', seconds: 3_600 },
    { label: 'minute', seconds: 60 },
  ]

  for (const unit of units) {
    const value = Math.floor(deltaSeconds / unit.seconds)
    if (value >= 1) {
      return `${value} ${unit.label}${value === 1 ? '' : 's'} ago`
    }
  }

  return 'Just now'
}

export function formatDate(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}
