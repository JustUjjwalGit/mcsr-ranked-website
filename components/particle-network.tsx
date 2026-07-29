'use client'

import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
}

interface PointerPosition {
  x: number
  y: number
  active: boolean
}

const MAX_PIXEL_RATIO = 2

function readThemeColors() {
  const styles = getComputedStyle(document.documentElement)
  return {
    particle: styles.getPropertyValue('--primary').trim() || '#35e08d',
    connection: styles.getPropertyValue('--accent').trim() || '#43c7e8',
  }
}

function particleLimit(width: number, height: number, reducedMotion: boolean) {
  const areaCount = Math.round((width * height) / 24_000)
  const mobile = width < 640
  const cores = navigator.hardwareConcurrency || 4
  const capabilityLimit = cores <= 4 ? (mobile ? 24 : 52) : mobile ? 34 : 82
  if (reducedMotion) return Math.min(16, Math.max(8, Math.round(areaCount / 3)))
  return Math.min(capabilityLimit, Math.max(mobile ? 18 : 30, areaCount))
}

export function ParticleNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return

    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const pointer: PointerPosition = { x: 0, y: 0, active: false }
    let particles: Particle[] = []
    let colors = readThemeColors()
    let animationFrame = 0
    let width = 0
    let height = 0
    let pixelRatio = 1
    let reducedMotion = reducedMotionQuery.matches
    let frameCount = 0

    const makeParticle = (): Particle => {
      const angle = Math.random() * Math.PI * 2
      const speed = reducedMotion ? 0 : 0.12 + Math.random() * 0.22
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 1.1 + Math.random() * 1.35,
      }
    }

    const syncParticleCount = () => {
      const target = particleLimit(width, height, reducedMotion)
      if (particles.length > target) particles = particles.slice(0, target)
      while (particles.length < target) particles.push(makeParticle())
      canvas.dataset.particleCount = String(particles.length)
      canvas.dataset.reducedMotion = String(reducedMotion)
    }

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      pixelRatio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO)
      canvas.width = Math.round(width * pixelRatio)
      canvas.height = Math.round(height * pixelRatio)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      syncParticleCount()
    }

    const draw = () => {
      context.clearRect(0, 0, width, height)
      const mobile = width < 640
      const connectionDistance = mobile ? 105 : 145
      const pointerDistance = mobile ? 90 : 130

      for (let index = 0; index < particles.length; index += 1) {
        const particle = particles[index]
        if (!reducedMotion) {
          if (pointer.active) {
            const pointerX = particle.x - pointer.x
            const pointerY = particle.y - pointer.y
            const pointerDistanceSquared = pointerX * pointerX + pointerY * pointerY
            if (pointerDistanceSquared > 0 && pointerDistanceSquared < pointerDistance * pointerDistance) {
              const distance = Math.sqrt(pointerDistanceSquared)
              const strength = (1 - distance / pointerDistance) * 0.018
              particle.vx += (pointerX / distance) * strength
              particle.vy += (pointerY / distance) * strength
            }
          }

          particle.vx *= 0.995
          particle.vy *= 0.995
          const speed = Math.hypot(particle.vx, particle.vy)
          if (speed > 0.55) {
            particle.vx = (particle.vx / speed) * 0.55
            particle.vy = (particle.vy / speed) * 0.55
          }
          particle.x += particle.vx
          particle.y += particle.vy
          if (particle.x < -5) particle.x = width + 5
          if (particle.x > width + 5) particle.x = -5
          if (particle.y < -5) particle.y = height + 5
          if (particle.y > height + 5) particle.y = -5
        }

        for (let otherIndex = index + 1; otherIndex < particles.length; otherIndex += 1) {
          const other = particles[otherIndex]
          const deltaX = particle.x - other.x
          const deltaY = particle.y - other.y
          const distance = Math.hypot(deltaX, deltaY)
          if (distance >= connectionDistance) continue
          context.globalAlpha = (1 - distance / connectionDistance) * (mobile ? 0.13 : 0.18)
          context.strokeStyle = colors.connection
          context.lineWidth = 0.8
          context.beginPath()
          context.moveTo(particle.x, particle.y)
          context.lineTo(other.x, other.y)
          context.stroke()
        }

        context.globalAlpha = mobile ? 0.48 : 0.58
        context.fillStyle = colors.particle
        context.beginPath()
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
        context.fill()
      }
      context.globalAlpha = 1
    }

    const animate = () => {
      draw()
      frameCount += 1
      if (frameCount % 60 === 0) {
        const nextRatio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO)
        if (nextRatio !== pixelRatio) resize()
      }
      animationFrame = window.requestAnimationFrame(animate)
    }

    const start = () => {
      window.cancelAnimationFrame(animationFrame)
      if (reducedMotion) {
        draw()
        return
      }
      animationFrame = window.requestAnimationFrame(animate)
    }

    const handlePointerMove = (event: PointerEvent) => {
      pointer.x = event.clientX
      pointer.y = event.clientY
      pointer.active = event.pointerType !== 'touch'
      canvas.dataset.pointerActive = String(pointer.active)
    }
    const handlePointerLeave = () => {
      pointer.active = false
      canvas.dataset.pointerActive = 'false'
    }
    const handleVisibility = () => {
      if (document.hidden) {
        window.cancelAnimationFrame(animationFrame)
      } else {
        start()
      }
    }
    const handleMotionPreference = () => {
      reducedMotion = reducedMotionQuery.matches
      syncParticleCount()
      start()
    }
    const handleThemeChange = () => {
      colors = readThemeColors()
      if (reducedMotion) draw()
    }

    const themeObserver = new MutationObserver(handleThemeChange)
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'style'],
    })
    window.addEventListener('resize', resize, { passive: true })
    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    window.addEventListener('pointerleave', handlePointerLeave)
    window.addEventListener('blur', handlePointerLeave)
    document.addEventListener('visibilitychange', handleVisibility)
    reducedMotionQuery.addEventListener('change', handleMotionPreference)

    resize()
    start()

    return () => {
      window.cancelAnimationFrame(animationFrame)
      themeObserver.disconnect()
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerleave', handlePointerLeave)
      window.removeEventListener('blur', handlePointerLeave)
      document.removeEventListener('visibilitychange', handleVisibility)
      reducedMotionQuery.removeEventListener('change', handleMotionPreference)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0"
      aria-hidden="true"
      data-particle-network
      data-pointer-active="false"
    />
  )
}
