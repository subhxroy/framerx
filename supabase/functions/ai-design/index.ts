import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AIDesignRequest {
  prompt: string
  mode: 'generate' | 'redesign'
  canvasContext: Record<string, unknown>[]
  elementId?: string
  designTokens?: DesignTokens
}

interface DesignTokens {
  colors: string[]
  fontSizes: number[]
  fontWeights: number[]
  spacingValues: number[]
  borderRadiusValues: number[]
}

interface ExplanationCategory {
  category: 'typography' | 'spacing' | 'color' | 'layout' | 'structure'
  title: string
  description: string
}

interface AIDesignResponse {
  mode: 'generate' | 'redesign'
  elements?: Record<string, unknown>[]
  patch?: Record<string, unknown>
  explanation: {
    summary: string
    categories: ExplanationCategory[]
  }
  usage: {
    promptTokens: number
    completionTokens: number
    model: string
  }
}

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// ---------------------------------------------------------------------------
// Auth — extract user ID from JWT payload (signature already verified by
// Supabase API gateway, so we just base64-decode the payload).
// ---------------------------------------------------------------------------

function getUserIdFromJWT(authHeader: string | null): string | null {
  if (!authHeader) return null
  const token = authHeader.replace('Bearer ', '')
  const parts = token.split('.')
  if (parts.length !== 3) return null
  try {
    const payload = JSON.parse(atob(parts[1]))
    return payload.sub ?? null
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Rate limiter — simple in-memory sliding window
// ---------------------------------------------------------------------------

class RateLimiter {
  private store = new Map<string, { count: number; windowStart: number }>()
  private readonly maxRequests: number
  private readonly windowMs: number

  constructor(maxRequests = 20, windowMs = 60_000) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
  }

  check(key: string): { allowed: boolean; retryAfterMs: number } {
    const now = Date.now()
    const entry = this.store.get(key)

    if (!entry || now - entry.windowStart > this.windowMs) {
      this.store.set(key, { count: 1, windowStart: now })
      return { allowed: true, retryAfterMs: 0 }
    }

    if (entry.count >= this.maxRequests) {
      const retryAfterMs = this.windowMs - (now - entry.windowStart)
      return { allowed: false, retryAfterMs }
    }

    entry.count++
    return { allowed: true, retryAfterMs: 0 }
  }
}

const rateLimiter = new RateLimiter(20, 60_000)

// ---------------------------------------------------------------------------
// AI Provider interface
// ---------------------------------------------------------------------------

interface AIProviderResult {
  content: string
  usage: { promptTokens: number; completionTokens: number }
}

interface AIProvider {
  generate(systemPrompt: string, messages: { role: string; content: string }[]): Promise<AIProviderResult>
}

// ---------------------------------------------------------------------------
// OpenRouter provider
// ---------------------------------------------------------------------------

class OpenRouterProvider implements AIProvider {
  private readonly apiKey: string
  private readonly model: string

  constructor(apiKey: string, model = 'google/gemini-2.0-flash-001') {
    this.apiKey = apiKey
    this.model = model
  }

  async generate(systemPrompt: string, messages: { role: string; content: string }[]): Promise<AIProviderResult> {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
        'HTTP-Referer': 'https://framer.app',
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 4096,
      }),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(`OpenRouter API error ${res.status}: ${body}`)
    }

    const json = await res.json()
    const content = json.choices?.[0]?.message?.content ?? ''
    const usage = json.usage ?? {}

    return {
      content,
      usage: {
        promptTokens: usage.prompt_tokens ?? 0,
        completionTokens: usage.completion_tokens ?? 0,
      },
    }
  }
}

// ---------------------------------------------------------------------------
// Provider factory
// ---------------------------------------------------------------------------

function createProvider(): AIProvider {
  const key = Deno.env.get('OPENROUTER_API_KEY')
  if (key) {
    return new OpenRouterProvider(key)
  }
  throw new Error(
    'No AI provider configured. Set OPENROUTER_API_KEY in Edge Function secrets:\n' +
    '  npx supabase secrets set OPENROUTER_API_KEY=<your-key>\n' +
    'See docs/supabase-edge-functions.md for provider setup.',
  )
}

// ---------------------------------------------------------------------------
/// System prompt builder
// ---------------------------------------------------------------------------

function buildSystemPrompt(tokens?: DesignTokens): string {
  const tokenHint = tokens
    ? `
Design tokens in use on this canvas (prefer these over inventing new ones):
  Colors: ${tokens.colors.join(', ')}
  Font sizes (px): ${tokens.fontSizes.join(', ')}
  Font weights: ${tokens.fontWeights.join(', ')}
  Spacing values (px): ${tokens.spacingValues.join(', ')}
  Border radii (px): ${tokens.borderRadiusValues.join(', ')}
`
    : ''

  return `You are a senior UI/UX designer helping build a website in a visual editor (Framer clone).
Your job is to generate structured element data in response to natural-language design prompts.

${tokenHint}
Always output **valid JSON only** — no markdown fences, no explanation outside the JSON fields.
The JSON must match this exact schema:

{
  "mode": "generate" | "redesign",
  "explanation": {
    "summary": "One-sentence summary of what was created or changed",
    "categories": [
      {
        "category": "typography" | "spacing" | "color" | "layout" | "structure",
        "title": "Short label",
        "description": "One-line rationale"
      }
    ]
  },
  // For "generate" mode — array of elements to create:
  "elements": [
    {
      "type": "frame" | "text" | "image" | "shape" | "stack",
      "name": "Human-readable name",
      "x": number, "y": number, "width": number, "height": number,
      "rotation": 0,
      "opacity": 1,
      "visible": true,
      "locked": false,
      "style": {
        "backgroundColor": "hex color",
        "borderRadius": number,
        "border": "1px solid #eee" (optional),
        "borderWidth": number (optional),
        "borderColor": "hex" (optional),
        "borderStyle": "solid" | "dashed" | "dotted" (optional),
        "overflow": "visible" | "hidden" (optional)
      },
      // For text elements:
      "text": {
        "content": "string",
        "fontSize": number,
        "fontWeight": number,
        "color": "hex",
        "textAlign": "left" | "center" | "right",
        "lineHeight": number,
        "letterSpacing": number
      },
      // For stacks / auto-layout:
      "autoLayout": {
        "enabled": true,
        "direction": "horizontal" | "vertical",
        "gap": number,
        "padding": { "top": number, "right": number, "bottom": number, "left": number },
        "alignItems": "start" | "center" | "end" | "stretch",
        "justifyContent": "start" | "center" | "end" | "space-between" | "space-around",
        "wrap": false
      },
      // Children (nested elements for tree structure):
      "children": [ /* same schema recursively */ ]
    }
  ],
  // For "redesign" mode — partial fields to update on an existing element:
  "patch": {
    // Any subset of Element fields
  }
}

IMPORTANT RULES:
1. x, y, width, height must use a 4px grid (values divisible by 4).
2. All colors must be 6-character hex (e.g. "#1a1a1a").
3. Position elements so they don't overlap unless clearly intentional for a stack.
4. For generate mode, create 1-3 well-structured elements, not dozens.
5. Prefer existing design tokens when provided.
6. Every element must have name, type, x, y, width, height.
7. Text elements must include the "text" block.
8. For redesign mode, only include fields that need to change.
9. Set "visible": false on elements that should exist but be hidden initially.
10. Use reasonable defaults: borderRadius 0 unless rounded corners are called for.
`
}

// ---------------------------------------------------------------------------
// Response validator
// ---------------------------------------------------------------------------

function validateResponse(data: unknown): AIDesignResponse {
  if (!data || typeof data !== 'object') {
    throw new Error('Response must be a JSON object')
  }

  const d = data as Record<string, unknown>

  if (d.mode !== 'generate' && d.mode !== 'redesign') {
    throw new Error('Response must include "mode": "generate" or "redesign"')
  }

  const mode = d.mode as 'generate' | 'redesign'

  if (mode === 'generate') {
    if (!Array.isArray(d.elements) || d.elements.length === 0) {
      throw new Error('Generate mode response must include non-empty "elements" array')
    }
  }

  if (mode === 'redesign' && (!d.patch || typeof d.patch !== 'object')) {
    throw new Error('Redesign mode response must include "patch" object')
  }

  const explanation = d.explanation as Record<string, unknown> | undefined
  if (!explanation || typeof explanation.summary !== 'string') {
    throw new Error('Response must include explanation.summary string')
  }

  const categories = Array.isArray(explanation.categories) ? explanation.categories : []
  const validCategories: ExplanationCategory[] = categories
    .filter((cat: unknown): cat is ExplanationCategory => {
      const c = cat as Record<string, unknown>
      return (
        typeof c.category === 'string' &&
        ['typography', 'spacing', 'color', 'layout', 'structure'].includes(c.category) &&
        typeof c.title === 'string' &&
        typeof c.description === 'string'
      )
    })
    .slice(0, 10)

  return {
    mode,
    elements: mode === 'generate' ? (d.elements as Record<string, unknown>[]) : undefined,
    patch: mode === 'redesign' ? (d.patch as Record<string, unknown>) : undefined,
    explanation: {
      summary: String(explanation.summary),
      categories: validCategories,
    },
    usage: { promptTokens: 0, completionTokens: 0, model: '' },
  }
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed. Use POST.' }, 405)
  }

  // Auth
  const userId = getUserIdFromJWT(req.headers.get('Authorization'))
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  const rateLimitKey = userId ?? ip

  // Rate limit
  const { allowed, retryAfterMs } = rateLimiter.check(rateLimitKey)
  if (!allowed) {
    return jsonResponse({
      error: 'Rate limit exceeded',
      retryAfterMs,
      retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
    }, 429)
  }

  // Parse body
  let body: AIDesignRequest
  try {
    const raw = await req.json()
    if (!raw.prompt || typeof raw.prompt !== 'string' || raw.prompt.trim().length === 0) {
      return jsonResponse({ error: 'Missing required field: prompt' }, 400)
    }
    if (!raw.mode || !['generate', 'redesign'].includes(raw.mode)) {
      return jsonResponse({ error: 'mode must be "generate" or "redesign"' }, 400)
    }
    body = {
      prompt: raw.prompt.trim(),
      mode: raw.mode,
      canvasContext: Array.isArray(raw.canvasContext) ? raw.canvasContext : [],
      elementId: typeof raw.elementId === 'string' ? raw.elementId : undefined,
      designTokens: raw.designTokens as DesignTokens | undefined,
    }
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }

  // Call AI provider
  let provider: AIProvider
  try {
    provider = createProvider()
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return jsonResponse({ error: msg }, 503)
  }

  const systemPrompt = buildSystemPrompt(body.designTokens)

  const userMessage = body.mode === 'generate'
    ? `Create a new design based on this request: "${body.prompt}"

Current canvas context (${body.canvasContext.length} elements):
${JSON.stringify(body.canvasContext.slice(0, 30), null, 2)}

Return a "generate" response with the elements array.`
    : `Redesign the selected element based on: "${body.prompt}"

Element to redesign (ID: ${body.elementId ?? 'unknown'}):
${JSON.stringify(body.canvasContext.find((el: any) => el.id === body.elementId) ?? body.canvasContext[0], null, 2)}

Return a "redesign" response with a patch containing only the fields to change.`

  let result: AIProviderResult
  try {
    result = await provider.generate(systemPrompt, [{ role: 'user', content: userMessage }])
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('AI provider error:', msg)
    return jsonResponse({ error: `AI generation failed: ${msg}` }, 502)
  }

  // Parse AI output
  let parsed: unknown
  try {
    parsed = JSON.parse(result.content)
  } catch {
    // Attempt to extract JSON from response
    const match = result.content.match(/\{[\s\S]*\}/)
    if (match) {
      try { parsed = JSON.parse(match[0]) } catch {
        return jsonResponse({ error: 'AI returned malformed JSON. Try rephrasing your prompt.' }, 502)
      }
    } else {
      return jsonResponse({ error: 'AI returned non-JSON response. Try rephrasing your prompt.' }, 502)
    }
  }

  // Validate
  let response: AIDesignResponse
  try {
    response = validateResponse(parsed)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return jsonResponse({ error: `AI response validation failed: ${msg}` }, 502)
  }

  // Attach usage info
  response.usage = {
    promptTokens: result.usage.promptTokens,
    completionTokens: result.usage.completionTokens,
    model: provider instanceof OpenRouterProvider
      ? (provider as any).model ?? 'unknown'
      : 'unknown',
  }

  // Trim large responses
  if (response.elements && response.elements.length > 10) {
    response.elements = response.elements.slice(0, 10)
  }

  console.log(`ai-design | user=${rateLimitKey} mode=${body.mode} tokens=${result.usage.promptTokens}+${result.usage.completionTokens}`)

  return jsonResponse(response)
})
