export const THEME_STORAGE_KEY = 'mcsr-theme-settings-v1'

export type BackgroundFit = 'cover' | 'contain' | 'max'
export type ThemeMode = 'preset' | 'custom'

export interface ThemeColors {
  background: string
  foreground: string
  card: string
  cardForeground: string
  popover: string
  popoverForeground: string
  primary: string
  primaryForeground: string
  secondary: string
  secondaryForeground: string
  muted: string
  mutedForeground: string
  accent: string
  accentForeground: string
  destructive: string
  border: string
  input: string
  ring: string
  chart1: string
  chart2: string
  chart3: string
  chart4: string
  chart5: string
  sidebar: string
  sidebarForeground: string
  sidebarPrimary: string
  sidebarPrimaryForeground: string
  sidebarAccent: string
  sidebarAccentForeground: string
  sidebarBorder: string
  sidebarRing: string
}

export interface ThemePreset {
  id: string
  name: string
  family: string
  accent: string
  colors: ThemeColors
  backgroundImage: string
  backgroundOverlay: string
  backgroundFilter: string
}

export interface ThemeSettings {
  mode: ThemeMode
  presetId: string
  colors: ThemeColors
  presetBackgroundImage: string
  presetBackgroundOverlay: string
  presetBackgroundFilter: string
  backgroundUrl: string
  localBackgroundImage: string
  backgroundFit: BackgroundFit
}

interface ThemeFamily {
  id: string
  name: string
  background: string
  card: string
  muted: string
  foreground: string
  mutedForeground: string
  border: string
  input: string
  overlay: string
  destructive: string
}

interface AccentSwatch {
  id: string
  name: string
  color: string
  secondary: string
  foreground: string
}

const families: ThemeFamily[] = [
  {
    id: 'ranked',
    name: 'Ranked',
    background: '#050806',
    card: '#0d1410',
    muted: '#18231d',
    foreground: '#f1fff6',
    mutedForeground: '#93a99b',
    border: '#24362b',
    input: '#0a100d',
    overlay: 'linear-gradient(rgba(0, 0, 0, 0.38), rgba(0, 0, 0, 0.52))',
    destructive: '#ff4f5f',
  },
  {
    id: 'obsidian',
    name: 'Obsidian',
    background: '#07080d',
    card: '#11131c',
    muted: '#202432',
    foreground: '#f4f6ff',
    mutedForeground: '#9ba4ba',
    border: '#2b3142',
    input: '#0e1018',
    overlay: 'linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.48))',
    destructive: '#ff5c6c',
  },
  {
    id: 'midnight',
    name: 'Midnight',
    background: '#071018',
    card: '#0f1b27',
    muted: '#1b2b3b',
    foreground: '#eef8ff',
    mutedForeground: '#91a8bc',
    border: '#294055',
    input: '#0b1721',
    overlay: 'linear-gradient(rgba(0, 0, 0, 0.32), rgba(0, 0, 0, 0.5))',
    destructive: '#ff5f7a',
  },
  {
    id: 'terminal',
    name: 'Terminal',
    background: '#06110c',
    card: '#0c1a13',
    muted: '#193126',
    foreground: '#ecfff5',
    mutedForeground: '#8db5a1',
    border: '#254837',
    input: '#08150f',
    overlay: 'linear-gradient(rgba(0, 0, 0, 0.36), rgba(0, 0, 0, 0.54))',
    destructive: '#ff5f5f',
  },
  {
    id: 'ember',
    name: 'Ember',
    background: '#140908',
    card: '#211311',
    muted: '#38211b',
    foreground: '#fff4ed',
    mutedForeground: '#c3a295',
    border: '#4c2d24',
    input: '#190d0b',
    overlay: 'linear-gradient(rgba(0, 0, 0, 0.34), rgba(0, 0, 0, 0.54))',
    destructive: '#ff4f5f',
  },
  {
    id: 'violet',
    name: 'Violet',
    background: '#0e0a17',
    card: '#191225',
    muted: '#2c2140',
    foreground: '#f7f1ff',
    mutedForeground: '#b2a2cc',
    border: '#3e3158',
    input: '#130d1e',
    overlay: 'linear-gradient(rgba(0, 0, 0, 0.34), rgba(0, 0, 0, 0.52))',
    destructive: '#ff5c8a',
  },
  {
    id: 'paper',
    name: 'Paper',
    background: '#f6f1e7',
    card: '#fffaf0',
    muted: '#e8dcc9',
    foreground: '#2b261d',
    mutedForeground: '#726856',
    border: '#d2c5ab',
    input: '#fff8eb',
    overlay: 'linear-gradient(rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.28))',
    destructive: '#c7273a',
  },
  {
    id: 'ice',
    name: 'Ice',
    background: '#edf7fb',
    card: '#f8fdff',
    muted: '#dcecf3',
    foreground: '#16272f',
    mutedForeground: '#5a707b',
    border: '#bdd3dd',
    input: '#f7fdff',
    overlay: 'linear-gradient(rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.22))',
    destructive: '#d22b4d',
  },
  {
    id: 'forest',
    name: 'Forest',
    background: '#07110a',
    card: '#101c13',
    muted: '#1d3122',
    foreground: '#eef9ef',
    mutedForeground: '#94ad98',
    border: '#2d4b34',
    input: '#0c160e',
    overlay: 'linear-gradient(rgba(0, 0, 0, 0.34), rgba(0, 0, 0, 0.52))',
    destructive: '#ff5a64',
  },
  {
    id: 'storm',
    name: 'Storm',
    background: '#111318',
    card: '#1b1f27',
    muted: '#2d3440',
    foreground: '#f2f4f8',
    mutedForeground: '#a7afbd',
    border: '#424b59',
    input: '#171a21',
    overlay: 'linear-gradient(rgba(0, 0, 0, 0.28), rgba(0, 0, 0, 0.44))',
    destructive: '#ff6572',
  },
]

const accents: AccentSwatch[] = [
  { id: 'lime', name: 'Lime', color: '#00e676', secondary: '#2eeea0', foreground: '#02140a' },
  { id: 'cyan', name: 'Cyan', color: '#00d9ff', secondary: '#4fd7ff', foreground: '#031219' },
  { id: 'blue', name: 'Blue', color: '#5794ff', secondary: '#7db6ff', foreground: '#06101f' },
  { id: 'violet', name: 'Violet', color: '#9b6cff', secondary: '#c084fc', foreground: '#12091f' },
  { id: 'rose', name: 'Rose', color: '#ff5ca8', secondary: '#ff8ac6', foreground: '#210713' },
  { id: 'coral', name: 'Coral', color: '#ff6b6b', secondary: '#ff9a76', foreground: '#210807' },
  { id: 'amber', name: 'Amber', color: '#ffc857', secondary: '#ffdf7e', foreground: '#1c1202' },
  { id: 'orange', name: 'Orange', color: '#ff8a3d', secondary: '#ffb052', foreground: '#1f0d02' },
  { id: 'mint', name: 'Mint', color: '#6dffbd', secondary: '#7fffd4', foreground: '#04160f' },
  { id: 'mono', name: 'Mono', color: '#f5f7fa', secondary: '#b8c0cc', foreground: '#101217' },
]

const colorEntries: Array<[keyof ThemeColors, string]> = [
  ['background', '--background'],
  ['foreground', '--foreground'],
  ['card', '--card'],
  ['cardForeground', '--card-foreground'],
  ['popover', '--popover'],
  ['popoverForeground', '--popover-foreground'],
  ['primary', '--primary'],
  ['primaryForeground', '--primary-foreground'],
  ['secondary', '--secondary'],
  ['secondaryForeground', '--secondary-foreground'],
  ['muted', '--muted'],
  ['mutedForeground', '--muted-foreground'],
  ['accent', '--accent'],
  ['accentForeground', '--accent-foreground'],
  ['destructive', '--destructive'],
  ['border', '--border'],
  ['input', '--input'],
  ['ring', '--ring'],
  ['chart1', '--chart-1'],
  ['chart2', '--chart-2'],
  ['chart3', '--chart-3'],
  ['chart4', '--chart-4'],
  ['chart5', '--chart-5'],
  ['sidebar', '--sidebar'],
  ['sidebarForeground', '--sidebar-foreground'],
  ['sidebarPrimary', '--sidebar-primary'],
  ['sidebarPrimaryForeground', '--sidebar-primary-foreground'],
  ['sidebarAccent', '--sidebar-accent'],
  ['sidebarAccentForeground', '--sidebar-accent-foreground'],
  ['sidebarBorder', '--sidebar-border'],
  ['sidebarRing', '--sidebar-ring'],
]

function makeThemeColors(family: ThemeFamily, accent: AccentSwatch): ThemeColors {
  return {
    background: family.background,
    foreground: family.foreground,
    card: family.card,
    cardForeground: family.foreground,
    popover: family.card,
    popoverForeground: family.foreground,
    primary: accent.color,
    primaryForeground: accent.foreground,
    secondary: family.muted,
    secondaryForeground: family.foreground,
    muted: family.muted,
    mutedForeground: family.mutedForeground,
    accent: accent.secondary,
    accentForeground: accent.foreground,
    destructive: family.destructive,
    border: family.border,
    input: family.input,
    ring: accent.color,
    chart1: accent.color,
    chart2: accent.secondary,
    chart3: family.mutedForeground,
    chart4: family.border,
    chart5: family.foreground,
    sidebar: family.card,
    sidebarForeground: family.foreground,
    sidebarPrimary: accent.color,
    sidebarPrimaryForeground: accent.foreground,
    sidebarAccent: family.muted,
    sidebarAccentForeground: family.foreground,
    sidebarBorder: family.border,
    sidebarRing: accent.color,
  }
}

export const themePresets: ThemePreset[] = families.flatMap((family) =>
  accents.map((accent) => ({
    id: `${family.id}-${accent.id}`,
    name: `${family.name} ${accent.name}`,
    family: family.name,
    accent: accent.name,
    colors: makeThemeColors(family, accent),
    backgroundImage: `radial-gradient(circle at 15% 12%, ${accent.color}33, transparent 30%), radial-gradient(circle at 82% 16%, ${accent.secondary}24, transparent 34%), linear-gradient(135deg, ${family.background}, ${family.card} 52%, ${family.muted})`,
    backgroundOverlay: family.overlay,
    backgroundFilter: 'none',
  })),
)

export const defaultThemePreset = themePresets[0]

export function createDefaultThemeSettings(): ThemeSettings {
  return {
    mode: 'preset',
    presetId: defaultThemePreset.id,
    colors: defaultThemePreset.colors,
    presetBackgroundImage: defaultThemePreset.backgroundImage,
    presetBackgroundOverlay: defaultThemePreset.backgroundOverlay,
    presetBackgroundFilter: defaultThemePreset.backgroundFilter,
    backgroundUrl: '',
    localBackgroundImage: '',
    backgroundFit: 'cover',
  }
}

export function getThemePreset(id: string | null | undefined) {
  return themePresets.find((theme) => theme.id === id) ?? defaultThemePreset
}

export function settingsFromPreset(
  preset: ThemePreset,
  current = createDefaultThemeSettings(),
): ThemeSettings {
  return {
    ...current,
    mode: 'preset',
    presetId: preset.id,
    colors: preset.colors,
    presetBackgroundImage: preset.backgroundImage,
    presetBackgroundOverlay: preset.backgroundOverlay,
    presetBackgroundFilter: preset.backgroundFilter,
  }
}

export function normalizeThemeSettings(value: unknown): ThemeSettings {
  const defaults = createDefaultThemeSettings()
  if (!value || typeof value !== 'object') return defaults

  const partial = value as Partial<ThemeSettings>
  const preset = getThemePreset(partial.presetId)

  return {
    mode: partial.mode === 'custom' ? 'custom' : 'preset',
    presetId: preset.id,
    colors: {
      ...preset.colors,
      ...(partial.colors && typeof partial.colors === 'object'
        ? partial.colors
        : {}),
    },
    presetBackgroundImage:
      partial.presetBackgroundImage || preset.backgroundImage,
    presetBackgroundOverlay:
      partial.presetBackgroundOverlay || preset.backgroundOverlay,
    presetBackgroundFilter:
      partial.presetBackgroundFilter || preset.backgroundFilter,
    backgroundUrl:
      typeof partial.backgroundUrl === 'string' ? partial.backgroundUrl : '',
    localBackgroundImage:
      typeof partial.localBackgroundImage === 'string'
        ? partial.localBackgroundImage
        : '',
    backgroundFit:
      partial.backgroundFit === 'contain' || partial.backgroundFit === 'max'
        ? partial.backgroundFit
        : 'cover',
  }
}

export function loadThemeSettings(): ThemeSettings {
  if (typeof window === 'undefined') return createDefaultThemeSettings()

  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    return normalizeThemeSettings(stored ? JSON.parse(stored) : null)
  } catch {
    return createDefaultThemeSettings()
  }
}

export function saveThemeSettings(settings: ThemeSettings): boolean {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(settings))
    return true
  } catch {
    return false
  }
}

function cssUrl(value: string) {
  return `url("${value.replace(/["\\]/g, '\\$&')}")`
}

function fitToCss(fit: BackgroundFit) {
  if (fit === 'contain') return 'contain'
  if (fit === 'max') return '100% 100%'
  return 'cover'
}

export function applyThemeSettings(settings: ThemeSettings) {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  for (const [key, cssVar] of colorEntries) {
    root.style.setProperty(cssVar, settings.colors[key])
  }

  const customBackground =
    settings.localBackgroundImage || settings.backgroundUrl.trim()
  const hasCustomBackground = customBackground.length > 0

  root.style.setProperty(
    '--app-background-image',
    hasCustomBackground
      ? cssUrl(customBackground)
      : settings.presetBackgroundImage || defaultThemePreset.backgroundImage,
  )
  root.style.setProperty(
    '--app-background-overlay',
    settings.presetBackgroundOverlay ||
      defaultThemePreset.backgroundOverlay,
  )
  root.style.setProperty(
    '--app-background-filter',
    hasCustomBackground
      ? 'blur(3px) brightness(0.76)'
      : settings.presetBackgroundFilter || 'none',
  )
  root.style.setProperty(
    '--app-background-size',
    hasCustomBackground ? fitToCss(settings.backgroundFit) : 'cover',
  )
  root.style.setProperty('--app-background-repeat', 'no-repeat')
  root.style.setProperty(
    '--app-background-scale',
    hasCustomBackground && settings.backgroundFit === 'cover' ? '1.02' : '1',
  )
}
