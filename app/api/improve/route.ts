import { fetchAPI } from '@/lib/api'
import {
  formatMatchTime,
  isApiError,
  McsrMatch,
  McsrTimeline,
  McsrUserProfileData,
  parseMatchList,
  parseUserProfile,
} from '@/lib/mcsr'
import { checkRateLimit, getRateLimitHeaders } from '@/lib/ratelimit'
import { getRankTierLabelFromElo } from '@/lib/rank-tiers'
import type { PlayerDashboard } from '@/components/improve/types'
import { recommendTutorials } from '@/lib/tutorial-recommendations'
import { segmentDuration } from '@/lib/improve-segments'
import { buildHumanSummary } from '@/lib/human-summary'

const MATCH_COUNT = 100
const DETAIL_COUNT = 30
const BENCHMARK_MATCH_COUNT = 80
const BENCHMARK_DETAIL_COUNT = 8
const FAIL_PENALTY_MS = 240_000
const DEATH_PENALTY_MS = 360_000
const LOW_SAMPLE_PENALTY_MS = 60_000
const deathEvents = ['projectelo.timeline.death']

const milestoneDefinitions = [
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

type MilestoneKey = (typeof milestoneDefinitions)[number]['key']

const segmentDefinitions = [
  {
    key: 'overworld',
    label: 'Overworld',
    from: null,
    to: 'enterNether',
  },
  {
    key: 'findBastion',
    label: 'Find Bastion',
    from: 'enterNether',
    to: 'findBastion',
  },
  {
    key: 'bastion',
    label: 'Bastion',
    from: 'findBastion',
    to: 'lootBastion',
  },
  {
    key: 'fortress',
    label: 'Fortress',
    from: 'lootBastion',
    to: 'firstRod',
  },
  {
    key: 'blinding',
    label: 'Blinding',
    from: 'firstRod',
    to: 'blindTravel',
  },
  {
    key: 'stronghold',
    label: 'Stronghold Nav',
    from: 'blindTravel',
    to: 'enterEnd',
  },
  {
    key: 'dragon',
    label: 'Dragon',
    from: 'enterEnd',
    to: 'finish',
  },
] as const

type SegmentKey = (typeof segmentDefinitions)[number]['key']
type SegmentDefinition = (typeof segmentDefinitions)[number]
type IssueMatch = {
  match: McsrMatch
  failedHere: boolean
  deathCount: number
}
type SegmentSample = {
  match: McsrMatch
  playerUuid: string
  opponent: { uuid: string; nickname?: string | null } | null
  segments: Record<SegmentKey, number | null>
}

const dashboardSplitDefinitions = [
  {
    key: 'enterNether',
    label: 'Enter Nether',
    to: 'enterNether',
    previous: [],
  },
  {
    key: 'findBastion',
    label: 'Enter Bastion',
    to: 'findBastion',
    previous: ['enterNether'],
  },
  {
    key: 'findFortress',
    label: 'Enter Fortress',
    to: 'findFortress',
    previous: ['enterNether', 'findBastion', 'lootBastion'],
  },
  {
    key: 'blindTravel',
    label: 'Blind Travel',
    to: 'blindTravel',
    previous: ['enterNether', 'findBastion', 'lootBastion', 'findFortress', 'firstRod'],
  },
  {
    key: 'stronghold',
    label: 'Stronghold',
    to: 'stronghold',
    previous: ['blindTravel'],
  },
  {
    key: 'enterEnd',
    label: 'Enter End',
    to: 'enterEnd',
    previous: ['stronghold'],
  },
  {
    key: 'finish',
    label: 'Dragon Kill',
    to: 'finish',
    previous: ['enterEnd'],
  },
] as const satisfies readonly {
  key: MilestoneKey
  label: string
  to: MilestoneKey
  previous: readonly MilestoneKey[]
}[]

const endingLabels: Record<SegmentKey, string> = {
  overworld: 'Nether',
  findBastion: 'Bastion',
  bastion: 'Bastion',
  fortress: 'Fortress',
  blinding: 'Blind',
  stronghold: 'Stronghold',
  dragon: 'End',
}

const tutorialBastionTypes = new Set(['housing', 'treasure', 'stables', 'bridge'])

const rankBands = [
  { name: 'Iron', min: 0, max: 1599 },
  { name: 'Gold', min: 1600, max: 1799 },
  { name: 'Diamond', min: 1800, max: 1999 },
  { name: 'Netherite', min: 2000, max: 2199 },
  { name: 'Grandmaster', min: 2200, max: Infinity },
]

const fallbackBenchmarks: Record<string, Record<SegmentKey, number>> = {
  Iron: {
    overworld: 330_000,
    findBastion: 90_000,
    bastion: 270_000,
    fortress: 270_000,
    blinding: 210_000,
    stronghold: 300_000,
    dragon: 180_000,
  },
  Gold: {
    overworld: 230_000,
    findBastion: 70_000,
    bastion: 240_000,
    fortress: 260_000,
    blinding: 150_000,
    stronghold: 270_000,
    dragon: 140_000,
  },
  Diamond: {
    overworld: 190_000,
    findBastion: 60_000,
    bastion: 200_000,
    fortress: 215_000,
    blinding: 120_000,
    stronghold: 225_000,
    dragon: 120_000,
  },
  Netherite: {
    overworld: 165_000,
    findBastion: 50_000,
    bastion: 165_000,
    fortress: 185_000,
    blinding: 100_000,
    stronghold: 190_000,
    dragon: 105_000,
  },
  Grandmaster: {
    overworld: 140_000,
    findBastion: 45_000,
    bastion: 140_000,
    fortress: 160_000,
    blinding: 85_000,
    stronghold: 165_000,
    dragon: 90_000,
  },
}

const segmentBounds: Record<SegmentKey, { min: number; max: number }> = {
  overworld: { min: 45_000, max: 720_000 },
  findBastion: { min: 10_000, max: 480_000 },
  bastion: { min: 25_000, max: 600_000 },
  fortress: { min: 20_000, max: 720_000 },
  blinding: { min: 15_000, max: 480_000 },
  stronghold: { min: 30_000, max: 720_000 },
  dragon: { min: 20_000, max: 420_000 },
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

function cleanAverage(values: number[]) {
  if (values.length === 0) return null
  if (values.length < 4) return average(values)
  const sorted = [...values].sort((a, b) => a - b)
  return average(sorted.slice(1, -1))
}

function cleanBenchmark(values: number[], fallback: number) {
  if (values.length < 3) return fallback
  return cleanAverage(values) ?? fallback
}

function percentage(numerator: number, denominator: number) {
  if (denominator <= 0) return null
  return numerator / denominator
}

function classifySkill(
  matches: number,
  elo: number | null,
  completionRate: number,
): PlayerDashboard['skillBand'] {
  if (matches < 5) return 'Insufficient data'
  const rating = elo ?? 0
  if (rating >= 2200 && completionRate >= 0.75) return 'Expert'
  if (rating >= 2000 && completionRate >= 0.6) return 'Advanced'
  if (rating >= 1800 && completionRate >= 0.45) return 'Intermediate'
  if (rating >= 1600 || completionRate >= 0.3) return 'Developing'
  return 'Beginner'
}

function formatSeedType(value?: string | null) {
  if (!value) return 'Unknown'
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

function getRankBand(elo: number) {
  return rankBands.find((band) => elo >= band.min && elo <= band.max) ?? rankBands[0]
}

function getTargetRankBand(elo: number) {
  const currentIndex = rankBands.findIndex((band) => elo >= band.min && elo <= band.max)
  return rankBands[Math.min(Math.max(currentIndex, 0) + 1, rankBands.length - 1)]
}

function isInRankBand(elo: number | null | undefined, band: (typeof rankBands)[number]) {
  if (elo == null) return false
  return elo >= band.min && elo <= band.max
}

function getSegmentLabel(key: SegmentKey) {
  return segmentDefinitions.find((segment) => segment.key === key)?.label ?? 'Unknown'
}

function normalizeVideoKey(value?: string | null) {
  return value?.toLowerCase().replace(/_/g, '') ?? null
}

function normalizeCategory(value?: string | null) {
  return formatSeedType(value).replace(/\s+/g, ' ').trim()
}

function getProfileData(body: unknown) {
  if (isApiError(body)) return null
  const data = (body as { data?: McsrUserProfileData }).data
  return data && typeof data.nickname === 'string' ? data : null
}

function getSocials(profile: McsrUserProfileData): PlayerDashboard['overview']['socials'] {
  const socials: PlayerDashboard['overview']['socials'] = []
  const { connections } = profile

  if (connections?.discord?.name) {
    socials.push({
      service: 'Discord',
      name: connections.discord.name,
      url: null,
    })
  }

  if (connections?.youtube?.name) {
    socials.push({
      service: 'YouTube',
      name: connections.youtube.name,
      url: connections.youtube.id
        ? `https://www.youtube.com/channel/${connections.youtube.id}`
        : null,
    })
  }

  if (connections?.twitch?.name) {
    socials.push({
      service: 'Twitch',
      name: connections.twitch.name,
      url: `https://www.twitch.tv/${connections.twitch.name}`,
    })
  }

  return socials
}

function getPlayerChange(match: McsrMatch, uuid: string) {
  return match.changes?.find((change) => change.uuid === uuid) ?? null
}

function getEloAfterMatch(match: McsrMatch, uuid: string) {
  const change = getPlayerChange(match, uuid)
  if (!change) return null

  // API match rows expose `eloRate` as the rating before the match in current
  // responses. Add the deterministic `change` to plot the post-match rating;
  // placement rows have null changes and fall back to the provided Elo value.
  if (typeof change.eloRate === 'number' && typeof change.change === 'number') {
    return change.eloRate + change.change
  }

  return typeof change.eloRate === 'number' ? change.eloRate : null
}

function isWin(match: McsrMatch, uuid: string) {
  return match.result?.uuid === uuid
}

function isDraw(match: McsrMatch) {
  return match.result?.uuid == null && !match.forfeited
}

function summarizeNumberGroups<T extends string>(
  matches: McsrMatch[],
  keyGetter: (match: McsrMatch) => T,
  timeGetter: (match: McsrMatch) => number | null,
  uuid: string,
) {
  const groups = new Map<
    T,
    {
      matches: number
      wins: number
      completed: number
      times: number[]
    }
  >()

  for (const match of matches) {
    const key = keyGetter(match)
    const current = groups.get(key) ?? {
      matches: 0,
      wins: 0,
      completed: 0,
      times: [],
    }
    const time = timeGetter(match)

    current.matches += 1
    current.wins += isWin(match, uuid) ? 1 : 0
    if (time != null) {
      current.completed += 1
      current.times.push(time)
    }

    groups.set(key, current)
  }

  return groups
}

function getPlayerTimelines(match: McsrMatch, uuid: string) {
  return (match.timelines ?? [])
    .filter((timeline) => timeline.uuid === uuid)
    .sort((a, b) => a.time - b.time)
}

function splitTime(timelines: McsrTimeline[], events: readonly string[]) {
  return timelines.find((timeline) => events.includes(timeline.type))?.time ?? null
}

function extractMilestones(match: McsrMatch, uuid: string) {
  const timelines = getPlayerTimelines(match, uuid)
  return Object.fromEntries(
    milestoneDefinitions.map((split) => [
      split.key,
      splitTime(timelines, split.events),
    ]),
  ) as Record<MilestoneKey, number | null>
}

function extractSegments(match: McsrMatch, uuid: string) {
  const milestones = extractMilestones(match, uuid)

  return Object.fromEntries(
    segmentDefinitions.map((segment) => {
      const end = milestones[segment.to]
      const start = segment.from ? milestones[segment.from] : 0
      const value = start != null && end != null && end >= start ? end - start : null
      return [segment.key, value]
    }),
  ) as Record<SegmentKey, number | null>
}

function extractDashboardSegments(match: McsrMatch, uuid: string) {
  const milestones = extractMilestones(match, uuid)

  return Object.fromEntries(
    dashboardSplitDefinitions.map((definition) => {
      const end = milestones[definition.to]
      if (end == null) return [definition.key, null]

      // Each displayed value is a per-match segment, never a subtraction of
      // aggregate averages. For branching Nether routes, use the latest valid
      // earlier milestone (for example loot bastion or fortress) that actually
      // occurred before this milestone.
      const duration = segmentDuration(
        end,
        definition.previous.map((key) => milestones[key]),
        definition.previous.length === 0,
      )
      return [definition.key, duration]
    }),
  ) as Record<MilestoneKey, number | null>
}

function validSegmentTime(key: SegmentKey, value: number | null | undefined) {
  if (value == null) return null
  const bounds = segmentBounds[key]
  return value >= bounds.min && value <= bounds.max ? value : null
}

function validSegmentValues(samples: SegmentSample[], key: SegmentKey) {
  return samples
    .map((sample) => validSegmentTime(key, sample.segments[key]))
    .filter((time): time is number => time != null)
}

function completedSegment(match: McsrMatch, uuid: string, segment: SegmentDefinition) {
  const milestones = extractMilestones(match, uuid)
  const start = segment.from ? milestones[segment.from] : 0
  const end = milestones[segment.to]
  return start != null && end != null && end >= start
}

function failureSegmentKey(match: McsrMatch, uuid: string): SegmentKey | null {
  if (hasCompleted(match, uuid)) return null

  const timelines = getPlayerTimelines(match, uuid)
  const lastTime = timelines[timelines.length - 1]?.time ?? match.result?.time ?? null
  if (lastTime == null) return null
  const lastDeath = [...timelines]
    .reverse()
    .find((timeline) => deathEvents.includes(timeline.type))
  if (lastDeath) return deathSegmentKey(match, uuid, lastDeath.time)

  const milestones = extractMilestones(match, uuid)

  for (const segment of segmentDefinitions) {
    const start = segment.from ? milestones[segment.from] : 0
    const end = milestones[segment.to]
    if (start != null && end == null) {
      return segment.key
    }
  }

  return null
}

function deathSegmentKey(match: McsrMatch, uuid: string, time: number): SegmentKey | null {
  const milestones = extractMilestones(match, uuid)
  const findBastion = milestones.findBastion
  const findFortress = milestones.findFortress

  if (findBastion != null && time >= findBastion && (findFortress == null || time < findFortress)) {
    return 'bastion'
  }

  if (findFortress != null && time >= findFortress && (milestones.firstRod == null || time < milestones.firstRod)) {
    return 'fortress'
  }

  for (const segment of segmentDefinitions) {
    const start = segment.from ? milestones[segment.from] : 0
    const end = milestones[segment.to]

    if (start != null && time >= start && (end == null || time < end)) {
      return segment.key
    }
  }

  return null
}

function deathCountsBySegment(match: McsrMatch, uuid: string) {
  const counts = new Map<SegmentKey, number>()

  for (const timeline of getPlayerTimelines(match, uuid)) {
    if (!deathEvents.includes(timeline.type)) continue
    const key = deathSegmentKey(match, uuid, timeline.time)
    if (!key) continue
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  return counts
}

function getCompletionTime(match: McsrMatch, uuid: string) {
  return (
    match.completions?.find((completion) => completion.uuid === uuid)?.time ??
    (match.result?.uuid === uuid ? match.result.time : undefined) ??
    extractMilestones(match, uuid).finish ??
    null
  )
}

function hasCompleted(match: McsrMatch, uuid: string) {
  return Boolean(getCompletionTime(match, uuid) && !match.forfeited)
}

function isRankedDuel(match: McsrMatch) {
  return match.type === 2 && match.players.length >= 2 && !match.decayed
}

function getMatchPlayer(match: McsrMatch, uuid: string) {
  return match.players.find((player) => player.uuid === uuid) ?? null
}

function getOpponent(match: McsrMatch, uuid: string) {
  return match.players.find((player) => player.uuid !== uuid) ?? null
}

function getStatsUrl(username: string, matchId: number) {
  return `/stats?player=${encodeURIComponent(username)}&match=${encodeURIComponent(String(matchId))}`
}

function getVodUrl(match: McsrMatch, uuid: string) {
  return match.vod?.find((vod) => vod.uuid === uuid)?.url ?? match.vod?.[0]?.url ?? null
}

function getBastionIssueType(issueMatches: IssueMatch[]) {
  const counts = new Map<string, number>()

  for (const issue of issueMatches) {
    const key = normalizeVideoKey(issue.match.bastionType)
    if (!key || !tutorialBastionTypes.has(key)) continue

    counts.set(
      key,
      (counts.get(key) ?? 0) + (issue.failedHere ? 2 : 0) + issue.deathCount,
    )
  }

  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
}

function phaseFromLastTimeline(match: McsrMatch, uuid: string) {
  const timelines = getPlayerTimelines(match, uuid)
  const last = timelines[timelines.length - 1]
  if (!last) return 'Unknown'

  const milestones = milestoneDefinitions
    .filter((milestone) =>
      (milestone.events as readonly string[]).includes(last.type),
    )
    .map((milestone) => milestone.label)

  return milestones[0] ?? 'Unknown'
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

async function fetchTargetBenchmarkSamples(
  targetTier: (typeof rankBands)[number],
  playerUuid: string,
) {
  try {
    const body = await fetchAPI(
      `/matches?count=${BENCHMARK_MATCH_COUNT}&type=2`,
    )
    const targets = parseMatchList(body)
      .filter(isRankedDuel)
      .filter((match) =>
        match.players.some(
          (player) =>
            player.uuid !== playerUuid && isInRankBand(player.eloRate, targetTier),
        ),
      )
      .slice(0, BENCHMARK_DETAIL_COUNT)
    const details = await Promise.all(targets.map(fetchMatchDetail))

    return details.flatMap((match) =>
      match.players
        .filter(
          (player) =>
            player.uuid !== playerUuid && isInRankBand(player.eloRate, targetTier),
        )
        .filter((player) => hasCompleted(match, player.uuid))
        .map((player) => ({
          match,
          playerUuid: player.uuid,
          opponent: player,
          segments: extractSegments(match, player.uuid),
        })),
    ) satisfies SegmentSample[]
  } catch {
    return [] satisfies SegmentSample[]
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
    const profileData = getProfileData(profileBody)
    const matches = parseMatchList(matchesBody).filter(isRankedDuel)

    if (!profile) {
      return Response.json(
        { error: 'Player not found.' },
        { status: 404, headers },
      )
    }

    const playerElo = profile.eloRate ?? 0
    const currentTier = getRankBand(playerElo)
    const targetTier = getTargetRankBand(playerElo)
    const detailTargets = matches.slice(0, DETAIL_COUNT)
    const uniqueTargets = [...new Map(detailTargets.map((match) => [match.id, match])).values()]
    const [detailedMatches, targetBenchmarkSegments] = await Promise.all([
      Promise.all(uniqueTargets.map(fetchMatchDetail)),
      fetchTargetBenchmarkSamples(targetTier, profile.uuid),
    ])
    const analysisMatches = detailedMatches.filter(isRankedDuel)

    const completedMatches = analysisMatches.filter((match) =>
      hasCompleted(match, profile.uuid),
    )
    const lastCompleted = completedMatches[0] ?? null
    const playerFailedMatches = analysisMatches.filter(
      (match) => !hasCompleted(match, profile.uuid),
    )

    const playerSegments: SegmentSample[] = completedMatches.map((match) => ({
      match,
      playerUuid: profile.uuid,
      opponent: null,
      segments: extractSegments(match, profile.uuid),
    }))

    const benchmarkSegments: SegmentSample[] = analysisMatches.flatMap((match) => {
      const opponent = getOpponent(match, profile.uuid)
      const player = getMatchPlayer(match, profile.uuid)

      if (!opponent || !player) return []
      if ((opponent.eloRate ?? 0) <= (player.eloRate ?? profile.eloRate ?? 0)) return []
      if (!hasCompleted(match, opponent.uuid)) return []

      return [
        {
          match,
          playerUuid: opponent.uuid,
          opponent,
          segments: extractSegments(match, opponent.uuid),
        },
      ]
    })

    const failCounts = new Map<SegmentKey, number>()
    const deathCounts = new Map<SegmentKey, number>()
    const issueMatchesBySegment = new Map<SegmentKey, McsrMatch[]>()
    const addIssueMatch = (key: SegmentKey, match: McsrMatch) => {
      issueMatchesBySegment.set(key, [
        ...(issueMatchesBySegment.get(key) ?? []),
        match,
      ])
    }

    for (const match of playerFailedMatches) {
      const key = failureSegmentKey(match, profile.uuid)
      if (!key) continue
      failCounts.set(key, (failCounts.get(key) ?? 0) + 1)
      addIssueMatch(key, match)
    }

    for (const match of analysisMatches) {
      for (const [key, count] of deathCountsBySegment(match, profile.uuid)) {
        deathCounts.set(key, (deathCounts.get(key) ?? 0) + count)
        addIssueMatch(key, match)
      }
    }

    const splitComparisons = segmentDefinitions.map((segment) => {
      const playerValues = validSegmentValues(playerSegments, segment.key)
      const targetBenchmarkValues = validSegmentValues(
        targetBenchmarkSegments,
        segment.key,
      )
      const opponentBenchmarkValues = validSegmentValues(
        benchmarkSegments,
        segment.key,
      )
      const fallbackBenchmark =
        fallbackBenchmarks[targetTier.name]?.[segment.key] ??
        fallbackBenchmarks.Gold[segment.key]
      const benchmarkValues =
        targetBenchmarkValues.length >= 3
          ? targetBenchmarkValues
          : opponentBenchmarkValues
      const playerAverage = cleanAverage(playerValues)
      const benchmarkAverage = cleanBenchmark(benchmarkValues, fallbackBenchmark)
      const difference =
        playerAverage != null && benchmarkAverage != null
          ? playerAverage - benchmarkAverage
          : null
      const gapPercent =
        difference != null && benchmarkAverage && benchmarkAverage > 0
          ? difference / benchmarkAverage
          : null
      const failCount = failCounts.get(segment.key) ?? 0
      const deathCount = deathCounts.get(segment.key) ?? 0
      const lowSamplePenalty =
        (failCount > 0 || deathCount > 0) && playerValues.length <= 1
          ? LOW_SAMPLE_PENALTY_MS
          : 0
      const score =
        Math.max(difference ?? 0, 0) +
        failCount * FAIL_PENALTY_MS +
        deathCount * DEATH_PENALTY_MS +
        lowSamplePenalty

      return {
        key: segment.key,
        label: segment.label,
        playerAverage,
        benchmarkAverage,
        difference,
        gapPercent,
        failCount,
        deathCount,
        score,
        samples: playerValues.length,
        benchmarkSamples: benchmarkValues.length >= 3 ? benchmarkValues.length : 0,
      }
    })

    const weakestSplit =
      [...splitComparisons]
        .filter(
          (split) =>
            split.difference != null || split.failCount > 0 || split.deathCount > 0,
        )
        .sort((a, b) => b.score - a.score)[0] ?? null

    const weaknessIssueMatches: IssueMatch[] = weakestSplit
      ? [
          ...(issueMatchesBySegment.get(weakestSplit.key) ?? []).map((match) => ({
            match,
            failedHere: failureSegmentKey(match, profile.uuid) === weakestSplit.key,
            deathCount:
              deathCountsBySegment(match, profile.uuid).get(weakestSplit.key) ?? 0,
          })),
          ...playerSegments
            .filter((sample) => sample.segments[weakestSplit.key] != null)
            .sort(
              (a, b) =>
                (b.segments[weakestSplit.key] ?? 0) -
                (a.segments[weakestSplit.key] ?? 0),
            )
            .map((sample) => ({
              match: sample.match,
              failedHere: false,
              deathCount: 0,
            })),
        ]
          .filter(
            (issue, index, issues) =>
              issues.findIndex((candidate) => candidate.match.id === issue.match.id) ===
              index,
          )
      : []
    const weaknessMatches = weakestSplit
      ? weaknessIssueMatches
          .map((issue) => {
            const { match } = issue
            const playerTime = extractSegments(match, profile.uuid)[
              weakestSplit.key
            ]
            const opponent = getOpponent(match, profile.uuid)
            const opponentTime = opponent
              ? extractSegments(match, opponent.uuid)[weakestSplit.key]
              : null
            const completed = hasCompleted(match, profile.uuid)

            return {
              id: match.id,
              date: match.date,
              seedType: formatSeedType(match.seedType),
              bastionType: formatSeedType(match.bastionType),
              playerTime,
              opponentTime,
              opponent: opponent?.nickname ?? null,
              opponentElo: opponent?.eloRate ?? null,
              completed,
              failedHere: issue.failedHere,
              deathCount: issue.deathCount,
              winner:
                match.players.find(
                  (player) => player.uuid === match.result?.uuid,
                )?.nickname ?? null,
              statsUrl: getStatsUrl(profile.nickname, match.id),
              vodUrl: getVodUrl(match, profile.uuid),
            }
          })
          .sort((a, b) => {
            const aIssueScore = (a.failedHere ? 1 : 0) + a.deathCount
            const bIssueScore = (b.failedHere ? 1 : 0) + b.deathCount
            if (aIssueScore !== bIssueScore) return bIssueScore - aIssueScore
            return (b.playerTime ?? 0) - (a.playerTime ?? 0)
          })
          .slice(0, 10)
      : []

    const forfeitCounts = new Map<string, number>()
    for (const match of playerFailedMatches) {
      const failKey = failureSegmentKey(match, profile.uuid)
      const phase = failKey ? getSegmentLabel(failKey) : phaseFromLastTimeline(match, profile.uuid)
      forfeitCounts.set(phase, (forfeitCounts.get(phase) ?? 0) + 1)
    }

    const completedTimes = completedMatches
      .map((match) => getCompletionTime(match, profile.uuid))
      .filter((time): time is number => time != null)
    const listedCompletedTimes = matches
      .map((match) => getCompletionTime(match, profile.uuid))
      .filter((time): time is number => time != null)
    const recentSeeds = new Map<string, number>()
    for (const match of analysisMatches) {
      const label = `${formatSeedType(match.seedType)} / ${formatSeedType(match.bastionType)}`
      recentSeeds.set(label, (recentSeeds.get(label) ?? 0) + 1)
    }

    const seasonStats = profileData?.statistics?.season
    const profileCompletions =
      seasonStats?.completions?.ranked ?? listedCompletedTimes.length
    const profileCompletionTime =
      seasonStats?.completionTime?.ranked ??
      listedCompletedTimes.reduce((sum, time) => sum + time, 0)
    const benchmarkLabel =
      targetBenchmarkSegments.length > 0
        ? `recent ${targetTier.name} players`
        : benchmarkSegments.length > 0
          ? `stronger recent opponents (${targetTier.name} target)`
          : `${targetTier.name} baseline`

    const milestoneSamples = completedMatches.map((match) => ({
      match,
      segments: extractDashboardSegments(match, profile.uuid),
    }))
    const splitRows = dashboardSplitDefinitions.map((split) => {
      const values = milestoneSamples
        .map((sample) => sample.segments[split.key])
        .filter((time): time is number => time != null && time > 0)
      const targetValues = targetBenchmarkSegments
        .map((sample) => extractDashboardSegments(sample.match, sample.playerUuid)[split.key])
        .filter((time): time is number => time != null && time > 0)
      const opponentValues = benchmarkSegments
        .map((sample) => extractDashboardSegments(sample.match, sample.playerUuid)[split.key])
        .filter((time): time is number => time != null && time > 0)
      const averageValue = average(values)
      const benchmarkValues = targetValues.length >= 3 ? targetValues : opponentValues
      const benchmarkAverage = benchmarkValues.length > 0 ? cleanAverage(benchmarkValues) : null
      const difference =
        averageValue != null && benchmarkAverage != null
          ? averageValue - benchmarkAverage
          : null

      return {
        key: split.key,
        label: split.label,
        average: averageValue,
        best: values.length > 0 ? Math.min(...values) : null,
        benchmarkAverage,
        averageDifference: difference,
        samples: values.length,
      }
    })
    const splitPerformance = splitRows.map((row) => {
      const benchmark = row.benchmarkAverage
      const averageValue = row.average
      const ratio =
        averageValue != null && benchmark != null && benchmark > 0
          ? benchmark / averageValue
          : null

      return {
        key: row.key,
        label: row.label,
        average: averageValue,
        benchmark,
        // Faster-than-benchmark split averages score above 70, slower split
        // averages trend downward. The clamp keeps one very slow split from
        // collapsing the whole radar while missing data remains null.
        score: ratio == null ? null : Math.max(15, Math.min(100, Math.round(ratio * 70))),
        samples: row.samples,
      }
    })

    const endingCounts = new Map<string, number>()
    for (const match of analysisMatches) {
      if (hasCompleted(match, profile.uuid)) continue

      // Failed ending location is derived only from the player's timeline:
      // explicit death events are mapped to the surrounding milestone window,
      // otherwise the first missing milestone after real progress is used.
      const key = failureSegmentKey(match, profile.uuid)
      if (!key) continue

      const label = endingLabels[key]
      endingCounts.set(label, (endingCounts.get(label) ?? 0) + 1)
    }
    const endingTotal = [...endingCounts.values()].reduce((sum, count) => sum + count, 0)

    const seedGroups = summarizeNumberGroups(
      matches,
      (match) => normalizeCategory(match.seed?.overworld ?? match.seedType),
      (match) => getCompletionTime(match, profile.uuid),
      profile.uuid,
    )
    const seedTypes = [...seedGroups.entries()]
      .map(([seedType, stats]) => ({
        seedType,
        averageCompletion: average(stats.times),
        matches: stats.matches,
        wins: stats.wins,
        completed: stats.completed,
        winRate: percentage(stats.wins, stats.matches),
      }))
      .sort((a, b) => b.matches - a.matches || a.seedType.localeCompare(b.seedType))

    const bastionGroups = summarizeNumberGroups(
      analysisMatches,
      (match) => normalizeCategory(match.seed?.nether ?? match.bastionType),
      (match) => extractDashboardSegments(match, profile.uuid).findBastion,
      profile.uuid,
    )
    const bastionTypes = [...bastionGroups.entries()]
      .map(([bastionType, stats]) => ({
        bastionType,
        matches: stats.matches,
        wins: stats.wins,
        completed: stats.completed,
        winRate: percentage(stats.wins, stats.matches),
        averageSplit: average(stats.times),
      }))
      .sort((a, b) => b.matches - a.matches || a.bastionType.localeCompare(b.bastionType))

    const eloHistory = [...matches]
      .sort((a, b) => a.date - b.date)
      .map((match) => {
        const opponent = getOpponent(match, profile.uuid)
        const change = getPlayerChange(match, profile.uuid)
        const result: PlayerDashboard['eloHistory'][number]['result'] = isDraw(match)
          ? 'Draw'
          : isWin(match, profile.uuid)
            ? 'Win'
            : 'Loss'

        return {
          matchId: match.id,
          date: match.date,
          elo: getEloAfterMatch(match, profile.uuid),
          change: change?.change ?? null,
          opponent: opponent?.nickname ?? null,
          result,
        }
      })
      .filter((point) => point.elo != null)

    const loadedWins = matches.filter((match) => isWin(match, profile.uuid)).length
    const loadedDraws = matches.filter(isDraw).length
    const loadedLosses = Math.max(matches.length - loadedWins - loadedDraws, 0)
    const loadedForfeits = matches.filter((match) => match.forfeited).length
    const deathsBySplit: PlayerDashboard['deathsBySplit'] = {
      total: endingTotal,
      slices: [...endingCounts.entries()]
        .map(([label, count]) => ({
          key: label.toLowerCase(),
          label,
          count,
          percent: percentage(count, endingTotal) ?? 0,
        }))
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)),
    }
    const loadedWinRate = percentage(loadedWins, loadedWins + loadedLosses)
    const loadedForfeitRate = percentage(loadedForfeits, matches.length)
    const skillBand = classifySkill(
      matches.length,
      profile.eloRate,
      percentage(completedMatches.length, analysisMatches.length) ?? 0,
    )
    const humanSummary = buildHumanSummary({
      username: profile.nickname,
      matches: matches.length,
      wins: loadedWins,
      losses: loadedLosses,
      draws: loadedDraws,
      splitRows,
      seedTypes,
      bastionTypes,
      deaths: deathsBySplit,
      forfeitRate: loadedForfeitRate,
    })

    const dashboard: PlayerDashboard = {
      loadedMatches: matches.length,
      splitDetailMatches: analysisMatches.length,
      benchmarkLabel,
      overview: {
        uuid: profile.uuid,
        username: profile.nickname,
        playerId: profile.uuid,
        country: profile.country?.toUpperCase() ?? null,
        socials: profileData ? getSocials(profileData) : [],
        lastRanked: profileData?.timestamp?.lastRanked ?? null,
        elo: profile.eloRate,
        rank: profile.eloRank,
        tier: getRankTierLabelFromElo(profile.eloRate),
        wins: loadedWins,
        losses: loadedLosses,
        draws: loadedDraws,
        pb: seasonStats?.bestTime?.ranked ?? (listedCompletedTimes.length > 0 ? Math.min(...listedCompletedTimes) : null),
        averageCompletion:
          profileCompletions > 0 ? Math.round(profileCompletionTime / profileCompletions) : null,
        winRate: loadedWinRate,
        forfeitRate: loadedForfeitRate,
      },
      eloHistory,
      splitPerformance,
      deathsBySplit,
      splitTimes: {
        completedMatches: completedMatches.length,
        rows: splitRows,
      },
      seedTypes,
      bastionTypes,
      dataQuality: [
        `Recent ranked sample is capped at ${MATCH_COUNT} matches by the upstream API request.`,
        `Split charts use ${analysisMatches.length} detailed matches because timeline data only exists on match-detail responses.`,
        ...(eloHistory.length === 0
          ? ['No numeric Elo changes were available in the loaded matches.']
          : []),
      ],
      skillBand,
      humanSummary,
    }

    const issueBastionKey =
      weakestSplit?.key === 'bastion'
        ? getBastionIssueType(weaknessIssueMatches)
        : null
    const bestBastion =
      issueBastionKey ??
      (lastCompleted ? normalizeVideoKey(lastCompleted.bastionType) : null)

    const recommendations = recommendTutorials({
      level: skillBand,
      weakSplit: weakestSplit?.key ?? null,
      weakSplitSamples: weakestSplit?.samples ?? 0,
      weakSplitGap: weakestSplit?.difference ?? null,
      dominantEnding: deathsBySplit.slices[0]?.label ?? null,
      forfeitRate: loadedForfeitRate,
      bastionType: bestBastion,
    })

    return Response.json(
      {
        analysis: {
          player: {
            uuid: profile.uuid,
            username: profile.nickname,
            elo: playerElo,
            rank: profile.eloRank ?? 0,
            country: profile.country?.toUpperCase() ?? 'N/A',
          },
          sample: {
            matches: analysisMatches.length,
            completed: completedMatches.length,
            forfeits: analysisMatches.filter((match) => match.forfeited).length,
            detailMatches: detailedMatches.length,
            benchmarkSamples: benchmarkSegments.length,
            targetBenchmarkSamples: targetBenchmarkSegments.length,
          },
          comparison: {
            currentTier: currentTier.name,
            targetTier: targetTier.name,
            benchmarkLabel,
            splitComparisons,
          },
          overview: {
            completionRate:
              analysisMatches.length > 0
                ? completedMatches.length / analysisMatches.length
                : 0,
            averageCompletion: average(completedTimes),
            bestCompletion: completedTimes.length > 0 ? Math.min(...completedTimes) : null,
            mostCommonSeed:
              [...recentSeeds.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A',
            primaryWeakness: weakestSplit?.label ?? 'Consistency',
            failureCount: (weakestSplit?.failCount ?? 0) + (weakestSplit?.deathCount ?? 0),
          },
          weakness: weakestSplit
            ? {
                key: weakestSplit.key,
                label: weakestSplit.label,
                difference: weakestSplit.difference,
                gapPercent: weakestSplit.gapPercent,
                failCount: weakestSplit.failCount,
                deathCount: weakestSplit.deathCount,
                bastionType:
                  weakestSplit.key === 'bastion' && issueBastionKey
                    ? formatSeedType(issueBastionKey)
                    : null,
                matches: weaknessMatches,
              }
            : null,
          lastCompleted: lastCompleted
            ? {
                id: lastCompleted.id,
                date: lastCompleted.date,
                time: getCompletionTime(lastCompleted, profile.uuid),
                seedType: formatSeedType(lastCompleted.seedType),
                bastionType: formatSeedType(lastCompleted.bastionType),
                statsUrl: getStatsUrl(profile.nickname, lastCompleted.id),
                vodUrl: getVodUrl(lastCompleted, profile.uuid),
                splits: segmentDefinitions.map((segment) => ({
                  key: segment.key,
                  label: segment.label,
                  time: extractSegments(lastCompleted, profile.uuid)[segment.key],
                })),
              }
            : null,
          splitSamples: splitComparisons.map((split) => ({
            key: split.key,
            label: split.label,
            average: split.playerAverage,
            median: median(
              playerSegments
                .map((sample) => sample.segments[split.key as SegmentKey])
                .filter((time): time is number => time != null),
            ),
            last: lastCompleted
              ? extractSegments(lastCompleted, profile.uuid)[split.key as SegmentKey]
              : null,
            deltaFromAverage: split.difference,
            samples: split.samples,
          })),
          failures: [...forfeitCounts.entries()]
            .sort((a, b) => b[1] - a[1])
            .map(([phase, count]) => ({ phase, count })),
          recommendations,
          recentMatches: analysisMatches.slice(0, 8).map((match) => {
            const failKey = failureSegmentKey(match, profile.uuid)
            const completed = hasCompleted(match, profile.uuid)

            return {
              id: match.id,
              date: match.date,
              time: getCompletionTime(match, profile.uuid) ?? match.result?.time ?? null,
              completed,
              forfeited: Boolean(match.forfeited),
              phase: completed
                ? 'Completed'
                : failKey
                  ? `${getSegmentLabel(failKey)} fail`
                  : 'Incomplete',
              seedType: formatSeedType(match.seedType),
              bastionType: formatSeedType(match.bastionType),
            }
          }),
          dashboard,
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
    const message = error instanceof Error ? error.message : ''
    if (
      message.includes('API Error: 404') ||
      (message.includes('API Error: 400') &&
        message.toLowerCase().includes('invalid user identifier'))
    ) {
      return Response.json(
        { error: 'Player not found.' },
        { status: 404, headers },
      )
    }

    if (message.includes('API Error: 429')) {
      return Response.json(
        { error: 'MCSR Ranked API rate limit reached. Try again shortly.' },
        { status: 429, headers },
      )
    }

    return Response.json(
      { error: 'Could not analyze that player.' },
      { status: 500, headers },
    )
  }
}
