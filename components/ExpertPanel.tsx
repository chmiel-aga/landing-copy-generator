'use client'

import { useState, useEffect } from 'react'
import type { GeneratedCopy, ExpertOpinion, PanelVariant } from '@/lib/prompts'
import { PANEL_CONFIG, defaultPanelVariant } from '@/lib/prompts'
import type { BrandProfile } from '@/lib/brand-context'
import { getApiKey } from '@/lib/api-key'

interface Props {
  copy: GeneratedCopy
  brandProfile: BrandProfile | null
  onCopyUpdate: (newCopy: GeneratedCopy) => void
  onAdvanceToVerification: () => void
  iterationRound: number
  pageType: string
}

type Phase = 'idle' | 'loading-critique' | 'critique-ready' | 'implementing'

const MAX_ROUNDS = 3

export default function ExpertPanel({
  copy,
  brandProfile,
  onCopyUpdate,
  onAdvanceToVerification,
  iterationRound,
  pageType,
}: Props) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [panelVariant, setPanelVariant] = useState<PanelVariant>(() =>
    defaultPanelVariant(pageType),
  )
  const [showVariantPicker, setShowVariantPicker] = useState(false)
  const [opinions, setOpinions] = useState<ExpertOpinion[]>([])
  const [selectedExperts, setSelectedExperts] = useState<string[]>([])
  const [lastImplementedExperts, setLastImplementedExperts] = useState<string[]>([])
  const [implementingStep, setImplementingStep] = useState<{
    current: number
    total: number
    expertName: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setPanelVariant(defaultPanelVariant(pageType))
  }, [pageType])

  const canRunMoreRounds = iterationRound < MAX_ROUNDS

  const isConflicted = (name: string): boolean => {
    return selectedExperts.some((sel) => {
      const op = opinions.find((o) => o.expert === sel)
      return op?.conflictsWith?.includes(name)
    })
  }

  const toggleExpert = (name: string) => {
    if (isConflicted(name)) return
    setSelectedExperts((prev) =>
      prev.includes(name) ? prev.filter((e) => e !== name) : [...prev, name],
    )
  }

  const runPanel = async () => {
    setPhase('loading-critique')
    setError(null)
    setSelectedExperts([])
    setShowVariantPicker(false)

    try {
      const res = await fetch('/api/panel-critique', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-anthropic-api-key': getApiKey() ?? '' },
        body: JSON.stringify({
          copy,
          panelVariant,
          round: iterationRound + 1,
          previousExpert:
            lastImplementedExperts.length > 0 ? lastImplementedExperts.join(', ') : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Błąd panelu')
      setOpinions(Array.isArray(data.opinions) ? data.opinions : [])
      setPhase('critique-ready')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nieoczekiwany błąd')
      setPhase('idle')
    }
  }

  const implementFeedback = async () => {
    if (selectedExperts.length === 0) return

    setPhase('implementing')
    setError(null)

    let currentCopy = copy

    for (let i = 0; i < selectedExperts.length; i++) {
      const expertName = selectedExperts[i]
      const opinion = opinions.find((o) => o.expert === expertName)
      if (!opinion) continue

      setImplementingStep({ current: i + 1, total: selectedExperts.length, expertName })

      try {
        const res = await fetch('/api/implement-feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-anthropic-api-key': getApiKey() ?? '' },
          body: JSON.stringify({
            copy: currentCopy,
            expertName,
            recommendation: opinion.recommendation,
            brandProfile,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? `Błąd wdrażania: ${expertName}`)
        currentCopy = data.copy
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Nieoczekiwany błąd')
        setPhase('critique-ready')
        setImplementingStep(null)
        return
      }
    }

    setLastImplementedExperts(selectedExperts)
    onCopyUpdate(currentCopy)
    setPhase('idle')
    setOpinions([])
    setSelectedExperts([])
    setImplementingStep(null)
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Loading */}
      {(phase === 'loading-critique' || phase === 'implementing') && (
        <div className="flex items-center gap-3 py-2">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin shrink-0" />
          <p className="text-sm text-gray-600">
            {phase === 'loading-critique' && 'Eksperci analizują copy...'}
            {phase === 'implementing' &&
              implementingStep &&
              `Wdrażam ${implementingStep.current}/${implementingStep.total}: ${implementingStep.expertName.split(' ').pop()}...`}
          </p>
        </div>
      )}

      {/* Idle: launch panel */}
      {phase === 'idle' && canRunMoreRounds && (
        <div className="space-y-3">
          <div>
            <button
              onClick={() => setShowVariantPicker((v) => !v)}
              className="flex items-center gap-2 text-sm transition-colors"
            >
              <span className="font-medium text-gray-700">{PANEL_CONFIG[panelVariant].label}</span>
              <span className="text-gray-400 text-xs">{showVariantPicker ? '▲' : '▼'}</span>
            </button>

            {showVariantPicker && (
              <div className="mt-2 border border-gray-100 rounded-lg overflow-hidden">
                {(Object.keys(PANEL_CONFIG) as PanelVariant[]).map((v) => (
                  <button
                    key={v}
                    onClick={() => {
                      setPanelVariant(v)
                      setShowVariantPicker(false)
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      v === panelVariant
                        ? 'bg-indigo-50 text-indigo-800 font-medium'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <span className="font-medium">{PANEL_CONFIG[v].label}</span>
                    <span className="block text-xs text-gray-400 mt-0.5">
                      {PANEL_CONFIG[v].when}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={runPanel}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            Uruchom panel ekspertów
            {iterationRound > 0 && (
              <span className="text-indigo-200 font-normal">— runda {iterationRound + 1}</span>
            )}
          </button>

          {iterationRound === 0 && (
            <p className="text-xs text-gray-400 text-center">
              5 mistrzów copywritingu oceni Twoje copy z różnych perspektyw
            </p>
          )}
        </div>
      )}

      {/* Max rounds reached */}
      {phase === 'idle' && !canRunMoreRounds && (
        <p className="text-xs text-amber-600 text-center py-1">
          Eksperci zaczynają się powtarzać — przejdź do weryfikacji końcowej.
        </p>
      )}

      {/* Expert cards */}
      {phase === 'critique-ready' && opinions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Wybierz rekomendacje do wdrożenia:
            </p>
            {selectedExperts.length > 0 && (
              <span className="text-xs bg-indigo-100 text-indigo-700 font-medium px-2 py-0.5 rounded-full">
                wybrano: {selectedExperts.length}
              </span>
            )}
          </div>

          {opinions.map((opinion) => {
            const isSelected = selectedExperts.includes(opinion.expert)
            const conflicted = !isSelected && isConflicted(opinion.expert)
            const conflictingWith = conflicted
              ? selectedExperts.filter((sel) =>
                  opinions.find((o) => o.expert === sel)?.conflictsWith?.includes(opinion.expert),
                )
              : []

            return (
              <button
                key={opinion.expert}
                onClick={() => toggleExpert(opinion.expert)}
                disabled={conflicted}
                className={`w-full text-left rounded-lg border p-4 transition-all ${
                  isSelected
                    ? 'border-indigo-400 bg-indigo-50 ring-1 ring-indigo-300'
                    : conflicted
                      ? 'border-gray-100 bg-gray-50 opacity-40 cursor-not-allowed'
                      : 'border-gray-100 hover:border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-sm font-semibold text-gray-900">{opinion.expert}</span>
                    {opinion.targetElement && (
                      <span className="ml-2 text-xs text-gray-400">→ {opinion.targetElement}</span>
                    )}
                  </div>
                  <div
                    className={`mt-0.5 w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${
                      isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300 bg-white'
                    }`}
                  >
                    {isSelected && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 8">
                        <path
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M1 4l3 3 5-6"
                        />
                      </svg>
                    )}
                  </div>
                </div>

                {conflicted && conflictingWith.length > 0 && (
                  <p className="text-xs text-amber-600 mb-2">
                    Wyklucza się z: {conflictingWith.join(', ')} (ten sam element)
                  </p>
                )}

                {opinion.conflictsWith && opinion.conflictsWith.length > 0 && !conflicted && (
                  <p className="text-xs text-gray-400 mb-2">
                    Uwaga: wyklucza się z {opinion.conflictsWith.join(', ')}
                  </p>
                )}

                <div className="space-y-1.5 text-xs">
                  <p className="text-green-700">
                    <span className="font-medium">+ Mocne: </span>
                    {opinion.strengths}
                  </p>
                  <p className="text-amber-700">
                    <span className="font-medium">⚠ Problem: </span>
                    {opinion.critique}
                  </p>
                  <p className="text-gray-700 bg-white rounded p-2 border border-gray-100 mt-2">
                    <span className="font-medium text-indigo-700">→ Rekomendacja: </span>
                    {opinion.recommendation}
                  </p>
                </div>
              </button>
            )
          })}

          <button
            onClick={implementFeedback}
            disabled={selectedExperts.length === 0}
            className={`w-full text-sm font-medium px-4 py-2.5 rounded-lg transition-colors ${
              selectedExperts.length > 0
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {selectedExperts.length === 0
              ? 'Wybierz eksperta'
              : selectedExperts.length === 1
                ? `Wdróż radę ${selectedExperts[0].split(' ').pop()}`
                : `Wdróż ${selectedExperts.length} rekomendacje (sekwencyjnie)`}
          </button>
        </div>
      )}

      {/* Advance to verification */}
      {phase === 'idle' && iterationRound >= 1 && (
        <div className="border-t border-gray-100 pt-4">
          <button
            onClick={onAdvanceToVerification}
            className="w-full text-sm font-medium text-gray-700 hover:text-indigo-600 border border-gray-200 hover:border-indigo-300 px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            Przejdź do weryfikacji końcowej →
          </button>
        </div>
      )}
    </div>
  )
}
