export type LearningLevel =
  | 'Insufficient data'
  | 'Beginner'
  | 'Developing'
  | 'Intermediate'
  | 'Advanced'
  | 'Expert'

type TutorialTopic =
  | 'overworld'
  | 'bastion'
  | 'fortress'
  | 'stronghold'
  | 'dragon'

export interface Tutorial {
  id: string
  videoId: string
  title: string
  url: string
  source: 'MCSR Ranked Explanations'
  official: true
  topic: TutorialTopic
  subtopic: string
  minimumLevel: Exclude<LearningLevel, 'Insufficient data'>
  maximumLevel: Exclude<LearningLevel, 'Insufficient data'>
  relevantSplit: string
  relevantBastion: string | null
  duration: string
  durationSeconds: number
  lastVerified: string
  thumbnail: string
}

export interface RecommendationInput {
  level: LearningLevel
  weakSplit: string | null
  weakSplitSamples: number
  weakSplitGap: number | null
  dominantEnding: string | null
  forfeitRate: number | null
  bastionType: string | null
}

const levels = ['Beginner', 'Developing', 'Intermediate', 'Advanced', 'Expert'] as const
const playlistId = 'PLKMhRbg_I18-1gMJC1oXKF8loH2AC7mRI'

function playlistVideo(
  video: Omit<
    Tutorial,
    'url' | 'source' | 'official' | 'lastVerified' | 'thumbnail'
  >,
): Tutorial {
  return {
    ...video,
    url: `https://www.youtube.com/watch?v=${video.videoId}&list=${playlistId}`,
    source: 'MCSR Ranked Explanations',
    official: true,
    lastVerified: '2026-07-29',
    thumbnail: `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`,
  }
}

// Manually verified against the official playlist. Keeping this catalogue
// local avoids scraping YouTube during normal application requests.
export const tutorialCatalogue: Tutorial[] = [
  playlistVideo({
    id: 'ranked-portals',
    videoId: 'WEfSS2JTR80',
    title: 'MCSR Ranked Explanations | Portals (ft. Oxidiot)',
    topic: 'overworld',
    subtopic: 'Portal building and faster Nether entry decisions',
    minimumLevel: 'Beginner',
    maximumLevel: 'Expert',
    relevantSplit: 'overworld',
    relevantBastion: null,
    duration: '4:43',
    durationSeconds: 283,
  }),
  playlistVideo({
    id: 'ranked-fortress',
    videoId: 'Ts2cRIz-MOc',
    title: 'MCSR Ranked Explanations | The Fortress (ft. Hax)',
    topic: 'fortress',
    subtopic: 'Fortress navigation, blaze fights, and rod consistency',
    minimumLevel: 'Beginner',
    maximumLevel: 'Expert',
    relevantSplit: 'fortress',
    relevantBastion: null,
    duration: '5:42',
    durationSeconds: 342,
  }),
  playlistVideo({
    id: 'ranked-housing',
    videoId: 'OxZkC67rops',
    title: 'MCSR Ranked Explanations | The Housing Bastion (ft. Big Big Mongey)',
    topic: 'bastion',
    subtopic: 'Housing recognition, routing, gold collection, and exits',
    minimumLevel: 'Beginner',
    maximumLevel: 'Expert',
    relevantSplit: 'bastion',
    relevantBastion: 'housing',
    duration: '8:36',
    durationSeconds: 516,
  }),
  playlistVideo({
    id: 'ranked-bridge',
    videoId: 'SDBdWHKLvNg',
    title: 'MCSR Ranked Explanations | The Bridge Bastion (ft. 7rowl)',
    topic: 'bastion',
    subtopic: 'Bridge recognition, safe looting, and route exits',
    minimumLevel: 'Beginner',
    maximumLevel: 'Expert',
    relevantSplit: 'bastion',
    relevantBastion: 'bridge',
    duration: '3:49',
    durationSeconds: 229,
  }),
  playlistVideo({
    id: 'ranked-treasure',
    videoId: 'G6bbyQsxDEI',
    title: 'MCSR Ranked Explanations | The Treasure Bastion (ft. Beefsalad)',
    topic: 'bastion',
    subtopic: 'Treasure routing, lava movement, and bartering setup',
    minimumLevel: 'Beginner',
    maximumLevel: 'Expert',
    relevantSplit: 'bastion',
    relevantBastion: 'treasure',
    duration: '3:43',
    durationSeconds: 223,
  }),
  playlistVideo({
    id: 'ranked-stables',
    videoId: 'jc8156m-URU',
    title: 'MCSR Ranked Explanations | The Stables Bastion (ft. Silverr)',
    topic: 'bastion',
    subtopic: 'Stables pathing, gold blocks, and piglin handling',
    minimumLevel: 'Beginner',
    maximumLevel: 'Expert',
    relevantSplit: 'bastion',
    relevantBastion: 'stables',
    duration: '5:51',
    durationSeconds: 351,
  }),
  playlistVideo({
    id: 'ranked-stronghold',
    videoId: 'iI8bntMXJzE',
    title: 'MCSR Ranked Explanations | The Stronghold (ft. Doogile)',
    topic: 'stronghold',
    subtopic: 'Stronghold navigation and faster portal-room access',
    minimumLevel: 'Beginner',
    maximumLevel: 'Expert',
    relevantSplit: 'stronghold',
    relevantBastion: null,
    duration: '2:51',
    durationSeconds: 171,
  }),
  playlistVideo({
    id: 'ranked-end-fight',
    videoId: '_d6_XF6SFBk',
    title: 'MCSR Ranked Explanations | The End Fight (ft. AutomattPL)',
    topic: 'dragon',
    subtopic: 'End-fight setup, bed timing, and finishing consistency',
    minimumLevel: 'Beginner',
    maximumLevel: 'Expert',
    relevantSplit: 'dragon',
    relevantBastion: null,
    duration: '6:09',
    durationSeconds: 369,
  }),
]

function levelIndex(level: LearningLevel) {
  return level === 'Insufficient data' ? 0 : levels.indexOf(level)
}

function tutorialScore(tutorial: Tutorial, input: RecommendationInput) {
  const playerLevel = levelIndex(input.level)
  const minimum = levelIndex(tutorial.minimumLevel)
  const maximum = levelIndex(tutorial.maximumLevel)
  let score = 28

  if (playerLevel >= minimum && playerLevel <= maximum) score += 18
  if (tutorial.relevantSplit === input.weakSplit) {
    score += input.weakSplitSamples >= 3 ? 46 : 22
    score += Math.min(Math.max((input.weakSplitGap ?? 0) / 10_000, 0), 18)
  }
  if (
    input.weakSplit === 'blinding' &&
    tutorial.topic === 'stronghold'
  ) {
    score += 20
  }
  if (
    input.dominantEnding &&
    tutorial.topic.toLowerCase().includes(input.dominantEnding.toLowerCase())
  ) {
    score += 24
  }
  if (
    input.bastionType &&
    tutorial.relevantBastion === input.bastionType.toLowerCase()
  ) {
    score += 36
  } else if (input.bastionType && tutorial.topic === 'bastion') {
    score += 8
  }
  if (
    (input.forfeitRate ?? 0) >= 0.25 &&
    ['overworld', 'bastion', 'dragon'].includes(tutorial.topic)
  ) {
    score += 16
  }
  if (input.level === 'Beginner' && tutorial.topic === 'overworld') score += 14
  return score
}

export function recommendTutorials(input: RecommendationInput, limit = 4) {
  const ranked = tutorialCatalogue
    .map((tutorial) => ({ tutorial, score: tutorialScore(tutorial, input) }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.tutorial.durationSeconds - b.tutorial.durationSeconds ||
        a.tutorial.id.localeCompare(b.tutorial.id),
    )
  const selected: Array<(typeof ranked)[number]> = []
  const topicCounts = new Map<TutorialTopic, number>()

  for (const candidate of ranked) {
    const topicLimit =
      candidate.tutorial.topic === 'bastion' && input.weakSplit === 'bastion'
        ? 2
        : 1
    if ((topicCounts.get(candidate.tutorial.topic) ?? 0) >= topicLimit) continue
    selected.push(candidate)
    topicCounts.set(
      candidate.tutorial.topic,
      (topicCounts.get(candidate.tutorial.topic) ?? 0) + 1,
    )
    if (selected.length === limit) break
  }

  return selected.map(({ tutorial }) => ({
    videoId: tutorial.videoId,
    title: tutorial.title,
    url: tutorial.url,
    thumbnail: tutorial.thumbnail,
    duration: tutorial.duration,
    source: tutorial.source,
    official: tutorial.official,
    focus:
      tutorial.relevantBastion &&
      tutorial.relevantBastion === input.bastionType?.toLowerCase()
        ? `${tutorial.subtopic}. Selected for the recorded ${tutorial.relevantBastion} bastion issue.`
        : tutorial.relevantSplit === input.weakSplit
          ? `${tutorial.subtopic}. Selected for the largest supported split weakness.`
          : input.weakSplit === 'blinding' && tutorial.topic === 'stronghold'
            ? `${tutorial.subtopic}. Selected to support the weakest endgame transition.`
            : `${tutorial.subtopic}. Selected to improve completion consistency.`,
  }))
}
