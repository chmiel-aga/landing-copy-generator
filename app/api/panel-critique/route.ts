import { NextRequest, NextResponse } from 'next/server'
import { extractJson } from '@/lib/json-utils'

export const maxDuration = 120
import { anthropic } from '@/lib/claude'
import { buildPanelCritiquePrompt } from '@/lib/prompts'
import type { GeneratedCopy, PanelVariant } from '@/lib/prompts'

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      copy: GeneratedCopy
      panelVariant: PanelVariant
      round: number
      previousExpert?: string
    }

    const { copy, panelVariant, round, previousExpert } = body

    if (!copy || !panelVariant) {
      return NextResponse.json({ error: 'Brak wymaganych danych' }, { status: 400 })
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system:
        'Jesteś moderatorem panelu ekspertów od copywritingu. Zwracasz wyłącznie poprawny JSON bez żadnego tekstu przed ani po.',
      messages: [
        {
          role: 'user',
          content: buildPanelCritiquePrompt(copy, panelVariant, round, previousExpert),
        },
      ],
    })

    const textBlock = response.content.find((b) => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('Brak odpowiedzi od modelu')
    }

    const jsonText = extractJson(textBlock.text)

    let result: { opinions?: unknown }
    try {
      result = JSON.parse(jsonText)
    } catch {
      throw new Error('Model zwrócił nieprawidłowy JSON (panel ekspertów)')
    }
    if (!Array.isArray(result.opinions)) {
      throw new Error('Odpowiedź modelu nie zawiera listy opinii')
    }
    return NextResponse.json(result)
  } catch (error) {
    console.error('Panel critique error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Błąd panelu ekspertów' },
      { status: 500 },
    )
  }
}
