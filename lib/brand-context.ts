export interface BrandProfile {
  archetype: string
  archetypeDescription: string
  targetPersona: string
  toneOfVoice: string[]
  vocabulary: {
    preferred: string[]
    avoided: string[]
  }
  brandEssence: string
  additionalContext: string
}

export interface SavedProfile {
  id: string
  name: string
  profile: BrandProfile
  savedAt: number
}

export const BRAND_PROFILE_KEY = 'empatify_brand_profile' // kept only for one-time migration
const PROFILES_KEY = 'empatify_profiles'
const ACTIVE_ID_KEY = 'empatify_active_profile_id'

function migrateIfNeeded(): void {
  if (typeof window === 'undefined') return
  if (localStorage.getItem(PROFILES_KEY) !== null) return
  const old = localStorage.getItem(BRAND_PROFILE_KEY)
  if (!old) return
  try {
    const profile = JSON.parse(old) as BrandProfile
    const id = crypto.randomUUID()
    const sp: SavedProfile = { id, name: 'Moja marka', profile, savedAt: Date.now() }
    localStorage.setItem(PROFILES_KEY, JSON.stringify([sp]))
    localStorage.setItem(ACTIVE_ID_KEY, id)
  } catch {}
}

export function getAllProfiles(): SavedProfile[] {
  if (typeof window === 'undefined') return []
  try {
    migrateIfNeeded()
    const raw = localStorage.getItem(PROFILES_KEY)
    return raw ? (JSON.parse(raw) as SavedProfile[]) : []
  } catch {
    return []
  }
}

export function getActiveProfileId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(ACTIVE_ID_KEY)
}

export function getActiveProfileEntry(): SavedProfile | null {
  const profiles = getAllProfiles()
  if (profiles.length === 0) return null
  const id = getActiveProfileId()
  return profiles.find((p) => p.id === id) ?? profiles[0]
}

export function getBrandProfile(): BrandProfile | null {
  if (typeof window === 'undefined') return null
  try {
    migrateIfNeeded()
    return getActiveProfileEntry()?.profile ?? null
  } catch {
    return null
  }
}

export function saveBrandProfile(profile: BrandProfile): void {
  if (typeof window === 'undefined') return
  const active = getActiveProfileEntry()
  if (active) {
    saveNamedProfile(active.id, active.name, profile)
  } else {
    saveNamedProfile(crypto.randomUUID(), 'Moja marka', profile)
  }
}

export function saveNamedProfile(id: string, name: string, profile: BrandProfile): void {
  if (typeof window === 'undefined') return
  migrateIfNeeded()
  const profiles = getAllProfiles()
  const idx = profiles.findIndex((p) => p.id === id)
  const entry: SavedProfile = {
    id,
    name: name.trim() || 'Bez nazwy',
    profile,
    savedAt: Date.now(),
  }
  if (idx >= 0) {
    profiles[idx] = entry
  } else {
    profiles.push(entry)
  }
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles))
  localStorage.setItem(ACTIVE_ID_KEY, id)
}

export function createNewProfile(): SavedProfile {
  return {
    id: crypto.randomUUID(),
    name: '',
    profile: emptyBrandProfile(),
    savedAt: Date.now(),
  }
}

export function switchToProfile(id: string): BrandProfile | null {
  if (typeof window === 'undefined') return null
  localStorage.setItem(ACTIVE_ID_KEY, id)
  return getActiveProfileEntry()?.profile ?? null
}

export function deleteProfile(id: string): void {
  if (typeof window === 'undefined') return
  const profiles = getAllProfiles().filter((p) => p.id !== id)
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles))
  if (getActiveProfileId() === id) {
    if (profiles[0]) {
      localStorage.setItem(ACTIVE_ID_KEY, profiles[0].id)
    } else {
      localStorage.removeItem(ACTIVE_ID_KEY)
    }
  }
}

export function emptyBrandProfile(): BrandProfile {
  return {
    archetype: '',
    archetypeDescription: '',
    targetPersona: '',
    toneOfVoice: [],
    vocabulary: { preferred: [], avoided: [] },
    brandEssence: '',
    additionalContext: '',
  }
}

export function getCompletionScore(profile: BrandProfile | null): {
  score: number
  total: number
  missing: string[]
} {
  const total = 5
  if (!profile) {
    return {
      score: 0,
      total,
      missing: ['archetyp marki', 'persona', 'ton głosu', 'esencja marki', 'słownictwo'],
    }
  }

  const missing: string[] = []
  let score = 0

  if (profile.archetype) score++
  else missing.push('archetyp marki')

  if (profile.targetPersona) score++
  else missing.push('persona')

  if (profile.toneOfVoice.length > 0) score++
  else missing.push('ton głosu')

  if (profile.brandEssence) score++
  else missing.push('esencja marki')

  if (profile.vocabulary.preferred.length > 0 || profile.vocabulary.avoided.length > 0) score++
  else missing.push('słownictwo')

  return { score, total, missing }
}

export function isProfileComplete(profile: BrandProfile | null): boolean {
  if (!profile) return false
  return !!(profile.archetype && profile.targetPersona && profile.toneOfVoice.length > 0)
}
