'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  MonitorPlay,
  Radio,
  RefreshCw,
  Swords,
  Trophy,
  Users,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import { MatchActions } from '@/components/match-actions'
import { RankIcon } from '@/components/rank-icon'
import { SiteLoader } from '@/components/site-loader'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { UserAvatar } from '@/components/user-avatar'
import {
  formatMatchTime,
  type McsrMatch,
  type McsrUser,
  parseMatchList,
} from '@/lib/mcsr'
import { cn } from '@/lib/utils'

interface LiveTimeline {
  time: number
  type: string
}

interface LivePlayerData {
  liveUrl: string | null
  timeline: LiveTimeline | null
}

interface LiveRace {
  currentTime: number
  players: McsrUser[]
  data: Record<string, LivePlayerData | undefined>
}

interface LiveResponse {
  status?: string
  data?: {
    players?: number
    liveMatches?: LiveRace[]
  }
}

type LiveFilter = 'all' | 'both' | 'streaming' | 'high-elo'

const LIVE_REFRESH_MS = 5_000

const progressStages = [
  { label: 'Start', order: 0 },
  { label: 'Nether', order: 1 },
  { label: 'Bastion', order: 2 },
  { label: 'Fortress', order: 4 },
  { label: 'Blind', order: 6 },
  { label: 'Stronghold', order: 7 },
  { label: 'End', order: 8 },
] as const

const timelineEvents: Array<{
  match: (type: string) => boolean
  order: number
  label: string
}> = [
  {
    match: (type) => type.includes('enter_the_nether') || type.includes('nether.root'),
    order: 1,
    label: 'Nether',
  },
  {
    match: (type) => type.includes('find_bastion'),
    order: 2,
    label: 'Bastion',
  },
  {
    match: (type) => type.includes('loot_bastion'),
    order: 3,
    label: 'Bastion cleared',
  },
  {
    match: (type) => type.includes('find_fortress'),
    order: 4,
    label: 'Fortress',
  },
  {
    match: (type) => type.includes('obtain_blaze_rod'),
    order: 5,
    label: 'Rods',
  },
  {
    match: (type) => type.includes('blind_travel'),
    order: 6,
    label: 'Blind',
  },
  {
    match: (type) => type.includes('follow_ender_eye') || type.includes('stronghold'),
    order: 7,
    label: 'Stronghold',
  },
  {
    match: (type) => type.includes('enter_the_end') || type.includes('end.root'),
    order: 8,
    label: 'End',
  },
  {
    match: (type) => type.includes('kill_dragon') || type.includes('dragon_death') || type.includes('finish'),
    order: 9,
    label: 'Finished',
  },
]

function raceKey(race: LiveRace) {
  return race.players
    .map((player) => player.uuid)
    .sort()
    .join(':')
}

function playerData(race: LiveRace, player: McsrUser | undefined) {
  return player ? race.data[player.uuid] : undefined
}

function getTimelineProgress(timeline: LiveTimeline | null | undefined) {
  if (!timeline) return { order: 0, label: 'Start' }
  const event = [...timelineEvents].reverse().find((candidate) =>
    candidate.match(timeline.type),
  )
  return event ?? { order: 0, label: 'Running' }
}

function formatRaceTime(ms: number | null | undefined, tenths = false) {
  if (ms == null || Number.isNaN(ms)) return '—'
  const totalSeconds = Math.max(ms, 0) / 1000
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = tenths
    ? (totalSeconds % 60).toFixed(1).padStart(4, '0')
    : Math.floor(totalSeconds % 60).toString().padStart(2, '0')
  return `${minutes}:${seconds}`
}

function averageElo(race: LiveRace) {
  const ratings = race.players
    .map((player) => player.eloRate)
    .filter((rating): rating is number => rating != null)
  if (ratings.length === 0) return 0
  return Math.round(ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length)
}

function streamCount(race: LiveRace) {
  return race.players.filter((player) => playerData(race, player)?.liveUrl).length
}

function sortLiveRaces(races: LiveRace[]) {
  return [...races].sort(
    (first, second) =>
      streamCount(second) - streamCount(first) ||
      averageElo(second) - averageElo(first) ||
      second.currentTime - first.currentTime,
  )
}

function twitchChannel(url: string | null | undefined) {
  if (!url) return null
  try {
    const parsed = new URL(url)
    if (!parsed.hostname.toLowerCase().endsWith('twitch.tv')) return null
    const channel = parsed.pathname.split('/').filter(Boolean)[0]
    return channel && channel.toLowerCase() !== 'videos' ? channel : null
  } catch {
    return null
  }
}

function youtubeVideoId(url: string | null | undefined) {
  if (!url) return null
  try {
    const parsed = new URL(url)
    if (parsed.hostname === 'youtu.be') return parsed.pathname.split('/').filter(Boolean)[0] ?? null
    if (parsed.hostname.endsWith('youtube.com')) {
      return parsed.searchParams.get('v') ||
        (parsed.pathname.startsWith('/embed/') ? parsed.pathname.split('/')[2] : null)
    }
  } catch {
    return null
  }
  return null
}

function liveLead(race: LiveRace) {
  const [first, second] = race.players
  if (!first || !second) return null
  const firstTimeline = playerData(race, first)?.timeline
  const secondTimeline = playerData(race, second)?.timeline
  const firstProgress = getTimelineProgress(firstTimeline)
  const secondProgress = getTimelineProgress(secondTimeline)

  if (firstProgress.order !== secondProgress.order) {
    const leader = firstProgress.order > secondProgress.order ? first : second
    return {
      leader,
      text: `${Math.abs(firstProgress.order - secondProgress.order)} milestone${Math.abs(firstProgress.order - secondProgress.order) === 1 ? '' : 's'} ahead`,
    }
  }

  if (
    firstTimeline &&
    secondTimeline &&
    firstProgress.order > 0 &&
    firstTimeline.time !== secondTimeline.time
  ) {
    const leader = firstTimeline.time < secondTimeline.time ? first : second
    return {
      leader,
      text: `${formatRaceTime(Math.abs(firstTimeline.time - secondTimeline.time), true)} ahead`,
    }
  }

  return null
}

function PlayerSummary({
  player,
  race,
  side,
}: {
  player: McsrUser
  race: LiveRace
  side: 'left' | 'right'
}) {
  const state = playerData(race, player)
  const progress = getTimelineProgress(state?.timeline)
  return (
    <div
      className={cn(
        'flex min-w-0 items-center gap-3',
        side === 'right' && 'flex-row-reverse text-right',
      )}
    >
      <UserAvatar
        uuid={player.uuid}
        username={player.nickname}
        size={58}
        className="h-12 w-12 shrink-0 rounded-sm sm:h-14 sm:w-14"
      />
      <div className="min-w-0">
        <Link
          href={`/player/${encodeURIComponent(player.nickname)}`}
          className="block truncate text-base font-bold text-foreground transition hover:text-primary sm:text-lg"
        >
          {player.nickname}
        </Link>
        <div
          className={cn(
            'mt-1 flex items-center gap-1.5 text-xs text-muted-foreground',
            side === 'right' && 'justify-end',
          )}
        >
          <RankIcon elo={player.eloRate} size={18} />
          <span>{player.eloRate?.toLocaleString() ?? 'Placement'} Elo</span>
          {player.eloRank != null && <span>· #{player.eloRank}</span>}
        </div>
        <p className="mt-1 truncate font-mono text-xs text-primary">
          {progress.label}{state?.timeline ? ` · ${formatRaceTime(state.timeline.time, true)}` : ''}
        </p>
      </div>
    </div>
  )
}

function ProgressRace({ race }: { race: LiveRace }) {
  const [first, second] = race.players
  if (!first || !second) return null
  const racers = [first, second]

  return (
    <div className="border-t border-white/10 bg-background/45 px-3 py-4 sm:px-5">
      <div className="grid gap-3">
        {racers.map((player, playerIndex) => {
          const state = playerData(race, player)
          const progress = getTimelineProgress(state?.timeline)
          const width = `${Math.min((progress.order / 9) * 100, 100)}%`
          return (
            <div key={player.uuid} className="grid grid-cols-[5.5rem_minmax(0,1fr)_5.5rem] items-center gap-2 sm:grid-cols-[8rem_minmax(0,1fr)_8rem] sm:gap-3">
              <span className="truncate text-xs font-semibold text-foreground">
                {player.nickname}
              </span>
              <div className="relative h-2 rounded-full bg-muted/70">
                <div
                  className={cn(
                    'absolute inset-y-0 left-0 rounded-full transition-[width] duration-500',
                    playerIndex === 0 ? 'bg-cyan-400' : 'bg-amber-400',
                  )}
                  style={{ width }}
                />
                <span
                  className={cn(
                    'absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background shadow-[0_0_12px_currentColor] transition-[left] duration-500',
                    playerIndex === 0 ? 'bg-cyan-300 text-cyan-300' : 'bg-amber-300 text-amber-300',
                  )}
                  style={{ left: width }}
                />
              </div>
              <span className="truncate text-right font-mono text-[11px] text-muted-foreground">
                {progress.label}
              </span>
            </div>
          )
        })}
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1">
        {progressStages.map((stage) => (
          <span key={stage.label} className="text-center font-mono text-[9px] uppercase text-muted-foreground sm:text-[10px]">
            {stage.label}
          </span>
        ))}
      </div>
    </div>
  )
}

function StreamPanel({
  player,
  race,
  parent,
  muted,
  hiddenOnMobile,
}: {
  player: McsrUser
  race: LiveRace
  parent: string
  muted: boolean
  hiddenOnMobile: boolean
}) {
  const state = playerData(race, player)
  const channel = twitchChannel(state?.liveUrl)
  const youtubeId = youtubeVideoId(state?.liveUrl)
  const progress = getTimelineProgress(state?.timeline)

  return (
    <section className={cn('relative min-w-0 bg-black', hiddenOnMobile && 'hidden md:block')}>
      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between bg-gradient-to-b from-black/85 to-transparent p-3 pointer-events-none">
        <span className="flex items-center gap-2 text-sm font-semibold text-white drop-shadow">
          <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
          {player.nickname}
        </span>
        <span className="rounded bg-black/65 px-2 py-1 font-mono text-[11px] text-white/85">
          {progress.label}
        </span>
      </div>

      {channel && parent ? (
        <iframe
          key={`${channel}-${muted}`}
          src={`https://player.twitch.tv/?channel=${encodeURIComponent(channel)}&parent=${encodeURIComponent(parent)}&muted=${muted ? 'true' : 'false'}&autoplay=true&layout=video&theme=dark`}
          title={`${player.nickname} live Twitch POV`}
          className="aspect-video h-full min-h-[240px] w-full border-0 bg-black sm:min-h-[300px] xl:min-h-[420px]"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      ) : youtubeId ? (
        <iframe
          key={`${youtubeId}-${muted}`}
          src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(youtubeId)}?autoplay=1&mute=${muted ? '1' : '0'}&rel=0`}
          title={`${player.nickname} live YouTube POV`}
          className="aspect-video h-full min-h-[240px] w-full border-0 bg-black sm:min-h-[300px] xl:min-h-[420px]"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
      ) : (
        <div className="flex aspect-video min-h-[240px] flex-col items-center justify-center bg-[radial-gradient(circle_at_center,var(--muted),var(--background))] p-6 text-center sm:min-h-[300px] xl:min-h-[420px]">
          <UserAvatar
            uuid={player.uuid}
            username={player.nickname}
            size={84}
            className="h-20 w-20 border-primary/30 opacity-85"
          />
          <p className="mt-4 font-semibold text-foreground">POV not shared</p>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Live progress is still updating from the ranked match timeline.
          </p>
          {state?.liveUrl && (
            <a
              href={state.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              Open external stream <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      )}
    </section>
  )
}

function LiveArena({ race }: { race: LiveRace }) {
  const [parent, setParent] = useState('')
  const [audioPlayer, setAudioPlayer] = useState<string | null>(null)
  const [mobilePlayer, setMobilePlayer] = useState<string | null>(null)
  const [displayTime, setDisplayTime] = useState(race.currentTime)
  const [first, second] = race.players
  const lead = liveLead(race)

  useEffect(() => {
    setParent(window.location.hostname)
  }, [])

  useEffect(() => {
    setDisplayTime(race.currentTime)
    const startedAt = Date.now()
    const timer = window.setInterval(() => {
      setDisplayTime(race.currentTime + Date.now() - startedAt)
    }, 100)
    return () => window.clearInterval(timer)
  }, [race.currentTime, raceKey(race)])

  useEffect(() => {
    setAudioPlayer(null)
    setMobilePlayer(first?.uuid ?? null)
  }, [first?.uuid, second?.uuid])

  if (!first || !second) return null
  const activeMobilePlayer = mobilePlayer ?? first.uuid

  return (
    <Card className="overflow-hidden rounded-xl border-primary/35 bg-card/94 shadow-[0_24px_80px_rgba(0,0,0,0.38)]">
      <div className="grid items-center gap-4 border-b border-white/10 bg-card/95 p-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:p-5">
        <PlayerSummary player={first} race={race} side="left" />
        <div className="order-first text-center md:order-none">
          <div className="flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-[0.22em] text-red-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" /> Live race
          </div>
          <p className="mt-1 font-mono text-3xl font-bold tabular-nums text-foreground sm:text-4xl">
            {formatRaceTime(displayTime, true)}
          </p>
          <p className={cn('mt-1 text-xs font-semibold', lead ? 'text-emerald-300' : 'text-muted-foreground')}>
            {lead ? `${lead.leader.nickname} · ${lead.text}` : 'Dead even at the latest milestone'}
          </p>
        </div>
        <PlayerSummary player={second} race={race} side="right" />
      </div>

      <ProgressRace race={race} />

      <div className="flex flex-wrap items-center justify-between gap-2 border-y border-white/10 bg-background/65 px-3 py-2 sm:px-4">
        <div className="flex md:hidden" role="group" aria-label="Choose mobile POV">
          {[first, second].map((player) => (
            <Button
              key={player.uuid}
              type="button"
              size="sm"
              variant={activeMobilePlayer === player.uuid ? 'secondary' : 'ghost'}
              onClick={() => setMobilePlayer(player.uuid)}
            >
              {player.nickname}
            </Button>
          ))}
        </div>
        <p className="hidden text-xs text-muted-foreground md:block">
          Both POVs are synced to the live ranked race. Streams can have different broadcast delay.
        </p>
        <div className="ml-auto flex flex-wrap items-center gap-1" role="group" aria-label="Stream audio focus">
          <Button
            type="button"
            size="sm"
            variant={audioPlayer === first.uuid ? 'secondary' : 'ghost'}
            onClick={() => setAudioPlayer((current) => current === first.uuid ? null : first.uuid)}
          >
            {audioPlayer === first.uuid ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            {first.nickname}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={audioPlayer === second.uuid ? 'secondary' : 'ghost'}
            onClick={() => setAudioPlayer((current) => current === second.uuid ? null : second.uuid)}
          >
            {audioPlayer === second.uuid ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            {second.nickname}
          </Button>
        </div>
      </div>

      <div className="grid bg-black md:grid-cols-2 md:divide-x md:divide-white/15">
        <StreamPanel
          player={first}
          race={race}
          parent={parent}
          muted={audioPlayer !== first.uuid}
          hiddenOnMobile={activeMobilePlayer !== first.uuid}
        />
        <StreamPanel
          player={second}
          race={race}
          parent={parent}
          muted={audioPlayer !== second.uuid}
          hiddenOnMobile={activeMobilePlayer !== second.uuid}
        />
      </div>
    </Card>
  )
}

function LiveRaceList({
  races,
  selectedKey,
  onSelect,
}: {
  races: LiveRace[]
  selectedKey: string | null
  onSelect: (key: string) => void
}) {
  return (
    <div className="space-y-2">
      {races.map((race) => {
        const [first, second] = race.players
        if (!first || !second) return null
        const key = raceKey(race)
        const lead = liveLead(race)
        const streams = streamCount(race)
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            className={cn(
              'w-full rounded-lg border p-3 text-left transition',
              selectedKey === key
                ? 'border-primary bg-primary/10 shadow-[0_0_28px_color-mix(in_oklch,var(--primary),transparent_82%)]'
                : 'border-border bg-background/45 hover:border-primary/55 hover:bg-muted/45',
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2">
                <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-red-500" />
                <span className="truncate text-sm font-semibold text-foreground">
                  {first.nickname} <span className="text-muted-foreground">vs</span> {second.nickname}
                </span>
              </span>
              <span className="shrink-0 font-mono text-xs text-foreground">
                {formatRaceTime(race.currentTime, true)}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
              <span>{averageElo(race).toLocaleString()} avg Elo</span>
              <span className={cn(streams === 2 && 'font-semibold text-emerald-300')}>
                {streams === 2 ? 'Both POVs' : streams === 1 ? '1 POV' : 'Progress only'}
              </span>
            </div>
            <p className="mt-1 truncate text-[11px] text-primary">
              {lead ? `${lead.leader.nickname} · ${lead.text}` : 'Even race'}
            </p>
          </button>
        )
      })}
    </div>
  )
}

function RecentMatchCard({ match }: { match: McsrMatch }) {
  const [first, second] = match.players
  if (!first || !second) return null
  const winner = match.result?.uuid
  return (
    <Card className="rounded-lg border-border bg-card/82 p-3 transition hover:border-primary/45 sm:p-4">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="grid min-w-0 gap-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
          <span className="font-mono text-xs text-muted-foreground">
            {new Date(match.date * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
            <Link href={`/player/${encodeURIComponent(first.nickname)}`} className={cn('truncate text-right text-sm font-semibold hover:text-primary', winner === first.uuid ? 'text-emerald-300' : 'text-foreground')}>
              {first.nickname}
            </Link>
            <Swords className="h-3.5 w-3.5 text-muted-foreground" />
            <Link href={`/player/${encodeURIComponent(second.nickname)}`} className={cn('truncate text-sm font-semibold hover:text-primary', winner === second.uuid ? 'text-emerald-300' : 'text-foreground')}>
              {second.nickname}
            </Link>
          </div>
          <span className="font-mono text-sm font-semibold text-primary sm:text-right">
            {formatMatchTime(match.result?.time) ?? 'Forfeit'}
          </span>
        </div>
        <MatchActions
          matchId={String(match.id)}
          playerNickname={first.nickname}
          vodUrl={match.vod?.[0]?.url}
          className="w-full lg:w-auto"
        />
      </div>
    </Card>
  )
}

export default function MatchesPage() {
  const [liveRaces, setLiveRaces] = useState<LiveRace[]>([])
  const [onlinePlayers, setOnlinePlayers] = useState(0)
  const [liveLoading, setLiveLoading] = useState(true)
  const [liveError, setLiveError] = useState('')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [filter, setFilter] = useState<LiveFilter>('all')
  const [matches, setMatches] = useState<McsrMatch[]>([])
  const [matchesLoading, setMatchesLoading] = useState(true)
  const [before, setBefore] = useState<string | null>(null)
  const [cursorStack, setCursorStack] = useState<string[]>([])

  const loadLive = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) setLiveLoading(true)
      const response = await fetch('/api/live', { cache: 'no-store' })
      if (!response.ok) throw new Error('Live service unavailable')
      const body = (await response.json()) as LiveResponse
      const races = sortLiveRaces(body.data?.liveMatches ?? [])
      setLiveRaces(races)
      setOnlinePlayers(body.data?.players ?? 0)
      setLastUpdated(new Date())
      setLiveError('')
      setSelectedKey((current) =>
        current && races.some((race) => raceKey(race) === current)
          ? current
          : races[0]
            ? raceKey(races[0])
            : null,
      )
    } catch {
      setLiveError('Live race data is temporarily unavailable.')
    } finally {
      setLiveLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadLive(true)
    const timer = window.setInterval(() => void loadLive(), LIVE_REFRESH_MS)
    return () => window.clearInterval(timer)
  }, [loadLive])

  useEffect(() => {
    async function loadRecentMatches() {
      try {
        setMatchesLoading(true)
        const params = new URLSearchParams({ count: '20' })
        if (before) params.set('before', before)
        const response = await fetch(`/api/matches?${params}`)
        const body = await response.json()
        setMatches(parseMatchList(body))
      } catch {
        setMatches([])
      } finally {
        setMatchesLoading(false)
      }
    }
    void loadRecentMatches()
  }, [before])

  const filteredRaces = useMemo(() => {
    if (filter === 'both') return liveRaces.filter((race) => streamCount(race) === 2)
    if (filter === 'streaming') return liveRaces.filter((race) => streamCount(race) > 0)
    if (filter === 'high-elo') return liveRaces.filter((race) => averageElo(race) >= 1500)
    return liveRaces
  }, [filter, liveRaces])

  const selectedRace =
    liveRaces.find((race) => raceKey(race) === selectedKey) ?? liveRaces[0] ?? null
  const bothPovCount = liveRaces.filter((race) => streamCount(race) === 2).length

  return (
    <>
      <Header />
      <main className="mx-auto max-w-[1800px] px-2 py-4 sm:px-4 sm:py-6">
        <section className="mb-4 flex flex-col gap-4 rounded-xl border border-white/10 bg-card/80 p-4 backdrop-blur-xl sm:p-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-red-400">
              <Radio className="h-4 w-4" /> Race control
            </div>
            <h1 className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">Live Ranked Matches</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Watch both runners, follow milestone progress, and see who is ahead as the race unfolds.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <div className="rounded-lg border border-border bg-background/50 px-3 py-2">
              <p className="text-[11px] uppercase text-muted-foreground">Live races</p>
              <p className="mt-1 font-mono text-lg font-bold text-foreground">{liveRaces.length}</p>
            </div>
            <div className="rounded-lg border border-border bg-background/50 px-3 py-2">
              <p className="text-[11px] uppercase text-muted-foreground">Both POVs</p>
              <p className="mt-1 font-mono text-lg font-bold text-emerald-300">{bothPovCount}</p>
            </div>
            <div className="rounded-lg border border-border bg-background/50 px-3 py-2">
              <p className="text-[11px] uppercase text-muted-foreground">Players online</p>
              <p className="mt-1 font-mono text-lg font-bold text-primary">{onlinePlayers.toLocaleString()}</p>
            </div>
            <Button type="button" variant="outline" className="h-full min-h-14" onClick={() => void loadLive()} disabled={liveLoading}>
              <RefreshCw className={cn('h-4 w-4', liveLoading && 'animate-spin')} />
              Refresh
            </Button>
          </div>
        </section>

        {liveError && (
          <div className="mb-4 rounded-lg border border-rose-500/35 bg-rose-500/10 p-3 text-sm text-rose-200">
            {liveError} Recent matches are still available below.
          </div>
        )}

        {liveLoading && liveRaces.length === 0 ? (
          <Card className="border-border bg-card/90 p-14">
            <SiteLoader label="Connecting to live races..." />
          </Card>
        ) : selectedRace ? (
          <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
            <LiveArena race={selectedRace} />

            <aside className="min-w-0 rounded-xl border border-white/10 bg-card/88 p-3 backdrop-blur-xl sm:p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="flex items-center gap-2 font-semibold text-foreground">
                    <Activity className="h-4 w-4 text-red-400" /> Live directory
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : 'Connecting...'}
                  </p>
                </div>
                <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-1 font-mono text-[10px] uppercase text-red-300">
                  Auto 5s
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-1 rounded-lg bg-background/55 p-1" role="group" aria-label="Filter live races">
                {([
                  ['all', 'All'],
                  ['both', 'Both POV'],
                  ['streaming', 'Streaming'],
                  ['high-elo', '1500+ Elo'],
                ] as Array<[LiveFilter, string]>).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFilter(value)}
                    className={cn(
                      'rounded-md px-2 py-2 text-xs font-medium transition',
                      filter === value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="mt-3 max-h-[45rem] overflow-y-auto pr-1">
                {filteredRaces.length > 0 ? (
                  <LiveRaceList races={filteredRaces} selectedKey={selectedKey} onSelect={setSelectedKey} />
                ) : (
                  <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                    No live races match this filter.
                  </div>
                )}
              </div>
            </aside>
          </section>
        ) : (
          <Card className="overflow-hidden rounded-xl border-border bg-card/90">
            <div className="flex min-h-[25rem] flex-col items-center justify-center p-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-primary/35 bg-primary/10 text-primary">
                <MonitorPlay className="h-6 w-6" />
              </div>
              <h2 className="mt-5 text-2xl font-bold text-foreground">No ranked race is live right now</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                This area automatically switches to dual POV mode when runners share their streams. The recent race archive is below.
              </p>
            </div>
          </Card>
        )}

        <section className="mt-8">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">Race archive</p>
              <h2 className="mt-1 text-2xl font-bold text-foreground">Recent Matches</h2>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Two-player races</span>
              <span className="flex items-center gap-1.5"><Trophy className="h-3.5 w-3.5" /> Winner highlighted</span>
              <span className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" /> Final time</span>
            </div>
          </div>

          <div className="space-y-2">
            {matchesLoading ? (
              <Card className="border-border bg-card/90 p-10"><SiteLoader label="Loading recent races..." /></Card>
            ) : matches.length > 0 ? (
              matches.map((match) => <RecentMatchCard key={match.id} match={match} />)
            ) : (
              <Card className="border-border bg-card/90 p-8 text-center text-muted-foreground">No recent matches found.</Card>
            )}
          </div>

          <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                const previous = cursorStack[cursorStack.length - 1]
                setCursorStack((stack) => stack.slice(0, -1))
                setBefore(previous ?? null)
              }}
              disabled={cursorStack.length === 0 || matchesLoading}
              className="justify-self-start"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
            <span className="font-mono text-xs text-muted-foreground">{matches.length} races</span>
            <Button
              variant="outline"
              onClick={() => {
                const lastId = matches[matches.length - 1]?.id
                if (!lastId) return
                setCursorStack((stack) => [...stack, before ?? ''])
                setBefore(String(lastId))
              }}
              disabled={matches.length < 20 || matchesLoading}
              className="justify-self-end"
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
