import Anthropic from '@anthropic-ai/sdk'

function createClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY env var is not set')
  }
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

let _client: Anthropic | null = null

export const anthropic = new Proxy({} as Anthropic, {
  get(_, prop: string | symbol) {
    if (!_client) _client = createClient()
    return (_client as unknown as Record<string | symbol, unknown>)[prop]
  },
})
