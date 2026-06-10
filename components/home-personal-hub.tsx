'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Clock,
  ExternalLink,
  Search,
  Star,
  Trash2,
  Video,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { UserAvatar } from '@/components/user-avatar'
import {
  clearRecentSearches,
  FavoritePlayer,
  getFavoritePlayers,
  getRecentSearches,
  removeFavoritePlayer,
} from '@/lib/player-memory'
import { parseMatchList } from '@/lib/mcsr'

interface FeaturedVod {
  id: string
  url: string
}

function getTwitchVideoId(url: string) {
  const match = url.match(/twitch\.tv\/videos\/(\d+)/i)
  return match?.[1] ?? null
}

function getDailyIndex(length: number) {
  if (length <= 0) return 0
  const today = new Date()
  const key = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  )
  return Math.floor(key / 86_400_000) % length
}

export function HomePersonalHub() {
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [favorites, setFavorites] = useState<FavoritePlayer[]>([])
  const [featuredVod, setFeaturedVod] = useState<FeaturedVod | null>(null)
  const [vodLoading, setVodLoading] = useState(true)

  useEffect(() => {
    setRecentSearches(getRecentSearches())
    setFavorites(getFavoritePlayers())
  }, [])

  useEffect(() => {
    async function loadFeaturedVod() {
      try {
        setVodLoading(true)
        const response = await fetch('/api/matches?count=40')
        const data = await response.json()
        const twitchVods = parseMatchList(data)
          .flatMap((match) => match.vod ?? [])
          .map((vod) => vod.url)
          .filter((url) => getTwitchVideoId(url))

        const uniqueVods = Array.from(new Set(twitchVods))
        const url = uniqueVods[getDailyIndex(uniqueVods.length)]
        const id = url ? getTwitchVideoId(url) : null

        setFeaturedVod(id && url ? { id, url } : null)
      } catch {
        setFeaturedVod(null)
      } finally {
        setVodLoading(false)
      }
    }

    loadFeaturedVod()
  }, [])

  const twitchEmbedUrl = useMemo(() => {
    if (!featuredVod || typeof window === 'undefined') return ''
    const parent = window.location.hostname
    return `https://player.twitch.tv/?video=${featuredVod.id}&parent=${parent}&muted=true`
  }, [featuredVod])

  function handleClearRecentSearches() {
    setRecentSearches(clearRecentSearches())
  }

  function handleRemoveFavorite(username: string) {
    setFavorites(removeFavoritePlayer(username))
  }

  return (
    <section className="grid gap-4 lg:grid-cols-3">
      <Card className="border border-primary/40 bg-card/85 p-5 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase text-muted-foreground">
              Recent Searches
            </h2>
          </div>
          {recentSearches.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={handleClearRecentSearches}
              aria-label="Clear recent searches"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="mt-4 space-y-2">
          {recentSearches.length > 0 ? (
            recentSearches.map((username) => (
              <Link
                key={username}
                href={`/player/${encodeURIComponent(username)}`}
                className="flex items-center justify-between rounded border border-border bg-muted/35 px-3 py-2 transition hover:bg-muted/70"
              >
                <span className="font-medium text-foreground">{username}</span>
                <Search className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))
          ) : (
            <div className="rounded border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
              Search a player from the header and they will show up here.
            </div>
          )}
        </div>
      </Card>

      <Card className="border border-primary/40 bg-card/85 p-5 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold uppercase text-muted-foreground">
            Favorite Players
          </h2>
        </div>

        <div className="mt-4 space-y-2">
          {favorites.length > 0 ? (
            favorites.slice(0, 5).map((player) => (
              <div
                key={player.username}
                className="flex items-center justify-between gap-3 rounded border border-border bg-muted/35 p-2"
              >
                <Link
                  href={`/player/${encodeURIComponent(player.username)}`}
                  className="flex min-w-0 items-center gap-3"
                >
                  <UserAvatar
                    uuid={player.uuid}
                    username={player.username}
                    size={36}
                    className="h-9 w-9 rounded"
                  />
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-foreground">
                      {player.username}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {player.rank ? `#${player.rank}` : 'Saved player'}
                      {player.elo ? `, ${player.elo.toLocaleString()} Elo` : ''}
                    </span>
                  </span>
                </Link>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleRemoveFavorite(player.username)}
                  aria-label={`Remove ${player.username} from favorites`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          ) : (
            <div className="rounded border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
              Open a player profile and hit Favorite to pin them here.
            </div>
          )}
        </div>
      </Card>

      <Card className="border border-primary/40 bg-card/85 p-5 backdrop-blur-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Video className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase text-muted-foreground">
              Daily Featured Match
            </h2>
          </div>
          {featuredVod && (
            <a
              href={featuredVod.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary transition hover:text-foreground"
              aria-label="Open Twitch VOD"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>

        {vodLoading ? (
          <div className="aspect-video animate-pulse rounded border border-border bg-muted" />
        ) : twitchEmbedUrl ? (
          <iframe
            src={twitchEmbedUrl}
            title="Daily Featured Match Twitch VOD"
            allowFullScreen
            className="aspect-video w-full rounded border border-border bg-black"
          />
        ) : (
          <div className="flex aspect-video items-center justify-center rounded border border-dashed border-border bg-muted/20 p-4 text-center text-sm text-muted-foreground">
            No Twitch VOD found right now.
          </div>
        )}
      </Card>
    </section>
  )
}
