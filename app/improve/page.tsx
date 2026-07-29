'use client'

import { FormEvent, useRef, useState } from 'react'
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
import {
  VideoGuides,
  type VideoGuide,
} from '@/components/improve/video-guides'
import type { PlayerDashboard } from '@/components/improve/types'

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
    bastionType: string | null
    matches: WeaknessMatch[]
  } | null
  recommendations: VideoGuide[]
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
    <div className="rounded-lg border border-border bg-[var(--secondary-surface)] px-3.5 py-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-1.5 font-mono text-[16px] font-semibold tabular-nums text-foreground">
        {value}
      </p>
    </div>
  )
}

export default function ImprovePage() {
  const [username, setUsername] = useState('')
  const [analysis, setAnalysis] = useState<ImproveAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showMatches, setShowMatches] = useState(false)
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null)
  const requestRef = useRef<{ id: number; controller: AbortController } | null>(null)

  async function analyzePlayer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const query = username.trim()
    if (!query) {
      setError('Enter a username first.')
      return
    }

    requestRef.current?.controller.abort()
    const request = {
      id: (requestRef.current?.id ?? 0) + 1,
      controller: new AbortController(),
    }
    requestRef.current = request

    try {
      setLoading(true)
      setError('')
      setShowMatches(false)
      setActiveVideoId(null)
      setAnalysis(null)
      const response = await fetch(
        `/api/improve?username=${encodeURIComponent(query)}`,
        { signal: request.controller.signal },
      )
      const data = await response.json()
      if (requestRef.current?.id !== request.id) return

      if (!response.ok || !data.analysis) {
        setAnalysis(null)
        setError(data.error || 'Could not analyze that player.')
        return
      }

      setAnalysis(data.analysis)
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === 'AbortError') return
      setAnalysis(null)
      setError('Could not analyze that player.')
    } finally {
      if (requestRef.current?.id === request.id) setLoading(false)
    }
  }

  const weakest = analysis?.weakness

  return (
    <>
      <Header />
      <main className="mx-auto max-w-[1440px] px-4 py-7 sm:py-9 lg:px-6">
        <div className="space-y-7">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/35 bg-primary/12 text-primary shadow-lg shadow-black/20">
                <Flame className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-[30px] font-bold leading-9 tracking-tight text-foreground">
                  Improve
                </h1>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Split comparison and focused practice guides
                </p>
              </div>
            </div>
          </div>

          <form
            onSubmit={analyzePlayer}
            className="grid gap-4 rounded-xl border border-border bg-card p-4 shadow-[0_16px_38px_rgba(0,0,0,0.22)] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:p-5"
            data-analysis-controls
          >
            <label htmlFor="improve-player" className="min-w-0">
              <span className="mb-2 block text-[13px] font-semibold text-foreground">
                Player
              </span>
              <span className="relative block">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="improve-player"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Enter an MCSR Ranked username"
                  autoComplete="off"
                  className="h-14 w-full rounded-lg border border-border bg-input pl-12 pr-4 text-base text-foreground shadow-inner shadow-black/10 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </span>
            </label>
            <Button type="submit" disabled={loading} className="h-14 min-w-36 rounded-lg px-6 text-sm font-semibold">
              {loading ? 'Analyzing...' : 'Analyze player'}
            </Button>
          </form>

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
            <div className="space-y-8">
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

            <section className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_18px_44px_rgba(0,0,0,0.24)]">
              <div className="border-b border-border bg-card p-5 sm:p-6">
                <p className="font-mono text-xs uppercase text-muted-foreground">
                  Comparing you to
                </p>
                <div className="mt-2 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <UserAvatar
                      uuid={analysis.player.uuid}
                      username={analysis.player.username}
                      size={64}
                      className="h-16 w-16 shrink-0 rounded-lg border border-border"
                    />
                    <div className="min-w-0">
                      <h2 className="break-words text-[26px] font-bold leading-8 text-foreground">
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
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
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
                <p className="mt-4 font-mono text-[12px] leading-5 text-muted-foreground">
                  Recent {analysis.sample.detailMatches} ranked duels - time gaps,
                  failed attempts, and deaths vs {analysis.comparison.benchmarkLabel}
                </p>
              </div>

              <div className="p-5 sm:p-6">
                <div className="mb-5 flex items-center gap-3">
                  <h3 className="text-[17px] font-semibold text-foreground">
                    Your splits vs {analysis.comparison.targetTier}
                  </h3>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <div className="min-w-0" data-comparison-table>
                  <table className="hidden w-full table-fixed border-separate border-spacing-y-2 text-[13px] lg:table">
                    <thead>
                      <tr className="font-mono text-[11px] uppercase text-muted-foreground">
                        <th className="px-2 pb-1 text-left font-medium">Split</th>
                        <th className="px-2 pb-1 text-right font-medium">You</th>
                        <th className="px-2 pb-1 text-right font-medium">
                          {analysis.comparison.targetTier} avg
                        </th>
                        <th className="px-2 pb-1 text-right font-medium">
                          Difference
                        </th>
                        <th className="px-2 pb-1 text-right font-medium">Gap</th>
                        <th className="px-2 pb-1 text-right font-medium">Avg Sample</th>
                        <th className="px-2 pb-1 text-right font-medium">Fails</th>
                        <th className="px-2 pb-1 text-right font-medium">Deaths</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysis.comparison.splitComparisons.map((split) => {
                        const isWeakest = split.key === weakest?.key
                        return (
                          <tr
                            key={split.key}
                            className={isWeakest ? 'comparison-weak-row' : ''}
                          >
                            <td className="comparison-row-cell font-medium text-foreground">
                              {split.label}
                            </td>
                            <td className="comparison-row-cell text-right font-mono font-semibold text-info">
                              {formatTime(split.playerAverage)}
                            </td>
                            <td className="comparison-row-cell text-right font-mono text-muted-foreground">
                              {formatTime(split.benchmarkAverage)}
                            </td>
                            <td
                              className={`comparison-row-cell text-right font-mono ${
                                (split.difference ?? 0) > 0
                                  ? 'text-rose-400'
                                  : 'text-emerald-400'
                              }`}
                            >
                              {formatDelta(split.difference)}
                            </td>
                            <td
                              className={`comparison-row-cell text-right font-mono ${
                                (split.gapPercent ?? 0) > 0
                                  ? 'text-rose-400'
                                  : 'text-emerald-400'
                              }`}
                            >
                              {formatGap(split.gapPercent)}
                            </td>
                            <td className="comparison-row-cell text-right font-mono text-muted-foreground">
                              {split.benchmarkSamples > 0
                                ? split.benchmarkSamples
                                : 'base'}
                            </td>
                            <td className="comparison-row-cell text-right font-mono text-danger">
                              {split.failCount}
                            </td>
                            <td className="comparison-row-cell text-right font-mono text-danger">
                              {split.deathCount}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  <div className="grid gap-3 lg:hidden">
                    {analysis.comparison.splitComparisons.map((split) => {
                      const isWeakest = split.key === weakest?.key
                      return (
                        <article
                          key={split.key}
                          className={`rounded-lg border p-4 ${
                            isWeakest
                              ? 'border-danger/40 bg-[var(--negative-performance-bg)]'
                              : 'border-border bg-[var(--secondary-surface)]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <h4 className="font-semibold text-foreground">{split.label}</h4>
                            <span className="font-mono text-sm font-semibold tabular-nums text-info">
                              {formatTime(split.playerAverage)}
                            </span>
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-[12px] min-[520px]:grid-cols-4">
                            <div>
                              <span className="block text-muted-foreground">{analysis.comparison.targetTier} avg</span>
                              <span className="mt-1 block font-mono tabular-nums text-foreground">{formatTime(split.benchmarkAverage)}</span>
                            </div>
                            <div>
                              <span className="block text-muted-foreground">Difference</span>
                              <span className={`mt-1 block font-mono tabular-nums ${(split.difference ?? 0) > 0 ? 'text-danger' : 'text-success'}`}>{formatDelta(split.difference)}</span>
                            </div>
                            <div>
                              <span className="block text-muted-foreground">Gap</span>
                              <span className={`mt-1 block font-mono tabular-nums ${(split.gapPercent ?? 0) > 0 ? 'text-danger' : 'text-success'}`}>{formatGap(split.gapPercent)}</span>
                            </div>
                            <div>
                              <span className="block text-muted-foreground">Sample / issues</span>
                              <span className="mt-1 block font-mono tabular-nums text-foreground">
                                {split.benchmarkSamples > 0 ? split.benchmarkSamples : 'base'} · {split.failCount}F · {split.deathCount}D
                              </span>
                            </div>
                          </div>
                        </article>
                      )
                    })}
                  </div>
                </div>

                {weakest && (
                  <div className="mt-8">
                    <div className="mb-4 flex items-center gap-3">
                      <h3 className="text-[16px] font-semibold text-foreground">
                        Practice focus
                      </h3>
                      <div className="h-px flex-1 bg-border" />
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowMatches((value) => !value)}
                      className="flex w-full items-center justify-between gap-3 rounded-lg border border-danger/45 bg-[var(--negative-performance-bg)] px-4 py-3.5 text-left font-mono text-sm leading-6 text-danger transition hover:border-danger/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span>
                        {weakest.bastionType
                          ? `${weakest.bastionType} ${weakest.label}`
                          : weakest.label}{' '}
                        - {formatDelta(weakest.difference)} slower (
                        {formatGap(weakest.gapPercent)}) - {weakest.failCount} fail
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
                  </div>
                )}

                <div className="mt-9 border-t border-border pt-7">
                  <div className="mb-5">
                    <h3 className="text-[17px] font-semibold text-foreground">
                      Recommended videos
                    </h3>
                    <p className="mt-1 text-[13px] leading-5 text-muted-foreground">
                      Selected from the official MCSR Ranked Explanations playlist for this player&apos;s loaded sample. Press Play to load one privacy-enhanced YouTube player.
                    </p>
                  </div>
                  <VideoGuides
                    videos={analysis.recommendations}
                    activeVideoId={activeVideoId}
                    onPlay={setActiveVideoId}
                  />
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
