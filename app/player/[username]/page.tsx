'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowRightLeft, Star } from 'lucide-react'
import { Header } from '@/components/header'
import { Card } from '@/components/ui/card'
import { Button, buttonVariants } from '@/components/ui/button'
import { mapMatchToCard, mapUserToProfile, parseMatchList } from '@/lib/mcsr'
import { MatchActions } from '@/components/match-actions'
import { UserAvatar } from '@/components/user-avatar'
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
    averageWinTime?: number
    averageLossTime?: number
    currentStreak?: number
    bestStreak?: number
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
          fetch(`/api/matches?player=${encodeURIComponent(username)}&limit=20`),
        ])

        const playerData = await playerRes.json()
        const matchesData = await matchesRes.json()
        const profile = mapUserToProfile(playerData)

        if (profile) {
          const nextPlayer = {
            ...profile,
            joinDate: undefined,
            lastActive: undefined,
          }
          setPlayer(nextPlayer)
          setFavorite(isFavoritePlayer(nextPlayer.username))
        }

        setMatches(
          parseMatchList(matchesData).map((match) =>
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
      <main className="mx-auto max-w-7xl px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            <span className="text-muted-foreground">Loading player data...</span>
          </div>
        ) : player ? (
          <div className="space-y-6">
            {/* Player Header */}
            <Card className="border border-border bg-card p-8">
              <div className="grid gap-8 lg:grid-cols-[minmax(240px,300px)_1fr]">
                <div className="flex justify-center lg:justify-start">
                  <div className="relative flex h-107 w-full max-w-75 items-end justify-center overflow-hidden rounded-lg border border-primary/40 bg-gradient-to-b from-primary/10 via-muted/20 to-background/80 p-4">
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
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 border-primary/50 bg-black/30">
                        <UserAvatar
                          uuid={player.uuid}
                          username={player.username}
                          size={80}
                          className="h-full w-full rounded-lg"
                        />
                      </div>
                      <div className="min-w-0">
                        <h1 className="break-words text-3xl font-bold text-foreground">
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
                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:justify-end">
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

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded border border-border bg-muted/50 p-4">
                      <p className="text-sm text-muted-foreground mb-1">Elo Rating</p>
                      <p className="tabular-figures font-mono text-3xl font-bold text-primary">
                        {player.elo.toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded border border-border bg-muted/50 p-4">
                      <p className="text-sm text-muted-foreground mb-1">Win Rate</p>
                      <p className="text-3xl font-bold text-primary">{winRate}%</p>
                    </div>
                    <div className="rounded border border-border bg-muted/50 p-4">
                      <p className="text-sm text-muted-foreground mb-1">Wins</p>
                      <p className="text-3xl font-bold text-green-500">{player.wins}</p>
                    </div>
                    <div className="rounded border border-border bg-muted/50 p-4">
                      <p className="text-sm text-muted-foreground mb-1">Losses</p>
                      <p className="text-3xl font-bold text-red-500">{player.losses}</p>
                    </div>
                  </div>

                  {/* Additional Stats */}
                  <div className="grid gap-4 md:grid-cols-2">
                    {player.statistics?.currentStreak !== undefined && (
                      <div className="rounded border border-border bg-muted/50 p-4">
                        <p className="text-sm text-muted-foreground mb-1">
                          Current Streak
                        </p>
                        <p className="text-2xl font-bold text-primary">
                          {player.statistics.currentStreak}
                        </p>
                      </div>
                    )}
                    {player.statistics?.bestStreak !== undefined && (
                      <div className="rounded border border-border bg-muted/50 p-4">
                        <p className="text-sm text-muted-foreground mb-1">
                          Best Streak
                        </p>
                        <p className="text-2xl font-bold text-primary">
                          {player.statistics.bestStreak}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Match History */}
            <Card className="border border-border bg-card p-6">
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-foreground">Recent Matches</h2>

                <div className="space-y-2">
                  {matches.length > 0 ? (
                    matches.map((match) => (
                      <div
                        key={match.id}
                        className={`flex items-center justify-between rounded border p-4 transition ${
                          match.result === 'win'
                            ? 'border-green-500/30 bg-green-500/5 hover:bg-green-500/10'
                            : 'border-red-500/30 bg-red-500/5 hover:bg-red-500/10'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded font-bold ${
                              match.result === 'win'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {match.result === 'win' ? 'W' : 'L'}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">
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
