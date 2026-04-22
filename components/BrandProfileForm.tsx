'use client'

import { useState } from 'react'
import type { BrandProfile } from '@/lib/brand-context'
import { BRAND_ARCHETYPES } from '@/lib/prompts'

interface Props {
  profile: BrandProfile
  onChange: (profile: BrandProfile) => void
}

function TagInput({
  label,
  hint,
  values,
  onChange,
  placeholder,
  required,
}: {
  label: string
  hint?: string
  values: string[]
  onChange: (vals: string[]) => void
  placeholder: string
  required?: boolean
}) {
  const [input, setInput] = useState('')

  const addTag = () => {
    const trimmed = input.trim()
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed])
    }
    setInput('')
  }

  const removeTag = (val: string) => onChange(values.filter((v) => v !== val))

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {hint && <p className="text-xs text-gray-400 mb-2">{hint}</p>}
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault()
              addTag()
            }
          }}
          placeholder={placeholder}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <button
          type="button"
          onClick={addTag}
          className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
        >
          Dodaj
        </button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {values.map((val) => (
            <span
              key={val}
              className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-sm px-3 py-1 rounded-full border border-indigo-100"
            >
              {val}
              <button
                type="button"
                onClick={() => removeTag(val)}
                className="ml-0.5 text-indigo-300 hover:text-indigo-500 leading-none"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default function BrandProfileForm({ profile, onChange }: Props) {
  const update = <K extends keyof BrandProfile>(key: K, value: BrandProfile[K]) => {
    onChange({ ...profile, [key]: value })
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
      <div>
        <h2 className="text-base font-semibold text-gray-900">Profil marki</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Pola oznaczone <span className="text-red-400">*</span> są wymagane do generowania copy.
        </p>
      </div>

      {/* Archetype */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Archetyp marki <span className="text-red-400">*</span>
        </label>
        <select
          value={profile.archetype}
          onChange={(e) => update('archetype', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          <option value="">Wybierz archetyp marki...</option>
          {BRAND_ARCHETYPES.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      {/* Archetype description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Opis archetypu w kontekście Twojej marki
        </label>
        <textarea
          value={profile.archetypeDescription}
          onChange={(e) => update('archetypeDescription', e.target.value)}
          placeholder="Jak ten archetyp przejawia się w komunikacji i działaniach marki? Co ją wyróżnia w ramach tego archetypu?"
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      </div>

      {/* Brand essence */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Esencja marki</label>
        <input
          type="text"
          value={profile.brandEssence}
          onChange={(e) => update('brandEssence', e.target.value)}
          placeholder="Obietnica marki w jednym zdaniu — co robisz i dla kogo?"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Target persona */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Docelowa persona <span className="text-red-400">*</span>
        </label>
        <textarea
          value={profile.targetPersona}
          onChange={(e) => update('targetPersona', e.target.value)}
          placeholder="Kim jest Twój idealny klient? Kim jest zawodowo? Jakie ma problemy i frustracje? Czego pragnie? Jakie ma cele?"
          rows={5}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      </div>

      {/* Tone of voice */}
      <TagInput
        label="Ton głosu"
        hint="Naciśnij Enter lub przecinek po każdej cesze"
        values={profile.toneOfVoice}
        onChange={(vals) => update('toneOfVoice', vals)}
        placeholder="np. empatyczny, bezpośredni, inspirujący..."
        required
      />

      {/* Preferred vocabulary */}
      <TagInput
        label="Słowa i frazy, których używamy"
        hint="Charakterystyczne dla marki słownictwo i zwroty"
        values={profile.vocabulary.preferred}
        onChange={(vals) =>
          onChange({ ...profile, vocabulary: { ...profile.vocabulary, preferred: vals } })
        }
        placeholder="np. transformacja, wyniki, przełom..."
      />

      {/* Avoided vocabulary */}
      <TagInput
        label="Słowa i frazy, których unikamy"
        hint="Słowa niedopasowane do tonu marki lub kojarzące się źle"
        values={profile.vocabulary.avoided}
        onChange={(vals) =>
          onChange({ ...profile, vocabulary: { ...profile.vocabulary, avoided: vals } })
        }
        placeholder="np. tani, prosty, każdy może..."
      />

      {/* Additional context */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Dodatkowy kontekst
        </label>
        <textarea
          value={profile.additionalContext}
          onChange={(e) => update('additionalContext', e.target.value)}
          placeholder="Inne ważne informacje: USP, wartości marki, pozycjonowanie na rynku, konkurencja, historia marki..."
          rows={4}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      </div>
    </div>
  )
}
