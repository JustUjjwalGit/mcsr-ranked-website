'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/header'
import { Card } from '@/components/ui/card'
import { UserAvatar } from '@/components/user-avatar'

interface EloBucket {
  label: string
  players: number
}

interface EloMover {
  uuid: string
  username: string
  eloChange: number
  matches: number
}

interface TopPlayer {
  uuid: string
  username: string
  elo: number
  rank: number
}

interface GlobalStats {
  leaderboardPlayers: number
  averageElo: number
  highestElo: number
  topCountry: string
  topPlayer: TopPlayer | null
  recentActivity: number
  liveMatches: number
  eloDistribution: EloBucket[]
  eloDistributionPlayers: number
  topGainers: EloMover[]
  topLosers: EloMover[]
  seasonInfo?: {
    name: string
    number: number
    startDate: string
    endDate: string
  }
}

function EloDistributionChart({ buckets }: { buckets: EloBucket[] }) {
  const maxPlayers = Math.max(...buckets.map((bucket) => bucket.players), 1)

  return (
    <div className="flex h-56 items-end gap-1 overflow-x-auto rounded border border-border bg-muted/30 px-4 py-3">
      {buckets.map((bucket) => (
        <div
          key={bucket.label}
          className="flex min-w-8 flex-1 flex-col items-center gap-2"
        >
          <div className="flex h-36 w-full items-end">
            <div
              className="w-full rounded-t bg-primary transition-all"
              style={{
                height: `${Math.max(
                  (bucket.players / maxPlayers) * 100,
                  bucket.players > 0 ? 8 : 2,
                )}%`,
              }}
              title={`${bucket.players} players in ${bucket.label} Elo bucket`}
            />
          </div>
          <span className="text-xs font-medium text-foreground tabular-figures">
            {bucket.players}
          </span>
          <span className="w-full truncate text-center text-[11px] text-muted-foreground">
            {bucket.label}
          </span>
        </div>
      ))}
    </div>
  )
}

function TopPlayerSummary({ player }: { player: TopPlayer | null | undefined }) {
  if (!player) {
    return (
      <div className="rounded border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
        No top player data
      </div>
    )
  }

  return (
    <a
      href={`/player/${player.username}`}
      className="flex items-center justify-between gap-3 rounded border border-border bg-muted/40 p-3 transition hover:bg-muted"
    >
      <span className="flex min-w-0 items-center gap-3">
        <UserAvatar
          uuid={player.uuid}
          username={player.username}
          size={36}
          className="h-9 w-9 shrink-0 rounded-md border border-border"
        />
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-foreground">
            {player.username}
          </span>
          <span className="block text-xs text-muted-foreground">Rank #{player.rank}</span>
        </span>
      </span>
      <span className="shrink-0 text-sm font-semibold text-primary">
        {player.elo.toLocaleString()}
      </span>
    </a>
  )
}

function MoversList({
  emptyText,
  movers,
}: {
  emptyText: string
  movers: EloMover[]
}) {
  if (movers.length === 0) {
    return (
      <div className="rounded border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
        {emptyText}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {movers.map((mover) => (
        <a
          key={mover.uuid}
          href={`/player/${mover.username}`}
          className="flex items-center justify-between gap-3 rounded border border-border bg-muted/50 p-3 transition hover:bg-muted"
        >
          <span className="flex min-w-0 items-center gap-3">
            <UserAvatar
              uuid={mover.uuid}
              username={mover.username}
              size={32}
              className="h-8 w-8 shrink-0 rounded-md border border-border"
            />
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-foreground">
                {mover.username}
              </span>
              <span className="block text-xs text-muted-foreground">
                {mover.matches} {mover.matches === 1 ? 'match' : 'matches'}
              </span>
            </span>
          </span>
          <span
            className={`shrink-0 text-sm font-semibold ${
              mover.eloChange > 0 ? 'text-green-500' : 'text-red-500'
            }`}
          >
            {mover.eloChange > 0 ? '+' : ''}
            {mover.eloChange} Elo
          </span>
        </a>
      ))}
    </div>
  )
}

export default function StatsPage() {
  const [stats, setStats] = useState<GlobalStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [season, setSeason] = useState('current')
  const [currentSeason, setCurrentSeason] = useState(11)

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true)
        const params = season === 'current' ? '' : `?season=${season}`
        const res = await fetch(`/api/stats${params}`)
        const data = await res.json()

        if (data.stats) {
          setStats(data.stats)
          if (data.stats.seasonInfo?.number) {
            setCurrentSeason(data.stats.seasonInfo.number)
          }
        }
      } catch (error) {
        console.error('Failed to load stats:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [season])

  const seasonOptions = Array.from(
    { length: currentSeason },
    (_, index) => currentSeason - index,
  )

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-foreground">Global Statistics</h1>
            <p className="text-muted-foreground">
              Overall metrics and insights for the MCSR community
            </p>
          </div>

          {/* Season Info */}
          {stats?.seasonInfo && (
            <Card className="border border-primary bg-primary/5 p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-primary">
                    {stats.seasonInfo.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {stats.seasonInfo.startDate} - {stats.seasonInfo.endDate}
                  </p>
                </div>
                <select
                  value={season}
                  onChange={(event) => setSeason(event.target.value)}
                  className="h-10 rounded border border-border bg-input px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="current">Current Season</option>
                  {seasonOptions.map((seasonNumber) => (
                    <option key={seasonNumber} value={seasonNumber}>
                      Season {seasonNumber}
                    </option>
                  ))}
                </select>
              </div>
            </Card>
          )}

          {/* Stats Grid */}
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-40 animate-pulse rounded border border-border bg-muted"
                ></div>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="border border-border bg-card p-6">
                <p className="text-sm text-muted-foreground mb-2">Recent Ranked</p>
                <p className="text-3xl font-bold text-foreground">
                  {stats?.recentActivity?.toLocaleString() || '0'}
                </p>
              </Card>

              <Card className="border border-border bg-card p-6">
                <p className="text-sm text-muted-foreground mb-2">Live Matches</p>
                <p className="text-3xl font-bold text-foreground">
                  {stats?.liveMatches?.toLocaleString() || '0'}
                </p>
              </Card>

              <Card className="border border-border bg-card p-6">
                <p className="text-sm text-muted-foreground mb-2">Highest Elo</p>
                <p className="text-3xl font-bold text-primary">
                  {stats?.highestElo?.toLocaleString() || '0'}
                </p>
              </Card>

              <Card className="border border-border bg-card p-6">
                <p className="text-sm text-muted-foreground mb-2">Top Country</p>
                <p className="text-3xl font-bold text-foreground">
                  {stats?.topCountry || 'N/A'}
                </p>
              </Card>
            </div>
          )}

          {/* Elo Distribution */}
          <Card className="border border-border bg-card p-6">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(360px,1.6fr)]">
              <div className="space-y-3">
                <h2 className="text-xl font-bold text-foreground">Elo Distribution</h2>
                <p className="text-3xl font-semibold text-primary">
                  {stats?.averageElo?.toLocaleString() || '0'}
                </p>
                <p className="text-sm text-muted-foreground">
                  average Elo across recent ranked match players
                </p>
                <div className="grid gap-3 pt-2 sm:grid-cols-2 lg:grid-cols-1">
                  <div className="rounded border border-border bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">Recent Players</p>
                    <p className="text-lg font-semibold text-foreground">
                      {stats?.eloDistributionPlayers?.toLocaleString() || '0'}
                    </p>
                  </div>
                  <TopPlayerSummary player={stats?.topPlayer} />
                </div>
              </div>
              <EloDistributionChart buckets={stats?.eloDistribution ?? []} />
            </div>
          </Card>

          {/* Additional Metrics */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border border-border bg-card p-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">
                  Top Gainers (24h)
                </h3>
                <MoversList
                  movers={stats?.topGainers ?? []}
                  emptyText="No Elo gains found in the recent match window."
                />
              </div>
            </Card>

            <Card className="border border-border bg-card p-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">
                  Top Losers (24h)
                </h3>
                <MoversList
                  movers={stats?.topLosers ?? []}
                  emptyText="No Elo losses found in the recent match window."
                />
              </div>
            </Card>
          </div>
        </div>
      </main>
    </>
  )
}
