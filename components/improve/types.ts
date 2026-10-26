export interface DashboardSocial {
  service: 'Discord' | 'YouTube' | 'Twitch'
  name: string
  url: string | null
}

export interface PlayerDashboard {
  loadedMatches: number
  splitDetailMatches: number
  benchmarkLabel: string
  overview: {
    uuid: string
    username: string
    playerId: string
    country: string | null
    socials: DashboardSocial[]
    lastRanked: number | null
    elo: number | null
    rank: number | null
    tier: string
    wins: number
    losses: number
    draws: number
    pb: number | null
    averageCompletion: number | null
    winRate: number | null
    forfeitRate: number | null
  }
  eloHistory: Array<{
    matchId: number
    date: number
    elo: number | null
    change: number | null
    opponent: string | null
  }>
  splitPerformance: Array<{
    key: string
    label: string
    average: number | null
    benchmark: number | null
    score: number | null
    samples: number
  }>
  deathsBySplit: {
    total: number
    slices: Array<{
      key: string
      label: string
      count: number
      percent: number
    }>
  }
  splitTimes: {
    completedMatches: number
    rows: Array<{
      key: string
      label: string
      average: number | null
      best: number | null
      benchmarkAverage: number | null
      averageDifference: number | null
      samples: number
    }>
  }
  seedTypes: Array<{
    seedType: string
    averageCompletion: number | null
    matches: number
    wins: number
    completed: number
    winRate: number | null
  }>
  bastionTypes: Array<{
    bastionType: string
    matches: number
    wins: number
    completed: number
    winRate: number | null
    averageSplit: number | null
  }>
  dataQuality: string[]
}
