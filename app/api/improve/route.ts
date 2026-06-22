import { fetchAPI } from '@/lib/api'
import {
  formatMatchTime,
  isApiError,
  McsrMatch,
  McsrTimeline,
  parseMatchList,
  parseUserProfile,
} from '@/lib/mcsr'
import { checkRateLimit, getRateLimitHeaders } from '@/lib/ratelimit'

const MATCH_COUNT = 30
const DETAIL_COUNT = 10

const splitDefinitions = [
  {
    key: 'enterNether',
    label: 'Enter Nether',
    events: ['story.enter_the_nether', 'nether.root'],
  },
  {
    key: 'findBastion',
    label: 'Find Bastion',
    events: ['nether.find_bastion'],
  },
  {
    key: 'lootBastion',
    label: 'Loot Bastion',
    events: ['nether.loot_bastion'],
  },
  {
    key: 'findFortress',
    label: 'Find Fortress',
    events: ['nether.find_fortress'],
  },
  {
    key: 'firstRod',
    label: 'First Rod',
    events: ['nether.obtain_blaze_rod'],
  },
  {
    key: 'blindTravel',
    label: 'Blind Travel',
    events: ['projectelo.timeline.blind_travel'],
  },
  {
    key: 'stronghold',
    label: 'Stronghold',
    events: ['story.follow_ender_eye'],
  },
  {
    key: 'enterEnd',
    label: 'Enter End',
    events: ['story.enter_the_end', 'end.root'],
  },
  {
    key: 'finish',
    label: 'Finish',
    events: ['end.kill_dragon', 'projectelo.timeline.dragon_death'],
  },
] as const

type SplitKey = (typeof splitDefinitions)[number]['key']

const failurePhaseOrder: Array<{
  key: SplitKey
  label: string
  maxTime: number
}> = [
  { key: 'enterNether', label: 'Overworld / Portal', maxTime: 75_000 },
  { key: 'findBastion', label: 'Nether Entry', maxTime: 110_000 },
  { key: 'lootBastion', label: 'Bastion', maxTime: 170_000 },
  { key: 'findFortress', label: 'Fortress Search', maxTime: 240_000 },
  { key: 'firstRod', label: 'Blaze Fight', maxTime: 290_000 },
  { key: 'blindTravel', label: 'Blind Travel', maxTime: 360_000 },
  { key: 'stronghold', label: 'Stronghold', maxTime: 450_000 },
  { key: 'enterEnd', label: 'End Entry', maxTime: 520_000 },
  { key: 'finish', label: 'Dragon Fight', maxTime: Infinity },
]

const videoLibrary: Record<
  string,
  {
    title: string
    url: string
    focus: string
  }
> = {
  overworld: {
    title: 'Ranked RSG Overworld Fundamentals',
    url: 'https://www.youtube.com/watch?v=egyiA_8FztM',
    focus: 'Portal building, early food, and faster first structure decisions.',
  },
  bastion: {
    title: 'Ranked RSG Bastion Fundamentals',
    url: 'https://www.youtube.com/watch?v=CRwiJcWWUlY',
    focus: 'Cleaner bastion entry, routing, piglin control, and avoiding early deaths.',
  },
  housing: {
    title: 'How to SPEEDRUN HOUSING',
    url: 'https://www.youtube.com/watch?v=y7fG2L4FZLU',
    focus: 'Housing route order, gold pathing, and safe exits.',
  },
  treasure: {
    title: 'How to SPEEDRUN Bastions - TREASURE',
    url: 'https://www.youtube.com/watch?v=u4-KxRhNsUc',
    focus: 'Treasure routing, lava movement, and fast bartering setup.',
  },
  stables: {
    title: 'How to SPEEDRUN Bastions - STABLES',
    url: 'https://www.youtube.com/watch?v=fjkkLdWYRmY',
    focus: 'Stables pathing, gold blocks, and safer piglin handling.',
  },
  bridge: {
    title: 'How to SPEEDRUN BRIDGE',
    url: 'https://www.youtube.com/watch?v=FoNy438g1GM',
    focus: 'Bridge route recognition, safe looting, and exit decisions.',
  },
  fortress: {
    title: 'Ranked RSG Fortress Guide',
    url: 'https://www.youtube.com/watch?v=JsFcAeBXVpk',
    focus: 'Finding fortress faster, safer blaze fights, and rod consistency.',
  },
  blind: {
    title: 'Blind Travel and Stronghold Navigation',
    url: 'https://www.youtube.com/watch?v=0N8Wj8hOVKM',
    focus: 'Blind distance, angle control, calculator flow, and stronghold entry.',
  },
  end: {
    title: 'How to One Cycle the Ender Dragon',
    url: 'https://www.youtube.com/watch?v=u9UVwwWxN_k',
    focus: 'Fast perch setup, bed timing, and reducing end fight throws.',
  },
}

function average(values: number[]) {
  if (values.length === 0) return null
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
}

function median(values: number[]) {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 1) return sorted[middle]
  return Math.round((sorted[middle - 1] + sorted[middle]) / 2)
}

function formatSeedType(value?: string | null) {
  if (!value) return 'Unknown'
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

function getPlayerTimelines(match: McsrMatch, uuid: string) {
  return (match.timelines ?? [])
    .filter((timeline) => timeline.uuid === uuid)
    .sort((a, b) => a.time - b.time)
}

function splitTime(timelines: McsrTimeline[], events: readonly string[]) {
  return timelines.find((timeline) => events.includes(timeline.type))?.time ?? null
}

function extractSplits(match: McsrMatch, uuid: string) {
  const timelines = getPlayerTimelines(match, uuid)
  return Object.fromEntries(
    splitDefinitions.map((split) => [
      split.key,
      splitTime(timelines, split.events),
    ]),
  ) as Record<SplitKey, number | null>
}

function getLastTimelinePhase(match: McsrMatch, uuid: string) {
  const timelines = getPlayerTimelines(match, uuid)
  const last = timelines[timelines.length - 1]
  if (!last) {
    const time = match.result?.time ?? 0
    return failurePhaseOrder.find((phase) => time <= phase.maxTime)?.label ?? 'Unknown'
  }

  for (let index = failurePhaseOrder.length - 1; index >= 0; index -= 1) {
    const phase = failurePhaseOrder[index]
    const split = splitDefinitions.find((item) => item.key === phase.key)
    if (split && (split.events as readonly string[]).includes(last.type)) {
      return phase.label
    }
  }

  const phaseByTime = failurePhaseOrder.find((phase) => last.time <= phase.maxTime)
  return phaseByTime?.label ?? 'Unknown'
}

function phaseVideoKey(phase: string, bastionType?: string | null) {
  if (phase.includes('Bastion')) {
    const normalized = bastionType?.toLowerCase()
    if (normalized && videoLibrary[normalized]) return normalized
    return 'bastion'
  }
  if (phase.includes('Fortress') || phase.includes('Blaze')) return 'fortress'
  if (phase.includes('Blind') || phase.includes('Stronghold')) return 'blind'
  if (phase.includes('End') || phase.includes('Dragon')) return 'end'
  return 'overworld'
}

async function fetchMatchDetail(match: McsrMatch) {
  try {
    const body = await fetchAPI(`/matches/${match.id}`)
    if (isApiError(body)) return match
    return ((body as { data?: McsrMatch }).data ?? match) as McsrMatch
  } catch {
    return match
  }
}

export async function GET(request: Request) {
  const ip =
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown'

  const rateLimitResult = await checkRateLimit(`improve:${ip}`)
  const headers = {
    ...getRateLimitHeaders(rateLimitResult),
  }

  if (!rateLimitResult.success) {
    return Response.json(
      { error: 'Too many requests. Rate limit exceeded.' },
      { status: 429, headers },
    )
  }

  const { searchParams } = new URL(request.url)
  const username = searchParams.get('username')?.trim()

  if (!username) {
    return Response.json(
      { error: 'Username is required.' },
      { status: 400, headers },
    )
  }

  try {
    const [profileBody, matchesBody] = await Promise.all([
      fetchAPI(`/users/${encodeURIComponent(username)}`),
      fetchAPI(`/users/${encodeURIComponent(username)}/matches?count=${MATCH_COUNT}`),
    ])

    const profile = parseUserProfile(profileBody)
    const matches = parseMatchList(matchesBody).filter((match) => !match.decayed)

    if (!profile) {
      return Response.json(
        { error: 'Player not found.' },
        { status: 404, headers },
      )
    }

    const completedSummary = matches.find(
      (match) => !match.forfeited && match.result?.uuid === profile.uuid,
    )
    const detailTargets = [
      ...matches.slice(0, DETAIL_COUNT),
      ...(completedSummary ? [completedSummary] : []),
    ]
    const uniqueTargets = [...new Map(detailTargets.map((match) => [match.id, match])).values()]
    const detailedMatches = await Promise.all(uniqueTargets.map(fetchMatchDetail))
    const detailMap = new Map(detailedMatches.map((match) => [match.id, match]))
    const enrichedMatches = matches.map((match) => detailMap.get(match.id) ?? match)

    const completedMatches = enrichedMatches.filter(
      (match) => !match.forfeited && match.result?.uuid === profile.uuid,
    )
    const forfeits = enrichedMatches.filter((match) => match.forfeited)
    const lastCompleted = completedMatches[0] ?? null
    const lastCompletedSplits = lastCompleted
      ? splitDefinitions.map((split) => ({
          key: split.key,
          label: split.label,
          time: extractSplits(lastCompleted, profile.uuid)[split.key],
        }))
      : []

    const splitSamples = splitDefinitions.map((split) => {
      const values = completedMatches
        .map((match) => extractSplits(match, profile.uuid)[split.key])
        .filter((time): time is number => time != null)
      const lastValue = lastCompleted
        ? extractSplits(lastCompleted, profile.uuid)[split.key]
        : null
      const avg = average(values)

      return {
        key: split.key,
        label: split.label,
        average: avg,
        median: median(values),
        last: lastValue,
        deltaFromAverage:
          avg != null && lastValue != null ? Math.round(lastValue - avg) : null,
        samples: values.length,
      }
    })

    const failureCounts = new Map<string, number>()
    for (const match of forfeits) {
      const phase = getLastTimelinePhase(match, profile.uuid)
      failureCounts.set(phase, (failureCounts.get(phase) ?? 0) + 1)
    }
    const topFailure = [...failureCounts.entries()].sort((a, b) => b[1] - a[1])[0]
    const weakestSplit = [...splitSamples]
      .filter((split) => split.deltaFromAverage != null && split.deltaFromAverage > 0)
      .sort((a, b) => (b.deltaFromAverage ?? 0) - (a.deltaFromAverage ?? 0))[0]

    const primaryPhase = topFailure?.[0] ?? weakestSplit?.label ?? 'Consistency'
    const primaryVideoKey = phaseVideoKey(primaryPhase, lastCompleted?.bastionType)
    const secondaryVideoKey =
      primaryVideoKey === 'bastion' && lastCompleted?.bastionType
        ? phaseVideoKey('Bastion', lastCompleted.bastionType)
        : weakestSplit
          ? phaseVideoKey(weakestSplit.label, lastCompleted?.bastionType)
          : 'overworld'
    const recommendations = [
      videoLibrary[primaryVideoKey],
      videoLibrary[secondaryVideoKey],
      videoLibrary.end,
    ].filter(
      (video, index, videos) =>
        video && videos.findIndex((candidate) => candidate.url === video.url) === index,
    )

    const completedTimes = completedMatches
      .map((match) => match.result?.time)
      .filter((time): time is number => time != null)
    const recentSeeds = new Map<string, number>()
    for (const match of enrichedMatches) {
      const label = `${formatSeedType(match.seedType)} / ${formatSeedType(match.bastionType)}`
      recentSeeds.set(label, (recentSeeds.get(label) ?? 0) + 1)
    }

    return Response.json(
      {
        analysis: {
          player: {
            uuid: profile.uuid,
            username: profile.nickname,
            elo: profile.eloRate ?? 0,
            rank: profile.eloRank ?? 0,
            country: profile.country?.toUpperCase() ?? 'N/A',
          },
          sample: {
            matches: enrichedMatches.length,
            completed: completedMatches.length,
            forfeits: forfeits.length,
            detailMatches: detailedMatches.length,
          },
          overview: {
            completionRate:
              enrichedMatches.length > 0
                ? completedMatches.length / enrichedMatches.length
                : 0,
            averageCompletion: average(completedTimes),
            bestCompletion: completedTimes.length > 0 ? Math.min(...completedTimes) : null,
            mostCommonSeed:
              [...recentSeeds.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A',
            primaryWeakness: primaryPhase,
            failureCount: topFailure?.[1] ?? 0,
          },
          lastCompleted: lastCompleted
            ? {
                id: lastCompleted.id,
                date: lastCompleted.date,
                time: lastCompleted.result?.time ?? null,
                seedType: formatSeedType(lastCompleted.seedType),
                bastionType: formatSeedType(lastCompleted.bastionType),
                statsUrl: `https://mcsrranked.com/stats/${encodeURIComponent(
                  profile.nickname,
                )}/${lastCompleted.id}`,
                vodUrl: lastCompleted.vod?.[0]?.url ?? null,
                splits: lastCompletedSplits,
              }
            : null,
          splitSamples,
          failures: [...failureCounts.entries()]
            .sort((a, b) => b[1] - a[1])
            .map(([phase, count]) => ({ phase, count })),
          recommendations,
          recentMatches: enrichedMatches.slice(0, 8).map((match) => ({
            id: match.id,
            date: match.date,
            time: match.result?.time ?? null,
            completed: !match.forfeited && match.result?.uuid === profile.uuid,
            forfeited: Boolean(match.forfeited),
            phase: match.forfeited ? getLastTimelinePhase(match, profile.uuid) : 'Completed',
            seedType: formatSeedType(match.seedType),
            bastionType: formatSeedType(match.bastionType),
          })),
          formatted: {
            averageCompletion: formatMatchTime(average(completedTimes) ?? undefined) ?? 'N/A',
            bestCompletion: formatMatchTime(
              completedTimes.length > 0 ? Math.min(...completedTimes) : undefined,
            ) ?? 'N/A',
          },
        },
      },
      { headers },
    )
  } catch (error) {
    return Response.json(
      { error: 'Could not analyze that player.' },
      { status: 500, headers },
    )
  }
}
