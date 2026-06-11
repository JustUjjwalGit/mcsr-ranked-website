'use client'

import { FormEvent, useEffect, useState } from 'react'
import {
  ArrowRightLeft,
  BarChart3,
  CheckCircle2,
  Info,
  Search,
  Sparkles,
  X,
  Zap,
} from 'lucide-react'
import { Header } from '@/components/header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UserAvatar } from '@/components/user-avatar'

interface PlayerSummary {
  uuid: string
  username: string
  country: string
  elo: number
  rank: number
  seasonWins: number
  seasonLosses: number
  seasonWinRate: number
  totalWins: number
  totalLosses: number
  totalWinRate: number
  seasonMatches: number
  totalMatches: number
  currentStreak: number
  bestStreak: number
  bestTime: number | null
  completionRate: number
  forfeitRate: number
  playtime: number
  lastRanked: number | null
  seasonHighestElo: number
  seasonLowestElo: number
}

interface ComparisonMetric {
  key: string
  label: string
  higherIsBetter: boolean
  weight: number
  player1: {
    value: number
    display: string
  }
  player2: {
    value: number
    display: string
  }
}

interface ComparisonData {
  players: [PlayerSummary, PlayerSummary]
  metrics: ComparisonMetric[]
  headToHead: {
    total: number
    player1Wins: number
    player2Wins: number
    player1EloChange: number
    player2EloChange: number
  }
  prediction: {
    winnerUuid: string
    winnerUsername: string
    probabilities: {
      player1: number
      player2: number
    }
    score: {
      player1: number
      player2: number
    }
    confidence: 'High' | 'Medium' | 'Close'
  }
}

function percent(value: number) {
  return `${Math.round(value * 1000) / 10}%`
}

function formatTime(ms: number | null) {
  if (!ms || ms <= 0) return 'N/A'
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function formatPlaytime(ms: number) {
  if (ms <= 0) return '0h'
  const hours = Math.round(ms / 1000 / 60 / 60)
  return `${hours.toLocaleString()}h`
}

function metricWinner(metric: ComparisonMetric) {
  if (metric.player1.value === metric.player2.value) return 'tie'
  if (metric.higherIsBetter) {
    return metric.player1.value > metric.player2.value ? 'player1' : 'player2'
  }
  return metric.player1.value < metric.player2.value ? 'player1' : 'player2'
}

function PlayerCard({
  player,
}: {
  player: PlayerSummary
}) {
  return (
    <Card className="border border-border bg-card p-5">
      <div className="flex min-w-0 items-center gap-3">
        <UserAvatar
          uuid={player.uuid}
          username={player.username}
          size={56}
          className="h-14 w-14 shrink-0 rounded-lg border border-border"
        />
        <div className="min-w-0">
          <h2 className="truncate text-xl font-bold text-foreground">
            {player.username}
          </h2>
          <p className="text-sm text-muted-foreground">
            {player.country} - Rank #{player.rank || '?'}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded border border-border bg-muted/40 p-3">
          <p className="text-xs text-muted-foreground">Elo</p>
          <p className="tabular-figures font-mono text-2xl font-bold text-primary">
            {player.elo.toLocaleString()}
          </p>
        </div>
        <div className="rounded border border-border bg-muted/40 p-3">
          <p className="text-xs text-muted-foreground">Best Time</p>
          <p className="text-2xl font-bold text-foreground">
            {formatTime(player.bestTime)}
          </p>
        </div>
      </div>
    </Card>
  )
}

function QuickStat({
  label,
  value,
}: {
  label: string
  value: string | number
}) {
  return (
    <div className="rounded border border-border bg-muted/40 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
    </div>
  )
}

function VersusStatRow({
  label,
  player1Name,
  player2Name,
  player1Value,
  player2Value,
}: {
  label: string
  player1Name: string
  player2Name: string
  player1Value: string | number
  player2Value: string | number
}) {
  return (
    <div className="grid gap-3 rounded border border-border bg-muted/30 p-3 md:grid-cols-[1fr_1.2fr_1fr] md:items-center">
      <div className="rounded border border-border bg-background/40 p-3 text-left">
        <p className="text-xs text-muted-foreground">{player1Name}</p>
        <p className="font-semibold text-foreground">{player1Value}</p>
      </div>
      <div className="text-center">
        <p className="font-semibold text-foreground">{label}</p>
      </div>
      <div className="rounded border border-border bg-background/40 p-3 text-right">
        <p className="text-xs text-muted-foreground">{player2Name}</p>
        <p className="font-semibold text-foreground">{player2Value}</p>
      </div>
    </div>
  )
}

function TutorialModal({
  onClose,
  onUseExample,
}: {
  onClose: () => void
  onUseExample: () => void
}) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <Card className="max-w-xl border border-primary/40 bg-card p-6 shadow-2xl shadow-black/60">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded border border-primary bg-primary/15 text-primary">
              <Info className="h-5 w-5" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">How Versus Works</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Search two MCSR Ranked players, compare their season and all-time
              stats, then get a winner estimate based on Elo, win rate,
              streaks, consistency, experience, and private room records.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close tutorial"
            onClick={onClose}
            className="rounded p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 rounded border border-border bg-muted/30 p-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
            <div className="rounded border border-border bg-background/60 p-3">
              <p className="text-xs text-muted-foreground">Player A</p>
              <p className="font-semibold text-foreground">edcr</p>
            </div>
            <ArrowRightLeft className="mx-auto h-5 w-5 text-primary" />
            <div className="rounded border border-border bg-background/60 p-3">
              <p className="text-xs text-muted-foreground">Player B</p>
              <p className="font-semibold text-foreground">v_strid</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span>The winner estimate is a stats-based prediction, not a guarantee.</span>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose}>
            Start Empty
          </Button>
          <Button
            onClick={() => {
              onUseExample()
              onClose()
            }}
          >
            Use Example
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default function VersusPage() {
  const [player1, setPlayer1] = useState('')
  const [player2, setPlayer2] = useState('')
  const [comparison, setComparison] = useState<ComparisonData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showTutorial, setShowTutorial] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const initialPlayer1 = params.get('player1')?.trim() ?? ''
    const initialPlayer2 = params.get('player2')?.trim() ?? ''
    const hasPrefilledPlayer = Boolean(initialPlayer1 || initialPlayer2)
    const seenTutorial = window.localStorage.getItem('versus-tutorial-seen')

    if (initialPlayer1) setPlayer1(initialPlayer1)
    if (initialPlayer2) setPlayer2(initialPlayer2)

    setShowTutorial(!seenTutorial && !hasPrefilledPlayer)

    if (
      initialPlayer1 &&
      initialPlayer2 &&
      initialPlayer1.toLowerCase() !== initialPlayer2.toLowerCase()
    ) {
      void comparePlayers(undefined, {
        player1: initialPlayer1,
        player2: initialPlayer2,
      })
    }
  }, [])

  function closeTutorial() {
    window.localStorage.setItem('versus-tutorial-seen', 'true')
    setShowTutorial(false)
  }

  async function comparePlayers(
    event?: FormEvent<HTMLFormElement>,
    overridePlayers?: { player1: string; player2: string },
  ) {
    event?.preventDefault()
    const first = (overridePlayers?.player1 ?? player1).trim()
    const second = (overridePlayers?.player2 ?? player2).trim()

    if (!first || !second) {
      setError('Enter two player names to compare.')
      return
    }

    if (first.toLowerCase() === second.toLowerCase()) {
      setError('Choose two different players.')
      return
    }

    try {
      setLoading(true)
      setError('')
      const response = await fetch(
        `/api/versus?player1=${encodeURIComponent(first)}&player2=${encodeURIComponent(
          second,
        )}`,
      )
      const data = await response.json()

      if (!response.ok || !data.comparison) {
        setComparison(null)
        setError(data.error || 'Could not compare those players.')
        return
      }

      setComparison(data.comparison)
    } catch {
      setComparison(null)
      setError('Could not compare those players.')
    } finally {
      setLoading(false)
    }
  }

  function useExample() {
    const example = { player1: 'edcr', player2: 'v_strid' }
    setPlayer1(example.player1)
    setPlayer2(example.player2)
    void comparePlayers(undefined, example)
  }

  const firstPlayer = comparison?.players[0]
  const secondPlayer = comparison?.players[1]

  return (
    <>
      <Header />
      {showTutorial && (
        <TutorialModal onClose={closeTutorial} onUseExample={useExample} />
      )}

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded border border-primary bg-primary/15 text-primary">
                <ArrowRightLeft className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-foreground">Versus</h1>
                <p className="text-muted-foreground">
                  Compare two players and estimate who has the statistical edge
                </p>
              </div>
            </div>
          </div>

          <Card className="border border-border bg-card p-5">
            <form
              onSubmit={comparePlayers}
              className="grid gap-4 md:grid-cols-[minmax(0,1fr)_3rem_minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_4rem_minmax(0,1fr)_auto] lg:items-center"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={player1}
                  onChange={(event) => setPlayer1(event.target.value)}
                  placeholder="First player"
                  className="h-11 w-full rounded border border-border bg-input pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex h-11 items-center justify-center rounded border border-primary/40 bg-primary/10 text-sm font-bold text-primary">
                VS
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={player2}
                  onChange={(event) => setPlayer2(event.target.value)}
                  placeholder="Second player"
                  className="h-11 w-full rounded border border-border bg-input pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="h-11 md:col-span-3 lg:col-span-1"
              >
                {loading ? 'Comparing...' : 'Compare'}
              </Button>
            </form>

            {error && (
              <div className="mt-4 rounded border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
                {error}
              </div>
            )}
          </Card>

          {loading && (
            <Card className="border border-border bg-card p-8">
              <div className="flex items-center justify-center gap-3 text-muted-foreground">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Comparing player stats...
              </div>
            </Card>
          )}

          {comparison && firstPlayer && secondPlayer && (
            <div className="space-y-6">
              <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">
                <PlayerCard player={firstPlayer} />
                <div className="flex items-center justify-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded border border-primary bg-primary/15 text-primary">
                    <Zap className="h-5 w-5" />
                  </div>
                </div>
                <PlayerCard player={secondPlayer} />
              </div>

              <Card className="border border-border bg-card p-6">
                <div className="mb-5 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-bold text-foreground">
                    Stat Comparison
                  </h2>
                </div>

                <div className="space-y-2">
                  {comparison.metrics.map((metric) => {
                    const winner = metricWinner(metric)

                    return (
                      <div
                        key={metric.key}
                        className="grid gap-3 rounded border border-border bg-muted/30 p-3 md:grid-cols-[1fr_1.2fr_1fr] md:items-center"
                      >
                        <div
                          className={`rounded border p-3 text-left ${
                            winner === 'player1'
                              ? 'border-primary/50 bg-primary/10 text-primary'
                              : 'border-border bg-background/40 text-foreground'
                          }`}
                        >
                          <p className="text-xs text-muted-foreground">
                            {firstPlayer.username}
                          </p>
                          <p className="font-semibold">{metric.player1.display}</p>
                        </div>

                        <div className="text-center">
                          <p className="font-semibold text-foreground">{metric.label}</p>
                          <p className="text-xs text-muted-foreground">
                            Weight {metric.weight}
                          </p>
                        </div>

                        <div
                          className={`rounded border p-3 text-right ${
                            winner === 'player2'
                              ? 'border-primary/50 bg-primary/10 text-primary'
                              : 'border-border bg-background/40 text-foreground'
                          }`}
                        >
                          <p className="text-xs text-muted-foreground">
                            {secondPlayer.username}
                          </p>
                          <p className="font-semibold">{metric.player2.display}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>

              <Card className="border border-border bg-card p-6">
                <h2 className="mb-4 text-xl font-bold text-foreground">
                  Extra Context
                </h2>
                <div className="space-y-2">
                  <VersusStatRow
                    label="Season Record"
                    player1Name={firstPlayer.username}
                    player2Name={secondPlayer.username}
                    player1Value={`${firstPlayer.seasonWins}-${firstPlayer.seasonLosses}`}
                    player2Value={`${secondPlayer.seasonWins}-${secondPlayer.seasonLosses}`}
                  />
                  <VersusStatRow
                    label="All-Time Record"
                    player1Name={firstPlayer.username}
                    player2Name={secondPlayer.username}
                    player1Value={`${firstPlayer.totalWins}-${firstPlayer.totalLosses}`}
                    player2Value={`${secondPlayer.totalWins}-${secondPlayer.totalLosses}`}
                  />
                  <VersusStatRow
                    label="Total Matches"
                    player1Name={firstPlayer.username}
                    player2Name={secondPlayer.username}
                    player1Value={firstPlayer.totalMatches.toLocaleString()}
                    player2Value={secondPlayer.totalMatches.toLocaleString()}
                  />
                  <VersusStatRow
                    label="Season Playtime"
                    player1Name={firstPlayer.username}
                    player2Name={secondPlayer.username}
                    player1Value={formatPlaytime(firstPlayer.playtime)}
                    player2Value={formatPlaytime(secondPlayer.playtime)}
                  />
                  <VersusStatRow
                    label="Best Streak"
                    player1Name={firstPlayer.username}
                    player2Name={secondPlayer.username}
                    player1Value={firstPlayer.bestStreak}
                    player2Value={secondPlayer.bestStreak}
                  />
                  <VersusStatRow
                    label="Season Elo Range"
                    player1Name={firstPlayer.username}
                    player2Name={secondPlayer.username}
                    player1Value={`${firstPlayer.seasonLowestElo}-${firstPlayer.seasonHighestElo}`}
                    player2Value={`${secondPlayer.seasonLowestElo}-${secondPlayer.seasonHighestElo}`}
                  />
                </div>
              </Card>

              <Card className="border border-primary/40 bg-primary/5 p-6">
                <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr] lg:items-center">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-primary">
                      <Sparkles className="h-5 w-5" />
                      <h2 className="text-xl font-bold">Final Prediction</h2>
                    </div>
                    <p className="text-3xl font-bold text-foreground">
                      {comparison.prediction.winnerUsername}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {comparison.prediction.confidence} confidence after comparing
                      ranked stats, consistency, experience, and private room record.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="mb-2 flex justify-between text-sm">
                        <span className="font-medium text-foreground">
                          {firstPlayer.username}
                        </span>
                        <span className="font-medium text-foreground">
                          {secondPlayer.username}
                        </span>
                      </div>
                      <div className="h-4 overflow-hidden rounded bg-background/80">
                        <div
                          className="h-full bg-primary"
                          style={{
                            width: `${comparison.prediction.probabilities.player1}%`,
                          }}
                        />
                      </div>
                      <div className="mt-2 flex justify-between text-sm text-muted-foreground">
                        <span>{comparison.prediction.probabilities.player1}%</span>
                        <span>{comparison.prediction.probabilities.player2}%</span>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <QuickStat
                        label="Private Room Record"
                        value={`${comparison.headToHead.player1Wins}-${comparison.headToHead.player2Wins}`}
                      />
                      <QuickStat
                        label="Weighted Score"
                        value={`${Math.round(comparison.prediction.score.player1)}-${Math.round(
                          comparison.prediction.score.player2,
                        )}`}
                      />
                      <QuickStat
                        label="Private Room Elo"
                        value={`${comparison.headToHead.player1EloChange >= 0 ? '+' : ''}${
                          comparison.headToHead.player1EloChange
                        } / ${
                          comparison.headToHead.player2EloChange >= 0 ? '+' : ''
                        }${comparison.headToHead.player2EloChange}`}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
