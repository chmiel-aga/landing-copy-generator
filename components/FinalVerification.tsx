'use client'

import { useState } from 'react'
import type { GeneratedCopy } from '@/lib/prompts'
import type { BrandProfile } from '@/lib/brand-context'
import { getApiKey } from '@/lib/api-key'

interface Props {
  copy: GeneratedCopy
  brandProfile: BrandProfile | null
  onCopyUpdate: (newCopy: GeneratedCopy) => void
  onDone: () => void
}

const CHECKLIST = [
  'Headline mówi o bólu lub wyniku — nie o produkcie',
  'Copy pisze do właściwego poziomu świadomości odbiorcy',
  'Są prawdziwe dowody: case studies, liczby, opinie z wynikami',
  'Jest urgency i jego uzasadnienie (bez fałszywych timerów)',
  'Social proof jest wiarygodny — nie pusta sala',
  'Usunięto buzzwordy i korporacyjny żargon',
  'Ton pasuje do medium i rynku PL (nie brzmi jak infomercial)',
  'FAQ zamyka obiekcje zakupowe, a nie tylko edukuje',
  'Struktura działa na mobile: krótkie sekcje, CTA widoczne bez scrollowania',
  'Wszystkie placeholdery [DO UZUPEŁNIENIA] są oznaczone i opisane',
]

export default function FinalVerification({ copy, brandProfile, onCopyUpdate, onDone }: Props) {
  const [mediumContext, setMediumContext] = useState(
    'Landing page na mobile, ruch z reklamy Meta lub Google, polski rynek B2B',
  )
  const [isCorrecting, setIsCorrecting] = useState(false)
  const [correctionDone, setCorrectionDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checked, setChecked] = useState<boolean[]>(Array(CHECKLIST.length).fill(false))

  const checkedCount = checked.filter(Boolean).length

  const toggleItem = (i: number) => {
    setChecked((prev) => prev.map((v, idx) => (idx === i ? !v : v)))
  }

  const runCorrection = async () => {
    setIsCorrecting(true)
    setError(null)

    try {
      const res = await fetch('/api/contextual-correction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-anthropic-api-key': getApiKey() ?? '' },
        body: JSON.stringify({ copy, mediumContext, brandProfile }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Błąd korekty')
      onCopyUpdate(data.copy)
      setCorrectionDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nieoczekiwany błąd')
    } finally {
      setIsCorrecting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Contextual correction */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-800">Korekta kontekstowa</h4>
          <span className="text-xs text-amber-600 font-medium">obowiązkowa</span>
        </div>

        {correctionDone ? (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-4 py-3">
            <span>✓</span>
            <span>Korekta kontekstowa wykonana — copy dopasowane do medium</span>
          </div>
        ) : (
          <>
            <textarea
              value={mediumContext}
              onChange={(e) => setMediumContext(e.target.value)}
              rows={2}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="np. landing page na mobile, ruch z reklamy Meta, polski rynek B2B"
            />
            {error && (
              <p className="text-xs text-red-600">{error}</p>
            )}
            <button
              onClick={runCorrection}
              disabled={isCorrecting}
              className="w-full bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isCorrecting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Wykonuję korektę...
                </>
              ) : (
                'Wykonaj korektę końcową'
              )}
            </button>
            <p className="text-xs text-gray-400">
              Usuwa archaizmy, dostosowuje do polskiego rynku 2026 i medium
            </p>
          </>
        )}
      </div>

      {/* Quality checklist */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-800">Checklist przed oddaniem</h4>
          <span className="text-xs text-gray-400 font-medium">
            {checkedCount}/{CHECKLIST.length}
          </span>
        </div>

        <div className="space-y-2">
          {CHECKLIST.map((item, i) => (
            <label
              key={i}
              className="flex items-start gap-3 cursor-pointer group"
            >
              <div
                className={`mt-0.5 w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${
                  checked[i]
                    ? 'border-green-500 bg-green-500'
                    : 'border-gray-300 group-hover:border-gray-400'
                }`}
                onClick={() => toggleItem(i)}
              >
                {checked[i] && (
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
              <span
                className={`text-sm leading-relaxed transition-colors ${
                  checked[i] ? 'text-gray-400 line-through' : 'text-gray-700'
                }`}
                onClick={() => toggleItem(i)}
              >
                {item}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Done */}
      {correctionDone && checkedCount === CHECKLIST.length && (
        <button
          onClick={onDone}
          className="w-full bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-3 rounded-lg transition-colors"
        >
          Gotowe — copy do oddania klientowi ✓
        </button>
      )}
    </div>
  )
}
