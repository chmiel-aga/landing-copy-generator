'use client'

import { useState, useRef } from 'react'
import type { BrandProfile } from '@/lib/brand-context'
import { getApiKey } from '@/lib/api-key'

interface Props {
  onExtracted: (profile: Partial<BrandProfile>) => void
}

const MAX_FILES = 10

export default function DocumentUpload({ onExtracted }: Props) {
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const processFile = async (file: File): Promise<void> => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/extract-brand', {
      method: 'POST',
      headers: { 'x-anthropic-api-key': getApiKey() ?? '' },
      body: formData,
    })

    if (!response.ok) {
      let errorMsg = 'Błąd analizy'
      try {
        const data = await response.json()
        errorMsg = data.error ?? errorMsg
      } catch {}
      throw new Error(`${file.name}: ${errorMsg}`)
    }

    const data = await response.json()

    onExtracted(data.profile as Partial<BrandProfile>)
  }

  const handleFiles = async (files: FileList) => {
    const fileArray = Array.from(files).slice(0, MAX_FILES)

    if (fileArray.length === 0) return

    setIsUploading(true)
    setError(null)
    setStatusMsg(null)

    const errors: string[] = []

    for (let i = 0; i < fileArray.length; i++) {
      setProgress({ current: i + 1, total: fileArray.length })
      try {
        await processFile(fileArray[i])
      } catch (err) {
        errors.push(err instanceof Error ? err.message : `${fileArray[i].name}: błąd`)
      }
    }

    setIsUploading(false)
    setProgress(null)

    if (errors.length > 0) {
      setError(errors.join(' • '))
    } else {
      const label =
        fileArray.length === 1
          ? `✓ Wyodrębniono dane z: ${fileArray[0].name}`
          : `✓ Przetworzono ${fileArray.length} plików`
      setStatusMsg(label)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-1">Wczytaj dokumenty marki</h2>
      <p className="text-sm text-gray-500 mb-4">
        Prześlij brand book, strategię marki lub inne dokumenty — automatycznie wyodrębnimy dane
        i uzupełnimy formularz poniżej. Maks. {MAX_FILES} plików na raz.
      </p>

      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isUploading
            ? 'border-indigo-300 bg-indigo-50/30 cursor-default'
            : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/20'
        }`}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => !isUploading && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".pdf,.docx,.txt"
          multiple
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) handleFiles(e.target.files)
            e.target.value = ''
          }}
        />
        {isUploading && progress ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-indigo-600 font-medium">
              Analizuję plik {progress.current} z {progress.total}...
            </p>
            {/* Progress bar */}
            <div className="w-48 h-1.5 bg-indigo-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="text-3xl mb-2">📄</div>
            <p className="text-sm font-medium text-gray-700">
              Przeciągnij pliki lub kliknij, aby wybrać
            </p>
            <p className="text-xs text-gray-400 mt-1">PDF, DOCX, TXT — maks. {MAX_FILES} plików</p>
          </>
        )}
      </div>

      {statusMsg && !isUploading && (
        <p className="mt-3 text-sm text-green-600">{statusMsg}</p>
      )}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  )
}
