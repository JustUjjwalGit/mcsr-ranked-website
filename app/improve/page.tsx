'use client'

import { FormEvent, useState } from 'react'
import {
  ArrowUpRight,
  BarChart3,
  Flame,
  PlayCircle,
  Search,
  ShieldAlert,
  Sparkles,
  Timer,
} from 'lucide-react'
import { Header } from '@/components/header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SiteLoader } from '@/components/site-loader'
import { UserAvatar } from '@/components/user-avatar'

interface SplitSample {
  key: string
  label: string
  average: number | null
  median: number | null
  last: number | null
  deltaFromAverage: number | null
  samples: number
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
  }
  overview: {
    completionRate: number
    averageCompletion: number | null
    bestCompletion: number | null
    mostCommonSeed: string
    primaryWeakness: string
    failureCount: number
  }
  lastCompleted: {
    id: number
    date: number
    time: number | null
    seedType: string
    bastionType: string
    statsUrl: string
    vodUrl: string | null
    splits: Array<{
      key: string
      label: string
      time: number | null
    }>
  } | null
  splitSamples: SplitSample[]
  failures: Array<{
    phase: string
    count: number
  }>
  recommendations: Array<{
    title: string
    url: string
    focus: string
  }>
  recentMatches: Array<{
    id: number
    date: number
    time: number | null
    completed: boolean
    forfeited: boolean
    phase: string
    seedType: string
    bastionType: string
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

function formatDate(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleDateString()
}

function percent(value: number) {
  return `${Math.round(value * 1000) / 10}%`
}

function StatCard({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail?: string
}) {
  return (
    <Card className="border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 break-words text-2xl font-bold text-foreground">
        {value}
      </p>
      {detail && <p className="mt-2 text-xs text-muted-foreground">{detail}</p>}
    </Card>
  )
}

function EmptyState() {
  return (
    <Card className="border border-dashed border-border bg-card/70 p-8 text-center">
      <Sparkles className="mx-auto h-8 w-8 text-primary" />
      <h2 className="mt-4 text-xl font-bold text-foreground">
        Find what to practice next
      </h2>
      <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
        Type a username to scan recent ranked matches, find repeated failure
        points, inspect the latest completed run splits, and get focused video
        recommendations.
      </p>
    </Card>
  )
}

export default function ImprovePage() {
  const [username, setUsername] = useState('')
  const [analysis, setAnalysis] = useState<ImproveAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-3 py-6 sm:px-4 sm:py-8">
        <div className="space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded border border-primary bg-primary/15 text-primary">
                  <Flame className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
                    Improve
                  </h1>
                  <p className="text-muted-foreground">
                    Recent match review, split check, and practice targets
                  </p>
                </div>
              </div>
            </div>

            <Card className="border border-border bg-card p-3 sm:p-4">
              <form
                onSubmit={analyzePlayer}
                className="grid gap-3 sm:grid-cols-[minmax(18rem,1fr)_auto]"
              >
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="Username"
                    className="h-11 w-full rounded border border-border bg-input pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <Button type="submit" disabled={loading} className="h-11">
                  {loading ? 'Analyzing...' : 'Analyze'}
                </Button>
              </form>
            </Card>
          </div>

          {error && (
            <Card className="border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
              {error}
            </Card>
          )}

          {loading ? (
            <Card className="border border-border bg-card p-10">
              <SiteLoader label="Reviewing recent matches..." />
            </Card>
          ) : analysis ? (
            <div className="space-y-6">
              <Card className="border border-primary/40 bg-card p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-4">
                    <UserAvatar
                      uuid={analysis.player.uuid}
                      username={analysis.player.username}
                      size={64}
                      className="h-16 w-16 shrink-0 rounded-lg border border-primary/40"
                    />
                    <div className="min-w-0">
                      <h2 className="truncate text-2xl font-bold text-foreground">
                        {analysis.player.username}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Rank #{analysis.player.rank || '?'} -{' '}
                        {analysis.player.elo.toLocaleString()} Elo -{' '}
                        {analysis.player.country}
                      </p>
                    </div>
                  </div>
                  <div className="rounded border border-primary/40 bg-primary/10 px-4 py-3">
                    <p className="text-xs uppercase text-muted-foreground">
                      Main Focus
                    </p>
                    <p className="font-semibold text-primary">
                      {analysis.overview.primaryWeakness}
                    </p>
                  </div>
                </div>
              </Card>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  label="Completion Rate"
                  value={percent(analysis.overview.completionRate)}
                  detail={`${analysis.sample.completed}/${analysis.sample.matches} recent matches completed`}
                />
                <StatCard
                  label="Average Finish"
                  value={analysis.formatted.averageCompletion}
                  detail={`${analysis.sample.completed} completed samples`}
                />
                <StatCard
                  label="Best Recent Finish"
                  value={analysis.formatted.bestCompletion}
                  detail={analysis.overview.mostCommonSeed}
                />
                <StatCard
                  label="Most Common Fail"
                  value={analysis.overview.primaryWeakness}
                  detail={`${analysis.overview.failureCount} recent forfeits`}
                />
              </div>

              <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
                <Card className="border border-border bg-card p-4 sm:p-6">
                  <div className="mb-5 flex items-center gap-2">
                    <Timer className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-bold text-foreground">
                      Last Completed Match Splits
                    </h2>
                  </div>

                  {analysis.lastCompleted ? (
                    <div className="space-y-4">
                      <div className="grid gap-3 md:grid-cols-3">
                        <div className="rounded border border-border bg-muted/40 p-3">
                          <p className="text-xs text-muted-foreground">Finish</p>
                          <p className="text-lg font-bold text-primary">
                            {formatTime(analysis.lastCompleted.time)}
                          </p>
                        </div>
                        <div className="rounded border border-border bg-muted/40 p-3">
                          <p className="text-xs text-muted-foreground">Seed</p>
                          <p className="font-semibold text-foreground">
                            {analysis.lastCompleted.seedType} /{' '}
                            {analysis.lastCompleted.bastionType}
                          </p>
                        </div>
                        <div className="rounded border border-border bg-muted/40 p-3">
                          <p className="text-xs text-muted-foreground">Date</p>
                          <p className="font-semibold text-foreground">
                            {formatDate(analysis.lastCompleted.date)}
                          </p>
                        </div>
                      </div>

                      <div className="overflow-x-auto rounded border border-border">
                        <table className="w-full text-sm">
                          <thead className="border-b border-border bg-muted/40">
                            <tr>
                              <th className="px-3 py-3 text-left text-muted-foreground">
                                Split
                              </th>
                              <th className="px-3 py-3 text-right text-muted-foreground">
                                Time
                              </th>
                              <th className="px-3 py-3 text-right text-muted-foreground">
                                Avg Gap
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {analysis.splitSamples.map((split) => (
                              <tr key={split.key} className="border-b border-border">
                                <td className="px-3 py-3 font-medium text-foreground">
                                  {split.label}
                                </td>
                                <td className="px-3 py-3 text-right font-mono text-foreground">
                                  {formatTime(split.last)}
                                </td>
                                <td
                                  className={`px-3 py-3 text-right font-mono ${
                                    (split.deltaFromAverage ?? 0) > 0
                                      ? 'text-red-400'
                                      : 'text-green-400'
                                  }`}
                                >
                                  {formatDelta(split.deltaFromAverage)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row">
                        <a
                          href={analysis.lastCompleted.statsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-9 items-center justify-center gap-2 rounded border border-border bg-background px-3 text-sm font-medium text-foreground transition hover:bg-muted"
                        >
                          <BarChart3 className="h-4 w-4" />
                          Match Stats
                        </a>
                        {analysis.lastCompleted.vodUrl && (
                          <a
                            href={analysis.lastCompleted.vodUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-9 items-center justify-center gap-2 rounded border border-primary/40 bg-primary/10 px-3 text-sm font-medium text-primary transition hover:border-primary"
                          >
                            <PlayCircle className="h-4 w-4" />
                            Watch VOD
                          </a>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="rounded border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                      No completed match found in the recent sample.
                    </p>
                  )}
                </Card>

                <Card className="border border-border bg-card p-4 sm:p-6">
                  <div className="mb-5 flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-bold text-foreground">
                      Fail Pattern
                    </h2>
                  </div>

                  <div className="space-y-3">
                    {analysis.failures.length > 0 ? (
                      analysis.failures.map((failure) => {
                        const max = Math.max(
                          ...analysis.failures.map((item) => item.count),
                          1,
                        )

                        return (
                          <div
                            key={failure.phase}
                            className="rounded border border-border bg-muted/35 p-3"
                          >
                            <div className="mb-2 flex justify-between gap-3">
                              <span className="font-medium text-foreground">
                                {failure.phase}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {failure.count}
                              </span>
                            </div>
                            <div className="h-2 overflow-hidden rounded bg-background">
                              <div
                                className="h-full rounded bg-primary"
                                style={{ width: `${(failure.count / max) * 100}%` }}
                              />
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <p className="rounded border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                        No forfeit pattern found in the recent sample.
                      </p>
                    )}
                  </div>
                </Card>
              </div>

              <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                <Card className="border border-border bg-card p-4 sm:p-6">
                  <h2 className="mb-4 text-xl font-bold text-foreground">
                    Practice Videos
                  </h2>
                  <div className="space-y-3">
                    {analysis.recommendations.map((video) => (
                      <a
                        key={video.url}
                        href={video.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded border border-border bg-muted/35 p-4 transition hover:border-primary hover:bg-muted/50"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-semibold text-foreground">
                              {video.title}
                            </h3>
                            <p className="mt-1 text-sm leading-5 text-muted-foreground">
                              {video.focus}
                            </p>
                          </div>
                          <ArrowUpRight className="h-4 w-4 shrink-0 text-primary" />
                        </div>
                      </a>
                    ))}
                  </div>
                </Card>

                <Card className="border border-border bg-card p-4 sm:p-6">
                  <h2 className="mb-4 text-xl font-bold text-foreground">
                    Recent Match Review
                  </h2>
                  <div className="space-y-2">
                    {analysis.recentMatches.map((match) => (
                      <div
                        key={match.id}
                        className="grid gap-3 rounded border border-border bg-muted/35 p-3 sm:grid-cols-[1fr_auto] sm:items-center"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-foreground">
                            {match.seedType} / {match.bastionType}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(match.date)} - {match.phase}
                          </p>
                        </div>
                        <div
                          className={`rounded border px-3 py-1 text-sm font-semibold ${
                            match.completed
                              ? 'border-green-500/30 bg-green-500/10 text-green-400'
                              : 'border-red-500/30 bg-red-500/10 text-red-400'
                          }`}
                        >
                          {match.completed ? formatTime(match.time) : 'Forfeit'}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          ) : (
            <EmptyState />
          )}
        </div>
      </main>
    </>
  )
}
