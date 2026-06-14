const PLACEHOLDER = '/placeholder-user.jpg'

/** Minecraft player head render (mc-heads.net). */
export function getPlayerAvatarUrl(
  uuid?: string | null,
  username?: string | null,
  size = 64,
): string {
  if (uuid) {
    return `https://mc-heads.net/avatar/${uuid}/${size}`
  }
  if (username) {
    return `https://mc-heads.net/avatar/${encodeURIComponent(username)}/${size}`
  }
  return PLACEHOLDER
}

export function getPlayerBodyUrl(
  uuid?: string | null,
  username?: string | null,
  size = 256,
): string {
  if (uuid) {
    return `https://mc-heads.net/player/${uuid}/${size}`
  }
  if (username) {
    return `https://mc-heads.net/player/${encodeURIComponent(username)}/${size}`
  }
  return PLACEHOLDER
}

export function getPlayerComboUrl(
  uuid?: string | null,
  username?: string | null,
  size = 256,
): string {
  if (uuid) {
    return `https://mc-heads.net/combo/${uuid}/${size}`
  }
  if (username) {
    return `https://mc-heads.net/combo/${encodeURIComponent(username)}/${size}`
  }
  return PLACEHOLDER
}

export function getPlayerSkinUrl(
  uuid?: string | null,
  username?: string | null,
): string | null {
  if (uuid) {
    return `https://mc-heads.net/skin/${uuid}`
  }
  if (username) {
    return `https://mc-heads.net/skin/${encodeURIComponent(username)}`
  }
  return null
}

export const placeholderUserPath = PLACEHOLDER
