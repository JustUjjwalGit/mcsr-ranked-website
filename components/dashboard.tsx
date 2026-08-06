'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { RankIcon } from '@/components/rank-icon'
import { UserAvatar } from '@/components/user-avatar'
import { MatchActions } from '@/components/match-actions'
import { SiteLoader } from '@/components/site-loader'
import {
  mapLeaderboardEntry,
  mapMatchToCard,
  parseLeaderboardUsers,
  parseMatchList,
} from '@/lib/mcsr'
import { getMcsrRank } from '@/lib/mcsr-rank'

interface TopPlayer {
  uuid: string
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
  vodUrl?: string
  replayPlayer: string
}

export function Dashboard() {
  const [topPlayers, setTopPlayers] = useState<TopPlayer[]>([])
  const [recentMatches, setRecentMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const topPlayer = topPlayers[0] ?? null

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [leaderboardRes, matchesRes] = await Promise.all([
          fetch('/api/leaderboard'),
          fetch('/api/matches?count=5'),
        ])

        // Reuse one leaderboard response for the feature and top four.
        const leaderboardData = await leaderboardRes.json()
        const users = parseLeaderboardUsers(leaderboardData)

        setTopPlayers(users.slice(0, 4).map(mapLeaderboardEntry))

        const matchesData = await matchesRes.json()
        const matches = parseMatchList(matchesData)

        if (matches.length > 0) {
          setRecentMatches(matches.map((match) => mapMatchToCard(match)))
        }
      } catch (error) {
        console.error('Failed to load dashboard:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [])

  return (
    <div className="space-y-6 py-6 sm:space-y-8 sm:py-8">
      {/* Top Player Section */}
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-1">
          <div className="mc-card rounded-md p-4 sm:p-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase text-muted-foreground">
                Top Ranked Player
              </h3>

              {loading ? (
                <div className="space-y-4">
                  <div className="h-32 animate-pulse rounded bg-muted"></div>
                </div>
              ) : topPlayer ? (
                <div className="space-y-4">
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg border-2 border-primary/50 bg-black/30">
                      <UserAvatar
                        uuid={topPlayer.uuid}
                        username={topPlayer.username}
                        size={80}
                        className="h-full w-full rounded-lg"
                      />
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-lg text-foreground">
                        {topPlayer.username}
                      </p>
                      <p className="mt-1 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <RankIcon elo={topPlayer.elo} size={24} />
                        {topPlayer.elo.toLocaleString()} Elo,{' '}
                        {getMcsrRank(topPlayer.elo)?.fullName ?? 'Unrated'}
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="space-y-2 border-t border-border pt-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Elo</span>
                      <span className="tabular-figures font-mono font-semibold text-foreground">
                        {topPlayer.elo.toLocaleString()}
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

                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Leaderboard Preview */}
        <div className="md:col-span-2">
          <div className="mc-card rounded-md p-4 sm:p-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase text-muted-foreground">
                Top 4 Ranked Players
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
                          <SiteLoader label="Loading leaderboard..." />
                        </td>
                      </tr>
                    ) : topPlayers.length > 0 ? (
                      topPlayers.map((player, index) => (
                        <tr
                          key={player.uuid}
                          className="border-b border-border transition hover:bg-muted/50"
                        >
                          <td className="py-3 text-foreground">
                            #{player.rank || index + 1}
                          </td>
                          <td className="py-3 text-foreground">
                            <span className="flex items-center gap-2">
                              <RankIcon elo={player.elo} size={24} />
                              <span className="font-medium">{player.username}</span>
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <span className="tabular-figures font-mono font-semibold text-primary">
                              {player.elo.toLocaleString()}
                            </span>
                          </td>
                          <td className="py-3 text-right text-muted-foreground">
                            {player.wins}-{player.losses}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={4}
                          className="py-6 text-center text-muted-foreground"
                        >
                          Leaderboard is unavailable.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <Link href="/players">
                <Button variant="outline" className="w-full">
                  View Players
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Matches */}
      <div>
        <div className="mc-card rounded-md p-4 sm:p-6">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase text-muted-foreground">
              Recent Matches
            </h3>

            <div className="space-y-2">
              {loading ? (
                <SiteLoader label="Loading recent matches..." className="py-6" />
              ) : recentMatches.length > 0 ? (
                recentMatches.map((match) => (
                  <div
                    key={match.id}
                    className="flex flex-col gap-3 rounded border border-border bg-muted/50 p-3 transition hover:bg-muted sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 space-y-2 sm:space-y-1">
                      <span className="block text-xs text-muted-foreground">
                        {new Date(match.timestamp).toLocaleString()}
                      </span>
                      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                        <span
                          className={
                            match.winner === match.player1
                              ? 'max-w-[12rem] truncate font-semibold text-foreground sm:max-w-none'
                              : 'max-w-[12rem] truncate text-muted-foreground sm:max-w-none'
                          }
                        >
                          {match.player1}
                        </span>
                        <span className="text-muted-foreground">vs</span>
                        <span
                          className={
                            match.winner === match.player2
                              ? 'max-w-[12rem] truncate font-semibold text-foreground sm:max-w-none'
                              : 'max-w-[12rem] truncate text-muted-foreground sm:max-w-none'
                          }
                        >
                          {match.player2}
                        </span>
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
                  No recent matches
                </p>
              )}
            </div>

            <Link href="/matches">
              <Button variant="outline" className="w-full">
                View All Matches
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
