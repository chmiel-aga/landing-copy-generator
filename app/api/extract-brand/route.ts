import { NextRequest, NextResponse } from 'next/server'
import { extractJson } from '@/lib/json-utils'

export const maxDuration = 120
import { createAnthropicClient } from '@/lib/claude'

export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-anthropic-api-key')
    if (!apiKey) {
      return NextResponse.json({ error: 'Brak klucza API. Skonfiguruj go w aplikacji.' }, { status: 401 })
    }
    const anthropic = createAnthropicClient(apiKey)

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Brak pliku' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    let documentText = ''

    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      try {
        // Dynamic import avoids issues with pdf-parse test file access at module init
        const pdfParse = (await import('pdf-parse')).default
        const data = await pdfParse(buffer)
        documentText = data.text
      } catch {
        return NextResponse.json(
          { error: 'Nie udało się odczytać pliku PDF. Spróbuj przekonwertować do TXT.' },
          { status: 400 },
        )
      }
    } else if (
      file.type ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.name.toLowerCase().endsWith('.docx')
    ) {
      try {
        const mammoth = await import('mammoth')
        const result = await mammoth.extractRawText({ buffer })
        documentText = result.value
      } catch {
        return NextResponse.json(
          { error: 'Nie udało się odczytać pliku DOCX.' },
          { status: 400 },
        )
      }
    } else {
      documentText = buffer.toString('utf-8')
    }

    if (!documentText.trim()) {
      return NextResponse.json(
        { error: 'Plik jest pusty lub nie zawiera tekstu możliwego do odczytania.' },
        { status: 400 },
      )
    }

    // Limit to ~8000 chars to stay within token budget
    const truncated = documentText.slice(0, 8000)

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `Przeanalizuj poniższy dokument marki i wyodrębnij z niego dane o marce.

Zwróć WYŁĄCZNIE JSON z poniższą strukturą. Dla pól których nie znalazłeś danych, pozostaw puste wartości ("" lub []).

{
  "archetype": "archetyp marki np. 'The Hero (Bohater)' — jeśli znaleziono",
  "archetypeDescription": "jak archetyp objawia się w tej marce",
  "targetPersona": "opis docelowej persony: kim jest, jakie ma problemy, potrzeby, motywacje",
  "toneOfVoice": ["cecha1", "cecha2", "cecha3"],
  "vocabulary": {
    "preferred": ["słowo lub fraza1", "fraza2"],
    "avoided": ["słowo1", "fraza2"]
  },
  "brandEssence": "esencja/obietnica marki w jednym zdaniu",
  "additionalContext": "inne ważne informacje: USP, wartości, pozycjonowanie"
}

DOKUMENT:
${truncated}`,
        },
      ],
    })

    const textBlock = response.content.find((b) => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('Brak odpowiedzi od modelu')
    }

    const jsonText = extractJson(textBlock.text)

    let extracted: unknown
    try {
      extracted = JSON.parse(jsonText)
    } catch {
      throw new Error('Model zwrócił nieprawidłowy JSON (ekstrakcja danych marki)')
    }
    return NextResponse.json({ profile: extracted })
  } catch (error) {
    console.error('Extract brand error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Błąd ekstrakcji danych marki' },
      { status: 500 },
    )
  }
}
