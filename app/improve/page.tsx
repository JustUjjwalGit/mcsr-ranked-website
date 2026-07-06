'use client'

import { FormEvent, useState } from 'react'
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
  recommendations: Array<{
    title: string
    url: string
    focus: string
    thumbnail: string
  }>
  formatted: {
    averageCompletion: string
    bestCompletion: string
  }
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

export default function ImprovePage() {
  const [username, setUsername] = useState('')
  const [analysis, setAnalysis] = useState<ImproveAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showMatches, setShowMatches] = useState(false)

  async function analyzePlayer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const query = username.trim()
    if (!query) {
      setError('Enter a username first.')
      return
    }

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
  }

  const weakest = analysis?.weakness

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-3 py-6 sm:px-4 sm:py-8">
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
            <div className="border border-border bg-card p-10">
              <SiteLoader label="Reviewing recent matches..." />
            </div>
          ) : analysis ? (
            <section className="overflow-hidden border border-border bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:64px_64px]">
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
                <p className="mt-3 font-mono text-xs text-muted-foreground">
                  Recent {analysis.sample.detailMatches} ranked duels - time gaps,
                  failed attempts, and deaths vs {analysis.comparison.benchmarkLabel}
                </p>
              </div>

              <div className="p-4 sm:p-5">
                <div className="mb-4 flex items-center gap-3">
                  <h3 className="font-mono text-sm uppercase text-cyan-400">
                    Your splits vs {analysis.comparison.targetTier}
                  </h3>
                  <div className="h-px flex-1 bg-cyan-400/40" />
                </div>

                <div className="overflow-x-auto border border-border bg-card/80">
                  <table className="w-full min-w-[900px] text-sm">
                    <thead className="border-b border-border bg-muted/25">
                      <tr className="font-mono text-xs uppercase text-muted-foreground">
                        <th className="px-4 py-3 text-left font-medium">Split</th>
                        <th className="px-4 py-3 text-right font-medium">You</th>
                        <th className="px-4 py-3 text-right font-medium">
                          {analysis.comparison.targetTier} avg
                        </th>
                        <th className="px-4 py-3 text-right font-medium">
                          Difference
                        </th>
                        <th className="px-4 py-3 text-right font-medium">Gap</th>
                        <th className="px-4 py-3 text-right font-medium">Avg Sample</th>
                        <th className="px-4 py-3 text-right font-medium">Fails</th>
                        <th className="px-4 py-3 text-right font-medium">Deaths</th>
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
                        Recommended guides
                      </h3>
                      <div className="h-px flex-1 bg-cyan-400/40" />
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowMatches((value) => !value)}
                      className="flex w-full items-center justify-between gap-3 border border-rose-500/45 bg-rose-500/10 px-3 py-3 text-left font-mono text-sm text-rose-300 transition hover:bg-rose-500/15"
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
          ) : (
            <EmptyState />
          )}
        </div>
      </main>
    </>
  )
}
