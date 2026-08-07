'use client'

import { useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Activity, BarChart3, Download, ExternalLink } from 'lucide-react'
import { toPng } from 'html-to-image'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { InfoTip } from '@/components/ui/info-tip'

import { UserAvatar } from '@/components/user-avatar'
import { getMcsrRankLabel } from '@/lib/mcsr-rank'
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
  icon,
}: {
  label: string
  value: string | number
  tone?: 'default' | 'good' | 'bad' | 'primary'
  title?: string
  icon?: ReactNode
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
    <div className="min-w-0 rounded-md border border-white/10 bg-background/38 px-3 py-2.5">
      <div className="flex w-full items-center justify-between gap-2 text-[12px] font-medium text-muted-foreground">
        <span>{label}</span>
        {title && <InfoTip label={label}>{title}</InfoTip>}
      </div>
      <p
        className={cn(
          'mt-1 flex min-h-7 items-center gap-2 truncate font-mono text-xl font-bold leading-none tabular-nums',
          valueClass,
        )}
      >
        {icon}
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
    <Card
      className="min-w-0 rounded-lg border-border/90 bg-card/88 p-4"
      data-stat-card
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="shrink-0 text-right text-xs text-muted-foreground">
          {sample}
        </p>
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
  const completionRate = dashboard.loadedMatches > 0
    ? dashboard.splitTimes.completedMatches / dashboard.loadedMatches
    : null
  const strongestSplit = [...dashboard.splitTimes.rows]
    .filter((row) => row.averageDifference != null)
    .sort((a, b) => (a.averageDifference ?? 0) - (b.averageDifference ?? 0))[0]
  const bestSeed = [...dashboard.seedTypes]
    .filter((row) => row.winRate != null && row.matches > 0)
    .sort(
      (a, b) =>
        (b.winRate ?? 0) - (a.winRate ?? 0) || b.matches - a.matches,
    )[0]
  const recentEloSwing = dashboard.eloHistory.reduce(
    (total, point) => total + (point.change ?? 0),
    0,
  )
  const recentWins = dashboard.eloHistory.filter((point) => (point.change ?? 0) > 0).length
  const recentLosses = dashboard.eloHistory.filter((point) => (point.change ?? 0) < 0).length

  return (
    <Card className="rounded-md border-cyan-400/35 bg-card/95 p-4 shadow-[0_0_48px_rgba(34,211,238,0.09)] sm:p-5">
      <div className="grid gap-5 lg:grid-cols-[auto_1fr]">
        <div className="min-w-0 space-y-3">
          <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[auto_minmax(0,1fr)_8.5rem_8.5rem]">
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
                Last played {formatRelativeTime(overview.lastRanked)} · {getMcsrRankLabel(overview.elo)} · Rank #
                {overview.rank ?? '—'}
              </p>
            </div>
            <div className="rounded-md border border-white/10 bg-background/38 px-3 py-2.5">
              <p className="text-[11px] text-muted-foreground">Recent Elo swing</p>
              <p className={cn('mt-1 font-mono text-lg font-bold', recentEloSwing >= 0 ? 'text-emerald-300' : 'text-rose-300')}>
                {recentEloSwing > 0 ? '+' : ''}{recentEloSwing}
              </p>
            </div>
            <div className="rounded-md border border-white/10 bg-background/38 px-3 py-2.5">
              <p className="text-[11px] text-muted-foreground">Recent form</p>
              <p className="mt-1 font-mono text-lg font-bold text-foreground">
                <span className="text-emerald-300">{recentWins}W</span>{' '}
                <span className="text-rose-300">{recentLosses}L</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2" aria-label="Player quick insights">
            <div className="min-w-0 rounded-md bg-background/38 px-2.5 py-2">
              <p className="truncate text-[11px] text-muted-foreground">Recent completion</p>
              <p className="mt-1 truncate font-mono text-sm font-semibold text-foreground">
                {formatPercent(completionRate)}
              </p>
            </div>
            <div className="min-w-0 rounded-md bg-background/38 px-2.5 py-2">
              <p className="truncate text-[11px] text-muted-foreground">Strongest split</p>
              <p className="mt-1 truncate text-sm font-semibold text-emerald-300" title={strongestSplit?.label}>
                {strongestSplit?.label ?? '—'}
              </p>
            </div>
            <div className="min-w-0 rounded-md bg-background/38 px-2.5 py-2">
              <p className="truncate text-[11px] text-muted-foreground">Best seed</p>
              <p className="mt-1 truncate text-sm font-semibold text-foreground" title={bestSeed?.seedType}>
                {bestSeed?.seedType ?? '—'}
              </p>
            </div>
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
            <div className="flex min-h-[70px] items-center justify-center gap-3 rounded-md border border-white/10 bg-background/38 px-3 font-mono text-xl font-bold tabular-nums xl:col-span-2">
              <span className="text-emerald-300">{overview.wins}W</span>
              <span className="text-rose-300">{overview.losses}L</span>
              <span className="text-amber-200">{overview.draws}D</span>
            </div>
            <StatBadge label="Current Elo" value={overview.elo?.toLocaleString() ?? '—'} tone="primary" />
            <StatBadge
              label="Tier"
              value={overview.tier}
              tone="primary"
            />
            <StatBadge label="PB" value={formatDuration(overview.pb)} tone="good" />
            <StatBadge label="Avg completion" value={formatDuration(overview.averageCompletion)} />
            <StatBadge label="Win rate" value={formatPercent(overview.winRate)} tone="good" title="Wins divided by decided ranked matches in the profile statistics." />
            <StatBadge label="Forfeit rate" value={formatPercent(overview.forfeitRate)} tone="bad" title="Forfeits divided by ranked matches in the profile statistics." />
            <StatBadge label="Rank" value={overview.rank ? `#${overview.rank}` : '—'} />
            <StatBadge label="Sample" value={`${dashboard.loadedMatches} matches`} />
          </div>
        </div>
      </div>
    </Card>
  )
}

function EloHistoryChart({ points }: { points: PlayerDashboard['eloHistory'] }) {
  const numericPoints = points.filter((point) => point.elo != null)
  const [chartView, setChartView] = useState<'rating' | 'changes'>('rating')
  if (numericPoints.length === 0) {
    return <EmptyChart message="No recorded Elo changes were available in the loaded matches." />
  }

  const data = numericPoints.map((point) => ({
    ...point,
    label: formatDate(point.date),
  }))
  const values = data.map((point) => point.elo ?? 0)
  const domainPadding = Math.max((Math.max(...values) - Math.min(...values)) * 0.15, 12)
  const domain: [number, number] = [
    Math.floor(Math.min(...values) - domainPadding),
    Math.ceil(Math.max(...values) + domainPadding),
  ]
  const common = {
    data,
    margin: { top: 12, right: 12, bottom: 4, left: 0 },
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap justify-end gap-1" role="group" aria-label="Elo chart view">
        <Button type="button" size="sm" variant={chartView === 'rating' ? 'secondary' : 'ghost'} onClick={() => setChartView('rating')} aria-label="Show Elo rating history">
          <Activity className="h-4 w-4" />
          Rating history
        </Button>
        <Button type="button" size="sm" variant={chartView === 'changes' ? 'secondary' : 'ghost'} onClick={() => setChartView('changes')} aria-label="Show Elo gained and lost per match">
          <BarChart3 className="h-4 w-4" />
          Gain / loss
        </Button>
      </div>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartView === 'rating' ? (
            <AreaChart {...common}>
              <defs>
                <linearGradient id="elo-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.42} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 5" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} minTickGap={34} />
              <YAxis domain={domain} tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} width={42} />
              <Tooltip contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 8 }} formatter={(value, _name, item) => [`${value} Elo${item.payload.change != null ? ` (${item.payload.change > 0 ? '+' : ''}${item.payload.change})` : ''}`, `vs ${item.payload.opponent ?? 'Unknown'}`]} />
              <Area type="monotone" dataKey="elo" stroke="var(--primary)" fill="url(#elo-area)" strokeWidth={2.5} dot={{ r: 3, fill: 'var(--primary)' }} activeDot={{ r: 6 }} isAnimationActive animationDuration={850} />
            </AreaChart>
          ) : (
            <BarChart {...common}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 5" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} minTickGap={34} />
              <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} width={42} />
              <Tooltip contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 8 }} formatter={(value, _name, item) => [`${Number(value) > 0 ? '+' : ''}${value} Elo`, `vs ${item.payload.opponent ?? 'Unknown'}`]} />
              <Bar dataKey="change" name="Elo change" radius={[4, 4, 2, 2]} isAnimationActive animationDuration={700}>
                {data.map((point) => (
                  <Cell key={point.matchId} fill={(point.change ?? 0) >= 0 ? '#34d399' : '#fb7185'} />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function SplitPerformanceRadar({ rows }: { rows: PlayerDashboard['splitPerformance'] }) {
  const values = rows.filter((row) => row.score != null)
  if (values.length < 3) {
    return <EmptyChart message="At least three splits with valid averages are needed for the radar chart." />
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={rows} outerRadius="68%">
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis dataKey="label" tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} tickFormatter={(label) => String(label).replace('Enter ', '')} />
          <Tooltip contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 8 }} formatter={(value, _name, item) => [`${value ?? '—'}/100 · ${formatDuration(item.payload.average)} · ${item.payload.samples} samples`, item.payload.label]} />
          <Radar dataKey="score" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.25} dot={{ r: 3, fill: 'var(--primary)' }} activeDot={{ r: 6 }} isAnimationActive animationDuration={750} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

function DonutChart({ data }: { data: PlayerDashboard['deathsBySplit'] }) {
  if (data.total === 0) {
    return <EmptyChart message="No classified failed endings were found in the detailed match sample." />
  }

  return (
    <div className="grid gap-4 sm:grid-cols-[220px_1fr] sm:items-center">
      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 8 }} formatter={(value, _name, item) => [`${value} · ${formatPercent(item.payload.percent)}`, item.payload.label]} />
            <Pie data={data.slices} dataKey="count" nameKey="label" innerRadius={48} outerRadius={78} paddingAngle={2} stroke="var(--card)" strokeWidth={3} isAnimationActive animationDuration={700}>
              {data.slices.map((slice, index) => <Cell key={slice.key} fill={chartColors[index % chartColors.length]} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
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
      <table className="w-full table-fixed text-[13px] sm:text-sm">
        <thead className="border-b border-border bg-muted/25 text-xs text-muted-foreground">
          <tr>
            <th className="w-[34%] px-2 py-2.5 text-left font-medium">Split</th>
            <th className="w-[22%] px-2 py-2.5 text-right font-medium">Avg</th>
            <th className="w-[20%] px-2 py-2.5 text-right font-medium">Best</th>
            <th className="w-[24%] px-2 py-2.5 text-right font-medium">Diff</th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row) => (
            <tr key={row.key} className="border-b border-border/70">
              <td className="break-words px-2 py-2.5 font-medium leading-5 text-foreground">{row.label}</td>
              <td className="px-2 py-2.5 text-right font-mono tabular-nums text-muted-foreground">{formatDuration(row.average)}</td>
              <td className="px-2 py-2.5 text-right font-mono tabular-nums text-emerald-300">{formatDuration(row.best)}</td>
              <td className={cn('px-2 py-2.5 text-right font-mono tabular-nums', (row.averageDifference ?? 0) <= 0 ? 'text-emerald-300' : 'text-rose-300')}>
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
  const rates = rows.map((row) => row.winRate).filter((rate): rate is number => rate != null)
  const bestRate = Math.max(...rates)
  const worstRate = Math.min(...rates)

  return (
    <div className="min-w-0">
      <table className="w-full table-fixed text-[13px] sm:text-sm">
        <thead className="border-b border-border bg-muted/25 text-xs text-muted-foreground">
          <tr>
            <th className="w-[34%] px-2 py-2.5 text-left font-medium">Seed</th>
            <th className="w-[27%] px-2 py-2.5 text-right font-medium">Avg time</th>
            <th className="w-[18%] px-2 py-2.5 text-right font-medium">Runs</th>
            <th className="w-[21%] px-2 py-2.5 text-right font-medium">Win %</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.seedType} className="border-b border-border/70">
              <td className={cn('break-words px-2 py-2.5 font-medium leading-5', row.winRate === bestRate ? 'text-emerald-300' : row.winRate === worstRate && bestRate !== worstRate ? 'text-rose-300' : 'text-foreground')}>{row.seedType}</td>
              <td className="px-2 py-2.5 text-right font-mono tabular-nums text-muted-foreground">{formatDuration(row.averageCompletion)}</td>
              <td className="px-2 py-2.5 text-right font-mono tabular-nums text-foreground">{row.matches}</td>
              <td className="px-2 py-2.5 text-right font-mono tabular-nums text-cyan-300">{formatPercent(row.winRate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function BastionTypesTable({ rows }: { rows: PlayerDashboard['bastionTypes'] }) {
  if (rows.length === 0) return <EmptyChart message="No bastion-type data was available in detailed matches." />
  const rates = rows.map((row) => row.winRate).filter((rate): rate is number => rate != null)
  const bestRate = Math.max(...rates)
  const worstRate = Math.min(...rates)

  return (
    <div className="min-w-0">
      <table className="w-full table-fixed text-[13px] sm:text-sm">
        <thead className="border-b border-border bg-muted/25 text-xs text-muted-foreground">
          <tr>
            <th className="w-[34%] px-2 py-2.5 text-left font-medium">Bastion</th>
            <th className="w-[18%] px-2 py-2.5 text-right font-medium">Runs</th>
            <th className="w-[21%] px-2 py-2.5 text-right font-medium">Win %</th>
            <th className="w-[27%] px-2 py-2.5 text-right font-medium">Avg split</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.bastionType} className="border-b border-border/70">
              <td className={cn('break-words px-2 py-2.5 font-medium leading-5', row.winRate === bestRate ? 'text-emerald-300' : row.winRate === worstRate && bestRate !== worstRate ? 'text-rose-300' : 'text-foreground')}>{row.bastionType}</td>
              <td className="px-2 py-2.5 text-right font-mono tabular-nums text-foreground">{row.matches}</td>
              <td className="px-2 py-2.5 text-right font-mono tabular-nums text-cyan-300">{formatPercent(row.winRate)}</td>
              <td className="px-2 py-2.5 text-right font-mono tabular-nums text-muted-foreground">{formatDuration(row.averageSplit)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function HumanSummary({ dashboard }: { dashboard: PlayerDashboard }) {
  const { overview } = dashboard
  const bestSplit = [...dashboard.splitTimes.rows]
    .filter((row) => row.averageDifference != null)
    .sort((a, b) => (a.averageDifference ?? 0) - (b.averageDifference ?? 0))[0]
  const bestSeed = [...dashboard.seedTypes]
    .filter((row) => row.winRate != null)
    .sort((a, b) => (b.winRate ?? 0) - (a.winRate ?? 0))[0]
  const bestBastion = [...dashboard.bastionTypes]
    .filter((row) => row.winRate != null)
    .sort((a, b) => (b.winRate ?? 0) - (a.winRate ?? 0))[0]
  const mostDeaths = dashboard.deathsBySplit.slices[0]
  const matchCount = overview.wins + overview.losses + overview.draws

  return (
    <Card className="rounded-md border-border/90 bg-card/92 p-4 sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="inline-flex items-center gap-1 font-mono text-sm uppercase text-primary">
          Human Summary <span className="text-muted-foreground">(0% AI)</span>
          <InfoTip label="Human Summary">
            This paragraph is generated deterministically from the statistics
            shown on this page. It does not call an AI service.
          </InfoTip>
        </h3>
        <span className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground">
          {dashboard.loadedMatches} match sample
          <InfoTip label="dashboard match sample">
            The dashboard uses only the recent ranked matches returned and the
            detailed matches that contain the required recorded fields.
          </InfoTip>
        </span>
      </div>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">
        <strong className="text-foreground">{overview.username}</strong> has a{' '}
        <span className="text-emerald-300">{overview.wins}W</span>-
        <span className="text-rose-300">{overview.losses}L</span>-
        <span>{overview.draws}D</span> record over {matchCount} ranked matches.
        {bestSplit && <> The strongest split is <strong className="text-foreground">{bestSplit.label}</strong>, averaging {formatSignedDuration(bestSplit.averageDifference)} versus {dashboard.benchmarkLabel}.</>}
        {bestSeed && <> The strongest seed type is <strong className="text-foreground">{bestSeed.seedType}</strong> ({bestSeed.wins}-{Math.max(bestSeed.matches - bestSeed.wins, 0)}, {formatPercent(bestSeed.winRate)}).</>}
        {bestBastion && <> The best recorded bastion type is <strong className="text-foreground">{bestBastion.bastionType}</strong> ({formatPercent(bestBastion.winRate)} across {bestBastion.matches} matches).</>}
        {mostDeaths && <> Most classified run endings occur around <strong className="text-foreground">{mostDeaths.label}</strong> ({mostDeaths.count}, {formatPercent(mostDeaths.percent)}).</>}
        {overview.forfeitRate != null && <> The loaded profile forfeit rate is <strong className={overview.forfeitRate >= 0.25 ? 'text-rose-300' : 'text-foreground'}>{formatPercent(overview.forfeitRate)}</strong>.</>}
      </p>
    </Card>
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
        className="space-y-4 bg-transparent p-0 text-foreground"
        data-export-root
      >
        <PlayerOverview dashboard={dashboard} />

        <div className="grid gap-4 xl:grid-cols-3">
          <ChartCard title="Elo Change" sample={`${dashboard.eloHistory.length} records`}>
            <EloHistoryChart points={dashboard.eloHistory} />
          </ChartCard>
          <ChartCard title="Split Performances" sample={`${splitDataSamples} usable splits`}>
            <SplitPerformanceRadar rows={dashboard.splitPerformance} />
          </ChartCard>
          <ChartCard title="Deaths by Split" sample={`${dashboard.deathsBySplit.total} endings`}>
            <DonutChart data={dashboard.deathsBySplit} />
          </ChartCard>
        </div>

        <HumanSummary dashboard={dashboard} />

        <div className="grid gap-4 lg:grid-cols-3">
          <ChartCard title="Split Times" sample={`${dashboard.splitTimes.completedMatches} matches`}>
            <SplitTimesTable data={dashboard.splitTimes} />
          </ChartCard>
          <ChartCard title="Seed Types" sample={`${seedMatchSamples} seeds`}>
            <SeedTypesTable rows={dashboard.seedTypes} />
          </ChartCard>
          <ChartCard title="Bastion Types" sample={`${bastionSamples} bastions`}>
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
