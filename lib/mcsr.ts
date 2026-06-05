/** Helpers for MCSR Ranked API response shapes (docs.mcsrranked.com). */

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

export interface McsrMatch {
  id: number
  date: number
  players: McsrUser[]
  result?: {
    uuid?: string
    time?: number
  } | null
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

export function mapLeaderboardEntry(user: McsrUser) {
  return {
    rank: user.eloRank ?? 0,
    username: user.nickname,
    elo: user.eloRate ?? 0,
    wins: 0,
    losses: 0,
    country: user.country ?? undefined,
  }
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

  return {
    id: String(match.id),
    player1: player1?.nickname ?? 'Unknown',
    player2: player2?.nickname ?? 'Unknown',
    opponent,
    winner: winnerNickname,
    result,
    timestamp: new Date(match.date * 1000).toISOString(),
    duration: formatMatchTime(match.result?.time),
  }
}
