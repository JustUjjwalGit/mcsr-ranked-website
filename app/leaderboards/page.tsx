'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'

interface LeaderboardEntry {
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
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        setLoading(true)
        const res = await fetch(`/api/leaderboard?season=${season}&offset=${offset}&limit=50`)
        const data = await res.json()

        if (data.leaderboard) {
          setLeaderboard(data.leaderboard)
          setFilteredLeaderboard(data.leaderboard)
        }
      } catch (error) {
        console.error('[v0] Failed to load leaderboard:', error)
      } finally {
        setLoading(false)
      }
    }

    loadLeaderboard()
  }, [season, offset])

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
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-foreground">Global Leaderboard</h1>
            <p className="text-muted-foreground">
              Track the top Minecraft speedrunners by Elo rating
            </p>
          </div>

          {/* Filters */}
          <Card className="border border-border bg-card p-4">
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
              <div className="flex gap-2">
                <Button
                  variant={season === 'current' ? 'default' : 'outline'}
                  onClick={() => {
                    setSeason('current')
                    setOffset(0)
                  }}
                >
                  Current Season
                </Button>
                <Button
                  variant={season === 'all' ? 'default' : 'outline'}
                  onClick={() => {
                    setSeason('all')
                    setOffset(0)
                  }}
                >
                  All Time
                </Button>
              </div>
            </div>
          </Card>

          {/* Leaderboard Table */}
          <Card className="border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
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
                      Elo
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-muted-foreground">
                      W/L
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
                        <div className="flex items-center justify-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                          Loading leaderboard...
                        </div>
                      </td>
                    </tr>
                  ) : filteredLeaderboard.length > 0 ? (
                    filteredLeaderboard.map((entry) => (
                      <tr
                        key={entry.rank}
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
                            className="font-semibold text-primary hover:underline"
                          >
                            {entry.username}
                          </a>
                        </td>
                        <td className="px-6 py-4 text-right text-muted-foreground">
                          {entry.country || '-'}
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-foreground">
                          {entry.elo}
                        </td>
                        <td className="px-6 py-4 text-right text-muted-foreground">
                          <span className="text-green-500">{entry.wins}</span>
                          <span className="mx-1">-</span>
                          <span className="text-red-500">{entry.losses}</span>
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

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setOffset(Math.max(0, offset - 50))}
              disabled={offset === 0 || loading}
            >
              ← Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Showing {offset + 1}-{offset + filteredLeaderboard.length}
            </span>
            <Button
              variant="outline"
              onClick={() => setOffset(offset + 50)}
              disabled={filteredLeaderboard.length < 50 || loading}
            >
              Next →
            </Button>
          </div>
        </div>
      </main>
    </>
  )
}
