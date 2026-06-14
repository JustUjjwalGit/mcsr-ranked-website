'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRightLeft,
  ExternalLink,
  Radio,
  RefreshCcw,
  Timer,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { UserAvatar } from '@/components/user-avatar'

interface LivePlayer {
  uuid: string
  nickname: string
  eloRate: number | null
  eloRank: number | null
  country: string | null
}

interface LiveMatch {
  currentTime: number
  players: LivePlayer[]
  data?: Record<
    string,
    {
      liveUrl?: string | null
      timeline?: {
        time?: number
        type?: string
      }
    }
  >
}

interface LiveResponse {
  status?: string
  data?: {
    players?: number
    liveMatches?: LiveMatch[]
  }
}

function formatDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`
  }

  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function formatTimeline(type?: string) {
  if (!type) return 'In progress'

  const label = type.split('.').at(-1) ?? type
  return label
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function getBestTimeline(match: LiveMatch) {
  return Object.values(match.data ?? {})
    .map((entry) => entry.timeline)
    .filter((timeline): timeline is NonNullable<typeof timeline> =>
      Boolean(timeline?.type),
    )
    .sort((a, b) => (b.time ?? 0) - (a.time ?? 0))[0]
}

function getLiveUrl(match: LiveMatch) {
  return Object.values(match.data ?? {}).find((entry) => entry.liveUrl)?.liveUrl
}

export function LiveNowCard() {
  const [matches, setMatches] = useState<LiveMatch[]>([])
  const [onlinePlayers, setOnlinePlayers] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function loadLiveMatches(isRefresh = false) {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      const response = await fetch('/api/live')
      const body = (await response.json()) as LiveResponse

      if (!response.ok || body.status === 'error') {
        setMatches([])
        setOnlinePlayers(0)
        return
      }

      setMatches(body.data?.liveMatches ?? [])
      setOnlinePlayers(body.data?.players ?? 0)
    } catch {
      setMatches([])
      setOnlinePlayers(0)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    void loadLiveMatches()
  }, [])

  const visibleMatches = useMemo(
    () =>
      [...matches]
        .sort((a, b) => {
          const aHasStream = getLiveUrl(a) ? 1 : 0
          const bHasStream = getLiveUrl(b) ? 1 : 0
          return bHasStream - aHasStream || b.currentTime - a.currentTime
        })
        .slice(0, 3),
    [matches],
  )

  return (
    <Card className="border border-primary/40 bg-card/85 p-4 backdrop-blur-sm sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative flex h-11 w-11 items-center justify-center rounded border border-primary bg-primary/15 text-primary">
            <Radio className="h-5 w-5" />
            {matches.length > 0 && (
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-green-500" />
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-foreground">Live Now</h2>
            <p className="text-sm text-muted-foreground">
              {matches.length.toLocaleString()} ranked matches,{' '}
              {onlinePlayers.toLocaleString()} players online
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => loadLiveMatches(true)}
          disabled={loading || refreshing}
          className="w-full lg:w-auto"
        >
          <RefreshCcw className={refreshing ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
          Refresh
        </Button>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        {loading ? (
          [0, 1, 2].map((item) => (
            <div
              key={item}
              className="h-32 animate-pulse rounded border border-border bg-muted/50"
            />
          ))
        ) : visibleMatches.length > 0 ? (
          visibleMatches.map((match) => {
            const [player1, player2] = match.players
            const liveUrl = getLiveUrl(match)
            const timeline = getBestTimeline(match)

            return (
              <div
                key={`${player1?.uuid ?? 'unknown'}-${player2?.uuid ?? 'unknown'}-${match.currentTime}`}
                className="rounded border border-border bg-muted/35 p-3"
              >
                <div className="mb-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Timer className="h-3.5 w-3.5 text-primary" />
                    {formatDuration(match.currentTime)}
                  </span>
                  <span className="min-w-0 truncate text-right">
                    {formatTimeline(timeline?.type)}
                  </span>
                </div>

                <div className="space-y-2">
                  {[player1, player2].filter(Boolean).map((player) => (
                    <Link
                      key={player.uuid}
                      href={`/player/${encodeURIComponent(player.nickname)}`}
                      className="flex min-w-0 items-center gap-3 rounded bg-background/35 p-2 transition hover:bg-muted"
                    >
                      <UserAvatar
                        uuid={player.uuid}
                        username={player.nickname}
                        size={32}
                        className="h-8 w-8 shrink-0 rounded border border-border"
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-foreground">
                          {player.nickname}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          #{player.eloRank ?? '?'} -{' '}
                          {(player.eloRate ?? 0).toLocaleString()} Elo
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Link
                    href={`/versus?player1=${encodeURIComponent(
                      player1?.nickname ?? '',
                    )}&player2=${encodeURIComponent(player2?.nickname ?? '')}`}
                    className="inline-flex h-8 items-center justify-center gap-1.5 rounded border border-border bg-background px-2 text-xs font-medium text-foreground transition hover:bg-muted"
                  >
                    <ArrowRightLeft className="h-3.5 w-3.5" />
                    Compare
                  </Link>
                  {liveUrl ? (
                    <a
                      href={liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-8 items-center justify-center gap-1.5 rounded border border-primary/40 bg-primary/10 px-2 text-xs font-medium text-primary transition hover:border-primary hover:bg-primary/15"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Watch
                    </a>
                  ) : (
                    <span className="inline-flex h-8 items-center justify-center rounded border border-border bg-background px-2 text-xs text-muted-foreground">
                      No stream
                    </span>
                  )}
                </div>
              </div>
            )
          })
        ) : (
          <div className="rounded border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground lg:col-span-3">
            No live ranked matches right now.
          </div>
        )}
      </div>
    </Card>
  )
}
