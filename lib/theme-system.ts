export const THEME_STORAGE_KEY = 'mcsr-theme-settings-v2'
const LEGACY_THEME_STORAGE_KEY = 'mcsr-theme-settings-v1'

export type BackgroundFit = 'cover' | 'contain' | 'max'
export type ThemeMode = 'preset' | 'custom'
export type ThemeAppearance = 'dark' | 'light'

export interface ThemeColors {
  background: string
  foreground: string
  card: string
  cardForeground: string
  elevated: string
  secondarySurface: string
  popover: string
  popoverForeground: string
  header: string
  primary: string
  primaryForeground: string
  secondary: string
  secondaryForeground: string
  muted: string
  mutedForeground: string
  subtleForeground: string
  accent: string
  accentForeground: string
  destructive: string
  border: string
  input: string
  inputBorder: string
  hover: string
  selected: string
  ring: string
  success: string
  warning: string
  danger: string
  info: string
  cursorGlow: string
  chartGrid: string
  chartAxis: string
  chartTooltip: string
  chart1: string
  chart2: string
  chart3: string
  chart4: string
  chart5: string
  tableHeader: string
  tableRowHover: string
  positiveBackground: string
  negativeBackground: string
  neutralBackground: string
  skeleton: string
  skeletonHighlight: string
  scrollbarTrack: string
  scrollbarThumb: string
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
  appearance: ThemeAppearance
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

type PaletteInput = {
  id: string
  name: string
  appearance: ThemeAppearance
  background: string
  elevated: string
  card: string
  secondary: string
  foreground: string
  mutedForeground: string
  subtleForeground: string
  primary: string
  accent: string
  border: string
  input: string
  success: string
  warning: string
  danger: string
  info: string
  charts: [string, string, string, string, string]
  glow: string
}

const palettes: PaletteInput[] = [
  {
    id: 'ranked-night',
    name: 'Ranked Night',
    appearance: 'dark',
    background: '#070b0d',
    elevated: '#121a1d',
    card: '#0d1417',
    secondary: '#172125',
    foreground: '#edf7f4',
    mutedForeground: '#91a39f',
    subtleForeground: '#6f817d',
    primary: '#35e08d',
    accent: '#43c7e8',
    border: '#26373a',
    input: '#0a1114',
    success: '#45d483',
    warning: '#e8b84e',
    danger: '#f06a72',
    info: '#58b8ef',
    charts: ['#35e08d', '#43c7e8', '#e8b84e', '#f06a72', '#b18af3'],
    glow: 'rgba(53, 224, 141, 0.16)',
  },
  {
    id: 'abyss-blue',
    name: 'Abyss Blue',
    appearance: 'dark',
    background: '#070d17',
    elevated: '#121f31',
    card: '#0d1725',
    secondary: '#18283c',
    foreground: '#eef5ff',
    mutedForeground: '#91a6bf',
    subtleForeground: '#6c819a',
    primary: '#68a7ff',
    accent: '#5de0d2',
    border: '#263a52',
    input: '#0a1320',
    success: '#55d68a',
    warning: '#f0bd5b',
    danger: '#f1707a',
    info: '#62b7ff',
    charts: ['#68a7ff', '#5de0d2', '#f0bd5b', '#f1707a', '#b68cff'],
    glow: 'rgba(104, 167, 255, 0.17)',
  },
  {
    id: 'void-orchid',
    name: 'Void Orchid',
    appearance: 'dark',
    background: '#0d0914',
    elevated: '#20172d',
    card: '#171020',
    secondary: '#281d36',
    foreground: '#f7f0ff',
    mutedForeground: '#b2a0c4',
    subtleForeground: '#89759e',
    primary: '#b98cff',
    accent: '#ff7db7',
    border: '#3a2b4b',
    input: '#120c1a',
    success: '#64d894',
    warning: '#efbd61',
    danger: '#ff7181',
    info: '#75baff',
    charts: ['#b98cff', '#ff7db7', '#64d894', '#efbd61', '#75baff'],
    glow: 'rgba(185, 140, 255, 0.16)',
  },
  {
    id: 'polar-run',
    name: 'Polar Run',
    appearance: 'dark',
    background: '#111820',
    elevated: '#25313d',
    card: '#18222c',
    secondary: '#202d38',
    foreground: '#eceff4',
    mutedForeground: '#a8b4c0',
    subtleForeground: '#7f8d9a',
    primary: '#88c0d0',
    accent: '#a3be8c',
    border: '#344552',
    input: '#141d26',
    success: '#a3be8c',
    warning: '#ebcb8b',
    danger: '#bf616a',
    info: '#81a1c1',
    charts: ['#88c0d0', '#a3be8c', '#ebcb8b', '#bf616a', '#b48ead'],
    glow: 'rgba(136, 192, 208, 0.15)',
  },
  {
    id: 'night-potion',
    name: 'Night Potion',
    appearance: 'dark',
    background: '#11111b',
    elevated: '#252338',
    card: '#191827',
    secondary: '#242238',
    foreground: '#f8f8f2',
    mutedForeground: '#aaa6bd',
    subtleForeground: '#807c93',
    primary: '#bd93f9',
    accent: '#8be9fd',
    border: '#39364f',
    input: '#151420',
    success: '#50fa7b',
    warning: '#f1fa8c',
    danger: '#ff6e7a',
    info: '#8be9fd',
    charts: ['#bd93f9', '#8be9fd', '#50fa7b', '#ffb86c', '#ff79c6'],
    glow: 'rgba(189, 147, 249, 0.16)',
  },
  {
    id: 'ancient-gold',
    name: 'Ancient Gold',
    appearance: 'dark',
    background: '#14110e',
    elevated: '#2a241d',
    card: '#1c1814',
    secondary: '#29231d',
    foreground: '#f4ead8',
    mutedForeground: '#b6a58d',
    subtleForeground: '#8e7d67',
    primary: '#d8a84e',
    accent: '#83b98b',
    border: '#44382d',
    input: '#17130f',
    success: '#8fbd78',
    warning: '#e0b657',
    danger: '#e06b64',
    info: '#72abc5',
    charts: ['#d8a84e', '#83b98b', '#72abc5', '#e06b64', '#ba8bd4'],
    glow: 'rgba(216, 168, 78, 0.14)',
  },
  {
    id: 'ember-route',
    name: 'Ember Route',
    appearance: 'dark',
    background: '#150c0b',
    elevated: '#30201b',
    card: '#201411',
    secondary: '#2d1c18',
    foreground: '#fff2e9',
    mutedForeground: '#c1a294',
    subtleForeground: '#95786c',
    primary: '#ff9363',
    accent: '#f1ca68',
    border: '#4b3129',
    input: '#190f0d',
    success: '#79c986',
    warning: '#f1ca68',
    danger: '#ff6f74',
    info: '#78b7dd',
    charts: ['#ff9363', '#f1ca68', '#79c986', '#78b7dd', '#ce8cda'],
    glow: 'rgba(255, 147, 99, 0.14)',
  },
  {
    id: 'signal-black',
    name: 'Signal Black',
    appearance: 'dark',
    background: '#030405',
    elevated: '#17191c',
    card: '#0b0d0f',
    secondary: '#15181b',
    foreground: '#ffffff',
    mutedForeground: '#b7bdc3',
    subtleForeground: '#858b91',
    primary: '#5cff9d',
    accent: '#66c9ff',
    border: '#353a3f',
    input: '#07090a',
    success: '#5cff9d',
    warning: '#ffd45c',
    danger: '#ff6875',
    info: '#66c9ff',
    charts: ['#5cff9d', '#66c9ff', '#ffd45c', '#ff6875', '#d09bff'],
    glow: 'rgba(92, 255, 157, 0.14)',
  },
  {
    id: 'cloud-map',
    name: 'Cloud Map',
    appearance: 'light',
    background: '#eef3f7',
    elevated: '#ffffff',
    card: '#f8fbfd',
    secondary: '#e4ebf0',
    foreground: '#17232d',
    mutedForeground: '#5f7280',
    subtleForeground: '#7a8b96',
    primary: '#1678b8',
    accent: '#008f7a',
    border: '#c4d0d9',
    input: '#ffffff',
    success: '#16875b',
    warning: '#a66b08',
    danger: '#c83d4d',
    info: '#1678b8',
    charts: ['#1678b8', '#008f7a', '#b1740c', '#c83d4d', '#7555bd'],
    glow: 'rgba(22, 120, 184, 0.11)',
  },
  {
    id: 'daybreak',
    name: 'Daybreak',
    appearance: 'light',
    background: '#faf8f3',
    elevated: '#ffffff',
    card: '#fffdf9',
    secondary: '#eee9df',
    foreground: '#292721',
    mutedForeground: '#6f695d',
    subtleForeground: '#8b8477',
    primary: '#326f62',
    accent: '#b2603a',
    border: '#d8d0c2',
    input: '#ffffff',
    success: '#337b55',
    warning: '#9b6a13',
    danger: '#b8444c',
    info: '#3677a5',
    charts: ['#326f62', '#b2603a', '#9b6a13', '#b8444c', '#6f58a7'],
    glow: 'rgba(50, 111, 98, 0.1)',
  },
]

function readableForeground(input: PaletteInput) {
  return input.appearance === 'light' ? '#ffffff' : '#07100c'
}

function createColors(input: PaletteInput): ThemeColors {
  const light = input.appearance === 'light'
  return {
    background: input.background,
    foreground: input.foreground,
    card: input.card,
    cardForeground: input.foreground,
    elevated: input.elevated,
    secondarySurface: input.secondary,
    popover: input.elevated,
    popoverForeground: input.foreground,
    header: light ? 'rgba(248,251,253,0.92)' : 'rgba(8,12,14,0.88)',
    primary: input.primary,
    primaryForeground: readableForeground(input),
    secondary: input.secondary,
    secondaryForeground: input.foreground,
    muted: input.secondary,
    mutedForeground: input.mutedForeground,
    subtleForeground: input.subtleForeground,
    accent: input.accent,
    accentForeground: readableForeground(input),
    destructive: input.danger,
    border: input.border,
    input: input.input,
    inputBorder: input.border,
    hover: light ? '#e0e8ed' : input.elevated,
    selected: light ? '#d8e9e3' : input.secondary,
    ring: input.primary,
    success: input.success,
    warning: input.warning,
    danger: input.danger,
    info: input.info,
    cursorGlow: input.glow,
    chartGrid: light ? 'rgba(35,55,70,0.14)' : 'rgba(235,245,250,0.12)',
    chartAxis: input.mutedForeground,
    chartTooltip: input.elevated,
    chart1: input.charts[0],
    chart2: input.charts[1],
    chart3: input.charts[2],
    chart4: input.charts[3],
    chart5: input.charts[4],
    tableHeader: light ? '#e5ebef' : input.secondary,
    tableRowHover: light ? '#eaf0f3' : input.elevated,
    positiveBackground: light ? 'rgba(22,135,91,0.11)' : 'rgba(69,212,131,0.1)',
    negativeBackground: light ? 'rgba(200,61,77,0.1)' : 'rgba(240,106,114,0.1)',
    neutralBackground: light ? 'rgba(95,114,128,0.1)' : 'rgba(145,163,159,0.08)',
    skeleton: light ? '#dce4e9' : input.secondary,
    skeletonHighlight: light ? '#edf2f5' : input.elevated,
    scrollbarTrack: input.background,
    scrollbarThumb: input.mutedForeground,
    sidebar: input.card,
    sidebarForeground: input.foreground,
    sidebarPrimary: input.primary,
    sidebarPrimaryForeground: readableForeground(input),
    sidebarAccent: input.secondary,
    sidebarAccentForeground: input.foreground,
    sidebarBorder: input.border,
    sidebarRing: input.primary,
  }
}

export const themePresets: ThemePreset[] = palettes.map((palette) => ({
  id: palette.id,
  name: palette.name,
  family: palette.appearance === 'light' ? 'Light' : 'Dark',
  accent: 'Curated',
  appearance: palette.appearance,
  colors: createColors(palette),
  backgroundImage: `radial-gradient(circle at 18% 5%, ${palette.glow}, transparent 34rem), linear-gradient(145deg, ${palette.background}, ${palette.card})`,
  backgroundOverlay:
    palette.appearance === 'light'
      ? 'linear-gradient(rgba(255,255,255,.1), rgba(255,255,255,.16))'
      : 'linear-gradient(rgba(0,0,0,.14), rgba(0,0,0,.28))',
  backgroundFilter: 'none',
}))

export const defaultThemePreset = themePresets[0]

const colorEntries: Array<[keyof ThemeColors, string]> = [
  ['background', '--background'],
  ['foreground', '--foreground'],
  ['card', '--card'],
  ['cardForeground', '--card-foreground'],
  ['elevated', '--elevated'],
  ['secondarySurface', '--secondary-surface'],
  ['popover', '--popover'],
  ['popoverForeground', '--popover-foreground'],
  ['header', '--header'],
  ['primary', '--primary'],
  ['primaryForeground', '--primary-foreground'],
  ['secondary', '--secondary'],
  ['secondaryForeground', '--secondary-foreground'],
  ['muted', '--muted'],
  ['mutedForeground', '--muted-foreground'],
  ['subtleForeground', '--subtle-foreground'],
  ['accent', '--accent'],
  ['accentForeground', '--accent-foreground'],
  ['destructive', '--destructive'],
  ['border', '--border'],
  ['input', '--input'],
  ['inputBorder', '--input-border'],
  ['hover', '--hover'],
  ['selected', '--selected'],
  ['ring', '--ring'],
  ['success', '--success'],
  ['warning', '--warning'],
  ['danger', '--danger'],
  ['info', '--info'],
  ['cursorGlow', '--cursor-glow'],
  ['chartGrid', '--chart-grid'],
  ['chartAxis', '--chart-axis'],
  ['chartTooltip', '--chart-tooltip'],
  ['chart1', '--chart-1'],
  ['chart2', '--chart-2'],
  ['chart3', '--chart-3'],
  ['chart4', '--chart-4'],
  ['chart5', '--chart-5'],
  ['tableHeader', '--table-header'],
  ['tableRowHover', '--table-row-hover'],
  ['positiveBackground', '--positive-performance-bg'],
  ['negativeBackground', '--negative-performance-bg'],
  ['neutralBackground', '--neutral-performance-bg'],
  ['skeleton', '--skeleton'],
  ['skeletonHighlight', '--skeleton-highlight'],
  ['scrollbarTrack', '--scrollbar-track'],
  ['scrollbarThumb', '--scrollbar-thumb'],
  ['sidebar', '--sidebar'],
  ['sidebarForeground', '--sidebar-foreground'],
  ['sidebarPrimary', '--sidebar-primary'],
  ['sidebarPrimaryForeground', '--sidebar-primary-foreground'],
  ['sidebarAccent', '--sidebar-accent'],
  ['sidebarAccentForeground', '--sidebar-accent-foreground'],
  ['sidebarBorder', '--sidebar-border'],
  ['sidebarRing', '--sidebar-ring'],
]

const legacyMap: Record<string, string> = {
  'ranked-lime': 'ranked-night',
  'obsidian-blue': 'abyss-blue',
  'midnight-blue': 'abyss-blue',
  'violet-violet': 'void-orchid',
  'paper-mint': 'daybreak',
  'ice-blue': 'cloud-map',
  'ember-orange': 'ember-route',
  'storm-mono': 'signal-black',
}

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
  const migrated = id ? legacyMap[id] ?? id : defaultThemePreset.id
  return themePresets.find((theme) => theme.id === migrated) ?? defaultThemePreset
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
  const legacyColors =
    partial.mode === 'custom' && partial.colors && typeof partial.colors === 'object'
      ? partial.colors
      : {}

  return {
    mode: partial.mode === 'custom' ? 'custom' : 'preset',
    presetId: preset.id,
    colors: { ...preset.colors, ...legacyColors },
    presetBackgroundImage: partial.presetBackgroundImage || preset.backgroundImage,
    presetBackgroundOverlay: partial.presetBackgroundOverlay || preset.backgroundOverlay,
    presetBackgroundFilter: partial.presetBackgroundFilter || preset.backgroundFilter,
    backgroundUrl: typeof partial.backgroundUrl === 'string' ? partial.backgroundUrl : '',
    localBackgroundImage:
      typeof partial.localBackgroundImage === 'string' ? partial.localBackgroundImage : '',
    backgroundFit:
      partial.backgroundFit === 'contain' || partial.backgroundFit === 'max'
        ? partial.backgroundFit
        : 'cover',
  }
}

export function loadThemeSettings(): ThemeSettings {
  if (typeof window === 'undefined') return createDefaultThemeSettings()
  try {
    const stored =
      window.localStorage.getItem(THEME_STORAGE_KEY) ??
      window.localStorage.getItem(LEGACY_THEME_STORAGE_KEY)
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
  for (const [key, cssVar] of colorEntries) root.style.setProperty(cssVar, settings.colors[key])
  const customBackground = settings.localBackgroundImage || settings.backgroundUrl.trim()
  const hasCustomBackground = customBackground.length > 0
  root.style.setProperty(
    '--app-background-image',
    hasCustomBackground ? cssUrl(customBackground) : settings.presetBackgroundImage,
  )
  root.style.setProperty('--app-background-overlay', settings.presetBackgroundOverlay)
  root.style.setProperty(
    '--app-background-filter',
    hasCustomBackground ? 'blur(3px) brightness(0.76)' : settings.presetBackgroundFilter,
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
  root.style.colorScheme = getThemePreset(settings.presetId).appearance
}

export function getThemeBootstrapScript() {
  const customColorMap = Object.fromEntries(colorEntries)
  const presets = Object.fromEntries(
    themePresets.map((theme) => [
      theme.id,
      {
        colors: Object.fromEntries(
          colorEntries.map(([key, variable]) => [variable, theme.colors[key]]),
        ),
        image: theme.backgroundImage,
        overlay: theme.backgroundOverlay,
        appearance: theme.appearance,
      },
    ]),
  )
  return `(function(){try{var p=${JSON.stringify(presets)};var keys=${JSON.stringify(customColorMap)};var raw=localStorage.getItem('${THEME_STORAGE_KEY}')||localStorage.getItem('${LEGACY_THEME_STORAGE_KEY}');var s=raw?JSON.parse(raw):null;var id=s&&s.presetId;var map=${JSON.stringify(legacyMap)};id=map[id]||id;var t=p[id]||p['${defaultThemePreset.id}'];var c=Object.assign({},t.colors);if(s&&s.mode==='custom'&&s.colors){Object.keys(s.colors).forEach(function(k){if(keys[k])c[keys[k]]=s.colors[k]})}var css=':root{';Object.keys(c).forEach(function(k){css+=k+':'+c[k]+';'});css+='--app-background-image:'+t.image+';--app-background-overlay:'+t.overlay+';color-scheme:'+t.appearance+'}';var el=document.createElement('style');el.id='mcsr-theme-bootstrap';el.textContent=css;document.head.appendChild(el)}catch(e){}})();`
}
