'use client'

import { FormEvent, Suspense, useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  BarChart3,
  ChevronDown,
  ExternalLink,
  Flame,
  PlayCircle,
  Search,
  Sparkles,
} from 'lucide-react'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { SiteLoader } from '@/components/site-loader'
import { UserAvatar } from '@/components/user-avatar'
import { StatsDashboard } from '@/components/improve/stats-dashboard'
import { InfoTip } from '@/components/ui/info-tip'
import type { PlayerDashboard } from '@/components/improve/types'
import {
  consistencyScore,
  PRACTICE_FOCUS_EXPLANATION,
} from '@/lib/improve-focus'

interface SplitComparison {
  key: string
  label: string
  playerAverage: number | null
  benchmarkAverage: number | null
  difference: number | null
  gapPercent: number | null
  failCount: number
  deathCount: number
  samples: number
  benchmarkSamples: number
}

interface WeaknessMatch {
  id: number
  date: number
  seedType: string
  bastionType: string
  playerTime: number | null
  opponentTime: number | null
  opponent: string | null
  opponentElo: number | null
  completed: boolean
  failedHere: boolean
  deathCount: number
  winner: string | null
  statsUrl: string
  vodUrl: string | null
}

interface ImproveAnalysis {
  player: {
    uuid: string
    username: string
    elo: number
    rank: number
    country: string
  }
  sample: {
    matches: number
    completed: number
    forfeits: number
    detailMatches: number
    benchmarkSamples?: number
  }
  comparison: {
    currentTier: string
    targetTier: string
    benchmarkLabel: string
    splitComparisons: SplitComparison[]
  }
  overview: {
    completionRate: number
    averageCompletion: number | null
    bestCompletion: number | null
    mostCommonSeed: string
    primaryWeakness: string
    failureCount: number
  }
  weakness: {
    key: string
    label: string
    difference: number | null
    gapPercent: number | null
    failCount: number
    deathCount: number
    basis?: 'pace' | 'consistency'
    bastionType: string | null
    matches: WeaknessMatch[]
  } | null
  recommendations: Array<{
    videoId: string
    title: string
    url: string
    focus: string
    thumbnail: string
    duration: string
    source: string
    official: true
  }>
  formatted: {
    averageCompletion: string
    bestCompletion: string
  }
  dashboard?: PlayerDashboard
}

function formatTime(ms: number | null | undefined) {
  if (!ms || ms <= 0) return 'N/A'
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function formatDelta(ms: number | null | undefined) {
  if (ms == null) return 'N/A'
  const prefix = ms > 0 ? '+' : ''
  return `${prefix}${formatTime(Math.abs(ms))}`
}

function formatGap(value: number | null | undefined) {
  if (value == null) return 'N/A'
  const prefix = value > 0 ? '+' : ''
  return `${prefix}${(value * 100).toFixed(1)}%`
}

function formatDate(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleDateString()
}

function percent(value: number) {
  return `${Math.round(value * 1000) / 10}%`
}

function EmptyState() {
  return (
    <div className="border border-dashed border-border bg-card/70 p-8 text-center">
      <Sparkles className="mx-auto h-8 w-8 text-primary" />
      <h2 className="mt-4 text-xl font-bold text-foreground">
        Find what to practice next
      </h2>
      <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
        Type a username to compare your recent splits against stronger recent
        opponents, find your biggest time loss, and get focused practice videos.
      </p>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4" aria-label="Loading dashboard">
      <div className="h-32 animate-pulse border border-border bg-card/80" />
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="h-72 animate-pulse border border-border bg-card/80" />
        <div className="h-72 animate-pulse border border-border bg-card/80" />
        <div className="h-72 animate-pulse border border-border bg-card/80" />
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="h-80 animate-pulse border border-border bg-card/80" />
        <div className="h-80 animate-pulse border border-border bg-card/80" />
        <div className="h-80 animate-pulse border border-border bg-card/80" />
      </div>
    </div>
  )
}

function MiniStat({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="border border-border bg-background/45 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-sm font-semibold text-foreground">
        {value}
      </p>
    </div>
  )
}

function ImprovePageContent() {
  const searchParams = useSearchParams()
  const initialPlayerParam = searchParams.get('player') || searchParams.get('username') || ''

  const [username, setUsername] = useState(initialPlayerParam)
  const [analysis, setAnalysis] = useState<ImproveAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showMatches, setShowMatches] = useState(false)

  const fetchAnalysis = useCallback(async (query: string) => {
    if (!query) return
    try {
      setLoading(true)
      setError('')
      setShowMatches(false)
      const response = await fetch(
        `/api/improve?username=${encodeURIComponent(query)}`,
      )
      const data = await response.json()

      if (!response.ok || !data.analysis) {
        setAnalysis(null)
        setError(data.error || 'Could not analyze that player.')
        return
      }

      setAnalysis(data.analysis)
    } catch {
      setAnalysis(null)
      setError('Could not analyze that player.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (initialPlayerParam) {
      setUsername(initialPlayerParam)
      fetchAnalysis(initialPlayerParam)
    }
  }, [initialPlayerParam, fetchAnalysis])

  async function analyzePlayer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const query = username.trim()
    if (!query) {
      setError('Enter a username first.')
      return
    }
    await fetchAnalysis(query)
  }

  const weakest = analysis?.weakness
  const secondaryConsistency = analysis
    ? [...analysis.comparison.splitComparisons]
        .filter(
          (split) =>
            split.key !== weakest?.key &&
            (split.failCount > 0 || split.deathCount > 0),
        )
        .sort(
          (a, b) =>
            consistencyScore(b.failCount, b.deathCount) -
              consistencyScore(a.failCount, a.deathCount) ||
            a.label.localeCompare(b.label),
        )[0] ?? null
    : null

  return (
    <>
      <Header />
      <main className="mx-auto max-w-[1440px] px-3 py-6 sm:px-4 sm:py-8">
        <div className="space-y-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center border border-primary bg-primary/15 text-primary">
                <Flame className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
                  Improve
                </h1>
                <p className="text-muted-foreground">
                  Split comparison and focused practice guides
                </p>
              </div>
            </div>

            <form
              onSubmit={analyzePlayer}
              className="grid gap-3 border border-border bg-card/90 p-3 sm:grid-cols-[minmax(18rem,1fr)_auto]"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Username"
                  className="h-11 w-full border border-border bg-input pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <Button type="submit" disabled={loading} className="h-11">
                {loading ? 'Analyzing...' : 'Analyze'}
              </Button>
            </form>
          </div>

          {error && (
            <div className="border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
              {error}
            </div>
          )}

          {loading ? (
            <div className="space-y-4 border border-border bg-card/70 p-4">
              <SiteLoader label="Reviewing recent matches..." />
              <DashboardSkeleton />
            </div>
          ) : analysis ? (
            <div className="space-y-6">
              {analysis.dashboard ? (
                <StatsDashboard dashboard={analysis.dashboard} />
              ) : (
                <div className="border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-200">
                  Dashboard statistics were not available for this response.
                </div>
              )}

              {analysis.sample.matches === 0 && (
                <div className="border border-border bg-card/80 p-4 text-sm text-muted-foreground">
                  No ranked matches were found in the loaded sample.
                </div>
              )}

            <section className="overflow-hidden rounded-lg border border-border bg-transparent">
              <div className="border-t-2 border-t-cyan-400 bg-card/95 p-4 sm:p-5">
                <p className="font-mono text-xs uppercase text-muted-foreground">
                  Comparing you to
                </p>
                <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <UserAvatar
                      uuid={analysis.player.uuid}
                      username={analysis.player.username}
                      size={54}
                      className="h-14 w-14 shrink-0 border border-primary/40"
                    />
                    <div className="min-w-0">
                      <h2 className="break-words text-2xl font-bold text-foreground">
                        {analysis.comparison.currentTier}{' '}
                        <span className="text-muted-foreground">to</span>{' '}
                        <span className="text-yellow-400">
                          {analysis.comparison.targetTier}
                        </span>
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {analysis.player.username} -{' '}
                        {analysis.player.elo.toLocaleString()} Elo - Rank #
                        {analysis.player.rank || '?'}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <MiniStat
                      label="Avg finish"
                      value={analysis.formatted.averageCompletion}
                    />
                    <MiniStat
                      label="Best"
                      value={analysis.formatted.bestCompletion}
                    />
                    <MiniStat
                      label="Complete"
                      value={percent(analysis.overview.completionRate)}
                    />
                    <MiniStat
                      label="Samples"
                      value={`${analysis.sample.completed}/${analysis.sample.matches}`}
                    />
                  </div>
                </div>
                <p className="mt-3 flex items-center gap-1 font-mono text-xs text-muted-foreground">
                  <span>
                    Recent {analysis.sample.detailMatches} ranked duels - time gaps,
                    failed attempts, and deaths vs {analysis.comparison.benchmarkLabel}
                  </span>
                  <InfoTip label="loaded match sample">
                    Only matches with the required recorded timeline data are used
                    for split comparisons. A smaller sample is less reliable.
                  </InfoTip>
                </p>

                {/* Ludwig Comparison Callout */}
                <div className="mt-4 rounded-md border-2 border-primary/40 bg-primary/10 p-3.5 sm:p-4">
                  <div className="flex items-center gap-2 font-heading text-xs font-bold uppercase tracking-wider text-primary">
                    <span>👑 LUDWIG CHECK ("ludwigahgren")</span>
                  </div>
                  {analysis.player.elo >= 1100 ? (
                    <div className="mt-1 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <p className="font-heading text-sm font-bold text-foreground sm:text-base">
                        Bro chill, at least you&apos;re better than Ludwig! 🔥
                      </p>
                      <p className="font-sans text-xs text-muted-foreground">
                        Your Elo ({analysis.player.elo.toLocaleString()}) &gt; Ludwig (~1,100 Elo, Gold). You&apos;ve officially surpassed the mogul!
                      </p>
                    </div>
                  ) : (
                    <div className="mt-1 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <p className="font-heading text-sm font-bold text-amber-400 sm:text-base">
                        Bruh... even Ludwig is ranked higher than you right now 😭💀
                      </p>
                      <p className="font-sans text-xs text-muted-foreground">
                        Your Elo ({analysis.player.elo.toLocaleString()}) &lt; Ludwig (~1,100 Elo, Gold). Time to lock in and review your splits below!
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 sm:p-5">
                <div className="mb-4 flex items-center gap-3">
                  <h3 className="font-mono text-sm uppercase text-cyan-400">
                    Your splits vs {analysis.comparison.targetTier}
                  </h3>
                  <div className="h-px flex-1 bg-cyan-400/40" />
                  <InfoTip label="split table columns" triggerText="Explain columns">
                    “You” is your average. The rank average is the benchmark.
                    Positive differences mean slower; negative differences mean
                    faster. Sample, fails, and deaths describe the data behind the
                    comparison.
                  </InfoTip>
                </div>

                <div className="overflow-x-auto border border-border bg-card/80">
                  <table className="w-full min-w-[900px] text-sm">
                    <thead className="border-b border-border bg-muted/25">
                      <tr className="font-mono text-xs uppercase text-muted-foreground">
                        <th className="px-4 py-3 text-left font-medium">Split</th>
                        <th className="px-4 py-3 text-right font-medium">
                          <InfoTip label="You" triggerText="You" showIcon={false} className="justify-end">
                            Your average split time from valid splits in the loaded
                            match sample.
                          </InfoTip>
                        </th>
                        <th className="px-4 py-3 text-right font-medium">
                          <InfoTip label={`${analysis.comparison.targetTier} average`} triggerText={`${analysis.comparison.targetTier} avg`} showIcon={false} className="justify-end">
                            The comparison average for the selected rank. When too
                            few live comparison splits exist, the displayed baseline
                            is used instead.
                          </InfoTip>
                        </th>
                        <th className="px-4 py-3 text-right font-medium">
                          <InfoTip label="Difference" triggerText="Difference" showIcon={false} className="justify-end">
                            Your time minus the benchmark time. Positive means
                            slower; negative means faster.
                          </InfoTip>
                        </th>
                        <th className="px-4 py-3 text-right font-medium">
                          <InfoTip label="Gap" triggerText="Gap" showIcon={false} className="justify-end">
                            The time difference as a percentage of the benchmark.
                            Positive means slower; negative means faster.
                          </InfoTip>
                        </th>
                        <th className="px-4 py-3 text-right font-medium">
                          <InfoTip label="average sample" triggerText="Avg Sample" showIcon={false} className="justify-end">
                              Number of live benchmark splits used. “Base” means there
                              were too few live samples, so the rank baseline was used.
                          </InfoTip>
                        </th>
                        <th className="px-4 py-3 text-right font-medium">
                          <InfoTip label="Fails" triggerText="Fails" showIcon={false} className="justify-end">
                            Failed attempts recorded at this segment in the loaded
                            detailed-match sample.
                          </InfoTip>
                        </th>
                        <th className="px-4 py-3 text-right font-medium">
                          <InfoTip label="Deaths" triggerText="Deaths" showIcon={false} className="justify-end">
                            Recorded deaths associated with this segment in the
                            loaded detailed-match sample.
                          </InfoTip>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysis.comparison.splitComparisons.map((split) => {
                        const isWeakest = split.key === weakest?.key
                        return (
                          <tr
                            key={split.key}
                            className={`border-b border-border ${
                              isWeakest ? 'bg-red-500/8' : 'bg-background/20'
                            }`}
                          >
                            <td className="px-4 py-4 font-medium text-foreground">
                              {split.label}
                            </td>
                            <td className="px-4 py-4 text-right font-mono font-semibold text-cyan-300">
                              {formatTime(split.playerAverage)}
                            </td>
                            <td className="px-4 py-4 text-right font-mono text-muted-foreground">
                              {formatTime(split.benchmarkAverage)}
                            </td>
                            <td
                              className={`px-4 py-4 text-right font-mono ${
                                (split.difference ?? 0) > 0
                                  ? 'text-rose-400'
                                  : 'text-emerald-400'
                              }`}
                            >
                              {formatDelta(split.difference)}
                            </td>
                            <td
                              className={`px-4 py-4 text-right font-mono ${
                                (split.gapPercent ?? 0) > 0
                                  ? 'text-rose-400'
                                  : 'text-emerald-400'
                              }`}
                            >
                              {formatGap(split.gapPercent)}
                            </td>
                            <td className="px-4 py-4 text-right font-mono text-muted-foreground">
                              {split.benchmarkSamples > 0
                                ? split.benchmarkSamples
                                : 'base'}
                            </td>
                            <td className="px-4 py-4 text-right font-mono text-rose-300">
                              {split.failCount}
                            </td>
                            <td className="px-4 py-4 text-right font-mono text-rose-300">
                              {split.deathCount}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {weakest && (
                  <div className="mt-8">
                    <div className="mb-4 flex items-center gap-3">
                      <h3 className="font-mono text-sm uppercase text-cyan-400">
                        Practice Focus
                      </h3>
                      <div className="h-px flex-1 bg-cyan-400/40" />
                      <InfoTip
                        label="Practice Focus"
                        triggerText="How is this chosen?"
                      >
                        {PRACTICE_FOCUS_EXPLANATION}
                      </InfoTip>
                    </div>

                    <div className="mb-4 rounded-lg border border-rose-500/35 bg-card/90 p-4">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <h4 className="text-xl font-semibold text-foreground">
                          {weakest.bastionType
                            ? `${weakest.bastionType} ${weakest.label}`
                            : weakest.label}
                        </h4>
                        <span className="font-mono text-sm text-rose-300">
                          {weakest.basis === 'pace'
                            ? `${formatDelta(weakest.difference)} · ${formatGap(
                                weakest.gapPercent,
                              )} gap`
                            : 'Consistency focus'}
                        </span>
                      </div>

                      <div className="mt-4 rounded-md border border-border bg-background/45 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Why this was selected
                        </p>
                        <p className="mt-1 text-sm leading-6 text-foreground/90">
                          {weakest.basis === 'pace' &&
                          weakest.difference != null &&
                          weakest.gapPercent != null
                            ? `${weakest.label} was selected because your average is ${formatTime(
                                Math.abs(weakest.difference),
                              )} slower than ${analysis.comparison.benchmarkLabel}, a ${Math.abs(
                                weakest.gapPercent * 100,
                              ).toFixed(1)}% time gap. It is the largest meaningful pace weakness in this loaded sample.`
                            : `${weakest.label} was selected as a consistency focus because no split was at least 15 seconds and 5% slower than ${analysis.comparison.benchmarkLabel}. Its ${weakest.failCount} fail${
                                weakest.failCount === 1 ? '' : 's'
                              } and ${weakest.deathCount} death${
                                weakest.deathCount === 1 ? '' : 's'
                              } were the strongest consistency signal in this loaded sample.`}
                        </p>
                      </div>

                      {secondaryConsistency && (
                        <div className="mt-3 rounded-md border border-amber-500/25 bg-amber-500/8 p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-amber-300">
                            Additional consistency note
                          </p>
                          <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            {secondaryConsistency.label}{' '}
                            {secondaryConsistency.difference != null &&
                            secondaryConsistency.difference <= 0
                              ? `is ${formatTime(
                                  Math.abs(secondaryConsistency.difference),
                                )} faster than ${analysis.comparison.benchmarkLabel}, so it was not classified as a pace weakness. `
                              : 'was not the largest qualifying pace weakness. '}
                            Its {secondaryConsistency.failCount} fail
                            {secondaryConsistency.failCount === 1 ? '' : 's'} and{' '}
                            {secondaryConsistency.deathCount} death
                            {secondaryConsistency.deathCount === 1 ? '' : 's'} still
                            suggest that consistency may deserve practice.
                          </p>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowMatches((value) => !value)}
                      className="flex w-full items-center justify-between gap-3 border border-rose-500/45 bg-rose-500/10 px-3 py-3 text-left font-mono text-sm text-rose-300 transition hover:bg-rose-500/15"
                    >
                      <span>
                        {weakest.bastionType
                          ? `${weakest.bastionType} ${weakest.label}`
                          : weakest.label}{' - '}
                        {weakest.basis === 'consistency'
                          ? 'consistency focus'
                          : `${formatDelta(weakest.difference)} slower (${formatGap(
                              weakest.gapPercent,
                            )})`}{' '}
                        - {weakest.failCount} fail
                        {weakest.failCount === 1 ? '' : 's'} - {weakest.deathCount}{' '}
                        death{weakest.deathCount === 1 ? '' : 's'}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 transition ${
                          showMatches ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {showMatches && (
                      <div className="border-x border-b border-rose-500/30 bg-background/55 p-3">
                        <div className="grid gap-2 md:grid-cols-2">
                          {weakest.matches.map((match) => (
                            <div
                              key={match.id}
                              className="border border-border bg-card/65 p-3"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate font-medium text-foreground">
                                    {match.seedType} / {match.bastionType}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatDate(match.date)} - vs{' '}
                                    {match.opponent ?? 'Unknown'}
                                  </p>
                                </div>
                                <span className="shrink-0 font-mono text-sm text-cyan-300">
                                  {match.failedHere
                                    ? 'Failed here'
                                    : match.completed
                                      ? formatTime(match.playerTime)
                                      : 'Incomplete'}
                                </span>
                              </div>
                              {(match.deathCount > 0 || match.failedHere) && (
                                <p className="mt-2 font-mono text-xs text-rose-300">
                                  Counted: {match.failedHere ? 'failed attempt' : 'split issue'}
                                  {match.deathCount > 0
                                    ? ` + ${match.deathCount} death${
                                        match.deathCount === 1 ? '' : 's'
                                      }`
                                    : ''}
                                </p>
                              )}
                              <div className="mt-3 flex flex-wrap gap-2">
                                <a
                                  href={match.statsUrl}
                                  className="inline-flex h-8 items-center gap-2 border border-border bg-background px-2 text-xs text-foreground hover:border-primary"
                                >
                                  <BarChart3 className="h-3.5 w-3.5" />
                                  Stats
                                </a>
                                <a
                                  href={`https://ranked.mcsr.in/match/${match.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex h-8 items-center gap-2 border border-border bg-background px-2 text-xs text-foreground hover:border-primary"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                  Official Stats
                                </a>
                                {match.vodUrl && (
                                  <a
                                    href={match.vodUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex h-8 items-center gap-2 border border-primary/40 bg-primary/10 px-2 text-xs text-primary hover:border-primary"
                                  >
                                    <PlayCircle className="h-3.5 w-3.5" />
                                    VOD
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mb-4 mt-8 flex items-center gap-3">
                      <h3 className="font-mono text-sm uppercase text-cyan-400">
                        Recommended guides
                      </h3>
                      <div className="h-px flex-1 bg-cyan-400/40" />
                      <InfoTip label="recommended guides">
                        The first guide matches the selected Practice Focus. Other
                        verified playlist guides may cover secondary consistency
                        issues or useful fundamentals.
                      </InfoTip>
                    </div>
                  </div>
                )}

                <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {analysis.recommendations.map((video) => (
                    <a
                      key={video.url}
                      href={video.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group overflow-hidden border border-border bg-card/80 transition hover:border-primary"
                    >
                      <div className="relative aspect-video overflow-hidden bg-muted">
                        <img
                          src={video.thumbnail}
                          alt=""
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/15" />
                        <div className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-red-600 text-white shadow-lg shadow-black/40">
                          <PlayCircle className="h-8 w-8" />
                        </div>
                      </div>
                      <div className="space-y-2 p-3">
                        <p className="font-mono text-[11px] uppercase tracking-wide text-primary">
                          Official MCSR Ranked guide · {video.duration}
                        </p>
                        <h4 className="line-clamp-2 min-h-10 text-sm font-semibold text-foreground">
                          {video.title}
                        </h4>
                        <p className="line-clamp-2 text-xs text-muted-foreground">
                          {video.focus}
                        </p>
                        <span className="inline-flex items-center gap-1 font-mono text-xs uppercase text-cyan-400">
                          Watch on YouTube
                          <ExternalLink className="h-3 w-3" />
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </section>
            </div>
          ) : (
            <EmptyState />
          )}
        </div>
      </main>
    </>
  )
}

export default function ImprovePage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <ImprovePageContent />
    </Suspense>
  )
}
