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

export const placeholderUserPath = PLACEHOLDER
