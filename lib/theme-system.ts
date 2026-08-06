export const THEME_STORAGE_KEY = 'mcsr-theme-preset-v3'

export interface ThemePreset {
  id: string
  name: string
  subtitle: string
  /** Path to a PNG in /public/icons/ — used for the theme card icon */
  iconImg: string
  /** Emoji fallback if the image hasn't loaded */
  iconEmoji: string
  /** Whether this is a light-mode theme */
  light?: boolean
  primary: string
  primaryForeground: string
  background: string
  foreground: string
  card: string
  border: string
  muted: string
  mutedForeground: string
  ring: string
}

export const themePresets: ThemePreset[] = [
  // ── Dimension themes ──────────────────────────────────────────
  {
    id: 'overworld',
    name: 'Overworld Grass',
    subtitle: 'Official MCSR Green',
    iconImg: '/icons/grass.jpg',
    iconEmoji: '🌱',
    primary: '#52b524',
    primaryForeground: '#051004',
    background: '#080c09',
    foreground: '#e6ede8',
    card: '#101711',
    border: '#213625',
    muted: '#162219',
    mutedForeground: '#8aa390',
    ring: '#5cb82a',
  },
  {
    id: 'nether',
    name: 'Nether Crimson',
    subtitle: 'Crimson Forest & Wastes',
    iconImg: '/icons/crimson.jpg',
    iconEmoji: '🔥',
    primary: '#e63939',
    primaryForeground: '#ffffff',
    background: '#0d0707',
    foreground: '#f0e0e0',
    card: '#1a0f0f',
    border: '#3a1e1e',
    muted: '#241414',
    mutedForeground: '#aa7a7a',
    ring: '#ff4d4d',
  },
  {
    id: 'the-end',
    name: 'The End',
    subtitle: 'Void Obsidian & Dragon Purple',
    iconImg: '/icons/end.jpg',
    iconEmoji: '👁️',
    primary: '#ab52f5',
    primaryForeground: '#ffffff',
    background: '#09070d',
    foreground: '#ede5ff',
    card: '#120f1a',
    border: '#2c1e3d',
    muted: '#1d1429',
    mutedForeground: '#9f85ba',
    ring: '#b966ff',
  },
  // ── Ore / Mineral themes ──────────────────────────────────────
  {
    id: 'redstone',
    name: 'Redstone',
    subtitle: 'High-Speed Circuit Dust',
    iconImg: '/icons/redstone.jpg',
    iconEmoji: '🔴',
    primary: '#ff3a1a',
    primaryForeground: '#ffffff',
    background: '#0c0807',
    foreground: '#ffe8e4',
    card: '#18110e',
    border: '#38221b',
    muted: '#241814',
    mutedForeground: '#a88176',
    ring: '#ff5030',
  },
  {
    id: 'diamond',
    name: 'Diamond',
    subtitle: 'Glacier Blue & Pure Crystal',
    iconImg: '/icons/diamond.jpg',
    iconEmoji: '💎',
    primary: '#4de0e6',
    primaryForeground: '#041214',
    background: '#060b0f',
    foreground: '#e0f8ff',
    card: '#0c151c',
    border: '#1a3342',
    muted: '#12202b',
    mutedForeground: '#7aa5b8',
    ring: '#5ff2f8',
  },
  {
    id: 'emerald',
    name: 'Emerald',
    subtitle: 'Villager Trade & Deep Forest',
    iconImg: '/icons/emerald.svg',
    iconEmoji: '🟢',
    primary: '#00c853',
    primaryForeground: '#001a0a',
    background: '#050e08',
    foreground: '#d8ffe9',
    card: '#0b1a10',
    border: '#164d23',
    muted: '#0f2b18',
    mutedForeground: '#5ea876',
    ring: '#00e560',
  },
  {
    id: 'gold',
    name: 'Gold Ingot',
    subtitle: 'Shiny Piglin-Grade Gold',
    iconImg: '/icons/gold.svg',
    iconEmoji: '✨',
    primary: '#f5c400',
    primaryForeground: '#140f00',
    background: '#0b0900',
    foreground: '#fff9d9',
    card: '#1a1500',
    border: '#3d3208',
    muted: '#261f00',
    mutedForeground: '#c4a830',
    ring: '#ffdb00',
  },
  {
    id: 'iron',
    name: 'Iron Ingot',
    subtitle: 'Classic Metallic Minecraft Gray',
    iconImg: '/icons/iron.svg',
    iconEmoji: '⚙️',
    primary: '#c8c8c8',
    primaryForeground: '#111111',
    background: '#0a0a0a',
    foreground: '#f0f0f0',
    card: '#161616',
    border: '#333333',
    muted: '#1f1f1f',
    mutedForeground: '#888888',
    ring: '#dedede',
  },
]

export const defaultThemePreset = themePresets[0]

export function getThemePreset(id: string | null | undefined): ThemePreset {
  return themePresets.find((theme) => theme.id === id) ?? defaultThemePreset
}

export function applyThemePreset(preset: ThemePreset) {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  root.style.setProperty('--background', preset.background)
  root.style.setProperty('--foreground', preset.foreground)
  root.style.setProperty('--card', preset.card)
  root.style.setProperty('--card-foreground', preset.foreground)
  root.style.setProperty('--popover', preset.card)
  root.style.setProperty('--popover-foreground', preset.foreground)
  root.style.setProperty('--primary', preset.primary)
  root.style.setProperty('--primary-foreground', preset.primaryForeground)
  root.style.setProperty('--secondary', preset.muted)
  root.style.setProperty('--secondary-foreground', preset.foreground)
  root.style.setProperty('--muted', preset.muted)
  root.style.setProperty('--muted-foreground', preset.mutedForeground)
  root.style.setProperty('--accent', preset.primary)
  root.style.setProperty('--accent-foreground', preset.primaryForeground)
  root.style.setProperty('--border', preset.border)
  root.style.setProperty('--input', preset.card)
  root.style.setProperty('--ring', preset.ring)
  root.style.setProperty('--sidebar', preset.card)
  root.style.setProperty('--sidebar-foreground', preset.foreground)
  root.style.setProperty('--sidebar-primary', preset.primary)
  root.style.setProperty('--sidebar-border', preset.border)

  // Adjust pixel-grid intensity for light vs dark themes
  root.style.setProperty(
    '--mc-bg-pattern',
    preset.light ? 'rgba(0,0,0,0.06)' : 'rgba(0,0,0,0.28)',
  )
}

export function loadStoredThemePreset(): ThemePreset {
  if (typeof window === 'undefined') return defaultThemePreset
  try {
    const id = window.localStorage.getItem(THEME_STORAGE_KEY)
    return getThemePreset(id)
  } catch {
    return defaultThemePreset
  }
}

export function saveStoredThemePreset(preset: ThemePreset) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, preset.id)
    applyThemePreset(preset)
    window.dispatchEvent(new CustomEvent('mcsr-theme-change', { detail: preset }))
  } catch {
    // ignore
  }
}
