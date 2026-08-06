'use client'

import { ReactNode, useEffect } from 'react'
import { applyThemePreset, loadStoredThemePreset } from '@/lib/theme-system'

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    applyThemePreset(loadStoredThemePreset())
  }, [])

  return <>{children}</>
}
