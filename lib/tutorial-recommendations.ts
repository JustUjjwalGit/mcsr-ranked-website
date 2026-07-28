export type LearningLevel =
  | 'Insufficient data'
  | 'Beginner'
  | 'Developing'
  | 'Intermediate'
  | 'Advanced'
  | 'Expert'

type TutorialTopic =
  | 'setup'
  | 'overworld'
  | 'bastion'
  | 'fortress'
  | 'blinding'
  | 'stronghold'
  | 'dragon'

export interface Tutorial {
  id: string
  title: string
  url: string
  source: string
  official: boolean
  topic: TutorialTopic
  subtopic: string
  minimumLevel: Exclude<LearningLevel, 'Insufficient data'>
  maximumLevel: Exclude<LearningLevel, 'Insufficient data'>
  relevantSplit: string | null
  relevantBastion: string | null
  estimatedMinutes: number | null
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

export const tutorialCatalogue: Tutorial[] = [
  {
    id: 'official-setup',
    title: 'MCSR Ranked Setup and New Runner Guide',
    url: 'https://wiki.mcsrranked.com/install/faq',
    source: 'MCSR Ranked Wiki',
    official: true,
    topic: 'setup',
    subtopic: 'Fundamentals and practice setup',
    minimumLevel: 'Beginner',
    maximumLevel: 'Developing',
    relevantSplit: null,
    relevantBastion: null,
    estimatedMinutes: null,
    lastVerified: '2026-07-28',
    thumbnail: '/Gold_Icon.png',
  },
  {
    id: 'official-overworld',
    title: 'How to Play: Overworld',
    url: 'https://wiki.mcsrranked.com/gameplay/tutorial/overworld/',
    source: 'MCSR Ranked Wiki',
    official: true,
    topic: 'overworld',
    subtopic: 'Seed structures and Nether entry',
    minimumLevel: 'Beginner',
    maximumLevel: 'Expert',
    relevantSplit: 'overworld',
    relevantBastion: null,
    estimatedMinutes: null,
    lastVerified: '2026-07-28',
    thumbnail: '/Gold_Icon.png',
  },
  {
    id: 'official-bastion',
    title: 'Bastion Remnant Routes',
    url: 'https://wiki.mcsrranked.com/gameplay/tutorial/nether/bastion/',
    source: 'MCSR Ranked Wiki',
    official: true,
    topic: 'bastion',
    subtopic: 'Recognition, routing, and exits',
    minimumLevel: 'Beginner',
    maximumLevel: 'Expert',
    relevantSplit: 'bastion',
    relevantBastion: null,
    estimatedMinutes: null,
    lastVerified: '2026-07-28',
    thumbnail: '/Gold_Icon.png',
  },
  {
    id: 'official-fortress',
    title: 'Fortress Routing',
    url: 'https://wiki.mcsrranked.com/gameplay/tutorial/nether/fortress',
    source: 'MCSR Ranked Wiki',
    official: true,
    topic: 'fortress',
    subtopic: 'Fortress navigation and blaze rods',
    minimumLevel: 'Developing',
    maximumLevel: 'Expert',
    relevantSplit: 'fortress',
    relevantBastion: null,
    estimatedMinutes: null,
    lastVerified: '2026-07-28',
    thumbnail: '/Gold_Icon.png',
  },
  {
    id: 'official-stronghold',
    title: 'Locate the Stronghold',
    url: 'https://wiki.mcsrranked.com/gameplay/tutorial/endgame/locate_stronghold',
    source: 'MCSR Ranked Wiki',
    official: true,
    topic: 'stronghold',
    subtopic: 'Blind travel and stronghold location',
    minimumLevel: 'Developing',
    maximumLevel: 'Expert',
    relevantSplit: 'blinding',
    relevantBastion: null,
    estimatedMinutes: null,
    lastVerified: '2026-07-28',
    thumbnail: '/Gold_Icon.png',
  },
  {
    id: 'official-one-cycle',
    title: 'One-Cycle Fundamentals',
    url: 'https://wiki.mcsrranked.com/gameplay/tutorial/endgame/end/one_cycle',
    source: 'MCSR Ranked Wiki',
    official: true,
    topic: 'dragon',
    subtopic: 'Bed timing and End consistency',
    minimumLevel: 'Beginner',
    maximumLevel: 'Expert',
    relevantSplit: 'dragon',
    relevantBastion: null,
    estimatedMinutes: null,
    lastVerified: '2026-07-28',
    thumbnail: '/Gold_Icon.png',
  },
  {
    id: 'ranked-overworld-video',
    title: 'Ranked RSG Overworld Fundamentals',
    url: 'https://www.youtube.com/watch?v=egyiA_8FztM',
    source: 'Curated MCSR tutorial',
    official: false,
    topic: 'overworld',
    subtopic: 'Portal, food, and structure decisions',
    minimumLevel: 'Beginner',
    maximumLevel: 'Intermediate',
    relevantSplit: 'overworld',
    relevantBastion: null,
    estimatedMinutes: null,
    lastVerified: '2026-07-28',
    thumbnail: 'https://img.youtube.com/vi/egyiA_8FztM/hqdefault.jpg',
  },
  {
    id: 'ranked-blind-video',
    title: 'Blind Travel and Stronghold Navigation',
    url: 'https://www.youtube.com/watch?v=0N8Wj8hOVKM',
    source: 'Curated MCSR tutorial',
    official: false,
    topic: 'blinding',
    subtopic: 'Blind distance, angles, and navigation',
    minimumLevel: 'Intermediate',
    maximumLevel: 'Expert',
    relevantSplit: 'blinding',
    relevantBastion: null,
    estimatedMinutes: null,
    lastVerified: '2026-07-28',
    thumbnail: 'https://img.youtube.com/vi/0N8Wj8hOVKM/hqdefault.jpg',
  },
]

function levelIndex(level: LearningLevel) {
  return level === 'Insufficient data' ? 0 : levels.indexOf(level)
}

function tutorialScore(tutorial: Tutorial, input: RecommendationInput) {
  const playerLevel = levelIndex(input.level)
  const minimum = levelIndex(tutorial.minimumLevel)
  const maximum = levelIndex(tutorial.maximumLevel)
  let score = tutorial.official ? 28 : 8
  if (playerLevel >= minimum && playerLevel <= maximum) score += 18
  else score -= Math.min(Math.abs(playerLevel - Math.max(minimum, Math.min(maximum, playerLevel))) * 12, 36)
  if (tutorial.relevantSplit && tutorial.relevantSplit === input.weakSplit) {
    score += input.weakSplitSamples >= 3 ? 46 : 22
    score += Math.min(Math.max((input.weakSplitGap ?? 0) / 10_000, 0), 18)
  }
  if (input.dominantEnding && tutorial.topic.toLowerCase().includes(input.dominantEnding.toLowerCase())) {
    score += 24
  }
  if (input.bastionType && tutorial.topic === 'bastion') score += 12
  if ((input.forfeitRate ?? 0) >= 0.25 && ['setup', 'overworld', 'bastion', 'dragon'].includes(tutorial.topic)) {
    score += 16
  }
  if (input.level === 'Beginner' && tutorial.topic === 'setup') score += 35
  if ((input.level === 'Advanced' || input.level === 'Expert') && tutorial.topic === 'setup') score -= 80
  return score
}

export function recommendTutorials(input: RecommendationInput, limit = 4) {
  const ranked = tutorialCatalogue
    .map((tutorial) => ({ tutorial, score: tutorialScore(tutorial, input) }))
    .sort((a, b) => b.score - a.score || a.tutorial.id.localeCompare(b.tutorial.id))
  const selected: Array<(typeof ranked)[number]> = []
  const topicCounts = new Map<TutorialTopic, number>()

  for (const candidate of ranked) {
    const duplicatePenalty = (topicCounts.get(candidate.tutorial.topic) ?? 0) * 24
    if (candidate.score - duplicatePenalty < 0) continue
    if ((topicCounts.get(candidate.tutorial.topic) ?? 0) >= 1) continue
    selected.push(candidate)
    topicCounts.set(candidate.tutorial.topic, 1)
    if (selected.length === limit) break
  }

  return selected.map(({ tutorial }) => ({
    title: tutorial.title,
    url: tutorial.url,
    thumbnail: tutorial.thumbnail,
    source: tutorial.source,
    official: tutorial.official,
    focus:
      tutorial.relevantSplit === input.weakSplit
        ? `${tutorial.subtopic}. Selected for the largest supported split weakness.`
        : tutorial.topic === 'setup' && input.level === 'Beginner'
          ? `${tutorial.subtopic}. Selected for a beginner learning profile.`
          : `${tutorial.subtopic}. Selected to improve completion consistency.`,
  }))
}
