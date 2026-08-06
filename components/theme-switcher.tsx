'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { Check, Palette, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  applyThemePreset,
  defaultThemePreset,
  loadStoredThemePreset,
  saveStoredThemePreset,
  ThemePreset,
  themePresets,
} from '@/lib/theme-system'
import { cn } from '@/lib/utils'

/** Tiny icon box — uses real MC asset with emoji fallback */
function ThemeIcon({ theme, size = 40 }: { theme: ThemePreset; size?: number }) {
  const [imgOk, setImgOk] = useState(true)
  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded border border-border bg-black/30"
      style={{ width: size, height: size }}
    >
      {imgOk ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={theme.iconImg}
          alt={theme.name}
          width={size - 4}
          height={size - 4}
          style={{ imageRendering: 'pixelated', objectFit: 'contain' }}
          onError={() => setImgOk(false)}
        />
      ) : (
        <span style={{ fontSize: size * 0.55 }}>{theme.iconEmoji}</span>
      )}
    </span>
  )
}

export function ThemeSwitcher() {
  const [open, setOpen] = useState(false)
  const [activeTheme, setActiveTheme] = useState<ThemePreset>(defaultThemePreset)

  useEffect(() => {
    const loaded = loadStoredThemePreset()
    setActiveTheme(loaded)
    applyThemePreset(loaded)
  }, [])

  useEffect(() => {
    if (!open) return
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [open])

  function handleSelectTheme(preset: ThemePreset) {
    setActiveTheme(preset)
    saveStoredThemePreset(preset)
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
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/85 px-2 py-4 sm:px-4">
          <div className="pixel-panel flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-md border border-primary/50 bg-card shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 border-b border-border p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-primary bg-primary/15 text-xl text-primary">
                  🎨
                </span>
                <div>
                  <h2 className="font-heading text-lg font-bold text-foreground sm:text-xl">
                    Minecraft Themes
                  </h2>
                  <p className="font-sans text-xs text-muted-foreground">
                    Dimensions, ores, and more.
                  </p>
                </div>
              </div>
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

            {/* Grid of Presets */}
            <div className="grid min-h-0 flex-1 overflow-y-auto gap-3 p-4 sm:grid-cols-2">
              {themePresets.map((theme) => {
                const isSelected = activeTheme.id === theme.id

                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => handleSelectTheme(theme)}
                    className={cn(
                      'flex items-start gap-3.5 rounded border p-3.5 text-left transition-all',
                      isSelected
                        ? 'border-primary bg-primary/15 ring-2 ring-primary/40'
                        : 'border-border bg-muted/40 hover:border-primary/60 hover:bg-muted/80',
                    )}
                  >
                    <ThemeIcon theme={theme} size={44} />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-heading text-sm font-bold text-foreground truncate">
                          {theme.name}
                        </span>
                        {/* Colour dot */}
                        <span
                          className="h-4 w-4 shrink-0 rounded-full border border-black/40"
                          style={{
                            backgroundColor: theme.primary,
                            boxShadow: `0 0 6px 1px ${theme.primary}88`,
                          }}
                        />
                      </div>
                      <p className="mt-1 font-sans text-xs text-muted-foreground truncate">
                        {theme.subtitle}
                      </p>
                      {isSelected && (
                        <span className="mt-2 inline-flex items-center gap-1 font-heading text-xs font-bold text-primary">
                          <Check className="h-3.5 w-3.5" /> Active Theme
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-border p-3 bg-muted/30">
              <span className="font-sans text-xs text-muted-foreground">
                Persisted automatically to your browser.
              </span>
              <Button type="button" variant="default" size="sm" onClick={() => setOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
