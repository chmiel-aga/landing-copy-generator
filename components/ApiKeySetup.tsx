'use client'

import { useState } from 'react'
import { setApiKey } from '@/lib/api-key'

export default function ApiKeySetup({ onSaved }: { onSaved: () => void }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')

  const handleSave = () => {
    const trimmed = value.trim()
    if (!trimmed.startsWith('sk-ant-')) {
      setError('Klucz musi zaczynać się od "sk-ant-"')
      return
    }
    setApiKey(trimmed)
    onSaved()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-lg font-bold text-gray-900">Generator copy landing page</h1>
        </div>
      </header>
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-7 h-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Skonfiguruj klucz API</h2>
          <p className="text-gray-500 text-sm text-center mb-6">
            Klucz jest przechowywany wyłącznie w Twojej przeglądarce i wysyłany bezpośrednio do Anthropic — nie trafia na żaden serwer pośredni.
          </p>
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Klucz API Anthropic
              </label>
              <input
                type="password"
                value={value}
                onChange={(e) => { setValue(e.target.value); setError('') }}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                placeholder="sk-ant-..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300"
                autoFocus
              />
              {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            </div>
            <button
              onClick={handleSave}
              disabled={!value.trim()}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Zapisz i kontynuuj
            </button>
            <p className="text-xs text-gray-400 text-center">
              Nie masz klucza?{' '}
              <a
                href="https://console.anthropic.com/account/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:underline"
              >
                Utwórz go na console.anthropic.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
