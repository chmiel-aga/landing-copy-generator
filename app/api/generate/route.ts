import { NextRequest, NextResponse } from 'next/server'
import { extractJson } from '@/lib/json-utils'

export const maxDuration = 120
import { anthropic } from '@/lib/claude'
import {
  buildBrandSystemPrompt,
  buildGenerationSystemInstructions,
  buildUserPrompt,
} from '@/lib/prompts'
import type { BrandProfile } from '@/lib/brand-context'

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      brandProfile: BrandProfile | null
      pageType: string
      pageGoal: string
      brief?: string
      ownDraft?: string
    }

    const { brandProfile, pageType, pageGoal, brief, ownDraft } = body

    if (!pageGoal?.trim()) {
      return NextResponse.json({ error: 'Cel strony jest wymagany' }, { status: 400 })
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
          content: buildUserPrompt(pageType, pageGoal, brief, ownDraft),
        },
      ],
    })

    const textBlock = response.content.find((b) => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('Brak odpowiedzi tekstowej od modelu')
    }

    console.log('GEN stop_reason:', response.stop_reason, '| raw length:', textBlock.text.length)
    const jsonText = extractJson(textBlock.text)
    console.log('GEN after extract length:', jsonText.length, '| last 200:', jsonText.slice(-200))

    let copy: unknown
    try {
      copy = JSON.parse(jsonText)
    } catch (e) {
      const err = e as SyntaxError
      const pos = Number(err.message.match(/position (\d+)/)?.[1] ?? -1)
      if (pos >= 0) console.error('GEN parse fail at pos', pos, '| context:', jsonText.slice(Math.max(0, pos - 100), pos + 100))
      else console.error('GEN parse error:', err.message, '| last 300:', jsonText.slice(-300))
      throw new Error('Model zwrócił nieprawidłowy JSON. Spróbuj ponownie.')
    }

    return NextResponse.json({
      copy,
      usage: {
        cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
        cacheWriteTokens: response.usage.cache_creation_input_tokens ?? 0,
      },
    })
  } catch (error) {
    console.error('Generate error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Błąd generowania copy' },
      { status: 500 },
    )
  }
}
