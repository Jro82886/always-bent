import { NextRequest, NextResponse } from 'next/server'

// Keep this in sync with your existing VM
type AnalysisVM = {
  areaKm2: number
  hasSST: boolean
  hasCHL: boolean
  sst?: { meanF: number; minF: number; maxF: number; gradFperMile: number }
  chl?: { mean: number } // mg/m³
}

// System rules: no made-up numbers; use °F + mg/m³; give actions
const SYSTEM_PROMPT = `
You are ABFI's on-board fishing analyst. Be concise, confident, and practical.
Rules:
- NEVER invent numbers; only use those in the JSON input.
- Units: Fahrenheit (°F) and mg/m³.
- If SST or CHL missing or OFF, say so and propose the next step.
- Output exactly two parts separated by a line with three hyphens:
PART A (markdown for UI): "Ocean Analysis", "Temperature Break" (if SST present), "Water Quality" (if CHL present), "Recommendations".
PART B (single-line JSON): {"actions":[...]} with zero or more items like:
  {"type":"enable_layers","layers":["sst","chl"]}
  {"type":"suggest_date","offsetDays":-1}
  {"type":"recenter_inlet","inletId":"<id>"}
Keep it tight (<= 120 words in PART A).
`

async function callOpenAI(user: string): Promise<string> {
  const key = process.env.LLM_API_KEY
  if (!key) throw new Error('Missing LLM_API_KEY')

  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini', // light, cheap, good
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: user }
      ],
      temperature: 0.4
    })
  })

  if (!r.ok) throw new Error(`OpenAI error ${r.status}`)
  const j = await r.json()
  return j?.choices?.[0]?.message?.content ?? ''
}

export async function POST(req: NextRequest) {
  try {
    const { analysisVM, toggles, inlet, dateISO } = await req.json() as {
      analysisVM: AnalysisVM
      toggles: { sstOn: boolean; chlOn: boolean }
      inlet?: { id?: string; name?: string }
      dateISO?: string
    }

    // Basic guardrails: don't proceed without real inputs
    if (!analysisVM || (!analysisVM.hasSST && !analysisVM.hasCHL)) {
      return NextResponse.json({
        markdown: `Ocean Analysis\nOcean data layers are not active. Enable SST and CHL to generate analysis.`,
        actions: [{ type: 'enable_layers', layers: ['sst', 'chl'] }]
      })
    }

    const payload = JSON.stringify({ analysisVM, toggles, inlet, dateISO })
    const content = await callOpenAI(payload)

    // Expect "markdown\n---\n{...json...}"
    const [md, jsonLine] = String(content).split('\n---\n')
    let actions: any[] = []
    try { 
      actions = JSON.parse(jsonLine || '{}')?.actions || [] 
    } catch {}

    return NextResponse.json({
      markdown: (md || 'Ocean Analysis\nNo output.').trim(),
      actions
    })
  } catch (e: any) {
    console.error('[AI] Error:', e)
    return NextResponse.json({
      markdown: `Ocean Analysis\nUnable to generate guidance right now.`,
      actions: []
    })
  }
}
