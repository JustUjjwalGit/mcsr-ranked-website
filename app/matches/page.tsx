'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { mapMatchToCard, parseMatchList } from '@/lib/mcsr'
import { MatchActions } from '@/components/match-actions'

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

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [before, setBefore] = useState<string | null>(null)
  const [cursorStack, setCursorStack] = useState<string[]>([])

  useEffect(() => {
    async function loadMatches() {
      try {
        setLoading(true)
        const params = new URLSearchParams({ count: '50' })
        if (before) params.set('before', before)
        const res = await fetch(`/api/matches?${params}`)
        const data = await res.json()
        setMatches(parseMatchList(data).map((match) => mapMatchToCard(match)))
      } catch (error) {
        console.error('Failed to load matches:', error)
      } finally {
        setLoading(false)
      }
    }

    loadMatches()
  }, [before])

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-foreground">Recent Matches</h1>
            <p className="text-muted-foreground">
              Watch and analyze matches from top speedrunners
            </p>
          </div>

          {/* Matches List */}
          <div className="space-y-3">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-20 animate-pulse rounded border border-border bg-muted"
                  ></div>
                ))}
              </div>
            ) : matches.length > 0 ? (
              matches.map((match) => (
                <Card
                  key={match.id}
                  className="border border-border bg-card p-4 transition hover:bg-muted/50"
                >
                  <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                      {/* Timestamp */}
                      <div className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(match.timestamp).toLocaleString()}
                      </div>

                      {/* Players */}
                      <div className="flex items-center gap-3 flex-1">
                        <a
                          href={`/player/${match.player1}`}
                          className={`font-semibold transition hover:text-primary ${
                            match.winner === match.player1
                              ? 'text-primary'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {match.player1}
                        </a>
                        <span className="text-muted-foreground">vs</span>
                        <a
                          href={`/player/${match.player2}`}
                          className={`font-semibold transition hover:text-primary ${
                            match.winner === match.player2
                              ? 'text-primary'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {match.player2}
                        </a>
                      </div>

                      {/* Duration */}
                      {match.duration && (
                        <div className="text-sm text-muted-foreground whitespace-nowrap">
                          {match.duration}
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <MatchActions
                      matchId={match.id}
                      playerNickname={match.replayPlayer}
                      vodUrl={match.vodUrl}
                      className="w-full md:w-auto"
                    />
                  </div>
                </Card>
              ))
            ) : (
              <Card className="border border-border bg-card p-8 text-center">
                <p className="text-muted-foreground">No matches found</p>
              </Card>
            )}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => {
                const previous = cursorStack[cursorStack.length - 1]
                setCursorStack((stack) => stack.slice(0, -1))
                setBefore(previous ?? null)
              }}
              disabled={cursorStack.length === 0 || loading}
            >
              ← Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              {matches.length} matches
            </span>
            <Button
              variant="outline"
              onClick={() => {
                const lastId = matches[matches.length - 1]?.id
                if (!lastId) return
                setCursorStack((stack) => [...stack, before ?? ''])
                setBefore(lastId)
              }}
              disabled={matches.length < 50 || loading}
            >
              Next →
            </Button>
          </div>
        </div>
      </main>
    </>
  )
}
