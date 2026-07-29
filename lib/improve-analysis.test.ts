import assert from 'node:assert/strict'
import test from 'node:test'
import { buildHumanSummary } from '@/lib/human-summary'
import { segmentDuration } from '@/lib/improve-segments'
import { getRankTierFromElo, resolveRankTier } from '@/lib/rank-tiers'
import { recommendTutorials } from '@/lib/tutorial-recommendations'

test('segment durations use the latest valid prior milestone', () => {
  assert.equal(segmentDuration(300_000, [120_000, 220_000]), 80_000)
  assert.equal(segmentDuration(120_000, [], true), 120_000)
})

test('segment durations support fortress-first and bastion-first routes', () => {
  assert.equal(segmentDuration(240_000, [90_000, null, 210_000]), 30_000)
  assert.equal(segmentDuration(280_000, [90_000, 170_000, 250_000]), 30_000)
})

test('segment durations reject missing and invalid ordering', () => {
  assert.equal(segmentDuration(null, [100_000]), null)
  assert.equal(segmentDuration(100_000, [120_000]), null)
  assert.equal(segmentDuration(-1, [], true), null)
})

test('beginner recommendations prioritize the official portals tutorial', () => {
  const recommendations = recommendTutorials({
    level: 'Beginner',
    weakSplit: 'overworld',
    weakSplitSamples: 7,
    weakSplitGap: 45_000,
    dominantEnding: 'Nether',
    forfeitRate: 0.4,
    bastionType: null,
  })
  assert.equal(recommendations[0]?.official, true)
  assert.match(recommendations[0]?.title ?? '', /Portals/)
})

test('expert recommendations omit setup guides', () => {
  const recommendations = recommendTutorials({
    level: 'Expert',
    weakSplit: 'blinding',
    weakSplitSamples: 12,
    weakSplitGap: 20_000,
    dominantEnding: 'Stronghold',
    forfeitRate: 0.05,
    bastionType: null,
  })
  assert.equal(recommendations.some((item) => item.title.includes('Setup')), false)
})

test('human summary ignores one-match category outliers', () => {
  const summary = buildHumanSummary({
    username: 'Runner',
    matches: 10,
    wins: 6,
    losses: 4,
    draws: 0,
    splitRows: [],
    seedTypes: [
      { seedType: 'Village', averageCompletion: 900_000, matches: 5, wins: 3, completed: 4, winRate: 0.6 },
      { seedType: 'Shipwreck', averageCompletion: 700_000, matches: 1, wins: 1, completed: 1, winRate: 1 },
    ],
    bastionTypes: [],
    deaths: { total: 0, slices: [] },
    forfeitRate: 0.1,
  })
  assert.match(summary, /Village is the strongest supported seed type/)
  assert.doesNotMatch(summary, /Shipwreck is the strongest/)
})

test('official ranked tiers and divisions follow documented Elo thresholds', () => {
  assert.equal(getRankTierFromElo(0).label, 'Coal I')
  assert.equal(getRankTierFromElo(500).label, 'Coal III')
  assert.equal(getRankTierFromElo(600).label, 'Iron I')
  assert.equal(getRankTierFromElo(800).label, 'Iron III')
  assert.equal(getRankTierFromElo(900).label, 'Gold I')
  assert.equal(getRankTierFromElo(1400).label, 'Emerald III')
  assert.equal(getRankTierFromElo(1800).label, 'Diamond III')
  assert.equal(getRankTierFromElo(2000).label, 'Netherite')
})

test('tier names resolve case-insensitively and unknown tiers stay neutral', () => {
  assert.equal(resolveRankTier('iRoN ii').label, 'Iron II')
  assert.equal(resolveRankTier('Future Rank').key, 'unknown')
  assert.equal(resolveRankTier(null, null).key, 'unranked')
})
