'use client'

import { useEffect, useRef } from 'react'

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  size: number
}

const MAX_DPR = 2
const LINK_DISTANCE = 170
const POINTER_DISTANCE = 220

export function ParticleNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const coarseQuery = window.matchMedia('(pointer: coarse)')
    const pointer = { x: 0, y: 0, active: false }

    let width = 1
    let height = 1
    let particles: Particle[] = []
    let frameId = 0
    let previousTime = 0
    let running = false
    let particleColor = '#67e8f9'
    let lineColor = '#38bdf8'

    const readColors = () => {
      const styles = getComputedStyle(document.documentElement)
      particleColor = styles.getPropertyValue('--primary').trim() || '#67e8f9'
      lineColor = styles.getPropertyValue('--accent').trim() || particleColor
    }

    const particleCount = () => {
      const areaCount = Math.round((width * height) / 19000)
      if (motionQuery.matches) return Math.min(Math.max(areaCount, 18), 32)
      if (coarseQuery.matches) return Math.min(Math.max(areaCount, 24), 42)
      return Math.min(Math.max(areaCount, 55), 105)
    }

    const makeParticle = (): Particle => {
      const angle = Math.random() * Math.PI * 2
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: Math.cos(angle),
        vy: Math.sin(angle),
        size: 1.2 + Math.random() * 1.4,
      }
    }

    const resize = () => {
      width = Math.max(window.innerWidth, 1)
      height = Math.max(window.innerHeight, 1)
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)

      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      context.setTransform(dpr, 0, 0, dpr, 0, 0)

      const count = particleCount()
      particles = Array.from({ length: count }, (_, index) =>
        particles[index] ?? makeParticle(),
      )
    }

    const draw = (time: number) => {
      if (!running) return

      const delta = previousTime
        ? Math.min((time - previousTime) / 1000, 0.05)
        : 1 / 60
      previousTime = time
      const speed = motionQuery.matches ? 8 : 36

      context.clearRect(0, 0, width, height)

      for (const particle of particles) {
        particle.x += particle.vx * speed * delta
        particle.y += particle.vy * speed * delta

        if (particle.x < 0 || particle.x > width) {
          particle.vx *= -1
          particle.x = Math.min(Math.max(particle.x, 0), width)
        }
        if (particle.y < 0 || particle.y > height) {
          particle.vy *= -1
          particle.y = Math.min(Math.max(particle.y, 0), height)
        }

        if (pointer.active) {
          const dx = particle.x - pointer.x
          const dy = particle.y - pointer.y
          const distance = Math.hypot(dx, dy)
          if (distance > 0 && distance < POINTER_DISTANCE) {
            const force = (1 - distance / POINTER_DISTANCE) * 150 * delta
            particle.x += (dx / distance) * force
            particle.y += (dy / distance) * force
          }
        }

        context.globalAlpha = 0.9
        context.fillStyle = particleColor
        context.beginPath()
        context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        context.fill()
      }

      for (let first = 0; first < particles.length; first += 1) {
        for (let second = first + 1; second < particles.length; second += 1) {
          const a = particles[first]
          const b = particles[second]
          const distance = Math.hypot(a.x - b.x, a.y - b.y)
          if (distance >= LINK_DISTANCE) continue

          context.globalAlpha = (1 - distance / LINK_DISTANCE) * 0.42
          context.strokeStyle = lineColor
          context.lineWidth = 1
          context.beginPath()
          context.moveTo(a.x, a.y)
          context.lineTo(b.x, b.y)
          context.stroke()
        }
      }

      if (pointer.active) {
        for (const particle of particles) {
          const distance = Math.hypot(
            particle.x - pointer.x,
            particle.y - pointer.y,
          )
          if (distance >= POINTER_DISTANCE) continue
          context.globalAlpha = (1 - distance / POINTER_DISTANCE) * 0.75
          context.strokeStyle = particleColor
          context.lineWidth = 1.2
          context.beginPath()
          context.moveTo(pointer.x, pointer.y)
          context.lineTo(particle.x, particle.y)
          context.stroke()
        }

      }

      context.globalAlpha = 1
      frameId = window.requestAnimationFrame(draw)
    }

    const start = () => {
      if (running || document.visibilityState === 'hidden') return
      running = true
      canvas.dataset.animation = 'running'
      previousTime = 0
      frameId = window.requestAnimationFrame(draw)
    }

    const stop = () => {
      running = false
      canvas.dataset.animation = 'paused'
      window.cancelAnimationFrame(frameId)
      frameId = 0
      previousTime = 0
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      pointer.x = event.clientX
      pointer.y = event.clientY
      pointer.active = true
    }
    const clearPointer = () => {
      pointer.active = false
    }
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') stop()
      else start()
    }
    const handleMotionChange = () => {
      resize()
    }

    readColors()
    resize()
    start()

    const themeObserver = new MutationObserver(readColors)
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'style'],
    })
    window.addEventListener('mcsr-theme-change', readColors)
    window.addEventListener('resize', resize, { passive: true })
    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', clearPointer)
    window.addEventListener('blur', clearPointer)
    document.addEventListener('visibilitychange', handleVisibility)
    motionQuery.addEventListener('change', handleMotionChange)
    coarseQuery.addEventListener('change', resize)

    return () => {
      stop()
      themeObserver.disconnect()
      window.removeEventListener('mcsr-theme-change', readColors)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', handlePointerMove)
      document.documentElement.removeEventListener('pointerleave', clearPointer)
      window.removeEventListener('blur', clearPointer)
      document.removeEventListener('visibilitychange', handleVisibility)
      motionQuery.removeEventListener('change', handleMotionChange)
      coarseQuery.removeEventListener('change', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="particle-network"
      data-particle-network="active"
      data-animation="initializing"
      aria-hidden="true"
    />
  )
}
