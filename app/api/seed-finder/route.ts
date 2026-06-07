import { execFile } from 'node:child_process'
import { constants, accessSync, existsSync } from 'node:fs'
import path from 'node:path'
import { promisify } from 'node:util'
import { checkRateLimit, getRateLimitHeaders } from '@/lib/ratelimit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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
  dir: string
  type: string
  description: string
}

interface Runner {
  command: string
  args: string[]
  label: string
}

const execFileAsync = promisify(execFile)

const seedProfiles: SeedProfile[] = [
  {
    key: 'filteredseed',
    label: 'Classic Coinflip',
    dir: path.join(/* turbopackIgnore: true */ process.cwd(), 'fsg', 'filteredseed'),
    type: 'Village / Shipwreck',
    description: 'Classic FSG, randomly chooses village or shipwreck.',
  },
  {
    key: 'twoironlootvillagelight',
    label: 'Two Iron Village',
    dir: path.join(
      /* turbopackIgnore: true */ process.cwd(),
      'fsg',
      'twoironlootvillagelight',
    ),
    type: 'Village',
    description: 'Village FSG tuned around early iron and light loot.',
  },
  {
    key: 'fsg-power-village-looting-sword',
    label: 'Looting Sword Village',
    dir: path.join(
      /* turbopackIgnore: true */ process.cwd(),
      'fsg',
      'fsg-power-village-looting-sword',
    ),
    type: 'Village',
    description: 'Power village profile with looting sword checks.',
  },
  {
    key: 'power-village-plusplus',
    label: 'Power Village++',
    dir: path.join(
      /* turbopackIgnore: true */ process.cwd(),
      'fsg',
      'power-village-plusplus',
    ),
    type: 'Village',
    description: 'Stronger power village filter variant.',
  },
  {
    key: 'co-op-fsg',
    label: 'Co-op FSG',
    dir: path.join(/* turbopackIgnore: true */ process.cwd(), 'fsg', 'co-op-fsg'),
    type: 'Village',
    description: 'Co-op mode FSG profile.',
  },
  {
    key: 'messing-around',
    label: 'Experimental Village',
    dir: path.join(/* turbopackIgnore: true */ process.cwd(), 'fsg', 'messing-around'),
    type: 'Village',
    description: 'Experimental village finder profile.',
  },
]

function profileToResponse(profile: SeedProfile) {
  return {
    key: profile.key,
    label: profile.label,
    type: profile.type,
    description: profile.description,
  }
}

function resolveProfile(value: string | null) {
  return (
    seedProfiles.find((profile) => profile.key === value) ?? seedProfiles[0]
  )
}

function isExecutable(filePath: string) {
  try {
    accessSync(filePath, constants.X_OK)
    return true
  } catch {
    return false
  }
}

async function findCommand(command: string) {
  try {
    const { stdout } = await execFileAsync('which', [command], {
      timeout: 1500,
    })
    return stdout.trim().split('\n')[0] || null
  } catch {
    return null
  }
}

async function getRunner(profileDir: string): Promise<Runner | null> {
  const nativeCandidates = ['seed', 'seed-linux', 'seed.out'].map((fileName) =>
    path.join(profileDir, fileName),
  )
  const nativeBinary = nativeCandidates.find(
    (filePath) => existsSync(filePath) && isExecutable(filePath),
  )

  if (nativeBinary) {
    return {
      command: nativeBinary,
      args: [],
      label: path.basename(nativeBinary),
    }
  }

  const windowsBinary = path.join(profileDir, 'seed.exe')
  if (!existsSync(windowsBinary)) return null

  if (process.platform === 'win32') {
    return {
      command: windowsBinary,
      args: [],
      label: 'seed.exe',
    }
  }

  const wine = (await findCommand('wine64')) ?? (await findCommand('wine'))
  if (!wine) return null

  return {
    command: wine,
    args: [windowsBinary],
    label: `${path.basename(wine)} seed.exe`,
  }
}

function parseSeedOutput(
  output: string,
  profile: SeedProfile,
  durationMs: number,
) {
  const seed = output.match(/Seed:\s*(-?\d+)/)?.[1]
  if (!seed) {
    throw new Error('FSG runner finished without printing a seed.')
  }

  const filtered = output.match(
    /Filtered\s+(\d+)\s+seeds\s+did\s+(\d+)\s+biome checks/i,
  )
  const version = output.match(/FSG\s+[^\r\n]+/i)?.[0]?.trim() ?? profile.label
  const verificationToken = output
    .match(/Verification Token:\s*([\s\S]*?)(?:\r?\n|$)/)?.[1]
    ?.trim()
  const generatedType = output.includes('Shipwreck Seed')
    ? 'Shipwreck'
    : output.includes('Village Seed')
      ? 'Village'
      : profile.type

  return {
    id: `${profile.key}-${seed}-${Date.now()}`,
    seed,
    profile: profile.label,
    type: generatedType,
    version,
    filteredSeeds: filtered?.[1] ? Number(filtered[1]) : null,
    biomeChecks: filtered?.[2] ? Number(filtered[2]) : null,
    verificationToken: verificationToken ?? null,
    durationMs,
  }
}

async function runSeedFinder(profile: SeedProfile, runner: Runner) {
  const startedAt = Date.now()
  const { stdout, stderr } = await execFileAsync(runner.command, runner.args, {
    cwd: profile.dir,
    timeout: 90_000,
    maxBuffer: 1024 * 1024,
  })
  const output = `${stdout}\n${stderr}`.trim()
  return parseSeedOutput(output, profile, Date.now() - startedAt)
}

export async function GET(request: Request) {
  const ip =
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown'

  const rateLimitResult = await checkRateLimit(`seed-finder:${ip}`)
  const headers = {
    ...getRateLimitHeaders(rateLimitResult),
  }

  if (!rateLimitResult.success) {
    return Response.json(
      { error: 'Too many requests. Rate limit exceeded.' },
      {
        status: 429,
        headers,
      },
    )
  }

  const { searchParams } = new URL(request.url)
  const profile = resolveProfile(searchParams.get('profile'))
  const count = Math.min(
    Math.max(Number(searchParams.get('count') ?? 3) || 3, 1),
    4,
  )
  const runner = await getRunner(profile.dir)

  if (!runner) {
    return Response.json(
      {
        error: 'FSG runner is not available on this server.',
        details:
          'The bundled seed.exe files are Windows executables. Install Wine or add a native Linux build named seed inside the selected fsg folder.',
        profile: profileToResponse(profile),
        profiles: seedProfiles.map(profileToResponse),
        runtime: {
          available: false,
          platform: process.platform,
        },
      },
      { status: 503, headers },
    )
  }

  try {
    const seeds = []
    const seenSeeds = new Set<string>()
    let attempts = 0

    while (seeds.length < count && attempts < count + 2) {
      attempts += 1
      const seed = await runSeedFinder(profile, runner)
      if (!seenSeeds.has(seed.seed)) {
        seenSeeds.add(seed.seed)
        seeds.push(seed)
      }
    }

    return Response.json(
      {
        profile: profileToResponse(profile),
        profiles: seedProfiles.map(profileToResponse),
        runtime: {
          available: true,
          runner: runner.label,
          platform: process.platform,
        },
        seeds,
      },
      { headers },
    )
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to run FSG seed finder.',
        profile: profileToResponse(profile),
        profiles: seedProfiles.map(profileToResponse),
        runtime: {
          available: true,
          runner: runner.label,
          platform: process.platform,
        },
      },
      { status: 500, headers },
    )
  }
}
