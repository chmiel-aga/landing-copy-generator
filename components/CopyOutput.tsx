'use client'

import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import type { GeneratedCopy, LandingSection } from '@/lib/prompts'
import { generateMarkdown, generateDocxBlob, openPrintWindow, triggerDownload } from '@/lib/export'

// ─── Auto-expanding textarea ──────────────────────────────────────────────────

function AutoTextarea({
  value,
  onChange,
  onKeyDown,
  className,
  placeholder,
  singleLine,
}: {
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  className?: string
  placeholder?: string
  singleLine?: boolean
}) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }, [value])

  useEffect(() => {
    if (ref.current) {
      ref.current.focus()
      const len = ref.current.value.length
      ref.current.setSelectionRange(len, len)
    }
  }, [])

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={onChange}
      onKeyDown={(e) => {
        if (singleLine && e.key === 'Enter') e.preventDefault()
        onKeyDown?.(e)
      }}
      placeholder={placeholder}
      rows={1}
      className={className}
      style={{ resize: 'none', overflow: 'hidden' }}
    />
  )
}

// ─── Export buttons ───────────────────────────────────────────────────────────

function ExportButtons({ copy }: { copy: GeneratedCopy }) {
  const [loadingDocx, setLoadingDocx] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-gray-400 mr-1">Pobierz:</span>
        {[
          {
            label: '.md',
            loading: false,
            onClick: () => {
              setExportError(null)
              const blob = new Blob([generateMarkdown(copy)], { type: 'text/markdown;charset=utf-8' })
              triggerDownload(blob, 'copy-landing-page.md')
            },
          },
          {
            label: '.docx',
            loading: loadingDocx,
            onClick: async () => {
              setExportError(null)
              setLoadingDocx(true)
              try {
                triggerDownload(await generateDocxBlob(copy), 'copy-landing-page.docx')
              } catch {
                setExportError('Nie udało się wygenerować pliku DOCX.')
              } finally {
                setLoadingDocx(false)
              }
            },
          },
          {
            label: '.pdf',
            loading: false,
            onClick: () => {
              setExportError(null)
              const opened = openPrintWindow(copy)
              if (!opened) setExportError('Przeglądarka zablokowała okno wydruku. Zezwól na pop-upy.')
            },
          },
        ].map(({ label, loading, onClick }) => (
          <button
            key={label}
            onClick={onClick}
            disabled={loading}
            className="text-xs font-mono border border-gray-200 text-gray-500 hover:border-indigo-300 hover:text-indigo-600 px-2 py-0.5 rounded transition-colors disabled:opacity-50"
          >
            {loading ? '…' : label}
          </button>
        ))}
      </div>
      {exportError && <p className="text-xs text-red-500">{exportError}</p>}
    </div>
  )
}

// ─── Section card ─────────────────────────────────────────────────────────────

function SectionCard({
  section,
  index,
  total,
  editingId,
  onStartEdit,
  onStopEdit,
  onUpdate,
  onMoveUp,
  onMoveDown,
  onToggle,
}: {
  section: LandingSection
  index: number
  total: number
  editingId: string | null
  onStartEdit: (id: string) => void
  onStopEdit: () => void
  onUpdate: (patch: Partial<LandingSection>) => void
  onMoveUp: () => void
  onMoveDown: () => void
  onToggle: () => void
}) {
  const titleId = `${section.id}_title`
  const bodyId = `${section.id}_body`
  const isEditingTitle = editingId === titleId
  const isEditingBody = editingId === bodyId

  const escHandler = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onStopEdit()
  }

  return (
    <div
      className={`rounded-xl border transition-colors ${
        section.enabled ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50'
      } ${!section.enabled ? 'opacity-50' : ''}`}
    >
      {/* Header row */}
      <div className="flex items-center gap-2 px-4 py-3">
        <span className="text-xs text-gray-300 font-mono shrink-0 w-4 text-right select-none">
          {index + 1}
        </span>

        {/* Title */}
        <div className="flex-1 min-w-0">
          {isEditingTitle ? (
            <AutoTextarea
              value={section.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
              onKeyDown={escHandler}
              singleLine
              className="w-full text-sm font-semibold text-gray-900 bg-transparent border-b border-indigo-300 focus:outline-none leading-snug py-0"
            />
          ) : (
            <button
              onClick={() => onStartEdit(titleId)}
              className="text-sm font-semibold text-gray-800 hover:text-indigo-700 transition-colors text-left w-full truncate"
              title="Kliknij, aby edytować tytuł"
            >
              {section.title}
            </button>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-0.5 shrink-0 ml-1">
          <button
            onClick={onMoveUp}
            disabled={index === 0}
            title="Przesuń wyżej"
            className="p-1 text-gray-300 hover:text-gray-500 disabled:opacity-20 disabled:cursor-not-allowed rounded transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 12 12">
              <path
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 9V3m0 0L3 6m3-3 3 3"
              />
            </svg>
          </button>
          <button
            onClick={onMoveDown}
            disabled={index === total - 1}
            title="Przesuń niżej"
            className="p-1 text-gray-300 hover:text-gray-500 disabled:opacity-20 disabled:cursor-not-allowed rounded transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 12 12">
              <path
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 3v6m0 0 3-3m-3 3-3-3"
              />
            </svg>
          </button>
          <button
            onClick={onToggle}
            title={section.enabled ? 'Wyłącz sekcję' : 'Włącz sekcję'}
            className={`p-1 rounded transition-colors ml-0.5 ${
              section.enabled
                ? 'text-indigo-400 hover:text-indigo-600'
                : 'text-gray-300 hover:text-gray-500'
            }`}
          >
            {section.enabled ? (
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 12 12">
                <circle cx="6" cy="6" r="5" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 12 12">
                <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Body — only when enabled */}
      {section.enabled && (
        <div className="border-t border-gray-100 px-4 py-3">
          {isEditingBody ? (
            <AutoTextarea
              value={section.body}
              onChange={(e) => onUpdate({ body: e.target.value })}
              onKeyDown={escHandler}
              placeholder="Treść sekcji..."
              className="w-full text-sm text-gray-800 leading-relaxed bg-gray-50 border border-indigo-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          ) : (
            <p
              onClick={() => onStartEdit(bodyId)}
              className={`text-sm leading-relaxed whitespace-pre-wrap cursor-text ${
                section.body ? 'text-gray-700' : 'text-gray-300 italic'
              }`}
              title="Kliknij, aby edytować"
            >
              {section.body || 'Kliknij, aby dodać treść...'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  copy: GeneratedCopy | null
  isGenerating: boolean
  error: string | null
  cacheInfo?: { cacheReadTokens?: number; cacheWriteTokens?: number } | null
  iterationRound?: number
  onCopyChange?: (updated: GeneratedCopy) => void
}

export default function CopyOutput({
  copy,
  isGenerating,
  error,
  cacheInfo,
  iterationRound = 0,
  onCopyChange,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [undoCopy, setUndoCopy] = useState<GeneratedCopy | null>(null)
  const [copiedAll, setCopiedAll] = useState(false)

  // Reset undo + editing when API updates the copy (panel / correction)
  useEffect(() => {
    setUndoCopy(null)
    setEditingId(null)
  }, [iterationRound])

  // Reset when a fresh generation arrives (copy was null, now has value)
  const prevCopyRef = useRef<GeneratedCopy | null>(null)
  useEffect(() => {
    const was = prevCopyRef.current
    prevCopyRef.current = copy
    if (copy && !was) {
      setUndoCopy(null)
      setEditingId(null)
    }
  }, [copy])

  const takeSnapshot = useCallback(() => {
    if (copy) setUndoCopy((prev) => prev ?? copy)
  }, [copy])

  const startEdit = useCallback(
    (id: string) => {
      takeSnapshot()
      setEditingId(id)
    },
    [takeSnapshot],
  )

  const stopEdit = useCallback(() => setEditingId(null), [])

  const handleUndo = useCallback(() => {
    if (undoCopy && onCopyChange) {
      onCopyChange(undoCopy)
      setUndoCopy(null)
      setEditingId(null)
    }
  }, [undoCopy, onCopyChange])

  const updateSection = useCallback(
    (sectionId: string, patch: Partial<LandingSection>) => {
      if (!copy || !onCopyChange) return
      onCopyChange({
        ...copy,
        sections: copy.sections.map((s) => (s.id === sectionId ? { ...s, ...patch } : s)),
      })
    },
    [copy, onCopyChange],
  )

  const moveSection = useCallback(
    (index: number, dir: -1 | 1) => {
      if (!copy || !onCopyChange) return
      takeSnapshot()
      const sections = [...copy.sections]
      const target = index + dir
      if (target < 0 || target >= sections.length) return
      ;[sections[index], sections[target]] = [sections[target], sections[index]]
      onCopyChange({ ...copy, sections })
    },
    [copy, onCopyChange, takeSnapshot],
  )

  const toggleSection = useCallback(
    (sectionId: string) => {
      if (!copy || !onCopyChange) return
      takeSnapshot()
      onCopyChange({
        ...copy,
        sections: copy.sections.map((s) =>
          s.id === sectionId ? { ...s, enabled: !s.enabled } : s,
        ),
      })
    },
    [copy, onCopyChange, takeSnapshot],
  )

  const handleCopyAll = async () => {
    if (!copy) return
    const text = copy.sections
      .filter((s) => s.enabled)
      .map((s) => `## ${s.title}\n${s.body}`)
      .join('\n\n')
    try {
      await navigator.clipboard.writeText(`${text}\n\nMETA OPIS: ${copy.metaDescription}`)
      setCopiedAll(true)
      setTimeout(() => setCopiedAll(false), 2000)
    } catch {}
  }

  // ── Empty states ────────────────────────────────────────────────────────────

  if (isGenerating) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 min-h-[440px] flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-600 text-sm font-medium">
          Generuję copy zgodne z profilem marki...
        </p>
        <p className="text-gray-400 text-xs mt-1">Zwykle zajmuje 10–25 sekund</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 min-h-[440px] flex flex-col items-center justify-center">
        <div className="text-4xl mb-3">⚠️</div>
        <p className="text-red-600 text-sm font-semibold">Błąd generowania</p>
        <p className="text-gray-500 text-sm mt-2 text-center max-w-xs">{error}</p>
      </div>
    )
  }

  if (!copy) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 min-h-[440px] flex flex-col items-center justify-center">
        <div className="text-5xl mb-4">✍️</div>
        <p className="text-gray-500 text-sm font-medium">Tu pojawi się Twoje copy</p>
        <p className="text-gray-400 text-xs mt-1 text-center max-w-xs">
          Wypełnij formularz i kliknij „Generuj copy"
        </p>
      </div>
    )
  }

  const cacheHit = (cacheInfo?.cacheReadTokens ?? 0) > 0

  // ── Main render ─────────────────────────────────────────────────────────────

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-gray-900">Wygenerowane copy</h2>
          {iterationRound > 0 && (
            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
              v{iterationRound + 1}
            </span>
          )}
          {cacheHit && (
            <span className="text-xs text-green-700 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full">
              ⚡ Cache hit
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {undoCopy && (
            <button
              onClick={handleUndo}
              className="text-xs text-amber-700 hover:text-amber-900 border border-amber-200 hover:border-amber-400 bg-amber-50 px-2.5 py-1 rounded-lg transition-colors font-medium"
            >
              ↩ Cofnij zmiany
            </button>
          )}
          <ExportButtons copy={copy} />
          <button
            onClick={handleCopyAll}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
          >
            {copiedAll ? '✓ Skopiowano' : 'Kopiuj wszystko'}
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-400 -mt-1">
        Kliknij tytuł lub treść sekcji, aby edytować. Użyj{' '}
        <kbd className="font-mono bg-gray-100 px-1 rounded">Esc</kbd> aby zamknąć. Zmiany są
        zapisywane na bieżąco.
      </p>

      {/* Sections */}
      <div className="space-y-2">
        {copy.sections.map((section, i) => (
          <SectionCard
            key={section.id}
            section={section}
            index={i}
            total={copy.sections.length}
            editingId={editingId}
            onStartEdit={startEdit}
            onStopEdit={stopEdit}
            onUpdate={(patch) => updateSection(section.id, patch)}
            onMoveUp={() => moveSection(i, -1)}
            onMoveDown={() => moveSection(i, 1)}
            onToggle={() => toggleSection(section.id)}
          />
        ))}
      </div>

      {/* Meta description */}
      <div className="rounded-xl border border-gray-100 px-4 py-3">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Meta opis
        </div>
        {editingId === 'meta' ? (
          <AutoTextarea
            value={copy.metaDescription}
            onChange={(e) => {
              if (onCopyChange) onCopyChange({ ...copy, metaDescription: e.target.value })
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') stopEdit()
            }}
            singleLine
            placeholder="Meta opis strony, max 160 znaków..."
            className="w-full text-sm text-gray-800 bg-gray-50 border border-indigo-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        ) : (
          <p
            onClick={() => startEdit('meta')}
            className={`text-sm leading-relaxed cursor-text ${
              copy.metaDescription ? 'text-gray-600' : 'text-gray-300 italic'
            }`}
            title="Kliknij, aby edytować"
          >
            {copy.metaDescription || 'Kliknij, aby dodać meta opis...'}
          </p>
        )}
      </div>
    </div>
  )
}
