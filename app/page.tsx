'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import {
  BrandProfile,
  SavedProfile,
  getAllProfiles,
  getActiveProfileEntry,
  switchToProfile,
  getCompletionScore,
  isProfileComplete,
} from '@/lib/brand-context'
import type { GeneratedCopy } from '@/lib/prompts'
import LandingPageForm from '@/components/LandingPageForm'
import CopyOutput from '@/components/CopyOutput'
import ExpertPanel from '@/components/ExpertPanel'
import FinalVerification from '@/components/FinalVerification'

export type { GeneratedCopy }

// ─── Accordion ────────────────────────────────────────────────────────────────

function Accordion({
  step,
  title,
  subtitle,
  isOpen,
  isCompleted,
  isLocked,
  onToggle,
  children,
}: {
  step: number
  title: string
  subtitle?: string
  isOpen: boolean
  isCompleted: boolean
  isLocked: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div
      className={`bg-white rounded-xl border transition-colors ${
        isOpen ? 'border-indigo-200 shadow-sm' : 'border-gray-200'
      }`}
    >
      <button
        onClick={() => !isLocked && onToggle()}
        disabled={isLocked}
        className={`w-full flex items-center gap-3 px-5 py-4 text-left transition-colors rounded-xl ${
          isLocked ? 'cursor-default opacity-40' : 'hover:bg-gray-50 cursor-pointer'
        }`}
      >
        {/* Step badge */}
        <div
          className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold transition-colors ${
            isCompleted
              ? 'bg-green-500 text-white'
              : isOpen
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-400'
          }`}
        >
          {isCompleted ? (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 12 10">
              <path
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M1 5l4 4 6-8"
              />
            </svg>
          ) : (
            step
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>

        {!isLocked && (
          <svg
            className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 16 16"
          >
            <path
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 6l4 4 4-4"
            />
          </svg>
        )}
      </button>

      {/* Content — always mounted (hidden with CSS) to preserve component state */}
      <div className={isOpen ? '' : 'hidden'}>
        <div className="border-t border-gray-100 px-5 py-5">{children}</div>
      </div>
    </div>
  )
}

// ─── Home ─────────────────────────────────────────────────────────────────────

export default function Home() {
  // Profile state
  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null)
  const [allProfiles, setAllProfiles] = useState<SavedProfile[]>([])
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null)
  const [activeProfileName, setActiveProfileName] = useState<string>('')
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Copy state
  const [generatedCopy, setGeneratedCopy] = useState<GeneratedCopy | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [cacheInfo, setCacheInfo] = useState<{
    cacheReadTokens?: number
    cacheWriteTokens?: number
  } | null>(null)
  const [iterationRound, setIterationRound] = useState(0)
  const [activePageType, setActivePageType] = useState('launch')

  // Step flow: 0=project, 1=panel, 2=verification
  const [activeStep, setActiveStep] = useState<0 | 1 | 2>(0)
  const [panelDone, setPanelDone] = useState(false)
  const [allDone, setAllDone] = useState(false)

  useEffect(() => {
    const profiles = getAllProfiles()
    setAllProfiles(profiles)
    const active = getActiveProfileEntry()
    if (active) {
      setBrandProfile(active.profile)
      setActiveProfileId(active.id)
      setActiveProfileName(active.name)
    }
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowProfileDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSwitchProfile = useCallback((sp: SavedProfile) => {
    const newProfile = switchToProfile(sp.id)
    setBrandProfile(newProfile)
    setActiveProfileId(sp.id)
    setActiveProfileName(sp.name)
    setShowProfileDropdown(false)
    setGeneratedCopy(null)
    setIterationRound(0)
    setCacheInfo(null)
    setGenerateError(null)
    setActiveStep(0)
    setPanelDone(false)
    setAllDone(false)
  }, [])

  const handleGenerate = useCallback(
    async (pageType: string, pageGoal: string, brief?: string, ownDraft?: string) => {
      setIsGenerating(true)
      setGenerateError(null)
      setGeneratedCopy(null)
      setCacheInfo(null)
      setIterationRound(0)
      setActivePageType(pageType)
      setPanelDone(false)
      setAllDone(false)

      try {
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ brandProfile, pageType, pageGoal, brief, ownDraft }),
        })

        const data = await response.json()

        if (!response.ok) throw new Error(data.error ?? 'Błąd generowania')

        setGeneratedCopy(data.copy as GeneratedCopy)
        setCacheInfo(data.usage)
        setActiveStep(1) // advance to panel
      } catch (err) {
        setGenerateError(err instanceof Error ? err.message : 'Wystąpił nieoczekiwany błąd')
      } finally {
        setIsGenerating(false)
      }
    },
    [brandProfile],
  )

  const handleCopyUpdate = useCallback((newCopy: GeneratedCopy) => {
    setGeneratedCopy(newCopy)
    setIterationRound((r) => r + 1)
    setCacheInfo(null)
  }, [])

  const handleCopyChange = useCallback((updated: GeneratedCopy) => {
    setGeneratedCopy(updated)
  }, [])

  const handleAdvanceToVerification = useCallback(() => {
    setPanelDone(true)
    setActiveStep(2)
  }, [])

  const completion = getCompletionScore(brandProfile)
  const profileComplete = isProfileComplete(brandProfile)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Empatify</h1>
            <p className="text-xs text-gray-400">Generator copy landing page</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Completion dots */}
            <div className="flex gap-1">
              {Array.from({ length: completion.total }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i < completion.score ? 'bg-indigo-500' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>

            {/* Profile switcher */}
            {allProfiles.length > 0 && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowProfileDropdown((v) => !v)}
                  className="flex items-center gap-1.5 text-sm border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors max-w-[160px]"
                >
                  <span className="truncate text-gray-700 font-medium">
                    {activeProfileName || 'Bez nazwy'}
                  </span>
                  {allProfiles.length > 1 && <span className="text-gray-400 shrink-0">▾</span>}
                </button>

                {showProfileDropdown && allProfiles.length > 1 && (
                  <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-20">
                    {allProfiles.map((sp) => (
                      <button
                        key={sp.id}
                        onClick={() => handleSwitchProfile(sp)}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                          sp.id === activeProfileId
                            ? 'bg-indigo-50 text-indigo-800 font-medium'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {sp.name || 'Bez nazwy'}
                      </button>
                    ))}
                    <div className="border-t border-gray-100">
                      <Link
                        href="/setup"
                        className="block px-4 py-2.5 text-sm text-indigo-600 hover:bg-indigo-50 transition-colors"
                        onClick={() => setShowProfileDropdown(false)}
                      >
                        Zarządzaj profilami →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            <Link
              href="/setup"
              className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shrink-0"
            >
              {brandProfile ? 'Edytuj markę' : 'Skonfiguruj markę'}
            </Link>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!profileComplete && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-amber-800 text-sm">
              <span className="font-semibold">Profil marki niekompletny.</span> Brakuje:{' '}
              {completion.missing.join(', ')}.{' '}
              <Link href="/setup" className="underline font-medium hover:text-amber-900">
                Uzupełnij profil marki
              </Link>{' '}
              aby copy było lepiej dopasowane do marki.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* ── Left: accordions ─────────────────────────────── */}
          <div className="space-y-3">
            {/* Step 1: Project info */}
            <Accordion
              step={1}
              title="Informacje o projekcie"
              subtitle="Typ strony, cel, kontekst"
              isOpen={activeStep === 0}
              isCompleted={!!generatedCopy}
              isLocked={false}
              onToggle={() => setActiveStep(0)}
            >
              <LandingPageForm
                brandProfile={brandProfile}
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
              />
              {generateError && (
                <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                  {generateError}
                </p>
              )}
            </Accordion>

            {/* Step 2: Expert panel */}
            <Accordion
              step={2}
              title="Panel Ekspertów"
              subtitle="Ocena i iteracja copy"
              isOpen={activeStep === 1}
              isCompleted={panelDone}
              isLocked={!generatedCopy}
              onToggle={() => setActiveStep(1)}
            >
              {generatedCopy && (
                <ExpertPanel
                  copy={generatedCopy}
                  brandProfile={brandProfile}
                  onCopyUpdate={handleCopyUpdate}
                  onAdvanceToVerification={handleAdvanceToVerification}
                  iterationRound={iterationRound}
                  pageType={activePageType}
                />
              )}
            </Accordion>

            {/* Step 3: Final verification */}
            <Accordion
              step={3}
              title="Weryfikacja końcowa"
              subtitle="Korekta kontekstowa i checklist"
              isOpen={activeStep === 2}
              isCompleted={allDone}
              isLocked={!generatedCopy}
              onToggle={() => setActiveStep(2)}
            >
              {generatedCopy && (
                <FinalVerification
                  copy={generatedCopy}
                  brandProfile={brandProfile}
                  onCopyUpdate={handleCopyUpdate}
                  onDone={() => setAllDone(true)}
                />
              )}
            </Accordion>
          </div>

          {/* ── Right: copy output (sticky) ──────────────────── */}
          <div className="lg:sticky lg:top-24">
            <CopyOutput
              copy={generatedCopy}
              isGenerating={isGenerating}
              error={generateError}
              cacheInfo={cacheInfo}
              iterationRound={iterationRound}
              onCopyChange={handleCopyChange}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
