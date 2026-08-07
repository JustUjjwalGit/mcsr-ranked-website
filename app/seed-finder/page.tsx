'use client'

import { useEffect, useState } from 'react'
import {
  Check,
  Copy,
  Cpu,
  ExternalLink,
  Gauge,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  Shuffle,
  Sparkles,
  Terminal,
} from 'lucide-react'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { SiteLoader } from '@/components/site-loader'

type SeedMode = 'verified' | 'practice'

interface SeedProfile {
  key: string
  label: string
  supportedVersions: string[]
  maxGenerating: number
  runIsRetimed: boolean
  description: string
}

interface FsgSeed {
  id: string
  seed: string
  profile: string
  filterId: string
  mode: SeedMode
  version: string
  verificationToken: string | null
  durationMs: number
}

interface SeedFinderResponse {
  profile?: SeedProfile
  profiles?: SeedProfile[]
  runtime?: {
    available: boolean
    runner?: string
    platform: string
  }
  seeds?: FsgSeed[]
  error?: string
  details?: string
}

function formatDuration(ms: number) {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function SeedCard({
  seed,
  copied,
  onCopy,
}: {
  seed: FsgSeed
  copied: boolean
  onCopy: (seed: string) => void
}) {
  return (
    <Card className="border border-border bg-card p-3 sm:p-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded border border-primary/40 bg-primary/10 px-2 py-1 text-primary">
                {seed.mode === 'verified' ? 'Fresh + token' : 'Practice'}
              </span>
              <span>{seed.profile}</span>
              <span>{formatDuration(seed.durationMs)}</span>
            </div>
            <p className="break-all font-mono text-xl font-bold text-foreground sm:text-2xl">
              {seed.seed}
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onCopy(seed.seed)}
            className="w-full sm:w-auto"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied' : 'Copy Seed'}
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded border border-border bg-muted/35 p-3">
            <p className="text-xs text-muted-foreground">Source</p>
            <p className="mt-1 font-semibold text-foreground">Official online DB</p>
          </div>
          <div className="rounded border border-border bg-muted/35 p-3">
            <p className="text-xs text-muted-foreground">Filter</p>
            <p className="mt-1 truncate font-semibold text-foreground">
              {seed.filterId}
            </p>
          </div>
          <div className="rounded border border-border bg-muted/35 p-3">
            <p className="text-xs text-muted-foreground">Version</p>
            <p className="mt-1 truncate font-semibold text-foreground">
              {seed.version}
            </p>
          </div>
        </div>

        {seed.verificationToken ? (
          <details className="rounded border border-emerald-500/30 bg-emerald-500/10 p-3">
            <summary className="cursor-pointer text-sm font-medium text-emerald-200">
              Verification Token
            </summary>
            <p className="mt-2 break-all font-mono text-xs text-emerald-100/80">
              {seed.verificationToken}
            </p>
          </details>
        ) : (
          <p className="rounded border border-amber-500/25 bg-amber-500/10 p-3 text-xs text-amber-100/80">
            Practice seeds were used previously and do not include a verification token.
          </p>
        )}
      </div>
    </Card>
  )
}

export default function SeedFinderPage() {
  const [profiles, setProfiles] = useState<SeedProfile[]>([])
  const [selectedProfile, setSelectedProfile] = useState('zsg')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [mode, setMode] = useState<SeedMode>('practice')
  const [seeds, setSeeds] = useState<FsgSeed[]>([])
  const [loadingProfiles, setLoadingProfiles] = useState(true)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [details, setDetails] = useState('')
  const [runner, setRunner] = useState<string | null>(null)
  const [copiedSeed, setCopiedSeed] = useState('')

  useEffect(() => {
    async function loadProfiles() {
      try {
        const response = await fetch('/api/seed-finder?metadata=1')
        const data = (await response.json()) as SeedFinderResponse

        if (!response.ok || data.error || !data.profiles?.length) {
          setError(data.error || 'Could not load official FSG filters.')
          setDetails(data.details || '')
          return
        }

        setProfiles(data.profiles)
        setRunner(data.runtime?.runner ?? null)
        const initialProfile = data.profiles[0]?.key || 'zsg'
        setSelectedProfile(initialProfile)
        setSelectedCategories([initialProfile])
      } catch {
        setError('Could not load official FSG filters.')
        setDetails('The FSG Online Database could not be reached.')
      } finally {
        setLoadingProfiles(false)
      }
    }

    loadProfiles()
  }, [])

  async function findSeeds(profileToUse?: string, append = false) {
    const targetProfile = profileToUse || selectedProfile
    if (!targetProfile) return

    try {
      if (append) {
        setLoadingMore(true)
      } else {
        setLoading(true)
        setSeeds([])
      }
      setError('')
      setDetails('')

      const params = new URLSearchParams({
        profile: targetProfile,
        mode,
        count: mode === 'practice' ? '3' : '1',
      })
      const response = await fetch(`/api/seed-finder?${params}`, {
        cache: 'no-store',
      })
      const data = (await response.json()) as SeedFinderResponse

      setRunner(data.runtime?.runner ?? runner)
      if (data.profiles?.length) setProfiles(data.profiles)

      if (!response.ok || data.error) {
        setError(data.error || 'Could not get an FSG seed.')
        setDetails(data.details || '')
        return
      }

      setSeeds((currentSeeds) => {
        const nextSeeds = data.seeds ?? []
        if (!append) return nextSeeds
        const seen = new Set(currentSeeds.map((seed) => seed.seed))
        return [
          ...currentSeeds,
          ...nextSeeds.filter((seed) => !seen.has(seed.seed)),
        ]
      })
    } catch {
      setError('Could not get an FSG seed.')
      setDetails('The FSG Online Database could not be reached.')
    } finally {
      if (append) {
        setLoadingMore(false)
      } else {
        setLoading(false)
      }
    }
  }

  function handleRandomCategorySeed() {
    const availablePool =
      selectedCategories.length > 0
        ? selectedCategories
        : profiles.map((p) => p.key)
    
    if (availablePool.length === 0) return

    const randomChoice =
      availablePool[Math.floor(Math.random() * availablePool.length)]
    setSelectedProfile(randomChoice)
    findSeeds(randomChoice, false)
  }

  function toggleCategorySelection(profileKey: string, e: React.MouseEvent) {
    e.stopPropagation()
    setSelectedCategories((prev) => {
      if (prev.includes(profileKey)) {
        const updated = prev.filter((k) => k !== profileKey)
        return updated
      } else {        return [...prev, profileKey]
      }
    })
  }

  function selectProfile(profile: string) {
    setSelectedProfile(profile)
    setSeeds([])
    setError('')
    setDetails('')
  }

  function selectMode(nextMode: SeedMode) {
    setMode(nextMode)
    setSeeds([])
    setError('')
    setDetails('')
  }

  async function copySeed(seed: string) {
    await navigator.clipboard.writeText(seed)
    setCopiedSeed(seed)
    window.setTimeout(() => setCopiedSeed(''), 1400)
  }

  const activeProfile =
    profiles.find((profile) => profile.key === selectedProfile) ?? profiles[0]

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-3 py-6 sm:px-4 sm:py-8">
        <div className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex min-w-0 items-start gap-3 sm:items-center">
              <div className="flex h-11 w-11 items-center justify-center rounded border border-primary bg-primary/15 text-primary">
                <Search className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
                  FSG Seed Finder
                </h1>
                <p className="text-muted-foreground">
                  Current filters and seeds from the official FSG Online Database
                </p>
              </div>
            </div>
          </div>

          <Card className="border border-primary/30 bg-primary/5 p-3 sm:p-4">
            <div className="grid gap-3 md:grid-cols-2">
              <button
                type="button"
                onClick={() => selectMode('verified')}
                className={`rounded border p-4 text-left transition ${
                  mode === 'verified'
                    ? 'border-emerald-400/60 bg-emerald-500/10 text-emerald-100'
                    : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted/60'
                }`}
              >
                <span className="flex items-center gap-2 font-semibold">
                  <ShieldCheck className="h-4 w-4" />
                  Fresh seed + token
                </span>
                <span className="mt-2 block text-sm opacity-80">
                  Consumes a new seed and applies the official cooldown. FSG Mod and
                  category rules are still required for leaderboard submissions.
                </span>
              </button>
              <button
                type="button"
                onClick={() => selectMode('practice')}
                className={`rounded border p-4 text-left transition ${
                  mode === 'practice'
                    ? 'border-amber-400/60 bg-amber-500/10 text-amber-100'
                    : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted/60'
                }`}
              >
                <span className="flex items-center gap-2 font-semibold">
                  <RefreshCw className="h-4 w-4" />
                  Practice seeds
                </span>
                <span className="mt-2 block text-sm opacity-80">
                  Previously used seeds with no cooldown. These runs are not verifiable.
                </span>
              </button>
            </div>
          </Card>

          {/* Seed Types & Actions Panel */}
          <Card className="pixel-panel rounded-lg border border-border bg-card p-3 shadow-[0_14px_34px_rgba(0,0,0,0.24)] text-card-foreground sm:p-4">
            {loadingProfiles ? (
              <SiteLoader label="Loading official FSG filters..." className="py-8" />
            ) : (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-3">
                  <div>
                    <h2 className="font-heading text-lg font-bold text-foreground">
                      Select Seed Categories
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Click a category card to inspect, or check boxes to pick randomly among chosen categories.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedCategories(profiles.map((p) => p.key))
                      }
                      className="text-xs text-primary underline-offset-4 hover:underline"
                    >
                      Select all
                    </button>
                    <span className="text-xs text-muted-foreground">•</span>
                    <button
                      type="button"
                      onClick={() => setSelectedCategories([])}
                      className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                    >
                      Clear selection
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {profiles.map((profile) => {
                    const active = profile.key === selectedProfile
                    const isChecked = selectedCategories.includes(profile.key)

                    return (
                      <div
                        key={profile.key}
                        onClick={() => selectProfile(profile.key)}
                        className={`relative min-h-28 cursor-pointer rounded border p-3 text-left transition sm:p-4 ${
                          active
                            ? 'border-primary bg-primary/15 text-primary'
                            : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onClick={(e) => toggleCategorySelection(profile.key, e)}
                              onChange={() => {}}
                              className="h-4 w-4 rounded border-border text-primary accent-primary focus:ring-primary cursor-pointer"
                              aria-label={`Select ${profile.label} for random pool`}
                            />
                            <span className="font-semibold text-foreground">
                              {profile.label}
                            </span>
                          </div>
                          <span className="shrink-0 rounded border border-current/30 px-2 py-1 text-xs">
                            {profile.supportedVersions.join(', ') || 'Java'}
                          </span>
                        </div>
                        <span className="mt-2 block text-sm opacity-80 pl-6">
                          {profile.description}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* Convenient Centered Seed Generation Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3 border-t border-border">
                  <Button
                    type="button"
                    onClick={() => findSeeds(undefined, false)}
                    disabled={loading || loadingMore || loadingProfiles || !activeProfile}
                    size="lg"
                    className="w-full sm:w-auto font-heading px-6 shadow-md"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    {loading
                      ? 'Requesting...'
                      : mode === 'verified'
                        ? 'Get Fresh Seed + Token'
                        : `Get Seed (${activeProfile?.label ?? 'Selected'})`}
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleRandomCategorySeed}
                    disabled={loading || loadingMore || loadingProfiles}
                    size="lg"
                    className="w-full sm:w-auto font-heading border border-primary/40 px-6 shadow-md hover:border-primary"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Shuffle className="h-4 w-4 text-primary" />
                    )}
                    {loading
                      ? 'Picking...'
                      : selectedCategories.length > 0
                        ? `Random Selected Seed (${selectedCategories.length})`
                        : 'Random Category Seed'}
                  </Button>
                </div>
              </div>
            )}
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <Terminal className="h-5 w-5 text-primary" />
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">Filter</p>
                  <p className="truncate text-lg font-bold text-foreground sm:text-xl">
                    {activeProfile?.label ?? 'Loading...'}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <Gauge className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Loaded</p>
                  <p className="text-lg font-bold text-foreground sm:text-xl">
                    {seeds.length} seeds
                  </p>
                </div>
              </div>
            </Card>
            <Card className="border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <Cpu className="h-5 w-5 text-primary" />
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">Source</p>
                  <p className="truncate text-lg font-bold text-foreground sm:text-xl">
                    {runner ?? 'FSG Online Database'}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <p className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
            No Vercel secret or local executable is required. Seed data comes from
            <a
              href="https://www.filteredseed.com/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              filteredseed.com <ExternalLink className="h-3 w-3" />
            </a>
            . For leaderboard attempts, install the
            <a
              href="https://modrinth.com/mod/fsg-mod"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              official FSG Mod <ExternalLink className="h-3 w-3" />
            </a>
            and follow the category rules.
          </p>

          {error && (
            <Card className="border border-red-500/40 bg-red-500/10 p-4">
              <p className="font-semibold text-red-200">{error}</p>
              {details && <p className="mt-2 text-sm text-red-300">{details}</p>}
            </Card>
          )}

          {loading ? (
            <Card className="border border-border bg-card p-8">
              <SiteLoader label="Requesting an official FSG seed..." />
            </Card>
          ) : seeds.length > 0 ? (
            <>
              <div className="grid gap-4 lg:grid-cols-2">
                {seeds.map((seed) => (
                  <SeedCard
                    key={seed.id}
                    seed={seed}
                    copied={copiedSeed === seed.seed}
                    onCopy={copySeed}
                  />
                ))}
              </div>
              <div className="flex justify-center pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => findSeeds(undefined, true)}
                  disabled={loading || loadingMore}
                >
                  {loadingMore ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  {loadingMore
                    ? 'Requesting...'
                    : mode === 'verified'
                      ? 'Get another fresh seed + token'
                      : 'Load more practice seeds'}
                </Button>
              </div>
            </>
          ) : (
            <Card className="border border-border bg-card p-8 text-center">
              <p className="text-lg font-semibold text-foreground">No seeds loaded yet</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Choose a filter and request a seed from the official online database.
              </p>
            </Card>
          )}
        </div>
      </main>
    </>
  )
}
