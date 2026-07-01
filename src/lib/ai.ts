const API_BASE = 'https://openrouter.ai/api/v1'
const MODEL = 'google/gemini-2.0-flash-lite-001'

export interface AIChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

let _abortController: AbortController | null = null

export function abortAI() {
  _abortController?.abort()
  _abortController = null
}

export async function chat(
  messages: AIChatMessage[],
  onChunk?: (text: string) => void,
): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY
  if (!apiKey) {
    throw new Error('VITE_OPENROUTER_API_KEY not set in .env')
  }

  _abortController?.abort()
  const ctrl = new AbortController()
  _abortController = ctrl

  const res = await fetch(`${API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': window.location.origin,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      stream: !!onChunk,
      temperature: 0.3,
      max_tokens: 2048,
    }),
    signal: ctrl.signal,
  })

  if (!res.ok) {
    const err = await res.text().catch(() => '')
    throw new Error(`AI API error ${res.status}: ${err}`)
  }

  if (onChunk && res.body) {
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let full = ''
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data: ')) continue
        const data = trimmed.slice(6)
        if (data === '[DONE]') break
        try {
          const parsed = JSON.parse(data)
          const delta = parsed.choices?.[0]?.delta?.content
          if (delta) {
            full += delta
            onChunk(delta)
          }
        } catch { /* skip malformed chunk */ }
      }
    }
    return full
  }

  const json = await res.json()
  return json.choices?.[0]?.message?.content ?? ''
}

export function buildElementContext(element: Record<string, any>): string {
  const ctx: Record<string, any> = {
    id: element.id,
    name: element.name,
    type: element.type,
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    rotation: element.rotation,
    opacity: element.opacity,
  }
  if (element.style) ctx.style = element.style
  if (element.text) ctx.text = element.text
  if (element.autoLayout) ctx.autoLayout = element.autoLayout
  if (element.sizing) ctx.sizing = element.sizing
  return JSON.stringify(ctx, null, 2)
}

export function parsePatchResponse(text: string): Record<string, any> | null {
  // Try to extract a JSON object from the response
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return null
  try {
    const parsed = JSON.parse(jsonMatch[0])
    // Validate it looks like an element patch (has at least one known field)
    const knownKeys = ['x', 'y', 'width', 'height', 'rotation', 'opacity', 'style', 'text', 'sizing', 'autoLayout', 'name']
    if (Object.keys(parsed).some(k => knownKeys.includes(k))) {
      return parsed
    }
    return null
  } catch {
    return null
  }
}

export const SYSTEM_PROMPT = `You are a design assistant for a visual website builder (Framer clone).
The user will give you a natural language command about a selected element.
You must respond with ONLY a JSON object containing the element property changes to apply.
Do NOT include any explanation or markdown formatting — just the JSON.

Element properties you can change:
- x, y (number, position in px)
- width, height (number, size in px)
- rotation (number, degrees)
- opacity (number, 0-1)
- style: { backgroundColor (hex or rgb), color (hex), borderRadius (number, px), borderWidth (number, px), borderColor (hex), borderStyle ("solid"|"dashed"|"dotted"), boxShadow (string), blur (number, px), backdropBlur (number, px) }
- text: { content (string), fontSize (number, px), fontWeight (number), color (hex), textAlign ("left"|"center"|"right"), lineHeight (number), letterSpacing (number, px) }
- sizing: { width ("fixed"|"fill"|"hug"), height ("fixed"|"fill"|"hug") }
- autoLayout: { enabled (boolean), direction ("horizontal"|"vertical"), gap (number, px), padding (object with top/bottom/left/right, px), alignItems ("flex-start"|"center"|"flex-end"|"stretch"), justifyContent ("flex-start"|"center"|"flex-end"|"space-between") }

Examples:
User: "make the background blue"
Response: { "style": { "backgroundColor": "#3b82f6" } }

User: "make this a button with rounded corners"
Response: { "style": { "backgroundColor": "#000000", "color": "#ffffff", "borderRadius": 8, "padding": "12px 24px" }, "sizing": { "width": "hug", "height": "hug" } }

User: "add padding 20px all around"
Response: { "autoLayout": { "enabled": true, "padding": { "top": 20, "right": 20, "bottom": 20, "left": 20 } } }

User: "make text bigger and bold"
Response: { "text": { "fontSize": 24, "fontWeight": 700 } }

Ignore any properties not mentioned. Only include properties that need to change.`
