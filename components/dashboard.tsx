'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { RankTier } from '@/components/rank-tier'
import { UserAvatar } from '@/components/user-avatar'
import { MatchActions } from '@/components/match-actions'
import { SiteLoader } from '@/components/site-loader'
import {
  mapLeaderboardEntry,
  mapMatchToCard,
  parseLeaderboardUsers,
  parseMatchList,
} from '@/lib/mcsr'

interface TopPlayer {
  uuid: string
  rank: number
  username: string
  elo: number
  country?: string
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

function countryFlag(country: string | undefined) {
  const code = country?.toUpperCase()
  if (!code || !/^[A-Z]{2}$/.test(code)) return null
  return code
    .split('')
    .map((letter) => String.fromCodePoint(127397 + letter.charCodeAt(0)))
    .join('')
}

export function Dashboard() {
  const [topPlayers, setTopPlayers] = useState<TopPlayer[]>([])
  const [recentMatches, setRecentMatches] = useState<Match[]>([])
  const [leaderboardLoading, setLeaderboardLoading] = useState(true)
  const [matchesLoading, setMatchesLoading] = useState(true)
  const [leaderboardError, setLeaderboardError] = useState(false)

  useEffect(() => {
    async function loadDashboard() {
      const [leaderboardResult, matchesResult] = await Promise.allSettled([
        fetch('/api/leaderboard?includeStats=false').then(async (response) => {
          if (!response.ok) throw new Error(`Leaderboard request failed (${response.status})`)
          return response.json()
        }),
        fetch('/api/matches?count=5').then(async (response) => {
          if (!response.ok) throw new Error(`Matches request failed (${response.status})`)
          return response.json()
        }),
      ])

      if (leaderboardResult.status === 'fulfilled') {
        setTopPlayers(
          parseLeaderboardUsers(leaderboardResult.value)
            .slice(0, 3)
            .map((user) => mapLeaderboardEntry(user)),
        )
      } else {
        console.error('Failed to load leaderboard:', leaderboardResult.reason)
        setLeaderboardError(true)
      }
      setLeaderboardLoading(false)

      if (matchesResult.status === 'fulfilled') {
        setRecentMatches(
          parseMatchList(matchesResult.value).map((match) => mapMatchToCard(match)),
        )
      } else {
        console.error('Failed to load recent matches:', matchesResult.reason)
      }
      setMatchesLoading(false)
    }

    loadDashboard()
  }, [])

  return (
    <div className="space-y-6 py-6 sm:space-y-8 sm:py-8">
      <section
        className="rounded-xl border border-primary/35 bg-card/85 p-4 shadow-[0_16px_38px_rgba(0,0,0,0.18)] backdrop-blur-sm sm:p-6"
        aria-labelledby="top-ranked-players-heading"
      >
        <div className="flex items-center justify-between gap-4">
          <h2 id="top-ranked-players-heading" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Top Ranked Players
          </h2>
          <Link href="/players" className="text-xs font-medium text-primary hover:underline">
            Full leaderboard
          </Link>
        </div>

        {leaderboardLoading ? (
          <SiteLoader label="Loading top ranked players..." className="py-10" />
        ) : leaderboardError ? (
          <p className="mt-4 rounded-lg border border-danger/35 bg-[var(--negative-performance-bg)] p-4 text-sm text-danger">
            The leaderboard is unavailable right now.
          </p>
        ) : topPlayers.length === 0 ? (
          <p className="mt-4 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
            No ranked players were returned.
          </p>
        ) : (
          <ol className="mt-4 grid gap-3 lg:grid-cols-3">
            {topPlayers.map((player, index) => (
              <li key={player.uuid}>
                <Link
                  href={`/player/${encodeURIComponent(player.username)}`}
                  className={`grid min-w-0 grid-cols-[auto_48px_minmax(0,1fr)] items-center gap-3 rounded-lg border p-3 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    index === 0
                      ? 'border-primary/55 bg-primary/10 shadow-[0_8px_24px_rgba(0,0,0,0.16)]'
                      : 'border-border bg-[var(--secondary-surface)] hover:border-primary/40'
                  }`}
                  aria-label={`#${index + 1} ${player.username}, ${player.elo.toLocaleString()} Elo`}
                >
                  <span className={`font-mono text-lg font-bold tabular-nums ${index === 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                    #{index + 1}
                  </span>
                  <UserAvatar
                    uuid={player.uuid}
                    username={player.username}
                    size={48}
                    className="h-12 w-12 rounded-md border border-border"
                  />
                  <span className="min-w-0">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="truncate font-semibold text-foreground">{player.username}</span>
                      {countryFlag(player.country) ? (
                        <span className="shrink-0 text-base" title={player.country}>
                          {countryFlag(player.country)}
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-1 flex min-w-0 items-center justify-between gap-2">
                      <RankTier elo={player.elo} iconSize={32} className="text-xs font-semibold" />
                      <span className="shrink-0 font-mono text-sm font-semibold tabular-nums text-foreground">
                        {player.elo.toLocaleString()} Elo
                      </span>
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* Recent Matches */}
      <div>
        <div className="rounded-lg border border-primary/40 bg-card/80 p-4 backdrop-blur-sm sm:p-6">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase text-muted-foreground">
              Recent Matches
            </h3>

            <div className="space-y-2">
              {matchesLoading ? (
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
