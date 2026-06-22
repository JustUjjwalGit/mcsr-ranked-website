/** Helpers for MCSR Ranked API response shapes (docs.mcsrranked.com). */

import { fetchAPIWithCache } from '@/lib/api'

export interface McsrUser {
  uuid: string
  nickname: string
  eloRate: number | null
  eloRank: number | null
  country: string | null
  seasonResult?: {
    eloRate?: number | null
    eloRank?: number | null
    phasePoint?: number | null
  }
}

export interface McsrMatchVod {
  uuid: string
  url: string
  startsAt: number
}

export interface McsrTimeline {
  uuid: string
  time: number
  type: string
}

export interface McsrCompletion {
  uuid: string
  time: number
}

export interface McsrMatch {
  id: number
  type?: number
  season?: number
  date: number
  seedType?: string | null
  bastionType?: string | null
  players: McsrUser[]
  vod?: McsrMatchVod[]
  result?: {
    uuid?: string
    time?: number
  } | null
  completions?: McsrCompletion[]
  timelines?: McsrTimeline[]
  forfeited?: boolean
  changes?: {
    uuid: string
    change: number | null
    eloRate: number | null
  }[]
  decayed?: boolean
}

interface McsrStatBucket {
  ranked: number
  casual: number
}

interface McsrStatistics {
  season: Record<string, McsrStatBucket>
  total: Record<string, McsrStatBucket>
}

type ApiEnvelope<T> = {
  status?: string
  data?: T
  error?: string
}

export function isApiError(body: unknown): boolean {
  if (!body || typeof body !== 'object') return true
  const envelope = body as ApiEnvelope<unknown>
  return envelope.status === 'error'
}

export function getApiErrorMessage(body: unknown): string | undefined {
  if (!body || typeof body !== 'object') return undefined
  const envelope = body as ApiEnvelope<{ error?: string; query?: Record<string, string[]> }>
  if (typeof envelope.data === 'object' && envelope.data !== null) {
    const data = envelope.data as { error?: string; query?: Record<string, string[]> }
    if (data.error) return data.error
    const query = data.query
    if (query) {
      const first = Object.values(query)[0]?.[0]
      if (first) return first
    }
  }
  return undefined
}

/** Maps UI season filter to a valid API query value, or null to omit the param. */
export function resolveSeasonQuery(season: string | null | undefined): string | null {
  if (!season || season === 'current') return null
  if (season === 'all') return null
  if (/^\d+$/.test(season)) return season
  return null
}

export function parseLeaderboardUsers(body: unknown): McsrUser[] {
  if (isApiError(body)) return []
  const data = (body as ApiEnvelope<{ users?: McsrUser[] }>).data
  return Array.isArray(data?.users) ? data.users : []
}

export function parseLeaderboardSeason(body: unknown): {
  number: number
  startsAt: number
  endsAt: number
} | null {
  if (isApiError(body)) return null
  const season = (body as ApiEnvelope<{ season?: { number: number; startsAt: number; endsAt: number } }>)
    .data?.season
  if (!season || typeof season.number !== 'number') return null
  return season
}

export function parseMatchList(body: unknown): McsrMatch[] {
  if (isApiError(body)) return []
  const data = (body as ApiEnvelope<McsrMatch[] | { matches?: McsrMatch[] }>).data
  if (Array.isArray(data)) return data
  if (data && Array.isArray((data as { matches?: McsrMatch[] }).matches)) {
    return (data as { matches: McsrMatch[] }).matches
  }
  return []
}

export function parseUserProfile(body: unknown): McsrUser | null {
  if (isApiError(body)) return null
  const data = (body as ApiEnvelope<McsrUser>).data
  if (!data || typeof data.nickname !== 'string') return null
  return data
}

export function formatMatchTime(ms?: number): string | undefined {
  if (ms == null || Number.isNaN(ms)) return undefined
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export type StatsScope = 'season' | 'total'

export function extractRecordStats(
  body: unknown,
  scope: StatsScope = 'season',
) {
  const data = (body as ApiEnvelope<{ statistics?: McsrStatistics }>).data
  const bucket = data?.statistics?.[scope]
  const wins = bucket?.wins?.ranked ?? 0
  const losses = bucket?.loses?.ranked ?? 0
  const matches = bucket?.playedMatches?.ranked ?? wins + losses
  const completions = bucket?.completions?.ranked ?? 0
  const forfeits = bucket?.forfeits?.ranked ?? 0

  return {
    wins,
    losses,
    matches,
    completions,
    forfeits,
    bestTime: bucket?.bestTime?.ranked,
    playtime: bucket?.playtime?.ranked ?? 0,
    completionTime: bucket?.completionTime?.ranked ?? 0,
    currentStreak: bucket?.currentWinStreak?.ranked,
    bestStreak: bucket?.highestWinStreak?.ranked,
  }
}

export function mapLeaderboardEntry(
  user: McsrUser & { wins?: number; losses?: number },
) {
  return {
    uuid: user.uuid,
    rank: user.eloRank ?? 0,
    username: user.nickname,
    elo: user.eloRate ?? 0,
    wins: user.wins ?? 0,
    losses: user.losses ?? 0,
    country: user.country ?? undefined,
  }
}

export function mapUserToProfile(body: unknown) {
  const user = parseUserProfile(body)
  if (!user) return null
  const stats = extractRecordStats(body, 'season')
  const totalStats = extractRecordStats(body, 'total')
  const data = (body as ApiEnvelope<{
    seasonResult?: { highest?: number | null; lowest?: number | null } | null
    timestamp?: { lastRanked?: number | null; firstOnline?: number | null }
  }>).data
  const completionRate =
    stats.matches > 0 ? stats.completions / stats.matches : 0
  const forfeitRate = stats.matches > 0 ? stats.forfeits / stats.matches : 0

  return {
    ...mapLeaderboardEntry({ ...user, wins: stats.wins, losses: stats.losses }),
    statistics: {
      currentStreak: stats.currentStreak,
      bestStreak: stats.bestStreak,
      bestTime: stats.bestTime,
      seasonMatches: stats.matches,
      totalWins: totalStats.wins,
      totalLosses: totalStats.losses,
      totalMatches: totalStats.matches,
      completionRate,
      forfeitRate,
      playtime: stats.playtime,
      seasonHighestElo: data?.seasonResult?.highest ?? user.eloRate ?? 0,
      seasonLowestElo: data?.seasonResult?.lowest ?? user.eloRate ?? 0,
      lastRanked: data?.timestamp?.lastRanked,
    },
  }
}

export function getMatchStatsUrl(nickname: string, matchId: number | string) {
  return `https://mcsrranked.com/stats/${encodeURIComponent(nickname)}/${matchId}`
}

function formatSeedType(value?: string | null) {
  if (!value) return ''
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

export function getBestSeedTypeFromMatches(
  matches: McsrMatch[],
  playerUuid?: string | null,
) {
  const bestMatch = matches
    .filter((match) => {
      if (match.forfeited || !match.result?.time || !match.seedType) {
        return false
      }
      return playerUuid ? match.result.uuid === playerUuid : true
    })
    .sort((a, b) => (a.result?.time ?? Infinity) - (b.result?.time ?? Infinity))[0]

  if (!bestMatch?.seedType) return 'N/A'

  const seedType = formatSeedType(bestMatch.seedType)
  const bastionType = formatSeedType(bestMatch.bastionType)
  return bastionType ? `${seedType} / ${bastionType}` : seedType
}

export async function enrichLeaderboardUsersWithStats<
  T extends McsrUser,
>(users: T[], limit = 30): Promise<(T & { wins: number; losses: number })[]> {
  const enriched = await Promise.all(
    users.map(async (user, index) => {
      if (index >= limit) {
        return { ...user, wins: 0, losses: 0 }
      }
      try {
        const details = await fetchAPIWithCache(
          `/users/${encodeURIComponent(user.nickname)}`,
        )
        const { wins, losses } = extractRecordStats(details, 'season')
        return { ...user, wins, losses }
      } catch {
        return { ...user, wins: 0, losses: 0 }
      }
    }),
  )
  return enriched
}

export function mapMatchToCard(match: McsrMatch, perspectiveNickname?: string) {
  const [player1, player2] = match.players
  const winnerUuid = match.result?.uuid
  const winnerNickname =
    winnerUuid && player1?.uuid === winnerUuid
      ? player1.nickname
      : winnerUuid && player2?.uuid === winnerUuid
        ? player2.nickname
        : 'Draw'

  let opponent = player2?.nickname ?? 'Unknown'
  let result: 'win' | 'loss' = 'loss'
  if (perspectiveNickname) {
    const self =
      player1?.nickname.toLowerCase() === perspectiveNickname.toLowerCase()
        ? player1
        : player2?.nickname.toLowerCase() === perspectiveNickname.toLowerCase()
          ? player2
          : null
    const other = self === player1 ? player2 : player1
    opponent = other?.nickname ?? 'Unknown'
    result = self?.uuid && winnerUuid === self.uuid ? 'win' : 'loss'
  }

  const replayPlayer =
    perspectiveNickname || player1?.nickname || player2?.nickname || 'Unknown'
  const vodUrl = match.vod?.[0]?.url

  return {
    id: String(match.id),
    player1: player1?.nickname ?? 'Unknown',
    player2: player2?.nickname ?? 'Unknown',
    opponent,
    winner: winnerNickname,
    result,
    timestamp: new Date(match.date * 1000).toISOString(),
    duration: formatMatchTime(match.result?.time),
    vodUrl,
    statsUrl: getMatchStatsUrl(replayPlayer, match.id),
    replayPlayer,
  }
}
