'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { SkinViewer } from 'skinview3d'
import { getPlayerSkinUrl } from '@/lib/player-avatar'
import { cn } from '@/lib/utils'
import { UserSkin } from '@/components/user-skin'

interface UserSkinViewerProps {
  uuid?: string | null
  username?: string | null
  className?: string
  fallbackClassName?: string
  priority?: boolean
}

export function UserSkinViewer({
  uuid,
  username,
  className,
  fallbackClassName,
  priority,
}: UserSkinViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<SkinViewer | null>(null)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)

  const skinUrl = useMemo(() => getPlayerSkinUrl(uuid, username), [uuid, username])

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    let disposed = false
    let resizeObserver: ResizeObserver | null = null

    setReady(false)
    setFailed(false)

    if (!canvas || !container || !skinUrl) {
      setFailed(true)
      return undefined
    }

    const activeCanvas = canvas
    const activeContainer = container
    const activeSkinUrl = skinUrl
    let activeViewer: SkinViewer | null = null

    async function loadViewer() {
      try {
        const skinview3d = await import('skinview3d')

        if (disposed) return

        const rect = activeContainer.getBoundingClientRect()
        const width = Math.max(1, Math.round(rect.width || 256))
        const height = Math.max(1, Math.round(rect.height || 288))

        const viewer = new skinview3d.SkinViewer({
          canvas: activeCanvas,
          width,
          height,
          enableControls: true,
          fov: 38,
          zoom: 0.88,
        })

        activeViewer = viewer
        viewerRef.current = viewer
        viewer.autoRotate = true
        viewer.autoRotateSpeed = 0.45
        viewer.controls.enablePan = false
        viewer.controls.enableZoom = false
        viewer.controls.rotateSpeed = 0.55

        const animation = new skinview3d.WalkingAnimation()
        animation.speed = 0.55
        animation.headBobbing = false
        viewer.animation = animation

        resizeObserver = new ResizeObserver(([entry]) => {
          if (!entry || disposed || viewer.disposed) return

          const nextWidth = Math.max(1, Math.round(entry.contentRect.width))
          const nextHeight = Math.max(1, Math.round(entry.contentRect.height))
          viewer.setSize(nextWidth, nextHeight)
        })
        resizeObserver.observe(activeContainer)

        await viewer.loadSkin(activeSkinUrl, { model: 'auto-detect' })

        if (!disposed) {
          setReady(true)
        }
      } catch (error) {
        console.error('Failed to load 3D player skin:', error)
        activeViewer?.dispose()
        if (viewerRef.current === activeViewer) {
          viewerRef.current = null
        }

        if (!disposed) {
          setFailed(true)
        }
      }
    }

    loadViewer()

    return () => {
      disposed = true
      resizeObserver?.disconnect()
      activeViewer?.dispose()
      if (viewerRef.current === activeViewer) {
        viewerRef.current = null
      }
    }
  }, [skinUrl])

  return (
    <div ref={containerRef} className={cn('relative h-full w-full', className)}>
      <div
        className={cn(
          'pointer-events-none absolute inset-0 flex items-end justify-center transition-opacity duration-300',
          ready && !failed ? 'opacity-0' : 'opacity-100',
        )}
      >
        <UserSkin
          uuid={uuid}
          username={username}
          size={256}
          priority={priority}
          className={fallbackClassName}
        />
      </div>
      <canvas
        ref={canvasRef}
        aria-label={username ? `${username} 3D skin` : '3D player skin'}
        className={cn(
          'absolute inset-0 h-full w-full touch-none transition-opacity duration-300',
          ready && !failed ? 'opacity-100' : 'opacity-0',
        )}
      />
    </div>
  )
}
