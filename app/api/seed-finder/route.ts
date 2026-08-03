import { checkRateLimit, getRateLimitHeaders } from '@/lib/ratelimit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const FSG_BASE_URL = 'https://www.filteredseed.com'
const FILTER_CACHE_MS = 60 * 60 * 1000

interface OnlineFilter {
  id: string
  displayName: string
  supportedVersions: string[]
  maxGenerating: number
  runIsRetimed: boolean
  hasCooldownScaling?: boolean
}

interface FiltersResponse {
  type: string
  filters?: OnlineFilter[]
  errorMessage?: string
}

interface VerifiedSeedResponse {
  type: string
  data?: {
    seed: string
    token: string
  }
  cooldown?: number
  errorMessage?: string
}

interface PracticeSeedResponse {
  type: string
  seeds?: string[]
  errorMessage?: string
}

let filterCache: { expiresAt: number; filters: OnlineFilter[] } | null = null

function profileToResponse(profile: OnlineFilter) {
  return {
    key: profile.id,
    label: profile.displayName,
    supportedVersions: profile.supportedVersions,
    maxGenerating: profile.maxGenerating,
    runIsRetimed: profile.runIsRetimed,
    description: profile.runIsRetimed
      ? 'Official online filter. Runs use FSG retiming rules.'
      : 'Official online filter for standard-timed runs.',
  }
}

async function getJson<T>(path: string) {
  const response = await fetch(`${FSG_BASE_URL}${path}`, {
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      'User-Agent': 'MCSR-Ranked-Tracker/1.0',
    },
    signal: AbortSignal.timeout(20_000),
  })

  if (!response.ok) {
    throw new Error(`FSG Online Database returned HTTP ${response.status}.`)
  }

  return (await response.json()) as T
}

async function getFilters() {
  if (filterCache && filterCache.expiresAt > Date.now()) {
    return filterCache.filters
  }

  const response = await getJson<FiltersResponse>('/filters')

  if (response.type !== 'SUCCESS' || !response.filters?.length) {
    throw new Error(response.errorMessage || 'No online FSG filters are available.')
  }

  filterCache = {
    expiresAt: Date.now() + FILTER_CACHE_MS,
    filters: response.filters,
  }

  return filterCache.filters
}

function makeSeed(
  seed: string,
  profile: OnlineFilter,
  mode: 'verified' | 'practice',
  durationMs: number,
  verificationToken: string | null,
) {
  return {
    id: `${profile.id}-${seed}-${Date.now()}`,
    seed,
    profile: profile.displayName,
    filterId: profile.id,
    mode,
    version: profile.supportedVersions.join(', ') || 'Minecraft Java',
    verificationToken,
    durationMs,
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  try {
    const filters = await getFilters()
    const profiles = filters.map(profileToResponse)

    if (searchParams.get('metadata') === '1') {
      return Response.json({
        profiles,
        runtime: {
          available: true,
          runner: 'FSG Online Database',
          platform: 'online',
        },
      })
    }

    const ip =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown'
    const rateLimitResult = await checkRateLimit(`seed-finder:${ip}`)
    const headers = getRateLimitHeaders(rateLimitResult)

    if (!rateLimitResult.success) {
      return Response.json(
        { error: 'Too many seed requests. Try again shortly.' },
        { status: 429, headers },
      )
    }

    const requestedProfile = searchParams.get('profile')
    const profile =
      filters.find((candidate) => candidate.id === requestedProfile) ?? filters[0]
    const mode = searchParams.get('mode') === 'practice' ? 'practice' : 'verified'
    const startedAt = Date.now()

    if (mode === 'practice') {
      const count = Math.min(
        Math.max(Number(searchParams.get('count') ?? 3) || 3, 1),
        4,
      )
      const response = await getJson<PracticeSeedResponse>(
        `/getRandomUsedSeeds/${encodeURIComponent(profile.id)}/${count}`,
      )

      if (response.type !== 'SUCCESS' || !response.seeds?.length) {
        return Response.json(
          {
            error: response.errorMessage || 'No FSG practice seeds are available.',
            profiles,
          },
          { status: 502, headers },
        )
      }

      const durationMs = Date.now() - startedAt
      return Response.json(
        {
          profile: profileToResponse(profile),
          profiles,
          runtime: {
            available: true,
            runner: 'FSG Online Database',
            platform: 'online',
          },
          seeds: response.seeds.map((seed) =>
            makeSeed(seed, profile, mode, durationMs, null),
          ),
        },
        { headers },
      )
    }

    const response = await getJson<VerifiedSeedResponse>(
      `/getSeed/${encodeURIComponent(profile.id)}`,
    )

    if (response.type === 'COOLDOWN') {
      const cooldownMs = Math.max(response.cooldown ?? 0, 0)
      const retryAfterSeconds = Math.max(Math.ceil(cooldownMs / 1000), 1)

      return Response.json(
        {
          error: 'The official FSG cooldown is active.',
          details: `Try again in about ${retryAfterSeconds} seconds, or use Practice mode while you wait.`,
          retryAfterMs: cooldownMs,
          profiles,
        },
        {
          status: 429,
          headers: {
            ...headers,
            'Retry-After': String(retryAfterSeconds),
          },
        },
      )
    }

    if (response.type !== 'SUCCESS' || !response.data?.seed) {
      return Response.json(
        {
          error: response.errorMessage || 'The FSG database did not return a seed.',
          profiles,
        },
        { status: 502, headers },
      )
    }

    return Response.json(
      {
        profile: profileToResponse(profile),
        profiles,
        runtime: {
          available: true,
          runner: 'FSG Online Database',
          platform: 'online',
        },
        seeds: [
          makeSeed(
            response.data.seed,
            profile,
            mode,
            Date.now() - startedAt,
            response.data.token || null,
          ),
        ],
      },
      { headers },
    )
  } catch (error) {
    return Response.json(
      {
        error: 'Could not reach the FSG Online Database.',
        details:
          error instanceof Error ? error.message : 'The upstream request failed.',
      },
      { status: 502 },
    )
  }
}
