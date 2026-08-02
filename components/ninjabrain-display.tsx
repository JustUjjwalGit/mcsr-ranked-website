'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  Check,
  ChevronRight,
  CircleAlert,
  Crosshair,
  ExternalLink,
  Eye,
  EyeOff,
  Fullscreen,
  Info,
  MapPin,
  Maximize2,
  Monitor,
  Navigation,
  PlugZap,
  Radio,
  Redo2,
  RotateCw,
  ShieldCheck,
  ShipWheel,
  Unplug,
  Undo2,
  Wifi,
  X,
  Zap,
} from 'lucide-react'
import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import {
  demoNinjabrainSnapshot,
  emptyNinjabrainSnapshot,
  getNinjabrainDisplayMode,
  getPredictionCoordinates,
  normalizeNinjabrainAddress,
  stripNinjabrainHtml,
  type AdvancementPosition,
  type AllAdvancementsData,
  type BlindData,
  type DivineData,
  type InformationMessage,
  type NinjabrainDisplayMode,
  type NinjabrainSnapshot,
  type StrongholdData,
} from '@/lib/ninjabrain'
import { cn } from '@/lib/utils'

type ConnectionStatus = 'idle' | 'connecting' | 'live' | 'demo' | 'error'
type SnapshotKey = keyof NinjabrainSnapshot

const endpointMap: Array<[SnapshotKey, string]> = [
  ['stronghold', 'stronghold'],
  ['blind', 'blind'],
  ['divine', 'divine'],
  ['boat', 'boat'],
  ['informationMessages', 'information-messages'],
  ['allAdvancements', 'all-advancements'],
]

const modeLabels: Record<NinjabrainDisplayMode, string> = {
  stronghold: 'Stronghold',
  blind: 'Blind travel',
  divine: 'Divine travel',
  'all-advancements': 'All advancements',
}

function localRequestInit(baseUrl: string) {
  const hostname = new URL(baseUrl).hostname
  const loopback = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]'
  return {
    cache: 'no-store',
    mode: 'cors',
    targetAddressSpace: loopback ? 'loopback' : 'local',
  } as RequestInit
}

function percent(value: number | undefined, decimals = 1) {
  return `${((value ?? 0) * 100).toFixed(decimals)}%`
}

function coordinate(value: number | undefined, decimals = 0) {
  if (value == null || Number.isNaN(value)) return '—'
  return value.toFixed(decimals)
}

function normalizeAngle(value: number) {
  let normalized = value % 360
  if (normalized > 180) normalized -= 360
  if (normalized <= -180) normalized += 360
  return normalized
}

function travelDirection(
  playerPosition: StrongholdData['playerPosition'],
  overworldX: number,
  overworldZ: number,
) {
  if (
    playerPosition.xInOverworld == null ||
    playerPosition.zInOverworld == null
  ) {
    return { angle: null, difference: null }
  }

  const xDifference = overworldX - playerPosition.xInOverworld
  const zDifference = overworldZ - playerPosition.zInOverworld
  const angle = normalizeAngle(Math.atan2(-xDifference, zDifference) * (180 / Math.PI))
  const difference =
    playerPosition.horizontalAngle == null
      ? null
      : normalizeAngle(angle - playerPosition.horizontalAngle)
  return { angle, difference }
}

function signedAngle(value: number | null) {
  if (value == null) return '—'
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}°`
}

function StatusPill({ status }: { status: ConnectionStatus }) {
  const live = status === 'live'
  const demo = status === 'demo'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.16em]',
        live && 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
        demo && 'border-amber-400/30 bg-amber-400/10 text-amber-200',
        !live && !demo && 'border-white/10 bg-white/5 text-muted-foreground',
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', live ? 'animate-pulse bg-emerald-300' : demo ? 'bg-amber-300' : 'bg-muted-foreground')} />
      {live ? 'Local live' : demo ? 'Demo feed' : 'Offline'}
    </span>
  )
}

function BoatPill({ snapshot }: { snapshot: NinjabrainSnapshot }) {
  const { boatAngle, boatState } = snapshot.boat
  const stateClass = {
    VALID: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300',
    MEASURING: 'border-sky-400/25 bg-sky-400/10 text-sky-300',
    ERROR: 'border-rose-400/25 bg-rose-400/10 text-rose-300',
  }[boatState] ?? 'border-white/10 bg-white/5 text-muted-foreground'

  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase', stateClass)}>
      <ShipWheel className="h-3 w-3" />
      {boatState === 'NONE' ? 'Boat off' : boatState.toLowerCase()}
      {boatAngle != null ? ` · ${boatAngle.toFixed(3)}°` : ''}
    </span>
  )
}

function MessageStrip({ messages }: { messages: InformationMessage[] }) {
  if (messages.length === 0) return null
  return (
    <div className="space-y-2 border-t border-white/10 bg-black/25 p-3 sm:p-4">
      {messages.map((message, index) => {
        const isError = message.severity === 'ERROR'
        const isWarning = message.severity === 'WARNING'
        const Icon = isError || isWarning ? AlertTriangle : Info
        return (
          <div
            key={`${message.type}-${index}`}
            className={cn(
              'flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-xs leading-5',
              isError && 'border-rose-400/25 bg-rose-400/10 text-rose-100',
              isWarning && 'border-amber-400/25 bg-amber-400/10 text-amber-100',
              !isError && !isWarning && 'border-sky-400/20 bg-sky-400/8 text-sky-100',
            )}
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{stripNinjabrainHtml(message.message)}</span>
          </div>
        )
      })}
    </div>
  )
}

function EmptyStronghold({ failed }: { failed: boolean }) {
  return (
    <div className="flex min-h-[28rem] flex-col items-center justify-center px-6 py-14 text-center">
      <div className={cn('flex h-16 w-16 items-center justify-center rounded-2xl border', failed ? 'border-rose-400/30 bg-rose-400/10 text-rose-300' : 'border-primary/30 bg-primary/10 text-primary')}>
        {failed ? <CircleAlert className="h-7 w-7" /> : <Eye className="h-7 w-7" />}
      </div>
      <p className="mt-5 font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground">
        {failed ? 'Calculation failed' : 'Ready for a throw'}
      </p>
      <h2 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">
        {failed ? 'Check the latest measurement' : 'Waiting for Ninjabrain Bot'}
      </h2>
      <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
        {failed
          ? 'Adjust or repeat the eye measurement on the PC. This display will update immediately.'
          : 'Copy an eye throw in Minecraft. The prediction will appear here without touching the phone.'}
      </p>
    </div>
  )
}

function StrongholdView({ data }: { data: StrongholdData }) {
  const top = data.predictions[0]
  if (!top) return <EmptyStronghold failed={data.resultType === 'FAILED'} />
  const target = getPredictionCoordinates(top)
  const latestThrow = data.eyeThrows[data.eyeThrows.length - 1]

  return (
    <div className="grid min-h-[28rem] lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
      <section className="relative overflow-hidden border-b border-white/10 p-5 sm:p-7 lg:border-b-0 lg:border-r">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="relative">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-300">
              <Navigation className="h-3.5 w-3.5" /> Best portal target
            </span>
            <span className="rounded-md border border-white/10 bg-black/25 px-2 py-1 font-mono text-[10px] text-muted-foreground">
              {data.eyeThrows.length} throw{data.eyeThrows.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="mt-7">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Nether coordinates</p>
            <p className="mt-1 break-words font-mono text-[clamp(2.5rem,10vw,5.4rem)] font-black leading-none tracking-[-0.08em] text-foreground tabular-nums">
              {target.netherX}, {target.netherZ}
            </p>
            <p className="mt-4 flex items-center gap-2 font-mono text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 text-primary" /> OW {target.overworldX}, {target.overworldZ}
            </p>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/8 p-3.5">
              <p className="text-[10px] uppercase tracking-[0.15em] text-emerald-200/70">Certainty</p>
              <p className="mt-1 font-mono text-2xl font-bold text-emerald-300 tabular-nums">{percent(top.certainty)}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3.5">
              <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">OW distance</p>
              <p className="mt-1 font-mono text-2xl font-bold text-foreground tabular-nums">{Math.round(top.overworldDistance)}<span className="ml-1 text-xs font-normal text-muted-foreground">b</span></p>
            </div>
            <div className="col-span-2 rounded-xl border border-white/10 bg-white/5 p-3.5 sm:col-span-1">
              <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Latest error</p>
              <p className={cn('mt-1 font-mono text-2xl font-bold tabular-nums', Math.abs(latestThrow?.error ?? 0) < 0.05 ? 'text-sky-300' : 'text-amber-300')}>
                {latestThrow ? `${latestThrow.error >= 0 ? '+' : ''}${latestThrow.error.toFixed(3)}°` : '—'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">Offset confidence</p>
            <h3 className="mt-1 font-semibold text-foreground">Stronghold predictions</h3>
          </div>
          <Crosshair className="h-5 w-5 text-primary" />
        </div>
        <div className="mt-4 space-y-2">
          {data.predictions.map((prediction, index) => {
            const coords = getPredictionCoordinates(prediction)
            return (
              <div key={`${prediction.chunkX}-${prediction.chunkZ}`} className={cn('rounded-lg border p-3', index === 0 ? 'border-emerald-400/25 bg-emerald-400/8' : 'border-white/8 bg-black/15')}>
                <div className="flex items-center gap-3">
                  <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-md font-mono text-xs font-bold', index === 0 ? 'bg-emerald-300 text-emerald-950' : 'bg-white/7 text-muted-foreground')}>
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-mono text-sm font-semibold text-foreground tabular-nums">{coords.netherX}, {coords.netherZ}</span>
                      <span className={cn('font-mono text-sm font-bold tabular-nums', index === 0 ? 'text-emerald-300' : 'text-muted-foreground')}>{percent(prediction.certainty)}</span>
                    </div>
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/7">
                      <div className={cn('h-full rounded-full', index === 0 ? 'bg-emerald-300' : 'bg-primary/60')} style={{ width: `${Math.max(prediction.certainty * 100, 0.5)}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function BlindView({ data }: { data: BlindData }) {
  const result = data.blindResult
  if (result.xInNether == null || result.zInNether == null) {
    return (
      <div className="flex min-h-[28rem] flex-col items-center justify-center p-8 text-center">
        <Navigation className="h-10 w-10 text-primary" />
        <h2 className="mt-4 text-2xl font-bold">Waiting for blind coordinates</h2>
        <p className="mt-2 text-sm text-muted-foreground">Use F3+C in the Nether and the evaluation will appear here.</p>
      </div>
    )
  }
  const evaluation = (result.evaluation ?? 'UNKNOWN').replaceAll('_', ' ')
  const good = ['EXCELLENT', 'HIGHROLL_GOOD'].includes(result.evaluation ?? '')

  return (
    <div className="relative min-h-[28rem] overflow-hidden p-5 sm:p-8">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/15 shadow-[0_0_100px_rgba(99,102,241,0.16)]" />
      <div className="relative mx-auto max-w-4xl">
        <div className="text-center">
          <p className={cn('font-mono text-xs font-semibold uppercase tracking-[0.23em]', good ? 'text-emerald-300' : 'text-amber-300')}>{evaluation}</p>
          <p className="mt-5 text-xs uppercase tracking-[0.18em] text-muted-foreground">Blind at Nether</p>
          <p className="mt-1 font-mono text-[clamp(3.2rem,14vw,6.5rem)] font-black leading-none tracking-[-0.08em] text-foreground tabular-nums">
            {coordinate(result.xInNether, 0)}, {coordinate(result.zInNether, 0)}
          </p>
        </div>

        <div className="mt-9 grid gap-3 sm:grid-cols-3">
          <div className={cn('rounded-xl border p-4 text-center', good ? 'border-emerald-400/25 bg-emerald-400/8' : 'border-amber-400/25 bg-amber-400/8')}>
            <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Chance under {Math.round(result.highrollThreshold ?? 400)}b</p>
            <p className={cn('mt-2 font-mono text-3xl font-bold', good ? 'text-emerald-300' : 'text-amber-300')}>{percent(result.highrollProbability)}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
            <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Improve by</p>
            <p className="mt-2 font-mono text-3xl font-bold text-foreground">{coordinate(result.improveDistance, 1)}<span className="ml-1 text-sm text-muted-foreground">b</span></p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
            <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Direction</p>
            <p className="mt-2 font-mono text-3xl font-bold text-primary">{coordinate((result.improveDirection ?? 0) * (180 / Math.PI), 1)}°</p>
          </div>
        </div>
        {data.hasDivine && <p className="mt-5 text-center text-xs text-sky-300">Divine information is included in this calculation.</p>}
      </div>
    </div>
  )
}

function DivineView({ data }: { data: DivineData }) {
  const result = data.divineResult
  if (!result.formattedSafeCoords && !result.formattedHighrollCoords) {
    return (
      <div className="flex min-h-[28rem] flex-col items-center justify-center p-8 text-center">
        <Zap className="h-10 w-10 text-amber-300" />
        <h2 className="mt-4 text-2xl font-bold">Waiting for a fossil</h2>
        <p className="mt-2 text-sm text-muted-foreground">The divine coordinates will appear after Ninjabrain receives the fossil input.</p>
      </div>
    )
  }
  return (
    <div className="min-h-[28rem] p-5 sm:p-8">
      <div className="mx-auto max-w-4xl text-center">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-amber-300/25 bg-amber-300/10 text-amber-300"><Zap className="h-6 w-6" /></span>
        <p className="mt-4 font-mono text-xs uppercase tracking-[0.23em] text-amber-300">Divine travel</p>
        <h2 className="mt-2 text-3xl font-bold">Choose your coordinates</h2>
        <div className="mt-7 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/8 p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">Safe</p>
            <p className="mt-4 whitespace-pre-wrap font-mono text-xl font-bold leading-9 text-foreground sm:text-2xl">{result.formattedSafeCoords ?? '—'}</p>
          </div>
          <div className="rounded-2xl border border-amber-400/25 bg-amber-400/8 p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">Highroll</p>
            <p className="mt-4 whitespace-pre-wrap font-mono text-xl font-bold leading-9 text-foreground sm:text-2xl">{result.formattedHighrollCoords ?? '—'}</p>
          </div>
        </div>
        {result.fossilXCoordinate != null && <p className="mt-5 font-mono text-xs text-muted-foreground">Fossil X: {result.fossilXCoordinate}</p>}
      </div>
    </div>
  )
}

function AdvancementCard({ label, value }: { label: string; value: AdvancementPosition }) {
  const saved = value.xInOverworld != null && value.zInOverworld != null
  return (
    <div className={cn('rounded-xl border p-4', saved ? 'border-primary/20 bg-primary/7' : 'border-white/8 bg-white/3')}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
        {saved ? <Check className="h-4 w-4 text-emerald-300" /> : <span className="font-mono text-[10px] text-muted-foreground">EMPTY</span>}
      </div>
      <p className="mt-3 font-mono text-xl font-bold text-foreground">{saved ? `${value.xInOverworld}, ${value.zInOverworld}` : '—'}</p>
      {saved && <p className="mt-1 font-mono text-xs text-muted-foreground">{Math.round(value.overworldDistance ?? 0)}b · {coordinate(value.travelAngle, 1)}°</p>}
    </div>
  )
}

function AllAdvancementsView({ data }: { data: AllAdvancementsData }) {
  const positions: Array<[string, AdvancementPosition]> = [
    ['Spawn / shulker', data.spawn],
    ['Monument', data.monument],
    ['Stronghold', data.stronghold],
    ['Outpost', data.outpost],
    ['Deep dark', data.deepDark],
    ['City query', data.cityQuery],
    ['Shulker transport', data.shulkerTransport],
    ['General location', data.generalLocation],
  ]
  return (
    <div className="min-h-[28rem] p-5 sm:p-7">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Route memory</p>
          <h2 className="mt-1 text-2xl font-bold">All advancements locations</h2>
        </div>
        <MapPin className="h-6 w-6 text-primary" />
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {positions.map(([label, value]) => <AdvancementCard key={label} label={label} value={value} />)}
      </div>
    </div>
  )
}

function StandStrongholdView({ data }: { data: StrongholdData }) {
  const [dimension, setDimension] = useState<'nether' | 'overworld'>('nether')
  const [throwOffset, setThrowOffset] = useState(0)
  const top = data.predictions[0]
  if (!top) return <EmptyStronghold failed={data.resultType === 'FAILED'} />

  const target = getPredictionCoordinates(top)
  const direction = travelDirection(
    data.playerPosition,
    target.overworldX,
    target.overworldZ,
  )
  const playerDimension = data.playerPosition.isInNether ? 'Nether' : 'Overworld'
  const playerX = data.playerPosition.xInOverworld
  const playerZ = data.playerPosition.zInOverworld
  const isOverworld = dimension === 'overworld'
  const maximumThrowOffset = Math.max(0, data.eyeThrows.length - 1)
  const safeThrowOffset = Math.min(throwOffset, maximumThrowOffset)
  const selectedThrowIndex = data.eyeThrows.length - 1 - safeThrowOffset
  const selectedThrow = data.eyeThrows[selectedThrowIndex]
  const primaryX = isOverworld ? target.overworldX : target.netherX
  const primaryZ = isOverworld ? target.overworldZ : target.netherZ
  const primaryDistance = isOverworld ? top.overworldDistance : top.overworldDistance / 8

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-3 pb-4 pt-3 sm:px-5 sm:pb-6">
      <section className={cn('relative overflow-hidden rounded-xl bg-[#09090b] shadow-[0_20px_70px_rgba(0,0,0,0.28)]', isOverworld ? 'border border-sky-200/15' : 'border border-red-300/15')}>
        <div
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute inset-0 bg-cover bg-center saturate-75',
            isOverworld
              ? "bg-[url('/ninjabrain-overworld-bg.jpg')] opacity-[0.16] brightness-75"
              : "bg-[url('/ninjabrain-nether-bg.jpg')] opacity-[0.18] brightness-75",
          )}
        />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-black/35" />
        <div className="relative grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_13rem] sm:items-stretch sm:p-5">
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-3">
              <p className={cn('font-mono text-[9px] uppercase tracking-[0.22em]', isOverworld ? 'text-sky-100/65' : 'text-red-200/65')}>{isOverworld ? 'Overworld stronghold target' : 'Nether portal target'}</p>
              <button type="button" onClick={() => setDimension(isOverworld ? 'nether' : 'overworld')} className={cn('rounded-md border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em] transition', isOverworld ? 'border-red-200/15 bg-red-300/5 text-red-100/55 hover:bg-red-300/10 hover:text-red-100' : 'border-sky-200/15 bg-sky-300/5 text-sky-100/55 hover:bg-sky-300/10 hover:text-sky-100')}>{isOverworld ? 'Show Nether' : 'Show Overworld'}</button>
            </div>
            <p className={cn('mt-2 whitespace-nowrap font-mono text-[clamp(2.8rem,16vw,6.2rem)] font-black leading-none tracking-[-0.08em] tabular-nums', isOverworld ? 'text-sky-50 drop-shadow-[0_0_30px_rgba(186,230,253,0.16)]' : 'text-red-200 drop-shadow-[0_0_30px_rgba(248,113,113,0.2)]')}>
              ({primaryX}, {primaryZ})
            </p>
            <p className={cn('mt-3 font-mono text-sm', isOverworld ? 'text-sky-100/50' : 'text-red-100/50')}>
              {Math.round(primaryDistance).toLocaleString()} {isOverworld ? 'Overworld' : 'Nether'} blocks away
            </p>
          </div>

          <div className="flex flex-row items-center justify-between gap-4 rounded-lg border border-emerald-400/20 bg-emerald-400/[0.07] p-4 sm:flex-col sm:items-start sm:justify-center">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-emerald-200/60">Certainty</p>
            <p className="font-mono text-4xl font-black text-emerald-300 tabular-nums sm:text-5xl">
              {percent(top.certainty)}
            </p>
          </div>
        </div>

        <div className="relative grid grid-cols-2 border-t border-white/8 sm:grid-cols-4">
          <button type="button" onClick={() => setDimension(isOverworld ? 'nether' : 'overworld')} className="border-b border-r border-white/8 p-3 text-left transition hover:bg-white/[0.05] sm:border-b-0 sm:p-4">
            <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-white/35">{isOverworld ? 'Nether target' : 'Overworld target'} · tap to show</p>
            <p className="mt-1.5 font-mono text-xl font-bold text-white tabular-nums">
              ({isOverworld ? target.netherX : target.overworldX}, {isOverworld ? target.netherZ : target.overworldZ})
            </p>
          </button>
          <div className="border-b border-white/8 p-3 sm:border-b-0 sm:border-r sm:p-4">
            <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-white/35">{isOverworld ? 'Nether distance' : 'Overworld distance'}</p>
            <p className="mt-1.5 font-mono text-xl font-bold text-white tabular-nums">
              {Math.round(isOverworld ? top.overworldDistance / 8 : top.overworldDistance)}b
            </p>
          </div>
          <div className="border-r border-white/8 p-3 sm:p-4">
            <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-white/35">Travel angle</p>
            <p className="mt-1.5 font-mono text-xl font-bold text-primary tabular-nums">
              {direction.angle == null ? '—' : `${direction.angle.toFixed(1)}°`}
            </p>
          </div>
          <div className="p-3 sm:p-4">
            <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-white/35">Turn</p>
            <p
              className={cn(
                'mt-1.5 font-mono text-xl font-bold tabular-nums',
                Math.abs(direction.difference ?? 0) <= 3
                  ? 'text-emerald-300'
                  : 'text-amber-300',
              )}
            >
              {signedAngle(direction.difference)}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-[#0b0e12]">
        <div className="grid grid-cols-[1.25fr_.7fr_.7fr_1fr_1fr] gap-1 border-b border-white/10 bg-white/[0.035] px-2 py-2 font-mono text-[7px] uppercase tracking-[0.08em] text-white/35 sm:px-4 sm:text-[9px] sm:tracking-[0.14em]">
          <span>Overworld</span>
          <span className="text-right">Chance</span>
          <span className="text-right">Distance</span>
          <span className="text-right">Nether</span>
          <span className="text-right">Direction</span>
        </div>
        {data.predictions.map((prediction, index) => {
          const coordinates = getPredictionCoordinates(prediction)
          const predictionDirection = travelDirection(
            data.playerPosition,
            coordinates.overworldX,
            coordinates.overworldZ,
          )
          return (
            <div
              key={`${prediction.chunkX}-${prediction.chunkZ}`}
              className={cn(
                'grid grid-cols-[1.25fr_.7fr_.7fr_1fr_1fr] items-center gap-1 border-b border-white/[0.06] px-2 py-2.5 font-mono text-[9px] tabular-nums last:border-b-0 sm:px-4 sm:text-xs',
                index === 0 ? 'bg-emerald-400/[0.06] text-white' : 'text-white/60',
              )}
            >
              <span className="whitespace-nowrap font-semibold">
                ({coordinates.overworldX}, {coordinates.overworldZ})
              </span>
              <span className={cn('text-right font-bold', index === 0 && 'text-emerald-300')}>
                {percent(prediction.certainty)}
              </span>
              <span className="text-right">{Math.round(prediction.overworldDistance)}b</span>
              <span className="whitespace-nowrap text-right">
                ({coordinates.netherX}, {coordinates.netherZ})
              </span>
              <span className="whitespace-nowrap text-right">
                {predictionDirection.angle == null
                  ? '—'
                  : `${predictionDirection.angle.toFixed(1)}°`}
                {predictionDirection.difference == null
                  ? ''
                  : ` (${signedAngle(predictionDirection.difference)})`}
              </span>
            </div>
          )
        })}
      </section>

      <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(18rem,.8fr)]">
        <section className="overflow-hidden rounded-xl border border-white/10 bg-[#0b0e12]">
          <div className="flex items-center justify-between border-b border-white/8 px-3 py-2.5">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/40">Eye measurements</p>
              <span className="mt-0.5 block font-mono text-[9px] text-white/30">{selectedThrow ? `Throw ${selectedThrowIndex + 1} of ${data.eyeThrows.length}` : 'No throws yet'}</span>
            </div>
            <div className="flex items-center gap-1.5" role="group" aria-label="Browse eye throw history">
              <button type="button" onClick={() => setThrowOffset(Math.min(safeThrowOffset + 1, maximumThrowOffset))} disabled={!selectedThrow || safeThrowOffset >= maximumThrowOffset} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-25" aria-label="Show previous eye throw"><Undo2 className="h-4 w-4" /></button>
              <button type="button" onClick={() => setThrowOffset(Math.max(safeThrowOffset - 1, 0))} disabled={!selectedThrow || safeThrowOffset === 0} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-25" aria-label="Show next eye throw"><Redo2 className="h-4 w-4" /></button>
            </div>
          </div>
          {selectedThrow ? (
            <div className="grid grid-cols-[1fr_.8fr_.65fr] gap-2 px-3 py-4 font-mono text-[10px] sm:text-xs">
              <div><p className="text-[8px] uppercase tracking-[0.12em] text-white/25">Position</p><span className="mt-1 block whitespace-nowrap text-white/75">({coordinate(selectedThrow.xInOverworld, 0)}, {coordinate(selectedThrow.zInOverworld, 0)})</span></div>
              <div className="text-right"><p className="text-[8px] uppercase tracking-[0.12em] text-white/25">Angle</p><span className="mt-1 block text-white/60">{selectedThrow.angle.toFixed(3)}°</span></div>
              <div className="text-right"><p className="text-[8px] uppercase tracking-[0.12em] text-white/25">Error</p><span className={cn('mt-1 block font-semibold', Math.abs(selectedThrow.error) < 0.05 ? 'text-sky-300' : 'text-amber-300')}>{signedAngle(selectedThrow.error)}</span></div>
            </div>
          ) : (
            <p className="px-3 py-5 text-center text-xs text-white/35">Waiting for an eye throw</p>
          )}
        </section>

        <section className="rounded-xl border border-white/10 bg-[#0b0e12] p-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/40">
            Last player position
          </p>
          <div className="mt-3 flex items-end justify-between gap-3">
            <div>
              <p className="font-mono text-lg font-bold text-white tabular-nums">
                {playerX == null || playerZ == null
                  ? 'Not recorded'
                  : `(${coordinate(playerX, 1)}, ${coordinate(playerZ, 1)})`}
              </p>
              <p className="mt-1 text-[10px] text-white/35">{playerDimension}</p>
            </div>
            <p className="font-mono text-sm font-semibold text-primary">
              {data.playerPosition.horizontalAngle == null
                ? '—'
                : `${data.playerPosition.horizontalAngle.toFixed(1)}°`}
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}

function NinjabrainStandConsole({
  snapshot,
  status,
  version,
  mode,
  onExit,
}: {
  snapshot: NinjabrainSnapshot
  status: ConnectionStatus
  version: string
  mode: NinjabrainDisplayMode
  onExit: () => void
}) {
  return (
    <section className="flex min-h-[100svh] flex-col bg-[#05070a] text-white">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-white/10 bg-[#080b0f]/95 px-3 py-2.5 backdrop-blur sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          <StatusPill status={status} />
          <span className="truncate font-mono text-[9px] uppercase tracking-[0.16em] text-white/35">
            Ninjabrain Bot {version || 'API'} · {modeLabels[mode]}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <BoatPill snapshot={snapshot} />
          <button
            type="button"
            onClick={onExit}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white"
            aria-label="Exit stand view"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {mode === 'stronghold' && <StandStrongholdView data={snapshot.stronghold} />}
      {mode === 'blind' && <BlindView data={snapshot.blind} />}
      {mode === 'divine' && <DivineView data={snapshot.divine} />}
      {mode === 'all-advancements' && <AllAdvancementsView data={snapshot.allAdvancements} />}

      <div className="mt-auto">
        <MessageStrip messages={snapshot.informationMessages.informationMessages} />
        <div className="flex items-center justify-between gap-3 border-t border-white/8 px-4 py-2 font-mono text-[8px] uppercase tracking-[0.14em] text-white/25">
          <span>F3+C updates automatically</span>
          <span>Screen stays awake</span>
        </div>
      </div>
    </section>
  )
}

function NinjabrainConsole({
  snapshot,
  status,
  version,
  mode,
  focusMode,
  onEnterFocus,
  onExitFocus,
}: {
  snapshot: NinjabrainSnapshot
  status: ConnectionStatus
  version: string
  mode: NinjabrainDisplayMode
  focusMode: boolean
  onEnterFocus: () => void
  onExitFocus: () => void
}) {
  return (
    <section className={cn('overflow-hidden rounded-2xl border border-white/12 bg-[#05070a]/95 text-white shadow-[0_30px_100px_rgba(0,0,0,0.5)]', focusMode && 'min-h-screen rounded-none border-0')}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-white/[0.035] px-3 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-2">
          <StatusPill status={status} />
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-white/40 sm:inline">NBB {version || 'API'}</span>
        </div>
        <div className="flex items-center gap-2">
          <BoatPill snapshot={snapshot} />
          <button
            type="button"
            onClick={focusMode ? onExitFocus : onEnterFocus}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white"
            aria-label={focusMode ? 'Exit stand view' : 'Open stand view'}
          >
            {focusMode ? <X className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="border-b border-white/8 bg-black/20 px-4 py-2.5 text-center font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
        {modeLabels[mode]}
      </div>

      {mode === 'stronghold' && <StrongholdView data={snapshot.stronghold} />}
      {mode === 'blind' && <BlindView data={snapshot.blind} />}
      {mode === 'divine' && <DivineView data={snapshot.divine} />}
      {mode === 'all-advancements' && <AllAdvancementsView data={snapshot.allAdvancements} />}

      <MessageStrip messages={snapshot.informationMessages.informationMessages} />
      <div className="flex items-center justify-between gap-3 border-t border-white/8 px-4 py-2.5 font-mono text-[9px] uppercase tracking-[0.15em] text-white/30 sm:px-5">
        <span>Direct from your PC</span>
        <span>No cloud relay</span>
      </div>
    </section>
  )
}

function SetupSteps() {
  const platforms = [
    {
      name: 'Windows',
      path: 'Settings → Network & internet → Wi-Fi or Ethernet → your connected network → IPv4 address.',
      command: 'ipconfig',
    },
    {
      name: 'macOS',
      path: 'System Settings → Network → Wi-Fi or Ethernet → Details → TCP/IP → IPv4 address.',
      command: 'ipconfig getifaddr en0',
    },
    {
      name: 'Linux',
      path: 'Settings → Network or Wi-Fi → connected network → Details → IPv4 address.',
      command: 'hostname -I',
    },
  ]

  return (
    <div>
      <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/7 p-4">
        <Monitor className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div>
          <h3 className="font-semibold text-foreground">First, enable the Ninjabrain API</h3>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">In Ninjabrain Bot, open <strong className="text-foreground">Settings → Advanced</strong>, then enable <strong className="text-foreground">Enable API (starts HTTP server)</strong>.</p>
        </div>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        {platforms.map(({ name, path, command }) => (
          <div key={name} className="rounded-xl border border-white/10 bg-background/35 p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold text-foreground">{name}</h3>
              <span className="rounded-md border border-white/10 bg-background/55 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-primary">Find IP</span>
            </div>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">{path}</p>
            <div className="mt-3 rounded-lg border border-white/8 bg-black/20 px-3 py-2">
              <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Terminal option</p>
              <code className="mt-1 block select-all text-xs text-foreground">{command}</code>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-start gap-2 rounded-lg border border-sky-400/15 bg-sky-400/7 p-3 text-xs leading-5 text-muted-foreground">
        <Wifi className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
        <span>Keep the computer and phone on the same trusted Wi-Fi. If several addresses appear, use the Wi-Fi IPv4 address, usually beginning with <strong className="font-mono text-foreground">192.168</strong> or <strong className="font-mono text-foreground">10.</strong>, then connect.</span>
      </div>
    </div>
  )
}

export function NinjabrainDisplay() {
  const [address, setAddress] = useState('')
  const [showAddress, setShowAddress] = useState(false)
  const [connectedAddress, setConnectedAddress] = useState('')
  const [status, setStatus] = useState<ConnectionStatus>('idle')
  const [snapshot, setSnapshot] = useState<NinjabrainSnapshot>(emptyNinjabrainSnapshot)
  const [version, setVersion] = useState('')
  const [error, setError] = useState('')
  const [focusMode, setFocusMode] = useState(false)
  const [demoMode, setDemoMode] = useState<NinjabrainDisplayMode>('stronghold')
  const [transport, setTransport] = useState<'events' | 'polling' | ''>('')
  const sourcesRef = useRef<EventSource[]>([])
  const pollTimerRef = useRef<number | null>(null)
  const fallbackTimerRef = useRef<number | null>(null)
  const wakeLockRef = useRef<{ release: () => Promise<void> } | null>(null)

  const clearConnection = useCallback(() => {
    sourcesRef.current.forEach((source) => source.close())
    sourcesRef.current = []
    if (pollTimerRef.current != null) window.clearInterval(pollTimerRef.current)
    if (fallbackTimerRef.current != null) window.clearTimeout(fallbackTimerRef.current)
    pollTimerRef.current = null
    fallbackTimerRef.current = null
    setTransport('')
  }, [])

  useEffect(() => {
    const saved = window.localStorage.getItem('ninjabrain-pc-address')
    if (saved) setAddress(saved)
    return clearConnection
  }, [clearConnection])

  const updateSnapshot = useCallback((key: SnapshotKey, value: unknown) => {
    setSnapshot((current) => ({ ...current, [key]: value }))
  }, [])

  const fetchEndpoint = useCallback(async (baseUrl: string, endpoint: string) => {
    const response = await fetch(`${baseUrl}/api/v1/${endpoint}`, localRequestInit(baseUrl))
    if (!response.ok) throw new Error(`${endpoint} returned ${response.status}`)
    return response.json() as Promise<unknown>
  }, [])

  const pollAll = useCallback(async (baseUrl: string) => {
    const results = await Promise.allSettled(
      endpointMap.map(async ([key, endpoint]) => [key, await fetchEndpoint(baseUrl, endpoint)] as const),
    )
    results.forEach((result) => {
      if (result.status === 'fulfilled') updateSnapshot(result.value[0], result.value[1])
    })
  }, [fetchEndpoint, updateSnapshot])

  const startPolling = useCallback((baseUrl: string) => {
    sourcesRef.current.forEach((source) => source.close())
    sourcesRef.current = []
    setTransport('polling')
    void pollAll(baseUrl)
    pollTimerRef.current = window.setInterval(() => void pollAll(baseUrl), 900)
  }, [pollAll])

  const startEvents = useCallback((baseUrl: string) => {
    let opened = 0
    setTransport('events')
    sourcesRef.current = endpointMap.map(([key, endpoint]) => {
      const source = new EventSource(`${baseUrl}/api/v1/${endpoint}/events`)
      source.onopen = () => { opened += 1 }
      source.onmessage = (event) => {
        try {
          updateSnapshot(key, JSON.parse(event.data) as unknown)
        } catch {
          // Ignore a malformed event and keep the live subscription open.
        }
      }
      return source
    })
    fallbackTimerRef.current = window.setTimeout(() => {
      if (opened === 0) startPolling(baseUrl)
    }, 4500)
  }, [startPolling, updateSnapshot])

  const requestWakeLock = useCallback(async () => {
    try {
      if ('wakeLock' in navigator) wakeLockRef.current = await navigator.wakeLock.request('screen')
    } catch {
      // The display still works when wake lock is unavailable or denied.
    }
  }, [])

  const connect = useCallback(async () => {
    clearConnection()
    setError('')
    setStatus('connecting')
    setSnapshot(emptyNinjabrainSnapshot)
    try {
      const baseUrl = normalizeNinjabrainAddress(address)
      const isPhone = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
      if (isPhone && /\/\/(localhost|127\.)/i.test(baseUrl)) {
        throw new Error('On your phone, localhost means the phone itself. Enter the gaming PC\'s Wi-Fi IPv4 address instead.')
      }

      const ping = await fetch(`${baseUrl}/api/v1/ping`, localRequestInit(baseUrl))
      if (!ping.ok || !(await ping.text()).includes('Ninjabrain Bot')) {
        throw new Error('The address answered, but Ninjabrain Bot was not found there.')
      }

      const versionResponse = await fetch(`${baseUrl}/api/v1/version`, localRequestInit(baseUrl))
      const versionBody = versionResponse.ok ? await versionResponse.json() as { version?: string } : {}
      await pollAll(baseUrl)
      setVersion(versionBody.version ?? '')
      setConnectedAddress('••••••••••••')
      setStatus('live')
      window.localStorage.setItem('ninjabrain-pc-address', address.trim())
      startEvents(baseUrl)
      void requestWakeLock()
    } catch (cause) {
      clearConnection()
      setStatus('error')
      setError(
        cause instanceof Error && cause.message !== 'Failed to fetch'
          ? cause.message
          : 'The phone could not reach Ninjabrain Bot. Check the same Wi-Fi, PC address, local-network permission, and firewall settings.',
      )
    }
  }, [address, clearConnection, pollAll, requestWakeLock, startEvents])

  const disconnect = useCallback(() => {
    clearConnection()
    void wakeLockRef.current?.release()
    wakeLockRef.current = null
    setStatus('idle')
    setConnectedAddress('')
    setSnapshot(emptyNinjabrainSnapshot)
    setVersion('')
    setError('')
    setFocusMode(false)
  }, [clearConnection])

  const startDemo = useCallback(() => {
    clearConnection()
    setSnapshot(demoNinjabrainSnapshot)
    setVersion('1.5.2 demo')
    setStatus('demo')
    setError('')
    setConnectedAddress('Demo data')
  }, [clearConnection])

  const enterFocus = useCallback(async () => {
    setFocusMode(true)
    void requestWakeLock()
    try {
      await document.documentElement.requestFullscreen?.()
    } catch {
      // iPhone Safari may keep the browser chrome; the fixed stand view still works.
    }
  }, [requestWakeLock])

  const exitFocus = useCallback(async () => {
    setFocusMode(false)
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
    } catch {
      // The inline view is restored even if the browser owns fullscreen state.
    }
  }, [])

  useEffect(() => {
    const handleFullscreen = () => {
      if (!document.fullscreenElement) setFocusMode(false)
    }
    document.addEventListener('fullscreenchange', handleFullscreen)
    return () => document.removeEventListener('fullscreenchange', handleFullscreen)
  }, [])

  const mode = status === 'demo' ? demoMode : getNinjabrainDisplayMode(snapshot)
  const active = status === 'live' || status === 'demo'
  const activeSnapshot = useMemo(() => {
    if (status !== 'demo') return snapshot
    return {
      ...snapshot,
      blind: { ...snapshot.blind, isBlindModeEnabled: demoMode === 'blind' },
      divine: { ...snapshot.divine, isDivineModeEnabled: demoMode === 'divine' },
      allAdvancements: { ...snapshot.allAdvancements, isAllAdvancementsModeEnabled: demoMode === 'all-advancements' },
    }
  }, [demoMode, snapshot, status])

  const normalConsoleView = (
    <NinjabrainConsole
      snapshot={activeSnapshot}
      status={status}
      version={version}
      mode={mode}
      focusMode={focusMode}
      onEnterFocus={enterFocus}
      onExitFocus={exitFocus}
    />
  )

  const standConsoleView = (
    <NinjabrainStandConsole
      snapshot={activeSnapshot}
      status={status}
      version={version}
      mode={mode}
      onExit={exitFocus}
    />
  )

  return (
    <>
      {!focusMode && <Header />}
      {focusMode ? (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#05070a]">{standConsoleView}</div>
      ) : (
        <main className="mx-auto max-w-7xl px-3 py-5 sm:px-4 sm:py-8">
          <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-card/78 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur-2xl sm:p-8">
            <div className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
            <div className="relative grid items-end gap-6 lg:grid-cols-[minmax(0,1fr)_auto]">
              <div>
                <span className="inline-flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  <Radio className="h-4 w-4" /> Ninjabrain phone display
                </span>
                <h1 className="mt-3 max-w-3xl text-3xl font-black tracking-tight text-foreground sm:text-5xl">
                  Ninjabrain on your phone. <span className="text-primary">Always visible.</span>
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                  Turn your phone into a live Ninjabrain display beside the monitor. The page reads the bot directly over your home Wi-Fi—no account, API key, or cloud upload.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 lg:w-[24rem]">
                {[
                  ['Delay', '<1s'],
                  ['Cloud', 'None'],
                  ['Port', '52533'],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-white/10 bg-background/45 px-3 py-3 text-center">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
                    <p className="mt-1 font-mono text-sm font-bold text-foreground">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {!active && (
            <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_23rem]">
              <div className="rounded-2xl border border-white/10 bg-card/80 p-5 backdrop-blur-xl sm:p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary"><PlugZap className="h-5 w-5" /></span>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">Connect locally</p>
                    <h2 className="text-xl font-bold text-foreground">Enter your gaming PC address</h2>
                  </div>
                </div>

                <form className="mt-5" onSubmit={(event) => { event.preventDefault(); void connect() }}>
                  <label htmlFor="ninjabrain-address" className="text-xs font-medium text-muted-foreground">PC IPv4 address</label>
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                    <div className="relative min-w-0 flex-1">
                      <Wifi className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        id="ninjabrain-address"
                        type={showAddress ? 'text' : 'password'}
                        value={address}
                        onChange={(event) => setAddress(event.target.value)}
                        placeholder="•••.•••.•••.•••"
                        inputMode="decimal"
                        autoComplete="off"
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck={false}
                        className="h-12 w-full rounded-lg border border-white/10 bg-background/60 pl-10 pr-11 font-mono text-sm text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAddress((visible) => !visible)}
                        className="absolute right-1.5 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                        aria-label={showAddress ? 'Hide PC IP address' : 'Show PC IP address'}
                        aria-pressed={showAddress}
                      >
                        {showAddress ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <Button type="submit" className="h-12 px-5" disabled={status === 'connecting'}>
                      {status === 'connecting' ? <RotateCw className="animate-spin" /> : <PlugZap />}
                      {status === 'connecting' ? 'Connecting…' : 'Connect display'}
                    </Button>
                  </div>
                </form>

                {error && <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-rose-400/25 bg-rose-400/10 p-3 text-sm leading-5 text-rose-100"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span></div>}

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-4">
                  <p className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 text-emerald-300" /> Your private PC address and run data stay in this browser and are never uploaded.</p>
                  <Button type="button" variant="ghost" onClick={startDemo}>Preview demo <ChevronRight /></Button>
                </div>
              </div>

              <aside className="rounded-2xl border border-amber-400/20 bg-amber-400/7 p-5 backdrop-blur-xl">
                <div className="flex items-center gap-2 text-amber-200"><AlertTriangle className="h-4 w-4" /><h2 className="font-semibold">Before connecting</h2></div>
                <ul className="mt-4 space-y-3 text-xs leading-5 text-muted-foreground">
                  <li>Use Ninjabrain Bot 1.5.2 or newer.</li>
                  <li>Keep the phone and gaming PC on the same trusted Wi-Fi.</li>
                  <li>Allow Java or Ninjabrain through your firewall for <strong className="text-foreground">private networks</strong> only.</li>
                  <li>Accept the browser’s local-network permission when it appears.</li>
                </ul>
              </aside>
            </section>
          )}

          {active && (
            <section className="mt-5">
              <div className="mb-3 flex flex-col gap-3 rounded-xl border border-white/10 bg-card/72 p-3 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2"><StatusPill status={status} /><span className="truncate font-mono text-[10px] text-muted-foreground">{connectedAddress}</span></div>
                  <p className="mt-1.5 text-xs text-muted-foreground">{status === 'live' ? `Live via ${transport === 'polling' ? 'fast polling' : 'event stream'} · NBB ${version || 'connected'}` : 'Sample data only — connect your PC when ready.'}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" className="h-9" onClick={enterFocus}><Fullscreen /> Stand view</Button>
                  <Button type="button" variant="ghost" className="h-9" onClick={disconnect}><Unplug /> Disconnect</Button>
                </div>
              </div>

              {status === 'demo' && (
                <div className="mb-3 grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-card/72 p-1 sm:flex sm:w-fit" role="group" aria-label="Choose demo display mode">
                  {(Object.keys(modeLabels) as NinjabrainDisplayMode[]).map((value) => (
                    <button key={value} type="button" onClick={() => setDemoMode(value)} className={cn('rounded-lg px-3 py-2 text-xs font-medium transition', demoMode === value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
                      {modeLabels[value]}
                    </button>
                  ))}
                </div>
              )}
              {normalConsoleView}
            </section>
          )}

          <section className="mt-5 rounded-2xl border border-white/10 bg-card/72 p-5 backdrop-blur-xl sm:p-6">
            <div className="mb-5 flex items-end justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">One-time setup</p>
                <h2 className="mt-1 text-2xl font-bold text-foreground">Find your PC address</h2>
              </div>
              <a href="https://github.com/Ninjabrain1/Ninjabrain-Bot/wiki/API" target="_blank" rel="noopener noreferrer" className="hidden items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground sm:flex">Official API docs <ExternalLink className="h-3.5 w-3.5" /></a>
            </div>
            <SetupSteps />
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-sky-400/15 bg-sky-400/7 p-3 text-xs leading-5 text-muted-foreground">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
              <span>Ninjabrain’s API has no password or API key. Use this display only on a trusted home network. The PC address is saved only in this browser, and neither it nor the API response is sent through the website server.</span>
            </div>
          </section>
        </main>
      )}
      {!focusMode && <Footer />}
    </>
  )
}
