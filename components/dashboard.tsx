'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface TopPlayer {
  rank: number
  username: string
  elo: number
  wins: number
  losses: number
  recentForm?: string
}

interface Match {
  id: string
  player1: string
  player2: string
  winner: string
  timestamp: string
  duration?: string
}

export function Dashboard() {
  const [topPlayer, setTopPlayer] = useState<TopPlayer | null>(null)
  const [recentMatches, setRecentMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboard() {
      try {
        // Fetch leaderboard for top player
        const leaderboardRes = await fetch('/api/leaderboard?limit=1')
        const leaderboardData = await leaderboardRes.json()
        
        if (leaderboardData.leaderboard?.[0]) {
          setTopPlayer(leaderboardData.leaderboard[0])
        }

        // Fetch recent matches
        const matchesRes = await fetch('/api/matches?limit=5')
        const matchesData = await matchesRes.json()
        
        if (matchesData.matches) {
          setRecentMatches(matchesData.matches)
        }
      } catch (error) {
        console.error('[v0] Failed to load dashboard:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [])

  return (
    <div className="space-y-8 py-8">
      {/* Top Player Section */}
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-1">
          <div className="border border-border bg-card p-6 rounded-lg">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase text-muted-foreground">
                Top 1 Ranked Player
              </h3>
              
              {loading ? (
                <div className="space-y-4">
                  <div className="h-32 animate-pulse rounded bg-muted"></div>
                </div>
              ) : topPlayer ? (
                <div className="space-y-4">
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-primary bg-muted text-2xl">
                      👤
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-lg text-foreground">
                        {topPlayer.username}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {topPlayer.elo} Elo, Grandmaster
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="space-y-2 border-t border-border pt-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Elo</span>
                      <span className="font-semibold text-foreground">
                        {topPlayer.elo}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Wins/Losses</span>
                      <span className="font-semibold text-foreground">
                        {topPlayer.wins}/{topPlayer.losses}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Win Rate</span>
                      <span className="font-semibold text-primary">
                        {topPlayer.wins > 0
                          ? (
                              (topPlayer.wins /
                                (topPlayer.wins + topPlayer.losses)) *
                              100
                            ).toFixed(1)
                          : '0'}
                        %
                      </span>
                    </div>
                  </div>

                  {/* Trend Chart (placeholder) */}
                  <div className="space-y-2 border-t border-border pt-4">
                    <p className="text-xs text-muted-foreground">Elo Trend</p>
                    <div className="h-12 rounded bg-muted"></div>
                  </div>

                  {/* Streaming Status */}
                  <div className="space-y-2 border-t border-border pt-4">
                    <p className="text-xs text-muted-foreground">Streaming on</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full border-destructive text-destructive hover:bg-destructive/10"
                      >
                        ● Live Now
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Leaderboard Preview */}
        <div className="md:col-span-2">
          <div className="border border-border bg-card p-6 rounded-lg">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase text-muted-foreground">
                Global Leaderboard
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left font-semibold text-muted-foreground">
                        Rank
                      </th>
                      <th className="text-left font-semibold text-muted-foreground">
                        Player
                      </th>
                      <th className="text-right font-semibold text-muted-foreground">
                        Elo
                      </th>
                      <th className="text-right font-semibold text-muted-foreground">
                        W/L
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-muted-foreground">
                          Loading...
                        </td>
                      </tr>
                    ) : (
                      <tr className="border-b border-border hover:bg-muted/50">
                        <td className="py-3 text-foreground">1</td>
                        <td className="py-3 text-foreground">
                          {topPlayer?.username || 'Loading...'}
                        </td>
                        <td className="py-3 text-right font-semibold text-primary">
                          {topPlayer?.elo || '-'}
                        </td>
                        <td className="py-3 text-right text-muted-foreground">
                          {topPlayer ? `${topPlayer.wins}-${topPlayer.losses}` : '-'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <Link href="/leaderboards">
                <Button variant="outline" className="w-full">
                  View Full Leaderboard →
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Matches */}
      <div>
        <div className="border border-border bg-card p-6 rounded-lg">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase text-muted-foreground">
              Recent Matches
            </h3>

            <div className="space-y-2">
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-12 animate-pulse rounded bg-muted"
                    ></div>
                  ))}
                </div>
              ) : recentMatches.length > 0 ? (
                recentMatches.map((match) => (
                  <div
                    key={match.id}
                    className="flex items-center justify-between rounded border border-border bg-muted/50 p-3 transition hover:bg-muted"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        {new Date(match.timestamp).toLocaleString()}
                      </span>
                      <div className="flex items-center gap-2">
                        <span
                          className={
                            match.winner === match.player1
                              ? 'font-semibold text-foreground'
                              : 'text-muted-foreground'
                          }
                        >
                          {match.player1}
                        </span>
                        <span className="text-muted-foreground">vs</span>
                        <span
                          className={
                            match.winner === match.player2
                              ? 'font-semibold text-foreground'
                              : 'text-muted-foreground'
                          }
                        >
                          {match.player2}
                        </span>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      View Replay
                    </Button>
                  </div>
                ))
              ) : (
                <p className="py-4 text-center text-muted-foreground">
                  No recent matches
                </p>
              )}
            </div>

            <Link href="/matches">
              <Button variant="outline" className="w-full">
                View All Matches →
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
