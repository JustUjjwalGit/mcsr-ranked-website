'use client'

import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import {
  Check,
  CircleAlert,
  ImageIcon,
  Palette,
  RotateCcw,
  Search,
  Upload,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  applyThemeSettings,
  BackgroundFit,
  createDefaultThemeSettings,
  getThemePreset,
  loadThemeSettings,
  saveThemeSettings,
  settingsFromPreset,
  ThemeColors,
  ThemeSettings,
  themePresets,
} from '@/lib/theme-system'
import { cn } from '@/lib/utils'

const colorControls: Array<{
  key: keyof ThemeColors
  label: string
}> = [
  { key: 'background', label: 'Background' },
  { key: 'foreground', label: 'Text' },
  { key: 'card', label: 'Cards' },
  { key: 'primary', label: 'Primary' },
  { key: 'primaryForeground', label: 'Primary Text' },
  { key: 'muted', label: 'Muted' },
  { key: 'mutedForeground', label: 'Muted Text' },
  { key: 'border', label: 'Border' },
  { key: 'input', label: 'Input' },
  { key: 'destructive', label: 'Danger' },
]

const fitOptions: Array<{
  value: BackgroundFit
  label: string
}> = [
  { value: 'cover', label: 'Cover' },
  { value: 'contain', label: 'Contain' },
  { value: 'max', label: 'Max' },
]

function updateSettings(next: ThemeSettings) {
  applyThemeSettings(next)
  const saved = saveThemeSettings(next)
  window.dispatchEvent(new CustomEvent('mcsr-theme-change', { detail: next }))
  return saved
}

function getFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export function ThemeSwitcher() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [storageError, setStorageError] = useState('')
  const [settings, setSettings] = useState<ThemeSettings>(() =>
    createDefaultThemeSettings(),
  )
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setSettings(loadThemeSettings())

    function syncTheme(event: Event) {
      const detail = (event as CustomEvent<ThemeSettings>).detail
      if (detail) setSettings(detail)
    }

    window.addEventListener('mcsr-theme-change', syncTheme)
    return () => window.removeEventListener('mcsr-theme-change', syncTheme)
  }, [])

  useEffect(() => {
    if (!open) return

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [open])

  const filteredThemes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return themePresets

    return themePresets.filter((theme) =>
      `${theme.name} ${theme.family} ${theme.accent}`
        .toLowerCase()
        .includes(normalizedQuery),
    )
  }, [query])

  function applyPreset(presetId: string) {
    const next = settingsFromPreset(getThemePreset(presetId), settings)
    setSettings(next)
    setStorageError('')
    updateSettings(next)
  }

  function updateCustomColor(key: keyof ThemeColors, value: string) {
    const next: ThemeSettings = {
      ...settings,
      mode: 'custom',
      colors: {
        ...settings.colors,
        [key]: value,
      },
    }
    setSettings(next)
    setStorageError('')
    updateSettings(next)
  }

  function updateBackground(partial: Partial<ThemeSettings>) {
    const next: ThemeSettings = {
      ...settings,
      ...partial,
    }
    setSettings(next)
    const saved = updateSettings(next)
    setStorageError(
      saved
        ? ''
        : 'This image is too large for browser storage. Try a smaller local file or use an image URL.',
    )
  }

  async function handleLocalImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const localBackgroundImage = await getFileAsDataUrl(file)
      updateBackground({ localBackgroundImage })
    } catch {
      updateBackground({ localBackgroundImage: '' })
    } finally {
      event.target.value = ''
    }
  }

  function resetTheme() {
    const next = createDefaultThemeSettings()
    setSettings(next)
    setStorageError('')
    updateSettings(next)
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        aria-label="Open theme switcher"
      >
        <Palette className="h-4 w-4" />
        <span className="hidden lg:inline">Theme</span>
      </Button>

      {open && (
        <div className="fixed inset-0 z-[90] bg-black/70 px-2 py-2 backdrop-blur-sm sm:px-4 sm:py-6">
          <div className="mx-auto flex max-h-[calc(100dvh-1rem)] max-w-6xl flex-col overflow-hidden rounded border border-primary/40 bg-card shadow-2xl shadow-black/60 sm:max-h-[calc(100dvh-3rem)]">
            <div className="flex items-center justify-between gap-3 border-b border-border p-3 sm:gap-4 sm:p-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-primary bg-primary/15 text-primary">
                  <Palette className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-foreground sm:text-xl">
                    Theme
                  </h2>
                  <p className="truncate text-sm text-muted-foreground">
                    Pick a preset or build a custom look.
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={resetTheme}>
                  <RotateCcw className="h-4 w-4" />
                  <span className="hidden sm:inline">Reset</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setOpen(false)}
                  aria-label="Close theme switcher"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto lg:grid lg:overflow-hidden lg:grid-cols-[minmax(0,1.2fr)_24rem]">
              <section className="border-b border-border p-3 sm:p-4 lg:min-h-0 lg:overflow-y-auto lg:border-b-0 lg:border-r">
                <div className="sticky top-0 z-10 bg-card pb-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search 100 presets..."
                      className="h-10 w-full rounded border border-border bg-input pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredThemes.map((theme) => {
                    const selected =
                      settings.mode === 'preset' && settings.presetId === theme.id

                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => applyPreset(theme.id)}
                        className={cn(
                          'rounded border p-3 text-left transition hover:border-primary',
                          selected
                            ? 'border-primary bg-primary/10'
                            : 'border-border bg-muted/30',
                        )}
                      >
                        <div
                          className="h-12 rounded border border-border"
                          style={{ background: theme.backgroundImage }}
                        />
                        <div className="mt-3 flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {theme.name}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {theme.family} / {theme.accent}
                            </p>
                          </div>
                          <span
                            className="mt-1 h-4 w-4 shrink-0 rounded-full border border-border"
                            style={{ backgroundColor: theme.colors.primary }}
                          />
                        </div>
                        {selected && (
                          <div className="mt-2 flex items-center gap-1 text-xs font-medium text-primary">
                            <Check className="h-3.5 w-3.5" />
                            Active
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </section>

              <aside className="p-3 sm:p-4 lg:min-h-0 lg:overflow-y-auto">
                <div className="space-y-5">
                  <div>
                    <h3 className="text-sm font-semibold uppercase text-muted-foreground">
                      Custom Colors
                    </h3>
                    <div className="mt-3 grid gap-3">
                      {colorControls.map((control) => (
                        <label
                          key={control.key}
                          className="grid grid-cols-[minmax(0,1fr)_2.75rem_minmax(5.5rem,6rem)] items-center gap-2 text-sm"
                        >
                          <span className="truncate text-muted-foreground">
                            {control.label}
                          </span>
                          <input
                            type="color"
                            value={settings.colors[control.key]}
                            onChange={(event) =>
                              updateCustomColor(control.key, event.target.value)
                            }
                            className="h-9 w-11 cursor-pointer rounded border border-border bg-input p-1"
                          />
                          <input
                            value={settings.colors[control.key]}
                            onChange={(event) =>
                              updateCustomColor(control.key, event.target.value)
                            }
                            className="h-9 rounded border border-border bg-input px-2 font-mono text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-border pt-5">
                    <div className="mb-3 flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-semibold uppercase text-muted-foreground">
                        Custom Background
                      </h3>
                    </div>

                    <div className="space-y-3">
                      {storageError && (
                        <div className="flex gap-2 rounded border border-destructive/40 bg-destructive/10 p-3 text-xs leading-5 text-destructive">
                          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                          <span>{storageError}</span>
                        </div>
                      )}

                      <label className="block text-sm">
                        <span className="mb-1 block text-muted-foreground">
                          Image URL
                        </span>
                        <input
                          value={settings.backgroundUrl}
                          onChange={(event) =>
                            updateBackground({ backgroundUrl: event.target.value })
                          }
                          placeholder="https://example.com/background.png"
                          className="h-10 w-full rounded border border-border bg-input px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </label>

                      <div className="grid grid-cols-3 gap-2">
                        {fitOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() =>
                              updateBackground({ backgroundFit: option.value })
                            }
                            className={cn(
                              'h-9 rounded border text-sm font-medium transition',
                              settings.backgroundFit === option.value
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground',
                            )}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLocalImage}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-4 w-4" />
                        Choose Local Image
                      </Button>

                      {settings.localBackgroundImage && (
                        <Button
                          type="button"
                          variant="destructive"
                          className="w-full"
                          onClick={() =>
                            updateBackground({ localBackgroundImage: '' })
                          }
                        >
                          Remove Local Image
                        </Button>
                      )}

                      <p className="rounded border border-border bg-muted/30 p-3 text-xs leading-5 text-muted-foreground">
                        Local image takes priority over URL and stays only in this
                        browser&apos;s local storage.
                      </p>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
