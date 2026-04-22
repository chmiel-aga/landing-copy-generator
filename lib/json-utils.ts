import { jsonrepair } from 'jsonrepair'

export function extractJson(text: string): string {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  let json = fenceMatch ? fenceMatch[1].trim() : text.trim()
  const start = json.indexOf('{')
  const end = json.lastIndexOf('}')
  if (start !== -1 && end !== -1 && start < end) json = json.slice(start, end + 1)
  try {
    return jsonrepair(json)
  } catch {
    return json
  }
}
