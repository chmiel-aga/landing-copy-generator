'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  BrandProfile,
  SavedProfile,
  getAllProfiles,
  getActiveProfileEntry,
  saveNamedProfile,
  switchToProfile,
  deleteProfile,
  createNewProfile,
  emptyBrandProfile,
} from '@/lib/brand-context'
import BrandProfileForm from '@/components/BrandProfileForm'
import DocumentUpload from '@/components/DocumentUpload'

export default function SetupPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<BrandProfile>(emptyBrandProfile())
  const [profileId, setProfileId] = useState<string>('')
  const [profileName, setProfileName] = useState<string>('')
  const [allProfiles, setAllProfiles] = useState<SavedProfile[]>([])
  const [savedState, setSavedState] = useState<'idle' | 'saved'>('idle')

  useEffect(() => {
    const profiles = getAllProfiles()
    setAllProfiles(profiles)
    const active = getActiveProfileEntry()
    if (active) {
      setProfile(active.profile)
      setProfileId(active.id)
      setProfileName(active.name)
    }
  }, [])

  const persistSave = (redirectAfter: boolean) => {
    const name = profileName.trim() || 'Bez nazwy'
    const id = profileId || crypto.randomUUID()
    saveNamedProfile(id, name, profile)
    setProfileId(id)
    setAllProfiles(getAllProfiles())
    if (redirectAfter) {
      router.push('/')
    } else {
      setSavedState('saved')
      setTimeout(() => setSavedState('idle'), 2000)
    }
  }

  const handleSwitchProfile = (sp: SavedProfile) => {
    switchToProfile(sp.id)
    setProfile(sp.profile)
    setProfileId(sp.id)
    setProfileName(sp.name)
  }

  const handleNewProfile = () => {
    const np = createNewProfile()
    setProfile(np.profile)
    setProfileId(np.id)
    setProfileName('')
  }

  const handleDeleteProfile = (id: string) => {
    deleteProfile(id)
    const remaining = getAllProfiles()
    setAllProfiles(remaining)
    if (remaining.length === 0) {
      router.push('/')
      return
    }
    if (id === profileId) {
      const next = remaining[0]
      switchToProfile(next.id)
      setProfile(next.profile)
      setProfileId(next.id)
      setProfileName(next.name)
    }
  }

  const handleExtracted = (extracted: Partial<BrandProfile>) => {
    setProfile((prev) => ({
      ...prev,
      archetype: extracted.archetype || prev.archetype,
      archetypeDescription: extracted.archetypeDescription || prev.archetypeDescription,
      targetPersona: extracted.targetPersona || prev.targetPersona,
      toneOfVoice:
        extracted.toneOfVoice && extracted.toneOfVoice.length > 0
          ? extracted.toneOfVoice
          : prev.toneOfVoice,
      vocabulary: {
        preferred:
          extracted.vocabulary?.preferred && extracted.vocabulary.preferred.length > 0
            ? extracted.vocabulary.preferred
            : prev.vocabulary.preferred,
        avoided:
          extracted.vocabulary?.avoided && extracted.vocabulary.avoided.length > 0
            ? extracted.vocabulary.avoided
            : prev.vocabulary.avoided,
      },
      brandEssence: extracted.brandEssence || prev.brandEssence,
      additionalContext: extracted.additionalContext
        ? prev.additionalContext
          ? prev.additionalContext + '\n\n' + extracted.additionalContext
          : extracted.additionalContext
        : prev.additionalContext,
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm transition-colors">
              ← Wróć
            </Link>
            <div className="h-4 w-px bg-gray-200" />
            <div>
              <h1 className="text-lg font-bold text-gray-900">Profil marki</h1>
              <p className="text-xs text-gray-400">Archetyp, persona, ton głosu</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => persistSave(false)}
              className="text-sm border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {savedState === 'saved' ? '✓ Zapisano' : 'Zapisz'}
            </button>
            <button
              onClick={() => persistSave(true)}
              className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Zapisz i wróć
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Profile switcher */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900">Twoje profile marek</h2>
            <button
              onClick={handleNewProfile}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors flex items-center gap-1"
            >
              + Nowy profil
            </button>
          </div>

          {allProfiles.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {allProfiles.map((sp) => (
                <div
                  key={sp.id}
                  className={`group flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full border text-sm transition-colors cursor-pointer ${
                    sp.id === profileId
                      ? 'border-indigo-400 bg-indigo-50 text-indigo-800 font-medium'
                      : 'border-gray-200 text-gray-600 hover:border-indigo-300 hover:bg-indigo-50/50'
                  }`}
                  onClick={() => handleSwitchProfile(sp)}
                >
                  <span>{sp.name || 'Bez nazwy'}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteProfile(sp.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all leading-none ml-0.5"
                    title="Usuń profil"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">
              Brak zapisanych profili. Wypełnij formularz i zapisz.
            </p>
          )}

          {/* Profile name input */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Nazwa aktywnego profilu
            </label>
            <input
              type="text"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="np. Empatify, Klient - Acme Corp, Marka premium..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
        </div>

        <DocumentUpload onExtracted={handleExtracted} />
        <BrandProfileForm profile={profile} onChange={setProfile} />

        <div className="flex justify-end pb-8">
          <button
            onClick={() => persistSave(true)}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Zapisz profil i wróć do generatora →
          </button>
        </div>
      </main>
    </div>
  )
}
