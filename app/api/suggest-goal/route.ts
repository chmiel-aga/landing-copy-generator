import { NextRequest, NextResponse } from 'next/server'
import { anthropic } from '@/lib/claude'
import { buildSuggestGoalPrompt } from '@/lib/prompts'

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { brief: string; pageType: string }
    const { brief, pageType } = body

    if (!brief?.trim()) {
      return NextResponse.json({ error: 'Brak briefu' }, { status: 400 })
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      messages: [
        {
          role: 'user',
          content: buildSuggestGoalPrompt(brief, pageType),
        },
      ],
    })

    const textBlock = response.content.find((b) => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('Brak odpowiedzi od modelu')
    }

    return NextResponse.json({ goal: textBlock.text.trim() })
  } catch (error) {
    console.error('Suggest goal error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Błąd sugerowania celu' },
      { status: 500 },
    )
  }
}
