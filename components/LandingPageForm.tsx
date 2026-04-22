'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import type { BrandProfile } from '@/lib/brand-context'
import { isProfileComplete, getCompletionScore } from '@/lib/brand-context'
import { LANDING_PAGE_TYPES } from '@/lib/prompts'

interface Props {
  brandProfile: BrandProfile | null
  onGenerate: (pageType: string, pageGoal: string, brief?: string, ownDraft?: string) => void
  isGenerating: boolean
}

const MAX_BRIEF_FILES = 3

export default function LandingPageForm({ brandProfile, onGenerate, isGenerating }: Props) {
  const [brief, setBrief] = useState('')
  const [pageType, setPageType] = useState('launch')
  const [pageGoal, setPageGoal] = useState('')
  const [isSuggestingGoal, setIsSuggestingGoal] = useState(false)
  const [showOwnDraft, setShowOwnDraft] = useState(false)
  const [ownDraft, setOwnDraft] = useState('')
  const [isExtractingFiles, setIsExtractingFiles] = useState(false)
  const [extractProgress, setExtractProgress] = useState<{ current: number; total: number } | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const profileOk = isProfileComplete(brandProfile)
  const completion = getCompletionScore(brandProfile)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!pageGoal.trim() || isGenerating) return
    onGenerate(pageType, pageGoal.trim(), brief.trim() || undefined, ownDraft.trim() || undefined)
  }

  const handleSuggestGoal = async () => {
    if (!brief.trim()) return
    setIsSuggestingGoal(true)
    try {
      const res = await fetch('/api/suggest-goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief: brief.trim(), pageType }),
      })
      if (!res.ok) {
        let errorMsg = 'Błąd sugestii celu'
        try {
          const data = await res.json()
          errorMsg = data.error ?? errorMsg
        } catch {}
        setFileError(errorMsg)
        return
      }
      const data = await res.json()
      setPageGoal(data.goal)
    } catch (err) {
      setFileError(err instanceof Error ? err.message : 'Nie udało się zasugerować celu')
    } finally {
      setIsSuggestingGoal(false)
    }
  }

  const handleBriefFiles = async (files: FileList) => {
    const fileArray = Array.from(files).slice(0, MAX_BRIEF_FILES)
    if (fileArray.length === 0) return
    setIsExtractingFiles(true)
    setFileError(null)
    const texts: string[] = []
    const errors: string[] = []
    for (let i = 0; i < fileArray.length; i++) {
      setExtractProgress({ current: i + 1, total: fileArray.length })
      try {
        const formData = new FormData()
        formData.append('file', fileArray[i])
        const res = await fetch('/api/extract-text', { method: 'POST', body: formData })
        if (!res.ok) {
          let errorMsg = fileArray[i].name
          try {
            const data = await res.json()
            errorMsg = data.error ?? errorMsg
          } catch {}
          throw new Error(errorMsg)
        }
        const data = await res.json()
        texts.push(`--- ${data.filename} ---\n${data.text}`)
      } catch (err) {
        errors.push(err instanceof Error ? err.message : fileArray[i].name)
      }
    }
    setIsExtractingFiles(false)
    setExtractProgress(null)
    if (texts.length > 0) {
      setBrief((prev) => (prev.trim() ? prev.trim() + '\n\n' + texts.join('\n\n') : texts.join('\n\n')))
    }
    if (errors.length > 0) setFileError('Błąd odczytu: ' + errors.join(' • '))
  }

  return (
    <div className="space-y-6">
      {!profileOk && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-amber-800 text-sm">
            Profil marki ({completion.score}/{completion.total}) — brakuje:{' '}
            <span className="font-medium">{completion.missing.join(', ')}</span>.{' '}
            <Link href="/setup" className="underline hover:text-amber-900">Uzupełnij</Link>{' '}
            dla lepszych wyników.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── 1. Brief i kontekst ─────────────────────────── */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Brief projektu
            </label>
            <p className="text-xs text-gray-400 mb-2">
              Opisz odbiorcę, ofertę, kluczowe korzyści i kontekst kampanii
            </p>
            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="Dla kogo jest ta strona? Co oferujesz? Jakie są główne korzyści? Skąd trafi tutaj użytkownik?"
              rows={5}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* File upload for brief */}
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.docx,.txt"
              multiple
              onChange={(e) => {
                if (e.target.files?.length) handleBriefFiles(e.target.files)
                e.target.value = ''
              }}
            />
            <button
              type="button"
              disabled={isExtractingFiles}
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-indigo-600 border border-gray-200 hover:border-indigo-300 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
            >
              {isExtractingFiles && extractProgress ? (
                <>
                  <div className="w-3 h-3 border border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  Odczytuję {extractProgress.current}/{extractProgress.total}...
                </>
              ) : (
                <>📎 Załącz dokumenty (maks. {MAX_BRIEF_FILES})</>
              )}
            </button>
            <span className="text-xs text-gray-400">PDF, DOCX, TXT</span>
          </div>
          {fileError && <p className="text-xs text-red-500">{fileError}</p>}
        </div>

        {/* ── 2. Typ strony + cel ─────────────────────────── */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Typ landing page</label>
            <div className="grid grid-cols-2 gap-2">
              {LANDING_PAGE_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setPageType(type.value)}
                  className={`px-3 py-2.5 text-sm rounded-lg border text-left transition-colors ${
                    pageType === type.value
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-medium'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Cel strony <span className="text-red-400">*</span>
              </label>
              <button
                type="button"
                onClick={handleSuggestGoal}
                disabled={!brief.trim() || isSuggestingGoal}
                className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {isSuggestingGoal ? (
                  <>
                    <div className="w-3 h-3 border border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    Sugeruję...
                  </>
                ) : (
                  '✦ Zaproponuj cel na podstawie briefu'
                )}
              </button>
            </div>
            <textarea
              value={pageGoal}
              onChange={(e) => setPageGoal(e.target.value)}
              placeholder="Opisz cel: co użytkownik ma zrobić (CTA), jaki produkt/usługę promujesz, jakie są kluczowe korzyści, dla kogo jest oferta?"
              rows={4}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
            {!brief.trim() && (
              <p className="text-xs text-gray-400 mt-1">
                Wypełnij brief, aby zaproponować cel automatycznie
              </p>
            )}
          </div>
        </div>

        {/* ── 3. Własny draft (opcjonalny) ────────────────── */}
        <div>
          <button
            type="button"
            onClick={() => setShowOwnDraft((v) => !v)}
            className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1"
          >
            {showOwnDraft ? '− Usuń własny draft' : '+ Wklejam własny draft tekstu'}
          </button>

          {showOwnDraft && (
            <div className="mt-2 space-y-1">
              <p className="text-xs text-gray-400">
                Wklej swój szkic — AI go ulepsza zamiast pisać od zera
              </p>
              <textarea
                value={ownDraft}
                onChange={(e) => setOwnDraft(e.target.value)}
                placeholder="Wklej swój draft copy tutaj..."
                rows={6}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>
          )}
        </div>

        {/* ── Submit ──────────────────────────────────────── */}
        <button
          type="submit"
          disabled={!pageGoal.trim() || isGenerating}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generuję copy...
            </>
          ) : ownDraft.trim() ? (
            'Ulepsz draft →'
          ) : (
            'Generuj copy →'
          )}
        </button>
      </form>
    </div>
  )
}
