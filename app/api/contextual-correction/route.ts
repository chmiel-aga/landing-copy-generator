import { NextRequest, NextResponse } from 'next/server'
import { extractJson } from '@/lib/json-utils'

export const maxDuration = 120
import { anthropic } from '@/lib/claude'
import {
  buildBrandSystemPrompt,
  buildGenerationSystemInstructions,
  buildContextualCorrectionPrompt,
} from '@/lib/prompts'
import type { GeneratedCopy } from '@/lib/prompts'
import type { BrandProfile } from '@/lib/brand-context'

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      copy: GeneratedCopy
      mediumContext: string
      brandProfile: BrandProfile | null
    }

    const { copy, mediumContext, brandProfile } = body

    if (!copy || !mediumContext?.trim()) {
      return NextResponse.json({ error: 'Brak wymaganych danych' }, { status: 400 })
    }

    const systemBlocks: { type: 'text'; text: string; cache_control?: { type: 'ephemeral' } }[] =
      []
    if (brandProfile) {
      systemBlocks.push({
        type: 'text',
        text: buildBrandSystemPrompt(brandProfile),
        cache_control: { type: 'ephemeral' },
      })
    }
    systemBlocks.push({ type: 'text', text: buildGenerationSystemInstructions() })

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      system: systemBlocks,
      messages: [
        {
          role: 'user',
          content: buildContextualCorrectionPrompt(copy, mediumContext),
        },
      ],
    })

    const textBlock = response.content.find((b) => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('Brak odpowiedzi od modelu')
    }

    const jsonText = extractJson(textBlock.text)

    let correctedCopy: unknown
    try {
      correctedCopy = JSON.parse(jsonText)
    } catch {
      throw new Error('Model zwrócił nieprawidłowy JSON (korekta kontekstowa)')
    }
    return NextResponse.json({
      copy: correctedCopy,
      usage: {
        cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
        cacheWriteTokens: response.usage.cache_creation_input_tokens ?? 0,
      },
    })
  } catch (error) {
    console.error('Contextual correction error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Błąd korekty kontekstowej' },
      { status: 500 },
    )
  }
}
