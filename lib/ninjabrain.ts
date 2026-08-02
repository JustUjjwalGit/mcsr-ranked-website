export const NINJABRAIN_PORT = 52533

export interface EyeThrow {
  xInOverworld: number
  zInOverworld: number
  angle: number
  angleWithoutCorrection: number
  correction: number
  correctionIncrements?: number
  error: number
  type: 'NORMAL' | 'NORMAL_WITH_ALT_STD' | 'MANUAL' | 'BOAT' | string
}

export interface PlayerPosition {
  xInOverworld?: number
  zInOverworld?: number
  horizontalAngle?: number
  isInOverworld?: boolean
  isInNether?: boolean
}

export interface StrongholdPrediction {
  chunkX: number
  chunkZ: number
  certainty: number
  overworldDistance: number
}

export interface StrongholdData {
  eyeThrows: EyeThrow[]
  resultType: 'NONE' | 'TRIANGULATION' | 'FAILED' | 'BLIND' | 'DIVINE' | 'ALL_ADVANCEMENTS' | string
  playerPosition: PlayerPosition
  predictions: StrongholdPrediction[]
}

export interface BlindResult {
  evaluation: 'EXCELLENT' | 'HIGHROLL_GOOD' | 'HIGHROLL_OKAY' | 'BAD_BUT_IN_RING' | 'BAD' | 'NOT_IN_RING' | string
  xInNether: number
  zInNether: number
  highrollThreshold: number
  highrollProbability: number
  improveDirection: number
  improveDistance: number
  averageDistance: number
}

export interface BlindData {
  isBlindModeEnabled: boolean
  hasDivine: boolean
  blindResult: Partial<BlindResult>
}

export interface DivineResult {
  fossilXCoordinate: number
  formattedSafeCoords: string
  formattedHighrollCoords: string
}

export interface DivineData {
  isDivineModeEnabled: boolean
  divineResult: Partial<DivineResult>
}

export interface BoatData {
  boatAngle?: number
  boatState: 'NONE' | 'ERROR' | 'MEASURING' | 'VALID' | string
}

export interface InformationMessage {
  severity: 'INFO' | 'WARNING' | 'ERROR' | string
  type: string
  message: string
}

export interface InformationMessagesData {
  informationMessages: InformationMessage[]
}

export interface AdvancementPosition {
  xInOverworld?: number
  zInOverworld?: number
  travelAngle?: number
  overworldDistance?: number
}

export interface AllAdvancementsData {
  isAllAdvancementsModeEnabled: boolean
  spawn: AdvancementPosition
  monument: AdvancementPosition
  stronghold: AdvancementPosition
  outpost: AdvancementPosition
  deepDark: AdvancementPosition
  cityQuery: AdvancementPosition
  shulkerTransport: AdvancementPosition
  generalLocation: AdvancementPosition
}

export interface NinjabrainSnapshot {
  stronghold: StrongholdData
  blind: BlindData
  divine: DivineData
  boat: BoatData
  informationMessages: InformationMessagesData
  allAdvancements: AllAdvancementsData
}

export type NinjabrainDisplayMode =
  | 'stronghold'
  | 'blind'
  | 'divine'
  | 'all-advancements'

export const emptyNinjabrainSnapshot: NinjabrainSnapshot = {
  stronghold: {
    eyeThrows: [],
    resultType: 'NONE',
    playerPosition: {},
    predictions: [],
  },
  blind: {
    isBlindModeEnabled: false,
    hasDivine: false,
    blindResult: {},
  },
  divine: {
    isDivineModeEnabled: false,
    divineResult: {},
  },
  boat: {
    boatState: 'NONE',
  },
  informationMessages: {
    informationMessages: [],
  },
  allAdvancements: {
    isAllAdvancementsModeEnabled: false,
    spawn: {},
    monument: {},
    stronghold: {},
    outpost: {},
    deepDark: {},
    cityQuery: {},
    shulkerTransport: {},
    generalLocation: {},
  },
}

export const demoNinjabrainSnapshot: NinjabrainSnapshot = {
  stronghold: {
    resultType: 'TRIANGULATION',
    playerPosition: {
      xInOverworld: 1212.65,
      zInOverworld: -318.01,
      horizontalAngle: -45.53,
      isInOverworld: true,
      isInNether: false,
    },
    eyeThrows: [
      {
        xInOverworld: 1213.26,
        zInOverworld: -318.63,
        angle: -45.53,
        angleWithoutCorrection: -45.53,
        correction: 0,
        correctionIncrements: 0,
        error: -0.0159,
        type: 'NORMAL',
      },
      {
        xInOverworld: 1212.65,
        zInOverworld: -318.01,
        angle: -45.53,
        angleWithoutCorrection: -45.53,
        correction: 0,
        correctionIncrements: 0,
        error: 0.0155,
        type: 'NORMAL',
      },
    ],
    predictions: [
      { chunkX: 146, chunkZ: 49, certainty: 0.8287, overworldDistance: 1579.3 },
      { chunkX: 147, chunkZ: 50, certainty: 0.1031, overworldDistance: 1601.9 },
      { chunkX: 145, chunkZ: 48, certainty: 0.068, overworldDistance: 1556.7 },
      { chunkX: 148, chunkZ: 51, certainty: 0.00019, overworldDistance: 1624.5 },
      { chunkX: 144, chunkZ: 47, certainty: 0.00004, overworldDistance: 1534 },
    ],
  },
  blind: {
    isBlindModeEnabled: false,
    hasDivine: false,
    blindResult: {
      evaluation: 'HIGHROLL_GOOD',
      xInNether: -217.82,
      zInNether: 6.88,
      highrollThreshold: 400,
      highrollProbability: 0.1007,
      improveDirection: 1.5392,
      improveDistance: 8.07,
      averageDistance: 1087,
    },
  },
  divine: {
    isDivineModeEnabled: false,
    divineResult: {
      fossilXCoordinate: 5,
      formattedSafeCoords: '(-142, 213), (-113, -230), (255, 17)',
      formattedHighrollCoords: '(-106, 158), (-84, -170), (190, 12)',
    },
  },
  boat: {
    boatAngle: -77.34375,
    boatState: 'VALID',
  },
  informationMessages: {
    informationMessages: [
      {
        severity: 'INFO',
        type: 'COMBINED_CERTAINTY',
        message: 'Nether coords (293, 99) have 93.2% combined chance across the top offsets.',
      },
    ],
  },
  allAdvancements: {
    isAllAdvancementsModeEnabled: false,
    spawn: { xInOverworld: -215, zInOverworld: 185, travelAngle: 134.48, overworldDistance: 5007 },
    monument: { xInOverworld: 3357, zInOverworld: 3693, travelAngle: 141.58, overworldDistance: 1 },
    stronghold: { xInOverworld: 2212, zInOverworld: -396, travelAngle: 164.35, overworldDistance: 4247 },
    outpost: {},
    deepDark: {},
    cityQuery: {},
    shulkerTransport: {},
    generalLocation: {},
  },
}

export function getNinjabrainDisplayMode(snapshot: NinjabrainSnapshot): NinjabrainDisplayMode {
  if (snapshot.allAdvancements.isAllAdvancementsModeEnabled) return 'all-advancements'
  if (snapshot.divine.isDivineModeEnabled || snapshot.stronghold.resultType === 'DIVINE') return 'divine'
  if (snapshot.blind.isBlindModeEnabled || snapshot.stronghold.resultType === 'BLIND') return 'blind'
  return 'stronghold'
}

export function getPredictionCoordinates(prediction: StrongholdPrediction) {
  const overworldX = prediction.chunkX * 16 + 4
  const overworldZ = prediction.chunkZ * 16 + 4
  return {
    overworldX,
    overworldZ,
    netherX: Math.round(overworldX / 8),
    netherZ: Math.round(overworldZ / 8),
  }
}

export function stripNinjabrainHtml(message: string) {
  return message
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()
}

function isPrivateIpv4(hostname: string) {
  const parts = hostname.split('.').map(Number)
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false
  }
  return (
    parts[0] === 10 ||
    parts[0] === 127 ||
    (parts[0] === 169 && parts[1] === 254) ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168)
  )
}

export function normalizeNinjabrainAddress(input: string) {
  const trimmed = input.trim().replace(/\/+$/, '')
  if (!trimmed) throw new Error('Enter the gaming PC\'s IPv4 address.')

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`
  let parsed: URL
  try {
    parsed = new URL(withProtocol)
  } catch {
    throw new Error('That address does not look right. Try something like 192.168.1.42.')
  }

  if (parsed.protocol !== 'http:') {
    throw new Error('Ninjabrain Bot uses HTTP. Enter only the PC address, not an https:// link.')
  }

  const hostname = parsed.hostname.toLowerCase()
  const allowed =
    hostname === 'localhost' ||
    hostname.endsWith('.local') ||
    isPrivateIpv4(hostname) ||
    hostname === '[::1]' ||
    hostname.startsWith('[fe80:') ||
    hostname.startsWith('[fc') ||
    hostname.startsWith('[fd')

  if (!allowed) {
    throw new Error('Use the PC\'s private Wi-Fi address, usually starting with 192.168, 10, or 172.')
  }

  parsed.port = parsed.port || String(NINJABRAIN_PORT)
  parsed.pathname = ''
  parsed.search = ''
  parsed.hash = ''
  return parsed.origin
}
