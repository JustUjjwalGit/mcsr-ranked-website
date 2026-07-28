'use client'

import { useEffect, useRef } from 'react'

export function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const finePointer = window.matchMedia('(pointer: fine)')
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (!finePointer.matches || reducedMotion.matches) return

    const glow = glowRef.current
    if (!glow) return

    let targetX = window.innerWidth / 2
    let targetY = window.innerHeight / 3
    let currentX = targetX
    let currentY = targetY
    let frame = 0
    let visible = !document.hidden

    const render = () => {
      if (!visible) {
        frame = 0
        return
      }
      currentX += (targetX - currentX) * 0.11
      currentY += (targetY - currentY) * 0.11
      glow.style.setProperty('--glow-x', `${currentX}px`)
      glow.style.setProperty('--glow-y', `${currentY}px`)
      frame = window.requestAnimationFrame(render)
    }

    const handlePointer = (event: PointerEvent) => {
      targetX = event.clientX
      targetY = event.clientY
      if (!frame && visible) frame = window.requestAnimationFrame(render)
    }
    const handleVisibility = () => {
      visible = !document.hidden
      glow.dataset.visible = visible ? 'true' : 'false'
      if (visible && !frame) frame = window.requestAnimationFrame(render)
      if (!visible && frame) {
        window.cancelAnimationFrame(frame)
        frame = 0
      }
    }

    glow.dataset.enabled = 'true'
    glow.dataset.visible = 'true'
    window.addEventListener('pointermove', handlePointer, { passive: true })
    document.addEventListener('visibilitychange', handleVisibility)
    frame = window.requestAnimationFrame(render)

    return () => {
      window.removeEventListener('pointermove', handlePointer)
      document.removeEventListener('visibilitychange', handleVisibility)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  return <div ref={glowRef} className="cursor-glow" aria-hidden="true" />
}
