import { NextRequest, NextResponse } from 'next/server'
import { extractJson } from '@/lib/json-utils'

export const maxDuration = 120
import { createAnthropicClient } from '@/lib/claude'
import {
  buildBrandSystemPrompt,
  buildGenerationSystemInstructions,
  buildImplementFeedbackPrompt,
} from '@/lib/prompts'
import type { GeneratedCopy } from '@/lib/prompts'
import type { BrandProfile } from '@/lib/brand-context'

export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-anthropic-api-key')
    if (!apiKey) {
      return NextResponse.json({ error: 'Brak klucza API. Skonfiguruj go w aplikacji.' }, { status: 401 })
    }
    const anthropic = createAnthropicClient(apiKey)

    const body = (await req.json()) as {
      copy: GeneratedCopy
      expertName: string
      recommendation: string
      brandProfile: BrandProfile | null
    }

    const { copy, expertName, recommendation, brandProfile } = body

    if (!copy || !expertName || !recommendation) {
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
          content: buildImplementFeedbackPrompt(copy, expertName, recommendation),
        },
      ],
    })

    const textBlock = response.content.find((b) => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('Brak odpowiedzi od modelu')
    }

    const jsonText = extractJson(textBlock.text)

    let newCopy: unknown
    try {
      newCopy = JSON.parse(jsonText)
    } catch {
      throw new Error('Model zwrócił nieprawidłowy JSON (wdrażanie rekomendacji)')
    }
    return NextResponse.json({
      copy: newCopy,
      usage: {
        cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
        cacheWriteTokens: response.usage.cache_creation_input_tokens ?? 0,
      },
    })
  } catch (error) {
    console.error('Implement feedback error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Błąd wdrażania rekomendacji' },
      { status: 500 },
    )
  }
}
