'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'
import { mapLeaderboardEntry, parseLeaderboardUsers } from '@/lib/mcsr'
import { UserAvatar } from '@/components/user-avatar'
import { SiteLoader } from '@/components/site-loader'

interface LeaderboardEntry {
  uuid: string
  rank: number
  username: string
  elo: number
  wins: number
  losses: number
  country?: string
  recentForm?: string
}

export default function LeaderboardsPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredLeaderboard, setFilteredLeaderboard] = useState<LeaderboardEntry[]>([])
  const [season, setSeason] = useState('current')

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        setLoading(true)
        const seasonParam =
          season === 'current' || season === 'all' ? '' : `season=${season}`
        const res = await fetch(
          `/api/leaderboard${seasonParam ? `?${seasonParam}` : ''}`,
        )
        const data = await res.json()
        const entries = parseLeaderboardUsers(data).map(mapLeaderboardEntry)

        setLeaderboard(entries)
        setFilteredLeaderboard(entries)
      } catch (error) {
        console.error('Failed to load leaderboard:', error)
      } finally {
        setLoading(false)
      }
    }

    loadLeaderboard()
  }, [season])

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = leaderboard.filter((entry) =>
        entry.username.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredLeaderboard(filtered)
    } else {
      setFilteredLeaderboard(leaderboard)
    }
  }, [searchQuery, leaderboard])

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-3 py-6 sm:px-4 sm:py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
              Global Leaderboard
            </h1>
            <p className="text-muted-foreground">
              Track the top Minecraft speedrunners by Elo rating
            </p>
          </div>

          {/* Filters */}
          <Card className="border border-border bg-card p-3 sm:p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              {/* Search */}
              <div className="relative flex-1 md:max-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search player..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded border border-border bg-input pl-10 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Season Filter */}
              <div className="grid grid-cols-2 gap-2 sm:flex">
                <Button
                  variant={season === 'current' ? 'default' : 'outline'}
                  onClick={() => {
                    setSeason('current')
                  }}
                >
                  Current Season
                </Button>
                <Button
                  variant={season === 'all' ? 'default' : 'outline'}
                  onClick={() => {
                    setSeason('all')
                  }}
                >
                  All Time
                </Button>
              </div>
            </div>
          </Card>

          {/* Leaderboard Table */}
          <Card className="overflow-hidden border border-border bg-card">
            <div className="space-y-3 p-3 md:hidden">
              {loading ? (
                <SiteLoader label="Loading leaderboard..." className="py-8" />
              ) : filteredLeaderboard.length > 0 ? (
                filteredLeaderboard.map((entry) => (
                  <a
                    key={entry.username}
                    href={`/player/${entry.username}`}
                    className="block rounded border border-border bg-muted/35 p-3 transition hover:bg-muted"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex min-w-0 items-center gap-3">
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded font-semibold ${
                            entry.rank === 1
                              ? 'bg-primary text-primary-foreground'
                              : entry.rank <= 3
                                ? 'bg-muted text-foreground'
                                : 'bg-muted/50 text-muted-foreground'
                          }`}
                        >
                          {entry.rank}
                        </span>
                        <UserAvatar
                          uuid={entry.uuid}
                          username={entry.username}
                          size={40}
                          className="h-10 w-10 shrink-0 rounded-md border border-border"
                        />
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-primary">
                            {entry.username}
                          </span>
                          <span className="block text-xs uppercase text-muted-foreground">
                            {entry.country || 'Unknown'}
                          </span>
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="tabular-figures block font-mono font-semibold text-foreground">
                          {entry.elo.toLocaleString()}
                        </span>
                        <span className="tabular-figures text-xs text-muted-foreground">
                          <span className="text-green-500">{entry.wins}</span>
                          <span className="mx-1">-</span>
                          <span className="text-red-500">{entry.losses}</span>
                        </span>
                      </span>
                    </div>
                  </a>
                ))
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No players found
                </p>
              )}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full">
                <thead className="border-b border-border bg-muted/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">
                      Rank
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">
                      Player
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-muted-foreground">
                      Country
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-muted-foreground">
                      <span className="tabular-figures">Elo</span>
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-muted-foreground">
                      <span className="tabular-figures">W/L</span>
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-muted-foreground">
                      Recent Form
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                        <SiteLoader label="Loading leaderboard..." />
                      </td>
                    </tr>
                  ) : filteredLeaderboard.length > 0 ? (
                    filteredLeaderboard.map((entry) => (
                      <tr
                        key={entry.username}
                        className="border-b border-border transition hover:bg-muted/50"
                      >
                        <td className="px-6 py-4">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded font-semibold ${
                              entry.rank === 1
                                ? 'bg-primary text-primary-foreground'
                                : entry.rank <= 3
                                  ? 'bg-muted text-foreground'
                                  : 'bg-muted/50 text-muted-foreground'
                            }`}
                          >
                            {entry.rank}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <a
                            href={`/player/${entry.username}`}
                            className="flex items-center gap-3 font-semibold text-primary hover:underline"
                          >
                            <UserAvatar
                              uuid={entry.uuid}
                              username={entry.username}
                              size={36}
                              className="h-9 w-9 shrink-0 rounded-md border border-border"
                            />
                            <span>{entry.username}</span>
                          </a>
                        </td>
                        <td className="px-6 py-4 text-right text-muted-foreground uppercase">
                          {entry.country || '—'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="tabular-figures inline-block min-w-[5ch] font-mono text-sm font-semibold tracking-normal text-foreground">
                            {entry.elo.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="tabular-figures inline-block min-w-[6ch] font-mono text-sm tracking-normal text-muted-foreground">
                            <span className="text-green-500">{entry.wins}</span>
                            <span className="mx-1 text-muted-foreground">-</span>
                            <span className="text-red-500">{entry.losses}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center gap-1">
                            {[0, 1, 2, 3, 4].map((i) => (
                              <div
                                key={i}
                                className="h-3 w-3 rounded-full bg-muted"
                              ></div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                        No players found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

        </div>
      </main>
    </>
  )
}
