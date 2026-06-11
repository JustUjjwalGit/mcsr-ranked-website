'use client'

import { ReactNode, useEffect } from 'react'
import { applyThemeSettings, loadThemeSettings } from '@/lib/theme-system'

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    applyThemeSettings(loadThemeSettings())
  }, [])

  return <>{children}</>
}
