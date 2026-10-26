export interface FavoritePlayer {
  username: string
  uuid?: string
  elo?: number
  rank?: number
  savedAt: number
}

const recentSearchesKey = 'mcsr-recent-searches'
const favoritePlayersKey = 'mcsr-favorite-players'
const maxRecentSearches = 6
const maxFavoritePlayers = 12

function canUseStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage)
}

function normalizeUsername(username: string) {
  return username.trim().toLowerCase()
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) return fallback

  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJson<T>(key: string, value: T) {
  if (!canUseStorage()) return
  window.localStorage.setItem(key, JSON.stringify(value))
}

export function getRecentSearches() {
  return readJson<string[]>(recentSearchesKey, []).filter(Boolean)
}

export function saveRecentSearch(username: string) {
  const cleanUsername = username.trim()
  if (!cleanUsername) return getRecentSearches()

  const nextSearches = [
    cleanUsername,
    ...getRecentSearches().filter(
      (item) => normalizeUsername(item) !== normalizeUsername(cleanUsername),
    ),
  ].slice(0, maxRecentSearches)

  writeJson(recentSearchesKey, nextSearches)
  return nextSearches
}

export function clearRecentSearches() {
  writeJson(recentSearchesKey, [])
  return []
}

export function getFavoritePlayers() {
  return readJson<FavoritePlayer[]>(favoritePlayersKey, []).filter(
    (player) => player.username,
  )
}

export function isFavoritePlayer(username: string) {
  const normalized = normalizeUsername(username)
  return getFavoritePlayers().some(
    (player) => normalizeUsername(player.username) === normalized,
  )
}

export function toggleFavoritePlayer(player: Omit<FavoritePlayer, 'savedAt'>) {
  const cleanUsername = player.username.trim()
  if (!cleanUsername) return getFavoritePlayers()

  const normalized = normalizeUsername(cleanUsername)
  const favorites = getFavoritePlayers()
  const existing = favorites.some(
    (favorite) => normalizeUsername(favorite.username) === normalized,
  )

  const nextFavorites = existing
    ? favorites.filter(
        (favorite) => normalizeUsername(favorite.username) !== normalized,
      )
    : [
        {
          ...player,
          username: cleanUsername,
          savedAt: Date.now(),
        },
        ...favorites,
      ].slice(0, maxFavoritePlayers)

  writeJson(favoritePlayersKey, nextFavorites)
  return nextFavorites
}

export function removeFavoritePlayer(username: string) {
  const normalized = normalizeUsername(username)
  const nextFavorites = getFavoritePlayers().filter(
    (favorite) => normalizeUsername(favorite.username) !== normalized,
  )

  writeJson(favoritePlayersKey, nextFavorites)
  return nextFavorites
}
