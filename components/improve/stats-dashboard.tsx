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
import { RankTier } from '@/components/rank-tier'
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
    <div className="max-w-72 rounded-lg border border-border bg-[var(--chart-tooltip)] p-3 text-[13px] leading-5 text-foreground shadow-2xl" data-chart-tooltip>
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
  value: ReactNode
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
      className="min-w-0 rounded-lg border border-border bg-[var(--secondary-surface)] px-3.5 py-3 shadow-[0_8px_20px_rgba(0,0,0,0.12)]"
    >
      <div className="flex items-center gap-1 text-[12px] leading-4 text-muted-foreground" data-stat-label={label}>
        <span>{label}</span>
        {title ? <Info className="h-3 w-3" aria-hidden="true" /> : null}
      </div>
      <div
        className={cn(
          'mt-1.5 min-w-0 whitespace-nowrap text-[clamp(24px,1.9vw,28px)] font-semibold leading-8 tracking-tight tabular-nums',
          valueClass,
        )}
        data-stat-value={label}
      >
        {value}
      </div>
    </div>
  )
}

function ChartCard({
  title,
  sample,
  action,
  compact = false,
  children,
}: {
  title: string
  sample: string
  action?: ReactNode
  compact?: boolean
  children: ReactNode
}) {
  return (
    <Card
      className={cn(
        'min-w-0 rounded-xl border-border bg-card p-4 shadow-[0_14px_34px_rgba(0,0,0,0.2)] sm:p-5',
        compact ? 'h-auto' : 'h-full',
      )}
      data-stat-card
    >
      <div className={cn('flex items-start justify-between gap-3', compact ? 'mb-3' : 'mb-4 min-h-12')}>
        <div className={cn('min-w-0', compact && 'flex w-full items-baseline justify-between gap-3')}>
          <h3 className="shrink-0 text-[16px] font-semibold leading-5 text-foreground">{title}</h3>
          <p className={cn('text-[12px] leading-5 text-muted-foreground', compact ? 'min-w-0 text-right' : 'mt-1')}>{sample}</p>
        </div>
        {action}
      </div>
      {children}
    </Card>
  )
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-[19rem] items-center justify-center rounded-lg border border-dashed border-border bg-[var(--neutral-performance-bg)] p-6 text-center text-sm leading-6 text-muted-foreground">
      {message}
    </div>
  )
}

function PlayerOverview({ dashboard }: { dashboard: PlayerDashboard }) {
  const { overview } = dashboard
  const flag = countryFlag(overview.country)

  return (
    <Card className="rounded-xl border-border bg-card p-5 shadow-[0_18px_44px_rgba(0,0,0,0.24)] sm:p-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(520px,1.1fr)] lg:items-stretch">
        <div className="min-w-0">
          <div className="flex min-w-0 items-start gap-4 sm:gap-5">
          <UserAvatar
            uuid={overview.uuid}
            username={overview.username}
            size={80}
            className="h-20 w-20 shrink-0 rounded-lg border border-border shadow-lg shadow-black/25"
            priority
          />
          <div className="min-w-0 pt-0.5">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h2 className="break-words text-[28px] font-bold leading-8 tracking-tight text-foreground">
                {overview.username}
              </h2>
              {overview.country ? (
                <span className="text-xl leading-none" title={overview.country}>
                  {flag ?? overview.country}
                </span>
              ) : null}
              <span className="h-7 rounded-md border border-border bg-[var(--secondary-surface)] px-2.5 font-mono text-[11px] leading-7 text-muted-foreground">
                ID {overview.playerId.slice(0, 8)}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {overview.socials.length > 0
                ? overview.socials.map((social) => `${social.service}: ${social.name}`).join(' · ')
                : 'No socials connected'}
            </p>
            <p className="mt-1 font-mono text-[12px] leading-5 text-muted-foreground">
              Last played {formatRelativeTime(overview.lastRanked)} · Rank #{overview.rank ?? '—'} · {dashboard.skillBand}
            </p>
          </div>
        </div>
          <div className="mt-5 overflow-hidden rounded-lg border border-border bg-[var(--secondary-surface)]" aria-label="Loaded match record">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <span className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">Ranked record</span>
              <span className="font-mono text-[11px] text-muted-foreground">{dashboard.loadedMatches}-match sample</span>
            </div>
            <div className="grid grid-cols-3 divide-x divide-border">
              <div className="px-3 py-3 text-center">
                <span className="font-mono text-[22px] font-bold tabular-nums text-success">{overview.wins}W</span>
                <span className="mt-0.5 block text-[11px] text-muted-foreground">Wins</span>
              </div>
              <div className="px-3 py-3 text-center">
                <span className="font-mono text-[22px] font-bold tabular-nums text-danger">{overview.losses}L</span>
                <span className="mt-0.5 block text-[11px] text-muted-foreground">Losses</span>
              </div>
              <div className="px-3 py-3 text-center">
                <span className="font-mono text-[22px] font-bold tabular-nums text-warning">{overview.draws}D</span>
                <span className="mt-0.5 block text-[11px] text-muted-foreground">Draws</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-3">
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
          <div className="grid flex-1 grid-cols-2 gap-2.5 sm:grid-cols-4">
            <StatBadge label="Current Elo" value={overview.elo?.toLocaleString() ?? '—'} tone="primary" />
            <StatBadge
              label="Tier"
              value={<RankTier tier={overview.tier} elo={overview.elo} iconSize={32} className="gap-1.5 text-[23px]" />}
              tone="primary"
            />
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
  const [allowAnimation, setAllowAnimation] = useState(true)
  const reducedMotion = useReducedMotion()
  const numericPoints = points.filter((point) => point.elo != null)
  const chartProps = {
    data: numericPoints,
    margin: { top: 14, right: 12, left: 2, bottom: 8 },
  }
  const controls = (
    <div className="flex rounded-lg border border-border bg-[var(--secondary-surface)] p-1" aria-label="Elo chart type">
      {(['line', 'area'] as const).map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => {
            setAllowAnimation(false)
            setMode(item)
          }}
          aria-pressed={mode === item}
          className={cn(
            'h-8 rounded-md px-2.5 text-xs font-medium capitalize transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
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
        tick={{ fontSize: 12, fill: 'var(--chart-axis)' }}
        minTickGap={36}
      />
      <YAxis
        domain={['dataMin - 20', 'dataMax + 20']}
        stroke="var(--chart-axis)"
        tick={{ fontSize: 12, fill: 'var(--chart-axis)' }}
        width={48}
      />
      <Tooltip content={<EloTooltip />} cursor={{ stroke: 'var(--chart-grid)' }} />
    </>
  )
  const seriesProps = {
    dataKey: 'elo',
    stroke: 'var(--chart-1)',
    strokeWidth: 3,
    isAnimationActive: allowAnimation && !reducedMotion,
    animationDuration: 700,
    dot: { r: numericPoints.length === 1 ? 5 : 3.5, fill: 'var(--chart-1)', strokeWidth: 0 },
    activeDot: { r: 7, fill: 'var(--chart-1)', stroke: 'var(--card)', strokeWidth: 2 },
  }
  return (
    <ChartCard title="Elo History" sample={`${numericPoints.length} chronological Elo records`} action={controls}>
      <div className="h-[19rem] min-w-0">
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
    <div className="h-[19rem] min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={values} outerRadius="78%" margin={{ top: 18, right: 26, bottom: 18, left: 26 }}>
          <PolarGrid stroke="var(--chart-grid)" strokeWidth={1.2} />
          <PolarAngleAxis
            dataKey="label"
            tick={{ fill: 'var(--chart-axis)', fontSize: 11.5, fontWeight: 500 }}
            tickFormatter={(value: string) => value.replace('Enter ', '')}
          />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <Tooltip content={<RadarTooltip />} />
          <Radar
            dataKey="score"
            stroke="var(--chart-1)"
            fill="var(--chart-1)"
            fillOpacity={0.32}
            strokeWidth={2.5}
            isAnimationActive={!reducedMotion}
            animationDuration={650}
            dot={{ r: 4, fill: 'var(--chart-1)', stroke: 'var(--card)', strokeWidth: 1.5 }}
            activeDot={{ r: 7, fill: 'var(--chart-1)', stroke: 'var(--foreground)', strokeWidth: 2 }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

function PieTooltip({
  active,
  payload,
  total,
}: {
  active?: boolean
  payload?: readonly TooltipEntry<PlayerDashboard['deathsBySplit']['slices'][number]>[]
  total: number
}) {
  const slice = payload?.[0]?.payload
  if (!active || !slice) return null
  return (
    <ChartTooltipShell>
      <p className="font-semibold">{slice.label}</p>
      <p className="mt-1 font-mono text-primary">{slice.count} endings · {formatPercent(slice.percent)}</p>
      <p className="mt-1 text-muted-foreground">Included sample: {total} classified endings</p>
    </ChartTooltipShell>
  )
}

function DonutChart({ data }: { data: PlayerDashboard['deathsBySplit'] }) {
  const reducedMotion = useReducedMotion()
  if (data.total === 0) {
    return <EmptyChart message="No failed endings could be classified from real timeline events." />
  }
  return (
    <div className="h-[19rem] min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data.slices}
            dataKey="count"
            nameKey="label"
            innerRadius="48%"
            outerRadius="78%"
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
          <Tooltip content={<PieTooltip total={data.total} />} />
          <Legend
            iconType="square"
            wrapperStyle={{ fontSize: 12, color: 'var(--chart-axis)', lineHeight: '20px' }}
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
    <div className="min-w-0" data-stat-table>
      <table className="hidden w-full table-fixed border-separate border-spacing-y-1.5 text-[13px] sm:table">
        <thead className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
          <tr>
            {headers.map((header) => (
              <th key={header.label} className={cn('px-3 pb-1 font-medium', header.align === 'right' ? 'text-right' : 'text-left')} style={{ width: header.width }}>
                {header.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="group">
              {row.cells.map((cell) => (
                <td
                  key={cell.label}
                  className={cn(
                    'break-words border-y border-border bg-[var(--secondary-surface)] px-2.5 py-2.5 leading-5 transition first:rounded-l-lg first:border-l last:rounded-r-lg last:border-r group-hover:bg-[var(--table-row-hover)]',
                    cell.className,
                  )}
                >
                  {cell.value}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="grid gap-2.5 sm:hidden">
        {rows.map((row) => (
          <div key={row.key} className="grid grid-cols-2 gap-x-3 gap-y-2 rounded-lg border border-border bg-[var(--secondary-surface)] p-3.5">
            {row.cells.map((cell) => (
              <div key={cell.label} className={cell.label === headers[0]?.label ? 'col-span-2 border-b border-border pb-2 font-semibold' : ''}>
                <span className="block text-[10px] uppercase text-muted-foreground">{cell.label}</span>
                <span className={cn('mt-0.5 block text-sm', cell.className)}>{cell.value}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
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

function HumanSummaryText({ summary }: { summary: string }) {
  const tokens = summary.split(
    /(\d+W-\d+L-\d+D|\d+(?:\.\d+)?%|\b(?:faster|slower|forfeit rate|priority)\b)/gi,
  )

  return (
    <p className="mt-4 max-w-6xl text-[15px] leading-7 text-foreground">
      {tokens.map((token, index) => {
        const normalized = token.toLowerCase()
        const tone =
          normalized === 'faster'
            ? 'text-success'
            : normalized === 'slower' || normalized === 'forfeit rate'
              ? 'text-danger'
              : normalized === 'priority'
                ? 'text-warning'
                : /^\d+W-\d+L-\d+D$/.test(token) || /^\d+(?:\.\d+)?%$/.test(token)
                  ? 'text-primary'
                  : ''

        return (
          <span key={`${index}-${token}`} className={cn(tone && 'font-semibold', tone)}>
            {token}
          </span>
        )
      })}
    </p>
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
    <section className="space-y-5">
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

      <div ref={ref} className="space-y-6 text-foreground" data-export-root>
        <PlayerOverview dashboard={dashboard} />
        <div className="grid min-w-0 items-stretch gap-5 lg:grid-cols-2 xl:grid-cols-3">
          <EloHistoryCard points={dashboard.eloHistory} />
          <ChartCard title="Split Performance" sample={`${splitSamples} valid segment records across ${dashboard.splitTimes.completedMatches} completed matches`}>
            <SplitPerformanceRadar rows={dashboard.splitPerformance} />
          </ChartCard>
          <ChartCard title="Run Endings" sample={`${dashboard.deathsBySplit.total} classified run endings`}>
            <DonutChart data={dashboard.deathsBySplit} />
          </ChartCard>
        </div>
        <div className="grid min-w-0 items-start gap-5 lg:grid-cols-2 xl:grid-cols-3">
          <ChartCard compact title="Split Times" sample={`${splitSamples} segments · ${dashboard.benchmarkLabel}`}>
            <SplitTimesTable data={dashboard.splitTimes} />
          </ChartCard>
          <ChartCard compact title="Seed Types" sample={`${seedSamples} recorded matches`}>
            <SeedTypesTable rows={dashboard.seedTypes} />
          </ChartCard>
          <ChartCard compact title="Bastion Types" sample={`${bastionSamples} recorded matches`}>
            <BastionTypesTable rows={dashboard.bastionTypes} />
          </ChartCard>
        </div>
        <Card className="rounded-xl border-border bg-card p-5 shadow-[0_14px_34px_rgba(0,0,0,0.2)] sm:p-6">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-[17px] font-semibold text-foreground">Human Summary (0% AI)</h3>
            <p className="font-mono text-[12px] text-muted-foreground">Exact sample: {dashboard.loadedMatches} ranked matches</p>
          </div>
          <HumanSummaryText summary={dashboard.humanSummary} />
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
