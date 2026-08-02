'use client'

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

interface InfoTipProps {
  label: string
  children: ReactNode
  className?: string
  triggerText?: string
  showIcon?: boolean
}

const TOOLTIP_WIDTH = 288
const VIEWPORT_GAP = 10
const TRIGGER_GAP = 8

export function InfoTip({
  label,
  children,
  className,
  triggerText,
  showIcon = true,
}: InfoTipProps) {
  const id = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ left: 0, top: 0 })

  function cancelClose() {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }

  function closeSoon() {
    cancelClose()
    closeTimerRef.current = setTimeout(() => setOpen(false), 220)
  }

  useEffect(() => {
    if (!open) return

    function updatePosition() {
      const trigger = triggerRef.current
      const tooltip = tooltipRef.current
      if (!trigger) return

      const triggerRect = trigger.getBoundingClientRect()
      const tooltipHeight = tooltip?.offsetHeight ?? 96
      const left = Math.min(
        Math.max(
          triggerRect.left + triggerRect.width / 2 - TOOLTIP_WIDTH / 2,
          VIEWPORT_GAP,
        ),
        window.innerWidth - TOOLTIP_WIDTH - VIEWPORT_GAP,
      )
      const roomBelow = window.innerHeight - triggerRect.bottom
      const top =
        roomBelow >= tooltipHeight + TRIGGER_GAP + VIEWPORT_GAP
          ? triggerRect.bottom + TRIGGER_GAP
          : Math.max(VIEWPORT_GAP, triggerRect.top - tooltipHeight - TRIGGER_GAP)

      setPosition({ left, top })
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node
      if (
        !triggerRef.current?.contains(target) &&
        !tooltipRef.current?.contains(target)
      ) {
        setOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  useEffect(
    () => () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    },
    [],
  )

  return (
    <span className={cn('inline-flex align-middle', className)}>
      <button
        ref={triggerRef}
        type="button"
        className="info-tip-trigger"
        data-has-text={triggerText ? 'true' : 'false'}
        aria-label={`More information about ${label}`}
        aria-describedby={open ? id : undefined}
        aria-controls={open ? id : undefined}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        onMouseEnter={() => {
          cancelClose()
          setOpen(true)
        }}
        onMouseLeave={closeSoon}
        onFocus={(event) => {
          cancelClose()
          if (event.currentTarget.matches(':focus-visible')) {
            setOpen(true)
          }
        }}
        onBlur={(event) => {
          if (!tooltipRef.current?.contains(event.relatedTarget as Node | null)) {
            closeSoon()
          }
        }}
      >
        {triggerText && <span>{triggerText}</span>}
        {showIcon && (
          <span aria-hidden="true" className="info-tip-badge">
            i
          </span>
        )}
      </button>
      {open &&
        createPortal(
          <div
            ref={tooltipRef}
            id={id}
            role="tooltip"
            tabIndex={-1}
            className="info-tip-popup"
            style={{ left: position.left, top: position.top }}
            onPointerEnter={cancelClose}
            onPointerLeave={closeSoon}
          >
            {children}
          </div>,
          document.body,
        )}
    </span>
  )
}
