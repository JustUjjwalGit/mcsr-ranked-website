'use client'

import { useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Download, ExternalLink, Info } from 'lucide-react'
import { toPng } from 'html-to-image'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { UserAvatar } from '@/components/user-avatar'
import { cn } from '@/lib/utils'
import {
  formatDate,
  formatDuration,
  formatPercent,
  formatRelativeTime,
  formatSignedDuration,
} from './format'
import type { PlayerDashboard } from './types'

const chartColors = ['#22d3ee', '#34d399', '#f59e0b', '#fb7185', '#a78bfa', '#60a5fa']

function countryFlag(country: string | null) {
  if (!country || !/^[A-Z]{2}$/.test(country)) return null

  return country
    .split('')
    .map((letter) => String.fromCodePoint(127397 + letter.charCodeAt(0)))
    .join('')
}

function StatBadge({
  label,
  value,
  tone = 'default',
  title,
}: {
  label: string
  value: string | number
  tone?: 'default' | 'good' | 'bad' | 'primary'
  title?: string
}) {
  const valueClass =
    tone === 'good'
      ? 'text-emerald-300'
      : tone === 'bad'
        ? 'text-rose-300'
        : tone === 'primary'
          ? 'text-cyan-300'
          : 'text-foreground'

  return (
    <div
      title={title}
      className="min-w-0 border border-white/10 bg-background/45 px-3 py-2"
    >
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <span>{label}</span>
        {title && <Info className="h-3 w-3" aria-hidden="true" />}
      </div>
      <p className={cn('mt-1 truncate font-mono text-sm font-semibold', valueClass)}>
        {value}
      </p>
    </div>
  )
}

function ChartCard({
  title,
  sample,
  children,
}: {
  title: string
  sample: string
  children: ReactNode
}) {
  return (
    <Card className="rounded-md border-border/90 bg-card/92 p-4" data-stat-card>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-mono text-sm uppercase text-cyan-300">{title}</h3>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{sample}</p>
        </div>
      </div>
      {children}
    </Card>
  )
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-56 items-center justify-center border border-dashed border-border bg-background/35 p-6 text-center text-sm text-muted-foreground">
      {message}
    </div>
  )
}

function PlayerOverview({ dashboard }: { dashboard: PlayerDashboard }) {
  const { overview } = dashboard
  const flag = countryFlag(overview.country)

  return (
    <Card className="rounded-md border-cyan-400/35 bg-card/95 p-4 shadow-[0_0_48px_rgba(34,211,238,0.09)] sm:p-5">
      <div className="grid gap-5 lg:grid-cols-[auto_1fr]">
        <div className="flex items-center gap-4">
          <UserAvatar
            uuid={overview.uuid}
            username={overview.username}
            size={86}
            className="h-20 w-20 rounded-md border-cyan-400/45 sm:h-[86px] sm:w-[86px]"
            priority
          />
          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h2 className="break-words text-2xl font-bold leading-tight text-foreground sm:text-3xl">
                {overview.username}
              </h2>
              <span className="h-6 rounded border border-primary/30 bg-primary/10 px-2 py-1 font-mono text-[11px] leading-none text-primary">
                ID {overview.playerId.slice(0, 8)}
              </span>
              {overview.country && (
                <span className="h-6 rounded border border-white/10 bg-background/60 px-2 py-1 font-mono text-[11px] leading-none text-muted-foreground">
                  {flag ? `${flag} ` : ''}
                  {overview.country}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">
              {overview.socials.length > 0
                ? overview.socials
                    .map((social) => `${social.service}: ${social.name}`)
                    .join(' · ')
                : 'No socials connected'}
            </p>
            <p className="mt-1 font-mono text-xs leading-5 text-muted-foreground">
              Last played {formatRelativeTime(overview.lastRanked)} · Rank #
              {overview.rank ?? '—'}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="hidden flex-wrap gap-2 lg:flex">
            {overview.socials.length > 0 ? (
              overview.socials.map((social) =>
                social.url ? (
                  <a
                    key={`${social.service}-${social.name}`}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 border border-white/10 bg-background/50 px-2 py-1 text-xs text-muted-foreground hover:border-primary hover:text-foreground"
                  >
                    {social.service}: {social.name}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span
                    key={`${social.service}-${social.name}`}
                    className="border border-white/10 bg-background/50 px-2 py-1 text-xs text-muted-foreground"
                  >
                    {social.service}: {social.name}
                  </span>
                ),
              )
            ) : (
              <span className="border border-white/10 bg-background/50 px-2 py-1 text-xs text-muted-foreground">
                No socials connected
              </span>
            )}
          </div>

          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <StatBadge label="Current Elo" value={overview.elo?.toLocaleString() ?? '—'} tone="primary" />
            <StatBadge label="Tier" value={overview.tier} tone="primary" />
            <StatBadge label="Wins" value={overview.wins} tone="good" />
            <StatBadge label="Losses" value={overview.losses} tone="bad" />
            {overview.draws > 0 && <StatBadge label="Draws" value={overview.draws} />}
            <StatBadge label="PB" value={formatDuration(overview.pb)} tone="good" />
            <StatBadge label="Avg completion" value={formatDuration(overview.averageCompletion)} />
            <StatBadge label="Win rate" value={formatPercent(overview.winRate)} tone="good" title="Wins divided by decided ranked matches in the profile statistics." />
            <StatBadge label="Forfeit rate" value={formatPercent(overview.forfeitRate)} tone="bad" title="Forfeits divided by ranked matches in the profile statistics." />
          </div>
        </div>
      </div>
    </Card>
  )
}

function EloHistoryChart({ points }: { points: PlayerDashboard['eloHistory'] }) {
  const numericPoints = points.filter((point) => point.elo != null)
  if (numericPoints.length === 0) {
    return <EmptyChart message="No recorded Elo changes were available in the loaded matches." />
  }

  const width = 720
  const height = 260
  const padding = { top: 24, right: 22, bottom: 42, left: 54 }
  const values = numericPoints.map((point) => point.elo ?? 0)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const spread = Math.max(max - min, 20)
  const yMin = min - spread * 0.15
  const yMax = max + spread * 0.15
  const xStep =
    numericPoints.length > 1
      ? (width - padding.left - padding.right) / (numericPoints.length - 1)
      : 0
  const plotHeight = height - padding.top - padding.bottom

  const coordinates = numericPoints.map((point, index) => {
    const x =
      numericPoints.length === 1
        ? width / 2
        : padding.left + index * xStep
    const y =
      padding.top +
      ((yMax - (point.elo ?? yMin)) / (yMax - yMin || 1)) * plotHeight

    return { ...point, x, y }
  })
  const path = coordinates
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ')

  return (
    <svg
      role="img"
      aria-label="Elo progression over loaded matches"
      viewBox={`0 0 ${width} ${height}`}
      className="h-64 w-full overflow-visible"
      preserveAspectRatio="none"
    >
      {[0, 0.5, 1].map((tick) => {
        const y = padding.top + tick * plotHeight
        const elo = Math.round(yMax - tick * (yMax - yMin))
        return (
          <g key={tick}>
            <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="rgba(255,255,255,0.1)" />
            <text x={padding.left - 10} y={y + 4} textAnchor="end" className="fill-muted-foreground text-[11px]">
              {elo}
            </text>
          </g>
        )
      })}
      <path
        d={path}
        fill="none"
        stroke="var(--primary)"
        strokeWidth="3"
        vectorEffect="non-scaling-stroke"
        className="dashboard-line"
        pathLength={1}
      />
      {coordinates.map((point, index) => (
        <g key={point.matchId}>
          <circle
            cx={point.x}
            cy={point.y}
            r={numericPoints.length === 1 ? 5 : 3.5}
            fill="var(--primary)"
            className="chart-point"
            tabIndex={0}
          >
            <title>
              {formatDate(point.date)} vs {point.opponent ?? 'Unknown'}: {point.elo} Elo
              {point.change != null ? ` (${point.change > 0 ? '+' : ''}${point.change})` : ''}
            </title>
          </circle>
          {(index === 0 || index === coordinates.length - 1) && (
            <text x={point.x} y={height - 16} textAnchor={index === 0 ? 'start' : 'end'} className="fill-muted-foreground text-[11px]">
              {formatDate(point.date)}
            </text>
          )}
        </g>
      ))}
    </svg>
  )
}

function SplitPerformanceRadar({ rows }: { rows: PlayerDashboard['splitPerformance'] }) {
  const values = rows.filter((row) => row.score != null)
  if (values.length < 3) {
    return <EmptyChart message="At least three splits with valid averages are needed for the radar chart." />
  }

  const size = 280
  const center = size / 2
  const radius = 94
  const angleStep = (Math.PI * 2) / rows.length
  const pointFor = (index: number, score: number) => {
    const angle = -Math.PI / 2 + index * angleStep
    const distance = radius * (score / 100)
    return {
      x: center + Math.cos(angle) * distance,
      y: center + Math.sin(angle) * distance,
    }
  }
  const polygon = rows
    .map((row, index) => pointFor(index, row.score ?? 0))
    .map((point) => `${point.x},${point.y}`)
    .join(' ')

  return (
    <svg role="img" aria-label="Split performance radar" viewBox={`0 0 ${size} ${size}`} className="mx-auto h-72 w-full max-w-md">
      {[0.33, 0.66, 1].map((scale) => (
        <polygon
          key={scale}
          points={rows.map((_, index) => {
            const point = pointFor(index, scale * 100)
            return `${point.x},${point.y}`
          }).join(' ')}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
        />
      ))}
      {rows.map((row, index) => {
        const edge = pointFor(index, 100)
        const label = pointFor(index, 123)
        return (
          <g key={row.key}>
            <line x1={center} y1={center} x2={edge.x} y2={edge.y} stroke="rgba(255,255,255,0.12)" />
            <text x={label.x} y={label.y} textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground text-[10px] sm:text-[11px]">
              {row.label.replace('Enter ', '')}
            </text>
          </g>
        )
      })}
      <polygon
        points={polygon}
        fill="rgba(34,211,238,0.22)"
        stroke="var(--primary)"
        strokeWidth="2"
        className="radar-area"
      >
        <title>Higher scores mean faster average splits compared with the benchmark.</title>
      </polygon>
      {rows.map((row, index) => {
        const point = pointFor(index, row.score ?? 0)
        return (
          <circle
            key={row.key}
            cx={point.x}
            cy={point.y}
            r="3.5"
            fill="#67e8f9"
            className="chart-point"
            tabIndex={0}
          >
            <title>
              {row.label}: {formatDuration(row.average)} average, {row.samples} sample{row.samples === 1 ? '' : 's'}
            </title>
          </circle>
        )
      })}
    </svg>
  )
}

function DonutChart({ data }: { data: PlayerDashboard['deathsBySplit'] }) {
  if (data.total === 0) {
    return <EmptyChart message="No classified failed endings were found in the detailed match sample." />
  }

  let cumulative = 0
  const radius = 72
  const center = 100
  const circumference = 2 * Math.PI * radius

  return (
    <div className="grid gap-4 sm:grid-cols-[220px_1fr] sm:items-center">
      <svg role="img" aria-label="Failed endings by split" viewBox="0 0 200 200" className="mx-auto h-52 w-52 -rotate-90">
        <circle cx={center} cy={center} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="26" />
        {data.slices.map((slice, index) => {
          const dash = slice.percent * circumference
          const segment = (
            <circle
              key={slice.key}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={chartColors[index % chartColors.length]}
              strokeWidth="26"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-cumulative}
              className="donut-segment"
              tabIndex={0}
            >
              <title>
                {slice.label}: {slice.count} ({formatPercent(slice.percent)})
              </title>
            </circle>
          )
          cumulative += dash
          return segment
        })}
      </svg>
      <div className="space-y-2">
        {data.slices.map((slice, index) => (
          <div key={slice.key} className="flex items-center justify-between gap-3 text-sm">
            <span className="inline-flex items-center gap-2 text-muted-foreground">
              <span className="h-2.5 w-2.5" style={{ backgroundColor: chartColors[index % chartColors.length] }} />
              {slice.label}
            </span>
            <span className="font-mono text-foreground">
              {slice.count} · {formatPercent(slice.percent)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SplitTimesTable({ data }: { data: PlayerDashboard['splitTimes'] }) {
  return (
    <div className="min-w-0">
      <p className="mb-3 text-xs text-muted-foreground">
        Completed matches used: {data.completedMatches}
      </p>
      <table className="w-full table-fixed text-[13px] sm:text-sm">
        <thead className="border-b border-border bg-muted/25 font-mono text-xs uppercase text-muted-foreground">
          <tr>
            <th className="w-[34%] px-2 py-3 text-left font-medium">Split</th>
            <th className="w-[22%] px-2 py-3 text-right font-medium">Average</th>
            <th className="w-[20%] px-2 py-3 text-right font-medium">Best</th>
            <th className="w-[24%] px-2 py-3 text-right font-medium">Diff</th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row) => (
            <tr key={row.key} className="border-b border-border/70">
              <td className="break-words px-2 py-3 font-medium leading-5 text-foreground">{row.label}</td>
              <td className="px-2 py-3 text-right font-mono tabular-nums text-muted-foreground">{formatDuration(row.average)}</td>
              <td className="px-2 py-3 text-right font-mono tabular-nums text-emerald-300">{formatDuration(row.best)}</td>
              <td className={cn('px-2 py-3 text-right font-mono tabular-nums', (row.averageDifference ?? 0) <= 0 ? 'text-emerald-300' : 'text-rose-300')}>
                {formatSignedDuration(row.averageDifference)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SeedTypesTable({ rows }: { rows: PlayerDashboard['seedTypes'] }) {
  if (rows.length === 0) return <EmptyChart message="No seed-type data was available." />

  return (
    <div className="min-w-0">
      <table className="w-full table-fixed text-[13px] sm:text-sm">
        <thead className="border-b border-border bg-muted/25 font-mono text-xs uppercase text-muted-foreground">
          <tr>
            <th className="w-[34%] px-2 py-3 text-left font-medium">Seed Type</th>
            <th className="w-[27%] px-2 py-3 text-right font-medium">Avg</th>
            <th className="w-[18%] px-2 py-3 text-right font-medium">Matches</th>
            <th className="w-[21%] px-2 py-3 text-right font-medium">Win Rate</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.seedType} className="border-b border-border/70">
              <td className="break-words px-2 py-3 font-medium leading-5 text-foreground">{row.seedType}</td>
              <td className="px-2 py-3 text-right font-mono tabular-nums text-muted-foreground">{formatDuration(row.averageCompletion)}</td>
              <td className="px-2 py-3 text-right font-mono tabular-nums text-foreground">{row.matches}</td>
              <td className="px-2 py-3 text-right font-mono tabular-nums text-cyan-300">{formatPercent(row.winRate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function BastionTypesTable({ rows }: { rows: PlayerDashboard['bastionTypes'] }) {
  if (rows.length === 0) return <EmptyChart message="No bastion-type data was available in detailed matches." />

  return (
    <div className="min-w-0">
      <table className="w-full table-fixed text-[13px] sm:text-sm">
        <thead className="border-b border-border bg-muted/25 font-mono text-xs uppercase text-muted-foreground">
          <tr>
            <th className="w-[34%] px-2 py-3 text-left font-medium">Bastion</th>
            <th className="w-[18%] px-2 py-3 text-right font-medium">Matches</th>
            <th className="w-[21%] px-2 py-3 text-right font-medium">Win Rate</th>
            <th className="w-[27%] px-2 py-3 text-right font-medium">Avg Split</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.bastionType} className="border-b border-border/70">
              <td className="break-words px-2 py-3 font-medium leading-5 text-foreground">{row.bastionType}</td>
              <td className="px-2 py-3 text-right font-mono tabular-nums text-foreground">{row.matches}</td>
              <td className="px-2 py-3 text-right font-mono tabular-nums text-cyan-300">{formatPercent(row.winRate)}</td>
              <td className="px-2 py-3 text-right font-mono tabular-nums text-muted-foreground">{formatDuration(row.averageSplit)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function StatsDashboard({ dashboard }: { dashboard: PlayerDashboard }) {
  const ref = useRef<HTMLDivElement>(null)
  const [exportState, setExportState] = useState<'idle' | 'working' | 'error'>('idle')
  const fileName = useMemo(
    () => `${dashboard.overview.username.toLowerCase()}-mcsr-stats.png`,
    [dashboard.overview.username],
  )
  const splitDataSamples = dashboard.splitPerformance.filter(
    (row) => row.score != null,
  ).length
  const seedMatchSamples = dashboard.seedTypes.reduce(
    (sum, row) => sum + row.matches,
    0,
  )
  const bastionSamples = dashboard.bastionTypes.reduce(
    (sum, row) => sum + row.matches,
    0,
  )

  async function exportDashboard() {
    if (!ref.current) return

    try {
      setExportState('working')
      const pixelRatio = Math.min(window.devicePixelRatio || 2, 3)
      const dataUrl = await toPng(ref.current, {
        cacheBust: true,
        pixelRatio,
        backgroundColor: '#070b16',
        width: ref.current.scrollWidth,
        height: ref.current.scrollHeight,
        style: {
          transform: 'none',
          background: '#070b16',
        },
      })
      const link = document.createElement('a')
      link.download = fileName
      link.href = dataUrl
      link.click()
      setExportState('idle')
    } catch {
      setExportState('error')
    }
  }

  return (
    <section className="space-y-4">
      <style>{`
        .dashboard-line {
          stroke-dasharray: 1;
          stroke-dashoffset: 1;
          animation: dashboard-line-draw 700ms ease-out forwards;
        }
        .radar-area {
          transform-origin: center;
          animation: radar-grow 520ms ease-out forwards;
        }
        .donut-segment {
          transition: opacity 160ms ease, stroke-width 160ms ease;
          animation: donut-pop 520ms ease-out both;
        }
        .chart-point {
          transform-origin: center;
          opacity: 0;
          animation: point-pop 420ms ease-out 420ms forwards;
          transition: r 140ms ease, filter 140ms ease;
          outline: none;
        }
        .chart-point:hover,
        .chart-point:focus-visible {
          r: 6px;
          filter: drop-shadow(0 0 8px rgba(103, 232, 249, 0.7));
        }
        .donut-segment:hover,
        .donut-segment:focus-visible {
          opacity: 0.86;
          stroke-width: 31;
          outline: none;
        }
        @keyframes dashboard-line-draw {
          to { stroke-dashoffset: 0; }
        }
        @keyframes point-pop {
          from { opacity: 0; transform: scale(0.4); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes radar-grow {
          from { transform: scale(0.08); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes donut-pop {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .dashboard-line,
          .radar-area,
          .donut-segment,
          .chart-point {
            animation: none;
            opacity: 1;
            stroke-dashoffset: 0;
          }
        }
      `}</style>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-mono text-sm uppercase text-muted-foreground">
          Loaded {dashboard.loadedMatches} ranked matches
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={exportDashboard}
          disabled={exportState === 'working'}
          className="h-9 w-full sm:w-auto"
        >
          <Download className="h-4 w-4" />
          {exportState === 'working' ? 'Exporting...' : 'Export stats card as image'}
        </Button>
      </div>
      {exportState === 'error' && (
        <div className="border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
          Export failed. Try again after images finish loading.
        </div>
      )}

      <div
        ref={ref}
        className="space-y-4 bg-background p-0 text-foreground"
        data-export-root
      >
        <PlayerOverview dashboard={dashboard} />

        <div className="grid gap-4 xl:grid-cols-3">
          <ChartCard title="Elo Change" sample={`${dashboard.eloHistory.length} Elo records`}>
            <EloHistoryChart points={dashboard.eloHistory} />
          </ChartCard>
          <ChartCard title="Split Performances" sample={`Based on ${splitDataSamples} splits with usable averages from ${dashboard.splitTimes.completedMatches} completed matches`}>
            <SplitPerformanceRadar rows={dashboard.splitPerformance} />
          </ChartCard>
          <ChartCard title="Deaths by Split" sample={`${dashboard.deathsBySplit.total} classified run endings`}>
            <DonutChart data={dashboard.deathsBySplit} />
          </ChartCard>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <ChartCard title="Split Times" sample={`Based on ${dashboard.splitTimes.completedMatches} completed matches · ${dashboard.benchmarkLabel}`}>
            <SplitTimesTable data={dashboard.splitTimes} />
          </ChartCard>
          <ChartCard title="Seed Types" sample={`Based on ${seedMatchSamples} loaded matches`}>
            <SeedTypesTable rows={dashboard.seedTypes} />
          </ChartCard>
          <ChartCard title="Bastion Types" sample={`Based on ${bastionSamples} recorded bastions`}>
            <BastionTypesTable rows={dashboard.bastionTypes} />
          </ChartCard>
        </div>

        {dashboard.dataQuality.length > 0 && (
          <div className="border border-border bg-card/80 p-3 text-xs leading-5 text-muted-foreground">
            {dashboard.dataQuality.join(' ')}
          </div>
        )}
      </div>
    </section>
  )
}
