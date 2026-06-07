'use client'

import { useEffect, useRef, useState } from 'react'
import { Header } from '@/components/header'
import { Card } from '@/components/ui/card'
import { UserAvatar } from '@/components/user-avatar'
import { CalendarDays, Check, ChevronDown } from 'lucide-react'

interface CountryBucket {
  country: string
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
  topCountries: CountryBucket[]
  topGainers: EloMover[]
  topLosers: EloMover[]
  seasonInfo?: {
    name: string
    number: number
    startDate: string
    endDate: string
  }
}

interface SeasonPickerProps {
  value: string
  seasonOptions: number[]
  onChange: (season: string) => void
}

function getSeasonLabel(value: string) {
  return value === 'current' ? 'Current Season' : `Season ${value}`
}

function SeasonPicker({ value, seasonOptions, onChange }: SeasonPickerProps) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const options = ['current', ...seasonOptions.map(String)]

  useEffect(() => {
    if (!open) return

    function closeOnOutsideClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)

    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  return (
    <div ref={menuRef} className="relative w-full sm:w-64">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex h-11 w-full items-center justify-between gap-3 rounded border border-primary/40 bg-background/80 px-3 text-left text-sm text-foreground shadow-sm shadow-primary/10 transition hover:border-primary hover:bg-muted/60 focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <span className="flex min-w-0 items-center gap-2">
          <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
          <span className="truncate font-medium">{getSeasonLabel(value)}</span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition ${
            open ? 'rotate-180 text-primary' : ''
          }`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Season"
          className="absolute right-0 top-full z-20 mt-2 max-h-72 w-full overflow-y-auto rounded border border-border bg-popover p-1 text-sm shadow-xl shadow-black/40"
        >
          {options.map((option) => {
            const selected = option === value

            return (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onChange(option)
                  setOpen(false)
                }}
                className={`flex h-9 w-full items-center justify-between gap-3 rounded px-3 text-left transition ${
                  selected
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                <span className="truncate font-medium">{getSeasonLabel(option)}</span>
                {selected && <Check className="h-4 w-4 shrink-0" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function CountryBreakdownChart({ countries }: { countries: CountryBucket[] }) {
  const maxPlayers = Math.max(...countries.map((country) => country.players), 1)

  return (
    <div className="space-y-3 rounded border border-border bg-muted/30 p-4">
      {countries.length > 0 ? (
        countries.map((country) => (
          <div
            key={country.country}
            className="grid grid-cols-[4.5rem_minmax(0,1fr)_3.5rem] items-center gap-3"
          >
            <span className="truncate text-sm font-semibold uppercase text-foreground">
              {country.country}
            </span>
            <div className="h-3 overflow-hidden rounded bg-background/80">
              <div
                className="h-full rounded bg-primary transition-all"
                style={{
                  width: `${Math.max((country.players / maxPlayers) * 100, 4)}%`,
                }}
                title={`${country.players} leaderboard players from ${country.country}`}
              />
            </div>
            <span className="text-right text-sm font-medium tabular-figures text-muted-foreground">
              {country.players}
            </span>
          </div>
        ))
      ) : (
        <div className="rounded border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
          No country data available
        </div>
      )}
    </div>
  )
}

function StatSummaryCard({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded border border-border bg-muted/40 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold text-foreground">{value}</p>
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
            setCurrentSeason((current) =>
              Math.max(current, data.stats.seasonInfo.number),
            )
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
            <Card className="relative z-30 border border-primary bg-primary/5 p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-primary">
                    {stats.seasonInfo.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {stats.seasonInfo.startDate} - {stats.seasonInfo.endDate}
                  </p>
                </div>
                <SeasonPicker
                  value={season}
                  seasonOptions={seasonOptions}
                  onChange={setSeason}
                />
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

          {/* Country Breakdown */}
          <Card className="border border-border bg-card p-6">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(360px,1.6fr)]">
              <div className="space-y-3">
                <h2 className="text-xl font-bold text-foreground">Country Breakdown</h2>
                <p className="text-3xl font-semibold text-primary">
                  {stats?.topCountry || 'N/A'}
                </p>
                <p className="text-sm text-muted-foreground">
                  top country by ranked leaderboard players
                </p>
                <div className="grid gap-3 pt-2 sm:grid-cols-2 lg:grid-cols-1">
                  <StatSummaryCard
                    label="Leaderboard Players"
                    value={stats?.leaderboardPlayers?.toLocaleString() || '0'}
                  />
                  <StatSummaryCard
                    label="Average Elo"
                    value={stats?.averageElo?.toLocaleString() || '0'}
                  />
                  <TopPlayerSummary player={stats?.topPlayer} />
                </div>
              </div>
              <CountryBreakdownChart countries={stats?.topCountries ?? []} />
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
