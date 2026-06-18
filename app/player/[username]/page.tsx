'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowRightLeft, Star } from 'lucide-react'
import { Header } from '@/components/header'
import { Card } from '@/components/ui/card'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  getBestSeedTypeFromMatches,
  mapMatchToCard,
  mapUserToProfile,
  parseMatchList,
} from '@/lib/mcsr'
import { MatchActions } from '@/components/match-actions'
import { UserAvatar } from '@/components/user-avatar'
import { UserComboAvatar } from '@/components/user-combo-avatar'
import { UserSkinViewer } from '@/components/user-skin-viewer'
import { isFavoritePlayer, toggleFavoritePlayer } from '@/lib/player-memory'

interface PlayerProfile {
  uuid: string
  username: string
  elo: number
  rank: number
  wins: number
  losses: number
  country?: string
  joinDate?: string
  lastActive?: string
  twitchChannel?: string
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

interface Match {
  id: string
  opponent: string
  result: 'win' | 'loss'
  timestamp: string
  duration?: string
  vodUrl?: string
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

function formatLastRanked(timestamp?: number | null) {
  if (!timestamp) return 'N/A'
  return new Date(timestamp * 1000).toLocaleDateString()
}

function ProfileStatCard({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: string | number
  tone?: 'default' | 'primary' | 'green' | 'red'
}) {
  const valueClass =
    tone === 'primary'
      ? 'text-primary'
      : tone === 'green'
        ? 'text-green-500'
        : tone === 'red'
          ? 'text-red-500'
          : 'text-foreground'

  return (
    <div className="rounded border border-border bg-muted/50 p-4">
      <p className="mb-1 text-sm text-muted-foreground">{label}</p>
      <p className={`break-words text-2xl font-bold ${valueClass}`}>
        {value}
      </p>
    </div>
  )
}

export default function PlayerPage() {
  const params = useParams()
  const username = decodeURIComponent(params.username as string)

  const [player, setPlayer] = useState<PlayerProfile | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [favorite, setFavorite] = useState(false)

  useEffect(() => {
    async function loadPlayer() {
      try {
        setLoading(true)
        const [playerRes, matchesRes] = await Promise.all([
          fetch(`/api/player?username=${encodeURIComponent(username)}`),
          fetch(`/api/matches?player=${encodeURIComponent(username)}&limit=100`),
        ])

        const playerData = await playerRes.json()
        const matchesData = await matchesRes.json()
        const profile = mapUserToProfile(playerData)
        const parsedMatches = parseMatchList(matchesData)

        if (profile) {
          const nextPlayer = {
            ...profile,
            statistics: {
              ...profile.statistics,
              bestSeedType: getBestSeedTypeFromMatches(
                parsedMatches,
                profile.uuid,
              ),
            },
            joinDate: undefined,
            lastActive: undefined,
          }
          setPlayer(nextPlayer)
          setFavorite(isFavoritePlayer(nextPlayer.username))
        }

        setMatches(
          parsedMatches.slice(0, 20).map((match) =>
            mapMatchToCard(match, username),
          ),
        )
      } catch (error) {
        console.error('Failed to load player:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPlayer()
  }, [username])

  function handleFavoriteToggle() {
    if (!player) return

    const favorites = toggleFavoritePlayer({
      username: player.username,
      uuid: player.uuid,
      elo: player.elo,
      rank: player.rank,
    })

    setFavorite(
      favorites.some(
        (item) => item.username.toLowerCase() === player.username.toLowerCase(),
      ),
    )
  }

  const winRate =
    player && player.wins + player.losses > 0
      ? ((player.wins / (player.wins + player.losses)) * 100).toFixed(1)
      : '0'

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-3 py-6 sm:px-4 sm:py-8">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            <span className="text-muted-foreground">Loading player data...</span>
          </div>
        ) : player ? (
          <div className="space-y-6">
            {/* Player Header */}
            <Card className="border border-border bg-card p-4 sm:p-6 lg:p-8">
              <div className="grid gap-6 lg:grid-cols-[minmax(220px,300px)_1fr] lg:gap-8">
                <div className="hidden justify-center sm:flex lg:justify-start">
                  <div className="relative flex h-80 w-full max-w-64 items-end justify-center overflow-hidden rounded-lg border border-primary/40 bg-gradient-to-b from-primary/10 via-muted/20 to-background/80 p-3 sm:h-96 sm:max-w-72 sm:p-4 lg:h-107 lg:max-w-75">
                    <UserSkinViewer
                      uuid={player.uuid}
                      username={player.username}
                      priority
                      fallbackClassName="h-full w-full drop-shadow-[0_14px_24px_rgba(0,0,0,0.55)]"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 border-primary/50 bg-black/30 sm:h-20 sm:w-20">
                        <UserComboAvatar
                          uuid={player.uuid}
                          username={player.username}
                          size={120}
                          priority
                          className="h-full w-full sm:hidden"
                        />
                        <UserAvatar
                          uuid={player.uuid}
                          username={player.username}
                          size={80}
                          className="hidden h-full w-full rounded-lg sm:block"
                        />
                      </div>
                      <div className="min-w-0">
                        <h1 className="break-words text-2xl font-bold text-foreground sm:text-3xl">
                          {player.username}
                        </h1>
                        <p className="text-lg font-semibold text-primary">
                          Rank #{player.rank}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {player.country || 'Unknown Country'}
                        </p>
                      </div>
                    </div>
                    <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-row sm:justify-end">
                      <Link
                        href={`/versus?player1=${encodeURIComponent(player.username)}`}
                        className={buttonVariants({
                          variant: 'outline',
                          size: 'sm',
                          className: 'w-full sm:w-auto',
                        })}
                      >
                        <ArrowRightLeft className="h-4 w-4" />
                        Compare
                      </Link>
                      <Button
                        type="button"
                        variant={favorite ? 'default' : 'outline'}
                        size="sm"
                        onClick={handleFavoriteToggle}
                        className="w-full sm:w-auto"
                      >
                        <Star
                          className={`h-4 w-4 ${favorite ? 'fill-current' : ''}`}
                        />
                        {favorite ? 'Favorited' : 'Favorite'}
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <ProfileStatCard
                      label="Elo Rating"
                      value={player.elo.toLocaleString()}
                      tone="primary"
                    />
                    <ProfileStatCard
                      label="Best PB"
                      value={formatTime(player.statistics?.bestTime)}
                      tone="primary"
                    />
                    <ProfileStatCard
                      label="Win Rate"
                      value={`${winRate}%`}
                      tone="primary"
                    />
                    <ProfileStatCard
                      label="Season Record"
                      value={`${player.wins}-${player.losses}`}
                    />
                    <ProfileStatCard
                      label="Season Matches"
                      value={(player.statistics?.seasonMatches ?? 0).toLocaleString()}
                    />
                    <ProfileStatCard
                      label="Best Seed Type"
                      value={player.statistics?.bestSeedType ?? 'N/A'}
                      tone="primary"
                    />
                    <ProfileStatCard
                      label="Completion Rate"
                      value={formatPercent(player.statistics?.completionRate)}
                    />
                  </div>

                  {/* Additional Stats */}
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {player.statistics?.currentStreak !== undefined && (
                      <ProfileStatCard
                        label="Current Streak"
                        value={player.statistics.currentStreak}
                        tone="primary"
                      />
                    )}
                    {player.statistics?.bestStreak !== undefined && (
                      <ProfileStatCard
                        label="Best Streak"
                        value={player.statistics.bestStreak}
                        tone="primary"
                      />
                    )}
                    <ProfileStatCard
                      label="Total Record"
                      value={`${player.statistics?.totalWins ?? 0}-${
                        player.statistics?.totalLosses ?? 0
                      }`}
                    />
                    <ProfileStatCard
                      label="Total Matches"
                      value={(player.statistics?.totalMatches ?? 0).toLocaleString()}
                    />
                    <ProfileStatCard
                      label="Season Playtime"
                      value={formatPlaytime(player.statistics?.playtime)}
                    />
                    <ProfileStatCard
                      label="Forfeit Rate"
                      value={formatPercent(player.statistics?.forfeitRate)}
                    />
                    <ProfileStatCard
                      label="Season Elo Range"
                      value={`${(
                        player.statistics?.seasonLowestElo ?? player.elo
                      ).toLocaleString()} - ${(
                        player.statistics?.seasonHighestElo ?? player.elo
                      ).toLocaleString()}`}
                    />
                    <ProfileStatCard
                      label="Last Ranked"
                      value={formatLastRanked(player.statistics?.lastRanked)}
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Match History */}
            <Card className="border border-border bg-card p-4 sm:p-6">
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-foreground">Recent Matches</h2>

                <div className="space-y-2">
                  {matches.length > 0 ? (
                    matches.map((match) => (
                      <div
                        key={match.id}
                        className={`flex flex-col gap-3 rounded border p-3 transition sm:flex-row sm:items-center sm:justify-between sm:p-4 ${
                          match.result === 'win'
                            ? 'border-green-500/30 bg-green-500/5 hover:bg-green-500/10'
                            : 'border-red-500/30 bg-red-500/5 hover:bg-red-500/10'
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded font-bold ${
                              match.result === 'win'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {match.result === 'win' ? 'W' : 'L'}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-foreground">
                              vs {match.opponent}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(match.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <MatchActions
                          matchId={match.id}
                          playerNickname={match.replayPlayer}
                          vodUrl={match.vodUrl}
                          className="w-full sm:w-auto"
                        />
                      </div>
                    ))
                  ) : (
                    <p className="py-4 text-center text-muted-foreground">
                      No matches found
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">Player not found</p>
            <Button variant="outline" className="mt-4">
              Go back to leaderboard
            </Button>
          </div>
        )}
      </main>
    </>
  )
}
