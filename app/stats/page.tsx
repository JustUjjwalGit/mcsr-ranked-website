'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/header'
import { Card } from '@/components/ui/card'

interface GlobalStats {
  totalMatches: number | null
  totalPlayers: number
  averageElo: number
  topCountry: string
  recentActivity: number
  seasonInfo?: {
    name: string
    startDate: string
    endDate: string
  }
}

export default function StatsPage() {
  const [stats, setStats] = useState<GlobalStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('/api/stats')
        const data = await res.json()

        if (data.stats) {
          setStats(data.stats)
        }
      } catch (error) {
        console.error('Failed to load stats:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

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
            <Card className="border border-primary bg-primary/5 p-6">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-primary">
                  {stats.seasonInfo.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {stats.seasonInfo.startDate} - {stats.seasonInfo.endDate}
                </p>
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
                <p className="text-sm text-muted-foreground mb-2">Total Matches</p>
                <p className="text-3xl font-bold text-foreground">
                  {stats?.totalMatches != null
                    ? stats.totalMatches.toLocaleString()
                    : '—'}
                </p>
              </Card>

              <Card className="border border-border bg-card p-6">
                <p className="text-sm text-muted-foreground mb-2">Active Players</p>
                <p className="text-3xl font-bold text-foreground">
                  {stats?.totalPlayers?.toLocaleString() || '0'}
                </p>
              </Card>

              <Card className="border border-border bg-card p-6">
                <p className="text-sm text-muted-foreground mb-2">Average Elo</p>
                <p className="text-3xl font-bold text-primary">
                  {stats?.averageElo || '0'}
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

          {/* Activity Section */}
          <Card className="border border-border bg-card p-6">
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">Recent Activity</h2>
              <p className="text-2xl font-semibold text-primary">
                {stats?.recentActivity || '0'} matches in last 24 hours
              </p>
              <div className="h-40 rounded bg-muted flex items-center justify-center text-muted-foreground">
                Activity chart
              </div>
            </div>
          </Card>

          {/* Additional Metrics */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border border-border bg-card p-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">
                  Top Gainers (24h)
                </h3>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded border border-border bg-muted/50 p-3"
                    >
                      <span className="text-sm font-medium text-foreground">
                        Player {i}
                      </span>
                      <span className="text-sm font-semibold text-green-500">
                        +50 Elo
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <Card className="border border-border bg-card p-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">
                  Top Losers (24h)
                </h3>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded border border-border bg-muted/50 p-3"
                    >
                      <span className="text-sm font-medium text-foreground">
                        Player {i}
                      </span>
                      <span className="text-sm font-semibold text-red-500">
                        -50 Elo
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </>
  )
}
