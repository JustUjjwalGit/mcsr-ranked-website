'use client'

import { useState } from 'react'
import {
  Check,
  Copy,
  Cpu,
  Gauge,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  Terminal,
} from 'lucide-react'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

type SeedProfileKey =
  | 'filteredseed'
  | 'twoironlootvillagelight'
  | 'fsg-power-village-looting-sword'
  | 'power-village-plusplus'
  | 'co-op-fsg'
  | 'messing-around'

interface SeedProfile {
  key: SeedProfileKey
  label: string
  type: string
  description: string
}

interface FsgSeed {
  id: string
  seed: string
  profile: string
  type: string
  version: string
  filteredSeeds: number | null
  biomeChecks: number | null
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

const seedProfiles: SeedProfile[] = [
  {
    key: 'filteredseed',
    label: 'Classic Coinflip',
    type: 'Village / Shipwreck',
    description: 'Classic FSG, randomly chooses village or shipwreck.',
  },
  {
    key: 'twoironlootvillagelight',
    label: 'Two Iron Village',
    type: 'Village',
    description: 'Village FSG tuned around early iron and light loot.',
  },
  {
    key: 'fsg-power-village-looting-sword',
    label: 'Looting Sword Village',
    type: 'Village',
    description: 'Power village profile with looting sword checks.',
  },
  {
    key: 'power-village-plusplus',
    label: 'Power Village++',
    type: 'Village',
    description: 'Stronger power village filter variant.',
  },
  {
    key: 'co-op-fsg',
    label: 'Co-op FSG',
    type: 'Village',
    description: 'Co-op mode FSG profile.',
  },
  {
    key: 'messing-around',
    label: 'Experimental Village',
    type: 'Village',
    description: 'Experimental village finder profile.',
  },
]

const batchSize = 3

function formatDuration(ms: number) {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function formatNumber(value: number | null) {
  return value == null ? 'N/A' : value.toLocaleString()
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
                {seed.type}
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
            <p className="text-xs text-muted-foreground">Filtered</p>
            <p className="mt-1 font-semibold text-foreground">
              {formatNumber(seed.filteredSeeds)}
            </p>
          </div>
          <div className="rounded border border-border bg-muted/35 p-3">
            <p className="text-xs text-muted-foreground">Biome Checks</p>
            <p className="mt-1 font-semibold text-foreground">
              {formatNumber(seed.biomeChecks)}
            </p>
          </div>
          <div className="rounded border border-border bg-muted/35 p-3">
            <p className="text-xs text-muted-foreground">Version</p>
            <p className="mt-1 truncate font-semibold text-foreground">
              {seed.version}
            </p>
          </div>
        </div>

        {seed.verificationToken && (
          <details className="rounded border border-border bg-background/35 p-3">
            <summary className="cursor-pointer text-sm font-medium text-foreground">
              Verification Token
            </summary>
            <p className="mt-2 break-all font-mono text-xs text-muted-foreground">
              {seed.verificationToken}
            </p>
          </details>
        )}
      </div>
    </Card>
  )
}

export default function SeedFinderPage() {
  const [selectedProfile, setSelectedProfile] =
    useState<SeedProfileKey>('filteredseed')
  const [seeds, setSeeds] = useState<FsgSeed[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [details, setDetails] = useState('')
  const [runner, setRunner] = useState<string | null>(null)
  const [copiedSeed, setCopiedSeed] = useState('')

  async function findSeeds(append = false) {
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
        profile: selectedProfile,
        count: String(batchSize),
      })
      const response = await fetch(`/api/seed-finder?${params}`)
      const data = (await response.json()) as SeedFinderResponse

      setRunner(data.runtime?.runner ?? null)

      if (!response.ok || data.error) {
        setError(data.error || 'Could not run FSG seed finder.')
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
      setError('Could not run FSG seed finder.')
      setDetails('The local FSG process could not be started.')
    } finally {
      if (append) {
        setLoadingMore(false)
      } else {
        setLoading(false)
      }
    }
  }

  function selectProfile(profile: SeedProfileKey) {
    setSelectedProfile(profile)
    setSeeds([])
    setError('')
    setDetails('')
    setRunner(null)
  }

  async function copySeed(seed: string) {
    await navigator.clipboard.writeText(seed)
    setCopiedSeed(seed)
    window.setTimeout(() => setCopiedSeed(''), 1400)
  }

  const activeProfile =
    seedProfiles.find((profile) => profile.key === selectedProfile) ??
    seedProfiles[0]

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
                  Generate real world seeds using the local FSG scripts
                </p>
              </div>
            </div>

            <Button
              type="button"
              onClick={() => findSeeds(false)}
              disabled={loading || loadingMore}
              className="w-full md:w-auto"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {loading ? 'Finding...' : 'Find Seeds'}
            </Button>
          </div>

          <Card className="border border-border bg-card p-3 sm:p-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {seedProfiles.map((profile) => {
                const active = profile.key === selectedProfile

                return (
                  <button
                    key={profile.key}
                    type="button"
                    onClick={() => selectProfile(profile.key)}
                    className={`min-h-28 rounded border p-3 text-left transition sm:p-4 ${
                      active
                        ? 'border-primary bg-primary/15 text-primary'
                        : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                    }`}
                  >
                    <span className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                      <span className="font-semibold">{profile.label}</span>
                      <span className="w-fit rounded border border-current/30 px-2 py-1 text-xs">
                        {profile.type}
                      </span>
                    </span>
                    <span className="mt-2 block text-sm opacity-80">
                      {profile.description}
                    </span>
                  </button>
                )
              })}
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <Terminal className="h-5 w-5 text-primary" />
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">Profile</p>
                  <p className="truncate text-lg font-bold text-foreground sm:text-xl">
                    {activeProfile.label}
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
                  <p className="text-sm text-muted-foreground">Runner</p>
                  <p className="truncate text-lg font-bold text-foreground sm:text-xl">
                    {runner ?? 'Local FSG'}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {error && (
            <Card className="border border-red-500/40 bg-red-500/10 p-4">
              <p className="font-semibold text-red-200">{error}</p>
              {details && (
                <p className="mt-2 text-sm text-red-300">{details}</p>
              )}
            </Card>
          )}

          {loading ? (
            <Card className="border border-border bg-card p-8">
              <div className="flex items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                Running FSG finder...
              </div>
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
                  onClick={() => findSeeds(true)}
                  disabled={loading || loadingMore}
                >
                  {loadingMore ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  {loadingMore ? 'Loading...' : 'Load more'}
                </Button>
              </div>
            </>
          ) : (
            <Card className="border border-border bg-card p-8 text-center">
              <p className="text-lg font-semibold text-foreground">
                No seeds loaded yet
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Choose a profile and run the finder.
              </p>
            </Card>
          )}
        </div>
      </main>
    </>
  )
}
