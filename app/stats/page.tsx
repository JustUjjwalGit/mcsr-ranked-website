'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  Activity,
  BarChart3,
  Clock,
  ExternalLink,
  Flame,
  Globe2,
  Search,
  Swords,
  Trophy,
  User,
} from 'lucide-react'
import { Header } from '@/components/header'
import { Button, buttonVariants } from '@/components/ui/button'
import { UserAvatar } from '@/components/user-avatar'
import { SiteLoader } from '@/components/site-loader'
import {
  getBestSeedTypeFromMatches,
  mapMatchToCard,
  mapUserToProfile,
  parseMatchList,
} from '@/lib/mcsr'
import { saveRecentSearch } from '@/lib/player-memory'
import { cn } from '@/lib/utils'

interface CountryBucket {
  country: string
  players: number
}

interface TopPlayer {
  uuid: string
  username: string
  elo: number
  rank: number
}

interface GlobalStats {
  leaderboardPlayers: number
  leaderboardSample?: number
  averageElo: number
  averageRank?: number
  highestElo: number
  topCountry: string
  topPlayer: TopPlayer | null
  recentActivity: number
  liveMatches: number
  topCountries: CountryBucket[]
  seasonInfo?: {
    name: string
    number: number
    startDate: string
    endDate: string
  }
}

interface PlayerProfile {
  uuid: string
  username: string
  elo: number
  rank: number
  wins: number
  losses: number
  country?: string
  statistics?: {
    currentStreak?: number
    bestStreak?: number
    bestTime?: number | null
    seasonMatches?: number
    totalWins?: number
    totalLosses?: number
    totalMatches?: number
    completionRate?: number
    forfeitRate?: number
    playtime?: number
    seasonHighestElo?: number
    seasonLowestElo?: number
    lastRanked?: number | null
    bestSeedType?: string
  }
}

interface MatchCard {
  id: string
  opponent: string
  result: 'win' | 'loss'
  timestamp: string
  duration?: string
  replayPlayer: string
}

function formatTime(ms?: number | null) {
  if (!ms || ms <= 0) return 'N/A'
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function formatPercent(value?: number) {
  return `${Math.round((value ?? 0) * 1000) / 10}%`
}

function formatPlaytime(ms?: number) {
  if (!ms || ms <= 0) return '0h'
  const hours = ms / 1000 / 60 / 60
  if (hours < 1) return `${Math.round(hours * 60)}m`
  return `${Math.round(hours).toLocaleString()}h`
}

function formatDate(timestamp?: number | null) {
  if (!timestamp) return 'N/A'
  return new Date(timestamp * 1000).toLocaleDateString()
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString()
}

function winRate(player: PlayerProfile | null) {
  if (!player) return 0
  const total = player.wins + player.losses
  return total > 0 ? player.wins / total : 0
}

function StatTile({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: string | number
  tone?: 'default' | 'primary' | 'good' | 'bad'
}) {
  const toneClass =
    tone === 'primary'
      ? 'text-primary'
      : tone === 'good'
        ? 'text-emerald-400'
        : tone === 'bad'
          ? 'text-rose-400'
          : 'text-foreground'

  return (
    <div className="border border-border bg-card/85 p-4">
      <p className="font-mono text-xs uppercase text-muted-foreground">{label}</p>
      <p
        className={`mt-2 break-words text-2xl font-bold tabular-figures ${toneClass}`}
      >
        {value}
      </p>
    </div>
  )
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right font-mono text-sm font-semibold text-foreground tabular-figures">
        {value}
      </span>
    </div>
  )
}

function GlobalMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Activity
  label: string
  value: string
}) {
  return (
    <div className="border border-border bg-background/45 p-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4 text-primary" />
        <span className="text-xs uppercase">{label}</span>
      </div>
      <p className="mt-2 font-mono text-xl font-bold text-foreground tabular-figures">
        {value}
      </p>
    </div>
  )
}

function CountryMiniChart({ countries }: { countries: CountryBucket[] }) {
  const maxPlayers = Math.max(...countries.map((country) => country.players), 1)

  return (
    <div className="space-y-2">
      {countries.slice(0, 5).map((country) => (
        <div
          key={country.country}
          className="grid grid-cols-[3rem_1fr_2.5rem] items-center gap-2"
        >
          <span className="truncate text-xs font-semibold uppercase text-foreground">
            {country.country}
          </span>
          <div className="h-2 bg-background/80">
            <div
              className="h-full bg-primary"
              style={{
                width: `${Math.max((country.players / maxPlayers) * 100, 5)}%`,
              }}
            />
          </div>
          <span className="text-right font-mono text-xs text-muted-foreground tabular-figures">
            {country.players}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function StatsPage() {
  const searchParams = useSearchParams()
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null)
  const [globalLoading, setGlobalLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [searchedUsername, setSearchedUsername] = useState('')
  const [player, setPlayer] = useState<PlayerProfile | null>(null)
  const [matches, setMatches] = useState<MatchCard[]>([])
  const [playerLoading, setPlayerLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadGlobalStats() {
      try {
        setGlobalLoading(true)
        const response = await fetch('/api/stats')
        const data = await response.json()
        if (data.stats) setGlobalStats(data.stats)
      } catch (loadError) {
        console.error('Failed to load global stats:', loadError)
      } finally {
        setGlobalLoading(false)
      }
    }

    loadGlobalStats()
  }, [])

  useEffect(() => {
    const playerParam = searchParams.get('player')
    if (!playerParam) return

    setQuery(playerParam)
    void loadPlayer(playerParam)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  async function loadPlayer(username: string) {
    const cleanUsername = username.trim()
    if (!cleanUsername) {
      setError('Enter a player username first.')
      return
    }

    try {
      setPlayerLoading(true)
      setError('')
      setSearchedUsername(cleanUsername)

      const [playerResponse, matchesResponse] = await Promise.all([
        fetch(`/api/player?username=${encodeURIComponent(cleanUsername)}`),
        fetch(`/api/matches?player=${encodeURIComponent(cleanUsername)}&limit=20`),
      ])

      const [playerData, matchesData] = await Promise.all([
        playerResponse.json(),
        matchesResponse.json(),
      ])

      if (!playerResponse.ok || playerData.error) {
        setPlayer(null)
        setMatches([])
        setError(playerData.error || 'Player not found.')
        return
      }

      const profile = mapUserToProfile(playerData)
      const parsedMatches = parseMatchList(matchesData)

      if (!profile) {
        setPlayer(null)
        setMatches([])
        setError('Player not found.')
        return
      }

      saveRecentSearch(profile.username)
      setPlayer({
        ...profile,
        statistics: {
          ...profile.statistics,
          bestSeedType: getBestSeedTypeFromMatches(parsedMatches, profile.uuid),
        },
      })
      setMatches(
        parsedMatches
          .slice(0, 8)
          .map((match) => mapMatchToCard(match, profile.username)),
      )
    } catch {
      setPlayer(null)
      setMatches([])
      setError('Could not load that player.')
    } finally {
      setPlayerLoading(false)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    loadPlayer(query)
  }

  const playerWinRate = useMemo(() => winRate(player), [player])

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-3 py-6 sm:px-4 sm:py-8">
        <div className="space-y-5">
          <section className="border border-border bg-card/90 p-4 sm:p-5">
            <div className="grid gap-4 lg:grid-cols-[1fr_minmax(320px,460px)] lg:items-end">
              <div>
                <p className="font-mono text-xs uppercase text-primary">Player stats</p>
                <h1 className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">
                  MCSR Ranked Stats
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                  Search a player to view ranked record, completion stats, streaks,
                  best time, Elo range, and recent match results.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search player..."
                    className="h-11 w-full border border-border bg-input pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <Button type="submit" disabled={playerLoading} className="h-11">
                  {playerLoading ? 'Loading...' : 'Search'}
                </Button>
              </form>
            </div>
          </section>

          {error && (
            <div className="border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-300">
              {error}
            </div>
          )}

          {playerLoading ? (
            <div className="border border-border bg-card p-10">
              <SiteLoader label="Loading player stats..." />
            </div>
          ) : player ? (
            <section className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.55fr)]">
              <div className="space-y-5">
                <div className="border border-border bg-card/90 p-4 sm:p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex min-w-0 items-center gap-4">
                      <UserAvatar
                        uuid={player.uuid}
                        username={player.username}
                        size={72}
                        className="h-18 w-18 shrink-0 border border-primary/40"
                      />
                      <div className="min-w-0">
                        <h2 className="break-words text-2xl font-bold text-foreground sm:text-3xl">
                          {player.username}
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Rank #{player.rank || '?'} -{' '}
                          {player.country?.toUpperCase() || 'Unknown'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:flex">
                      <Link
                        href={`/player/${player.username}`}
                        className={cn(buttonVariants({ variant: 'outline' }), 'h-9')}
                      >
                        <User className="h-4 w-4" />
                        Profile
                      </Link>
                      <Link
                        href={`/versus?player1=${encodeURIComponent(player.username)}`}
                        className={cn(buttonVariants({ variant: 'outline' }), 'h-9')}
                      >
                        <Swords className="h-4 w-4" />
                        Compare
                      </Link>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <StatTile
                      label="Elo"
                      value={player.elo.toLocaleString()}
                      tone="primary"
                    />
                    <StatTile
                      label="Win Rate"
                      value={formatPercent(playerWinRate)}
                      tone="primary"
                    />
                    <StatTile
                      label="Best Time"
                      value={formatTime(player.statistics?.bestTime)}
                      tone="primary"
                    />
                    <StatTile label="Record" value={`${player.wins}-${player.losses}`} />
                  </div>
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                  <div className="border border-border bg-card/90">
                    <div className="border-b border-border p-4">
                      <h3 className="font-semibold text-foreground">Season Ranked</h3>
                    </div>
                    <StatRow
                      label="Matches"
                      value={(player.statistics?.seasonMatches ?? 0).toLocaleString()}
                    />
                    <StatRow label="Wins" value={player.wins.toLocaleString()} />
                    <StatRow label="Losses" value={player.losses.toLocaleString()} />
                    <StatRow
                      label="Completion Rate"
                      value={formatPercent(player.statistics?.completionRate)}
                    />
                    <StatRow
                      label="Forfeit Rate"
                      value={formatPercent(player.statistics?.forfeitRate)}
                    />
                    <StatRow
                      label="Playtime"
                      value={formatPlaytime(player.statistics?.playtime)}
                    />
                  </div>

                  <div className="border border-border bg-card/90">
                    <div className="border-b border-border p-4">
                      <h3 className="font-semibold text-foreground">Performance</h3>
                    </div>
                    <StatRow
                      label="Current Streak"
                      value={player.statistics?.currentStreak ?? 0}
                    />
                    <StatRow label="Best Streak" value={player.statistics?.bestStreak ?? 0} />
                    <StatRow
                      label="Season Elo Low"
                      value={(player.statistics?.seasonLowestElo ?? player.elo).toLocaleString()}
                    />
                    <StatRow
                      label="Season Elo High"
                      value={(player.statistics?.seasonHighestElo ?? player.elo).toLocaleString()}
                    />
                    <StatRow
                      label="Best Seed Type"
                      value={player.statistics?.bestSeedType ?? 'N/A'}
                    />
                    <StatRow
                      label="Last Ranked"
                      value={formatDate(player.statistics?.lastRanked)}
                    />
                  </div>
                </div>

                <div className="border border-border bg-card/90">
                  <div className="flex items-center justify-between gap-3 border-b border-border p-4">
                    <h3 className="font-semibold text-foreground">Recent Matches</h3>
                    <span className="font-mono text-xs uppercase text-muted-foreground">
                      {matches.length} shown
                    </span>
                  </div>
                  <div className="divide-y divide-border">
                    {matches.length > 0 ? (
                      matches.map((match) => (
                        <div
                          key={match.id}
                          className="grid gap-3 p-4 sm:grid-cols-[auto_1fr_auto] sm:items-center"
                        >
                          <span
                            className={`flex h-9 w-9 items-center justify-center font-bold ${
                              match.result === 'win'
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : 'bg-rose-500/15 text-rose-400'
                            }`}
                          >
                            {match.result === 'win' ? 'W' : 'L'}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground">
                              vs {match.opponent}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDateTime(match.timestamp)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 sm:justify-end">
                            <span className="font-mono text-sm text-muted-foreground">
                              {match.duration ?? 'N/A'}
                            </span>
                            <a
                              href={`/stats?player=${encodeURIComponent(
                                match.replayPlayer,
                              )}&match=${encodeURIComponent(match.id)}`}
                              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                            >
                              <BarChart3 className="h-3.5 w-3.5" />
                              Stats
                            </a>
                            <a
                              href={`https://ranked.mcsr.in/match/${match.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              Official Stats
                            </a>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="p-5 text-sm text-muted-foreground">No recent matches found.</p>
                    )}
                  </div>
                </div>
              </div>

              <aside className="space-y-5">
                <div className="border border-border bg-card/90 p-4">
                  <h3 className="font-semibold text-foreground">All-Time Ranked</h3>
                  <div className="mt-4 grid gap-3">
                    <StatTile
                      label="Total Matches"
                      value={(player.statistics?.totalMatches ?? 0).toLocaleString()}
                    />
                    <StatTile
                      label="Total Record"
                      value={`${player.statistics?.totalWins ?? 0}-${
                        player.statistics?.totalLosses ?? 0
                      }`}
                    />
                  </div>
                </div>

                <div className="border border-border bg-card/90 p-4">
                  <h3 className="font-semibold text-foreground">Global Snapshot</h3>
                  {globalLoading ? (
                    <SiteLoader label="Loading global stats..." className="py-8" />
                  ) : (
                    <div className="mt-4 space-y-3">
                      <GlobalMetric
                        icon={Globe2}
                        label="Top Country"
                        value={globalStats?.topCountry ?? 'N/A'}
                      />
                      <GlobalMetric
                        icon={Activity}
                        label="Leaderboard Sample"
                        value={(globalStats?.leaderboardSample ?? globalStats?.leaderboardPlayers ?? 0).toLocaleString()}
                      />
                      <GlobalMetric
                        icon={Flame}
                        label="Average Rank"
                        value={(globalStats?.averageRank ?? 0).toLocaleString()}
                      />
                      <GlobalMetric
                        icon={Trophy}
                        label="Highest Elo"
                        value={(globalStats?.highestElo ?? 0).toLocaleString()}
                      />
                    </div>
                  )}
                </div>

                <div className="border border-border bg-card/90 p-4">
                  <h3 className="font-semibold text-foreground">Top Player</h3>
                  {globalStats?.topPlayer ? (
                    <Link
                      href={`/player/${globalStats.topPlayer.username}`}
                      className="mt-4 flex items-center justify-between gap-3 border border-border bg-background/45 p-3 transition hover:border-primary"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <UserAvatar
                          uuid={globalStats.topPlayer.uuid}
                          username={globalStats.topPlayer.username}
                          size={36}
                          className="h-9 w-9 shrink-0 border border-border"
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-foreground">
                            {globalStats.topPlayer.username}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            Rank #{globalStats.topPlayer.rank}
                          </span>
                        </span>
                      </span>
                      <span className="font-mono text-sm font-semibold text-primary">
                        {globalStats.topPlayer.elo.toLocaleString()}
                      </span>
                    </Link>
                  ) : (
                    <p className="mt-4 text-sm text-muted-foreground">No top player data.</p>
                  )}
                </div>

                <div className="border border-border bg-card/90 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold text-foreground">Top Countries</h3>
                    <span className="font-mono text-xs uppercase text-primary">
                      {globalStats?.topCountry ?? 'N/A'}
                    </span>
                  </div>
                  <div className="mt-4">
                    <CountryMiniChart countries={globalStats?.topCountries ?? []} />
                  </div>
                </div>
              </aside>
            </section>
          ) : (
            <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
              <div className="border border-dashed border-border bg-card/70 p-8 text-center">
                <Search className="mx-auto h-8 w-8 text-primary" />
                <h2 className="mt-4 text-xl font-bold text-foreground">
                  Search for a player
                </h2>
                <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                  The stats page now works like a player stat lookup. Try your own
                  username, EDCR, v_strid, or any ranked player.
                </p>
                {searchedUsername && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Last searched: {searchedUsername}
                  </p>
                )}
              </div>

              <div className="border border-border bg-card/90 p-4">
                <h3 className="font-semibold text-foreground">Global Snapshot</h3>
                {globalLoading ? (
                  <SiteLoader label="Loading global stats..." className="py-8" />
                ) : (
                  <div className="mt-4 grid gap-3">
                    <GlobalMetric
                      icon={Globe2}
                      label="Top Country"
                      value={globalStats?.topCountry ?? 'N/A'}
                    />
                    <GlobalMetric
                      icon={Clock}
                      label="Leaderboard Sample"
                      value={(globalStats?.leaderboardSample ?? globalStats?.leaderboardPlayers ?? 0).toLocaleString()}
                    />
                    <GlobalMetric
                      icon={Flame}
                      label="Average Rank"
                      value={(globalStats?.averageRank ?? 0).toLocaleString()}
                    />
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  )
}
