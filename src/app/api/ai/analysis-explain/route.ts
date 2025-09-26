import { NextRequest, NextResponse } from 'next/server'

// Keep this in sync with your existing VM
type AnalysisVM = {
  areaKm2: number
  hasSST: boolean
  hasCHL: boolean
  sst?: { meanF: number; minF: number; maxF: number; gradFperMile: number }
  chl?: { mean: number } // mg/m³
}

// System rules: no made-up numbers; use °F + mg/m³; extended analysis format
const SYSTEM_PROMPT = `
You are ABFI's on-board fishing analyst. Generate an extended analysis report with precision and insight.

RULES:
- NEVER invent numbers; only use those in the JSON input
- Units: Fahrenheit (°F) for temperature, mg/m³ for chlorophyll  
- If SST or CHL missing, note it and suggest enabling layers

OUTPUT FORMAT (markdown only, no JSON):

## Temperature Analysis
Describe sea surface temperatures in °F. Include current mean (e.g., "averaging 73.2°F"), range (min-max), and gradient if > 0.5°F/mile indicates a temperature break. Note any extremes within the analysis area.

## Water Quality
Describe chlorophyll levels and water clarity. Clear blue: < 0.2 mg/m³, productive green: 0.3-1.5 mg/m³, murky: > 2.0 mg/m³. Average value and any spatial patterns.

## Fishing Insights
2-3 sentences tying SST + CHL patterns to fishing conditions. E.g., "Sharp temperature break with elevated chlorophyll creates a productive edge. Target the warm side where baitfish concentrate."

End with: *Data from Copernicus ocean observations. Conditions change rapidly - combine with local knowledge.*
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

    // Now expecting pure markdown (no JSON actions)
    const markdown = String(content).trim() || 'Ocean Analysis\nNo output.'

    return NextResponse.json({
      markdown,
      actions: [] // No actions in extended analysis format
    })
  } catch (e: any) {
    console.error('[AI] Error:', e)
    return NextResponse.json({
      markdown: `Ocean Analysis\nUnable to generate guidance right now.`,
      actions: []
    })
  }
}
