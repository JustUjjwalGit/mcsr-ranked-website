'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Download, ExternalLink, Info } from 'lucide-react'
import { toPng } from 'html-to-image'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
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

const chartColors = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--info)',
]

type TooltipEntry<T> = {
  payload?: T
  value?: number | string
  name?: string
  color?: string
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduced(query.matches)
    sync()
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [])
  return reduced
}

function countryFlag(country: string | null) {
  if (!country || !/^[A-Z]{2}$/.test(country)) return null
  return country
    .split('')
    .map((letter) => String.fromCodePoint(127397 + letter.charCodeAt(0)))
    .join('')
}

function ChartTooltipShell({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-64 rounded-md border border-border bg-[var(--chart-tooltip)] p-3 text-xs text-foreground shadow-xl">
      {children}
    </div>
  )
}

function StatBadge({
  label,
  value,
  tone = 'default',
  title,
}: {
  label: string
  value: string | number
  tone?: 'default' | 'good' | 'bad' | 'warning' | 'primary'
  title?: string
}) {
  const valueClass = {
    default: 'text-foreground',
    good: 'text-success',
    bad: 'text-danger',
    warning: 'text-warning',
    primary: 'text-primary',
  }[tone]

  return (
    <div
      title={title}
      className="min-w-0 rounded-md border border-border bg-[var(--neutral-performance-bg)] px-3 py-2"
    >
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <span>{label}</span>
        {title ? <Info className="h-3 w-3" aria-hidden="true" /> : null}
      </div>
      <p className={cn('mt-1 truncate font-mono text-sm font-semibold tabular-nums', valueClass)}>
        {value}
      </p>
    </div>
  )
}

function ChartCard({
  title,
  sample,
  action,
  children,
}: {
  title: string
  sample: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <Card className="min-w-0 rounded-lg border-border bg-card/95 p-4" data-stat-card>
      <div className="mb-3 flex min-h-12 items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-mono text-sm font-semibold uppercase text-primary">{title}</h3>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{sample}</p>
        </div>
        {action}
      </div>
      {children}
    </Card>
  )
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-64 items-center justify-center rounded-md border border-dashed border-border bg-[var(--neutral-performance-bg)] p-6 text-center text-sm text-muted-foreground">
      {message}
    </div>
  )
}

function PlayerOverview({ dashboard }: { dashboard: PlayerDashboard }) {
  const { overview } = dashboard
  const flag = countryFlag(overview.country)

  return (
    <Card className="rounded-lg border-primary/35 bg-card/95 p-4 shadow-[0_0_44px_color-mix(in_srgb,var(--primary),transparent_92%)] sm:p-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(460px,1fr)] lg:items-center">
        <div className="flex min-w-0 items-start gap-4">
          <UserAvatar
            uuid={overview.uuid}
            username={overview.username}
            size={88}
            className="h-[88px] w-[88px] shrink-0 rounded-md border border-primary/45"
            priority
          />
          <div className="min-w-0 pt-0.5">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h2 className="break-words text-2xl font-bold leading-7 text-foreground">
                {overview.username}
              </h2>
              <span className="h-6 rounded border border-primary/35 bg-primary/10 px-2 font-mono text-[11px] leading-6 text-primary">
                ID {overview.playerId.slice(0, 8)}
              </span>
              {overview.country ? (
                <span className="h-6 rounded border border-border bg-background/55 px-2 font-mono text-[11px] leading-6 text-muted-foreground">
                  {flag ? `${flag} ` : ''}{overview.country}
                </span>
              ) : null}
            </div>
            <p className="mt-1.5 text-sm leading-5 text-muted-foreground">
              {overview.socials.length > 0
                ? overview.socials.map((social) => `${social.service}: ${social.name}`).join(' · ')
                : 'No socials connected'}
            </p>
            <p className="mt-1 font-mono text-xs leading-5 text-muted-foreground">
              Last played {formatRelativeTime(overview.lastRanked)} · Rank #{overview.rank ?? '—'} · {dashboard.skillBand}
            </p>
            <div className="mt-2.5 grid max-w-xs grid-cols-3 gap-1.5" aria-label="Loaded match record">
              <div className="rounded border border-success/25 bg-[var(--positive-performance-bg)] px-2 py-1.5 text-center font-mono text-sm font-bold text-success">
                {overview.wins}W
              </div>
              <div className="rounded border border-danger/25 bg-[var(--negative-performance-bg)] px-2 py-1.5 text-center font-mono text-sm font-bold text-danger">
                {overview.losses}L
              </div>
              <div className="rounded border border-warning/25 bg-[var(--neutral-performance-bg)] px-2 py-1.5 text-center font-mono text-sm font-bold text-warning">
                {overview.draws}D
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {overview.socials.length > 0 ? (
            <div className="hidden flex-wrap gap-2 lg:flex">
              {overview.socials.map((social) =>
                social.url ? (
                  <a
                    key={`${social.service}-${social.name}`}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded border border-border bg-background/45 px-2 py-1 text-xs text-muted-foreground transition hover:border-primary hover:text-foreground"
                  >
                    {social.service}: {social.name}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : null,
              )}
            </div>
          ) : null}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatBadge label="Current Elo" value={overview.elo?.toLocaleString() ?? '—'} tone="primary" />
            <StatBadge label="Tier" value={overview.tier} tone="primary" />
            <StatBadge label="PB" value={formatDuration(overview.pb)} tone="good" />
            <StatBadge label="Avg completion" value={formatDuration(overview.averageCompletion)} />
            <StatBadge label="Win rate" value={formatPercent(overview.winRate)} tone={(overview.winRate ?? 0) >= 0.55 ? 'good' : 'default'} title="Wins divided by decided matches in the loaded sample." />
            <StatBadge label="Forfeit rate" value={formatPercent(overview.forfeitRate)} tone={(overview.forfeitRate ?? 0) >= 0.25 ? 'bad' : 'default'} title="Forfeits divided by all matches in the loaded sample." />
            <StatBadge label="Rank" value={overview.rank ? `#${overview.rank}` : '—'} />
            <StatBadge label="Sample" value={`${dashboard.loadedMatches} matches`} />
          </div>
        </div>
      </div>
    </Card>
  )
}

function EloTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: readonly TooltipEntry<PlayerDashboard['eloHistory'][number]>[]
}) {
  const point = payload?.[0]?.payload
  if (!active || !point) return null
  return (
    <ChartTooltipShell>
      <p className="font-semibold">{formatDate(point.date)} · Match #{point.matchId}</p>
      <p className="mt-1 font-mono text-primary">{point.elo?.toLocaleString()} Elo</p>
      <p className="mt-1 text-muted-foreground">
        {point.result ?? 'Unknown result'} vs {point.opponent ?? 'Unknown'}
        {point.change != null ? ` · ${point.change > 0 ? '+' : ''}${point.change}` : ''}
      </p>
    </ChartTooltipShell>
  )
}

function EloHistoryCard({ points }: { points: PlayerDashboard['eloHistory'] }) {
  const [mode, setMode] = useState<'line' | 'area'>('line')
  const reducedMotion = useReducedMotion()
  const numericPoints = points.filter((point) => point.elo != null)
  const chartProps = {
    data: numericPoints,
    margin: { top: 12, right: 12, left: 0, bottom: 8 },
  }
  const controls = (
    <div className="flex rounded-md border border-border bg-background/50 p-0.5" aria-label="Elo chart type">
      {(['line', 'area'] as const).map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => setMode(item)}
          aria-pressed={mode === item}
          className={cn(
            'h-7 rounded px-2 text-xs capitalize transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            mode === item ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-[var(--hover)]',
          )}
        >
          {item}
        </button>
      ))}
    </div>
  )
  if (numericPoints.length === 0) {
    return (
      <ChartCard title="Elo History" sample="0 Elo records" action={controls}>
        <EmptyChart message="No recorded Elo values were available in the loaded matches." />
      </ChartCard>
    )
  }
  const common = (
    <>
      <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 4" vertical={false} />
      <XAxis
        dataKey="date"
        tickFormatter={(value: number) => formatDate(value)}
        stroke="var(--chart-axis)"
        tick={{ fontSize: 11 }}
        minTickGap={36}
      />
      <YAxis
        domain={['dataMin - 20', 'dataMax + 20']}
        stroke="var(--chart-axis)"
        tick={{ fontSize: 11 }}
        width={44}
      />
      <Tooltip content={<EloTooltip />} cursor={{ stroke: 'var(--chart-grid)' }} />
    </>
  )
  const seriesProps = {
    dataKey: 'elo',
    stroke: 'var(--chart-1)',
    strokeWidth: 2.5,
    isAnimationActive: !reducedMotion,
    animationDuration: 700,
    dot: { r: numericPoints.length === 1 ? 5 : 3, fill: 'var(--chart-1)', strokeWidth: 0 },
    activeDot: { r: 6, fill: 'var(--chart-1)', stroke: 'var(--card)', strokeWidth: 2 },
  }
  return (
    <ChartCard title="Elo History" sample={`${numericPoints.length} Elo records`} action={controls}>
      <div className="h-64 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          {mode === 'line' ? (
            <LineChart {...chartProps}>
              {common}
              <Line type="linear" {...seriesProps} connectNulls={false} />
            </LineChart>
          ) : (
            <AreaChart {...chartProps}>
              <defs>
                <linearGradient id="elo-area-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.42} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              {common}
              <Area type="linear" {...seriesProps} fill="url(#elo-area-gradient)" connectNulls={false} />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}

function RadarTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: readonly TooltipEntry<PlayerDashboard['splitPerformance'][number]>[]
}) {
  const row = payload?.[0]?.payload
  if (!active || !row) return null
  const difference =
    row.average != null && row.benchmark != null ? row.average - row.benchmark : null
  return (
    <ChartTooltipShell>
      <p className="font-semibold">{row.label}</p>
      <p className="mt-1 font-mono text-primary">{row.score ?? '—'} performance score</p>
      <p className="mt-1 text-muted-foreground">Average {formatDuration(row.average)}</p>
      <p className="text-muted-foreground">Benchmark difference {formatSignedDuration(difference)}</p>
      <p className="text-muted-foreground">{row.samples} usable {row.samples === 1 ? 'match' : 'matches'}</p>
    </ChartTooltipShell>
  )
}

function SplitPerformanceRadar({ rows }: { rows: PlayerDashboard['splitPerformance'] }) {
  const reducedMotion = useReducedMotion()
  const values = rows.filter((row) => row.score != null)
  if (values.length < 3) {
    return <EmptyChart message="At least three segments with valid player and benchmark averages are required." />
  }
  return (
    <div className="h-64 min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={values} outerRadius="68%">
          <PolarGrid stroke="var(--chart-grid)" />
          <PolarAngleAxis
            dataKey="label"
            tick={{ fill: 'var(--chart-axis)', fontSize: 10 }}
            tickFormatter={(value: string) => value.replace('Enter ', '')}
          />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <Tooltip content={<RadarTooltip />} />
          <Radar
            dataKey="score"
            stroke="var(--chart-1)"
            fill="var(--chart-1)"
            fillOpacity={0.23}
            isAnimationActive={!reducedMotion}
            animationDuration={650}
            dot={{ r: 3, fill: 'var(--chart-1)' }}
            activeDot={{ r: 6, fill: 'var(--chart-1)' }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

function PieTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: readonly TooltipEntry<PlayerDashboard['deathsBySplit']['slices'][number]>[]
}) {
  const slice = payload?.[0]?.payload
  if (!active || !slice) return null
  return (
    <ChartTooltipShell>
      <p className="font-semibold">{slice.label}</p>
      <p className="mt-1 font-mono text-primary">{slice.count} endings · {formatPercent(slice.percent)}</p>
      <p className="mt-1 text-muted-foreground">Of the classified ending sample</p>
    </ChartTooltipShell>
  )
}

function DonutChart({ data }: { data: PlayerDashboard['deathsBySplit'] }) {
  const reducedMotion = useReducedMotion()
  if (data.total === 0) {
    return <EmptyChart message="No failed endings could be classified from real timeline events." />
  }
  return (
    <div className="h-64 min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data.slices}
            dataKey="count"
            nameKey="label"
            innerRadius="46%"
            outerRadius="72%"
            paddingAngle={2}
            stroke="var(--card)"
            strokeWidth={2}
            isAnimationActive={!reducedMotion}
            animationDuration={650}
            activeShape={{ stroke: 'var(--foreground)', strokeWidth: 2 }}
          >
            {data.slices.map((slice, index) => (
              <Cell key={slice.key} fill={chartColors[index % chartColors.length]} />
            ))}
          </Pie>
          <Tooltip content={<PieTooltip />} />
          <Legend
            iconType="square"
            wrapperStyle={{ fontSize: 11, color: 'var(--chart-axis)' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

function DataTable({
  headers,
  rows,
}: {
  headers: Array<{ label: string; align?: 'left' | 'right'; width: string }>
  rows: Array<{ key: string; cells: Array<{ label: string; value: ReactNode; className?: string }> }>
}) {
  return (
    <>
      <table className="hidden w-full table-fixed text-[13px] sm:table">
        <thead className="border-y border-border bg-[var(--table-header)] font-mono text-[11px] uppercase text-muted-foreground">
          <tr>
            {headers.map((header) => (
              <th key={header.label} className={cn('px-2 py-2.5 font-medium', header.align === 'right' ? 'text-right' : 'text-left')} style={{ width: header.width }}>
                {header.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-b border-border/70 transition hover:bg-[var(--table-row-hover)]">
              {row.cells.map((cell) => (
                <td key={cell.label} className={cn('break-words px-2 py-2.5 leading-5', cell.className)}>
                  {cell.value}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="grid gap-2 sm:hidden">
        {rows.map((row) => (
          <div key={row.key} className="grid grid-cols-2 gap-x-3 gap-y-1 rounded-md border border-border bg-[var(--neutral-performance-bg)] p-3">
            {row.cells.map((cell) => (
              <div key={cell.label} className={cell.label === headers[0]?.label ? 'col-span-2 border-b border-border pb-2 font-semibold' : ''}>
                <span className="block text-[10px] uppercase text-muted-foreground">{cell.label}</span>
                <span className={cn('mt-0.5 block text-sm', cell.className)}>{cell.value}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  )
}

function SplitTimesTable({ data }: { data: PlayerDashboard['splitTimes'] }) {
  return (
    <DataTable
      headers={[
        { label: 'Segment', width: '32%' },
        { label: 'Average', align: 'right', width: '23%' },
        { label: 'Best', align: 'right', width: '20%' },
        { label: 'Difference', align: 'right', width: '25%' },
      ]}
      rows={data.rows.map((row) => ({
        key: row.key,
        cells: [
          { label: 'Segment', value: row.label, className: 'font-medium text-foreground' },
          { label: 'Average', value: formatDuration(row.average), className: 'text-right font-mono tabular-nums text-muted-foreground' },
          { label: 'Best', value: formatDuration(row.best), className: 'text-right font-mono tabular-nums text-success' },
          {
            label: 'Difference',
            value: formatSignedDuration(row.averageDifference),
            className: cn(
              'text-right font-mono tabular-nums',
              row.averageDifference == null ? 'text-muted-foreground' : row.averageDifference <= 0 ? 'text-success' : 'text-danger',
            ),
          },
        ],
      }))}
    />
  )
}

function SeedTypesTable({ rows }: { rows: PlayerDashboard['seedTypes'] }) {
  if (rows.length === 0) return <EmptyChart message="No seed-type data was available." />
  return (
    <DataTable
      headers={[
        { label: 'Seed type', width: '34%' },
        { label: 'Average', align: 'right', width: '27%' },
        { label: 'Matches', align: 'right', width: '17%' },
        { label: 'Win rate', align: 'right', width: '22%' },
      ]}
      rows={rows.map((row) => ({
        key: row.seedType,
        cells: [
          { label: 'Seed type', value: row.seedType, className: 'font-medium text-foreground' },
          { label: 'Average', value: formatDuration(row.averageCompletion), className: 'text-right font-mono tabular-nums text-muted-foreground' },
          { label: 'Matches', value: row.matches, className: 'text-right font-mono tabular-nums text-foreground' },
          { label: 'Win rate', value: formatPercent(row.winRate), className: cn('text-right font-mono tabular-nums', row.matches < 3 ? 'text-muted-foreground' : (row.winRate ?? 0) >= 0.55 ? 'text-success' : (row.winRate ?? 0) < 0.4 ? 'text-danger' : 'text-warning') },
        ],
      }))}
    />
  )
}

function BastionTypesTable({ rows }: { rows: PlayerDashboard['bastionTypes'] }) {
  if (rows.length === 0) return <EmptyChart message="No bastion-type data was available in detailed matches." />
  return (
    <DataTable
      headers={[
        { label: 'Bastion', width: '32%' },
        { label: 'Matches', align: 'right', width: '18%' },
        { label: 'Win rate', align: 'right', width: '22%' },
        { label: 'Average split', align: 'right', width: '28%' },
      ]}
      rows={rows.map((row) => ({
        key: row.bastionType,
        cells: [
          { label: 'Bastion', value: row.bastionType, className: 'font-medium text-foreground' },
          { label: 'Matches', value: row.matches, className: 'text-right font-mono tabular-nums text-foreground' },
          { label: 'Win rate', value: formatPercent(row.winRate), className: cn('text-right font-mono tabular-nums', row.matches < 3 ? 'text-muted-foreground' : (row.winRate ?? 0) >= 0.55 ? 'text-success' : (row.winRate ?? 0) < 0.4 ? 'text-danger' : 'text-warning') },
          { label: 'Average split', value: formatDuration(row.averageSplit), className: 'text-right font-mono tabular-nums text-muted-foreground' },
        ],
      }))}
    />
  )
}

export function StatsDashboard({ dashboard }: { dashboard: PlayerDashboard }) {
  const ref = useRef<HTMLDivElement>(null)
  const [exportState, setExportState] = useState<'idle' | 'working' | 'error'>('idle')
  const fileName = useMemo(
    () => `${dashboard.overview.username.toLowerCase()}-mcsr-stats.png`,
    [dashboard.overview.username],
  )
  const splitSamples = dashboard.splitTimes.rows.reduce((sum, row) => sum + row.samples, 0)
  const seedSamples = dashboard.seedTypes.reduce((sum, row) => sum + row.matches, 0)
  const bastionSamples = dashboard.bastionTypes.reduce((sum, row) => sum + row.matches, 0)

  async function exportDashboard() {
    if (!ref.current) return
    try {
      setExportState('working')
      const rootStyles = getComputedStyle(ref.current)
      const background = rootStyles.getPropertyValue('--background').trim() || '#070b0d'
      const dataUrl = await toPng(ref.current, {
        cacheBust: true,
        pixelRatio: Math.min(window.devicePixelRatio || 2, 3),
        backgroundColor: background,
        width: ref.current.scrollWidth,
        height: ref.current.scrollHeight,
        style: { transform: 'none', background },
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-mono text-sm uppercase text-muted-foreground">
          Loaded {dashboard.loadedMatches} ranked matches
        </p>
        <Button type="button" variant="outline" onClick={exportDashboard} disabled={exportState === 'working'} className="h-9 w-full sm:w-auto">
          <Download className="h-4 w-4" />
          {exportState === 'working' ? 'Exporting...' : 'Export stats card as image'}
        </Button>
      </div>
      {exportState === 'error' ? (
        <div className="rounded-md border border-danger/40 bg-[var(--negative-performance-bg)] p-3 text-sm text-danger">
          Export failed. Wait for player images to load, then try again.
        </div>
      ) : null}

      <div ref={ref} className="space-y-4 bg-background text-foreground" data-export-root>
        <PlayerOverview dashboard={dashboard} />
        <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <EloHistoryCard points={dashboard.eloHistory} />
          <ChartCard title="Segment Performance" sample={`${splitSamples} valid segment records across ${dashboard.splitTimes.completedMatches} completed matches`}>
            <SplitPerformanceRadar rows={dashboard.splitPerformance} />
          </ChartCard>
          <ChartCard title="Run Endings" sample={`${dashboard.deathsBySplit.total} classified run endings`}>
            <DonutChart data={dashboard.deathsBySplit} />
          </ChartCard>
        </div>
        <div className="grid min-w-0 items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
          <ChartCard title="Segment Times" sample={`${splitSamples} valid segments · ${dashboard.benchmarkLabel}`}>
            <SplitTimesTable data={dashboard.splitTimes} />
          </ChartCard>
          <ChartCard title="Seed Types" sample={`${seedSamples} loaded matches grouped by recorded seed type`}>
            <SeedTypesTable rows={dashboard.seedTypes} />
          </ChartCard>
          <ChartCard title="Bastion Types" sample={`${bastionSamples} detailed matches with recorded bastions`}>
            <BastionTypesTable rows={dashboard.bastionTypes} />
          </ChartCard>
        </div>
        <Card className="rounded-lg border-border bg-card/95 p-4 sm:p-5">
          <h3 className="font-mono text-sm font-semibold uppercase text-primary">Human Summary (0% AI)</h3>
          <p className="mt-1 text-xs text-muted-foreground">{dashboard.loadedMatches}-match sample</p>
          <p className="mt-3 max-w-5xl text-sm leading-6 text-foreground">{dashboard.humanSummary}</p>
        </Card>
        {dashboard.dataQuality.length > 0 ? (
          <div className="rounded-md border border-border bg-card/85 p-3 text-xs leading-5 text-muted-foreground">
            {dashboard.dataQuality.join(' ')}
          </div>
        ) : null}
      </div>
    </section>
  )
}
