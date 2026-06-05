'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/header'
import { Card } from '@/components/ui/card'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { UserAvatar } from '@/components/user-avatar'
import { mapLeaderboardEntry, parseLeaderboardUsers } from '@/lib/mcsr'

interface PlayerCard {
  uuid: string
  username: string
  elo: number
  rank: number
  wins: number
  losses: number
  country?: string
  isLive?: boolean
  twitchChannel?: string
}

export default function PlayersPage() {
  const [players, setPlayers] = useState<PlayerCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadPlayers() {
      try {
        const res = await fetch('/api/leaderboard')
        const data = await res.json()
        setPlayers(parseLeaderboardUsers(data).map(mapLeaderboardEntry))
      } catch (error) {
        console.error('Failed to load players:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPlayers()
  }, [])

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-foreground">Top Players</h1>
            <p className="text-muted-foreground">
              Browse profiles of top Minecraft speedrunners
            </p>
          </div>

          {/* Players Grid */}
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div
                  key={i}
                  className="h-80 animate-pulse rounded border border-border bg-muted"
                ></div>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {players.map((player) => (
                <Card
                  key={player.username}
                  className="border border-border bg-card overflow-hidden transition hover:border-primary hover:bg-card/80"
                >
                  <div className="space-y-4 p-4">
                    {/* Header with Rank */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground uppercase">
                          Rank
                        </p>
                        <p className="text-2xl font-bold text-primary">
                          #{player.rank}
                        </p>
                      </div>
                      {player.isLive && (
                        <div className="flex items-center gap-1 rounded-full border border-destructive bg-destructive/20 px-2 py-1 text-xs font-semibold text-destructive">
                          <div className="h-2 w-2 animate-pulse rounded-full bg-destructive"></div>
                          LIVE
                        </div>
                      )}
                    </div>

                    {/* Avatar */}
                    <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg border-2 border-primary/50 bg-black/30">
                      <UserAvatar
                        uuid={player.uuid}
                        username={player.username}
                        size={80}
                        className="h-full w-full rounded-lg"
                      />
                    </div>

                    {/* Player Info */}
                    <div className="space-y-1">
                      <h3 className="font-bold text-foreground">
                        {player.username}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {player.country || 'Unknown'}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="space-y-2 border-t border-border pt-3">
                      <div className="flex justify-between">
                        <span className="text-xs text-muted-foreground">Elo</span>
                        <span className="tabular-figures font-mono font-semibold text-primary">
                          {player.elo.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-muted-foreground">Record</span>
                        <span className="text-xs text-muted-foreground">
                          <span className="text-green-500 font-semibold">
                            {player.wins}
                          </span>
                          -
                          <span className="text-red-500 font-semibold">
                            {player.losses}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* View Profile Button */}
                    <a
                      href={`/player/${player.username}`}
                      className={cn(
                        buttonVariants({ variant: 'outline' }),
                        'w-full',
                      )}
                    >
                      View Profile
                    </a>

                    {/* Twitch Button (if available) */}
                    {player.twitchChannel && (
                      <Button
                        variant="default"
                        className="w-full gap-2 bg-primary text-primary-foreground"
                      >
                        <span>▶</span>
                        Watch Stream
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {players.length === 0 && !loading && (
            <Card className="border border-border bg-card p-8 text-center">
              <p className="text-muted-foreground">No players found</p>
            </Card>
          )}
        </div>
      </main>
    </>
  )
}
