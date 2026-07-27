/** Pull the first JSON object/array out of messy model output. */
export function extractJson<T = unknown>(raw: string): T {
  const cleaned = raw
    .replace(/```json\s*/gi, '')
    .replace(/```/g, '')
    .trim()

  try {
    return JSON.parse(cleaned) as T
  } catch {
    // fall through
  }

  const objectStart = cleaned.indexOf('{')
  const arrayStart = cleaned.indexOf('[')
  let start = -1
  if (objectStart >= 0 && (arrayStart < 0 || objectStart < arrayStart)) start = objectStart
  else if (arrayStart >= 0) start = arrayStart

  if (start < 0) {
    throw new Error('No JSON found in model response')
  }

  const opener = cleaned[start]
  const closer = opener === '{' ? '}' : ']'
  let depth = 0
  let inString = false
  let escape = false

  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i]
    if (inString) {
      if (escape) escape = false
      else if (ch === '\\') escape = true
      else if (ch === '"') inString = false
      continue
    }
    if (ch === '"') {
      inString = true
      continue
    }
    if (ch === opener) depth++
    if (ch === closer) depth--
    if (depth === 0) {
      const slice = cleaned.slice(start, i + 1)
      return JSON.parse(slice) as T
    }
  }

  throw new Error('Incomplete JSON in model response')
}
