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
  if (!key) {
    // Return a basic analysis if no API key
    const data = JSON.parse(user);
    const { analysisVM } = data;
    
    if (!analysisVM.sst && !analysisVM.chl) {
      return "## Ocean Analysis\n\nNo ocean data available for this area.";
    }
    
    let analysis = "## Temperature Analysis\n";
    if (analysisVM.sst) {
      analysis += `Water temperatures averaging ${analysisVM.sst.meanF.toFixed(1)}°F, `;
      analysis += `ranging from ${analysisVM.sst.minF.toFixed(1)}°F to ${analysisVM.sst.maxF.toFixed(1)}°F. `;
      if (analysisVM.sst.gradFperMile > 0.5) {
        analysis += `Notable temperature gradient of ${analysisVM.sst.gradFperMile.toFixed(1)}°F/mile detected.\n\n`;
      } else {
        analysis += "Uniform temperature distribution.\n\n";
      }
    }
    
    analysis += "## Water Quality\n";
    if (analysisVM.chl) {
      analysis += `Chlorophyll concentration at ${analysisVM.chl.mean.toFixed(2)} mg/m³ indicates `;
      if (analysisVM.chl.mean < 0.2) {
        analysis += "clear blue water with low productivity.\n\n";
      } else if (analysisVM.chl.mean < 1.5) {
        analysis += "productive green water favorable for baitfish.\n\n";
      } else {
        analysis += "highly productive but possibly turbid water.\n\n";
      }
    }
    
    analysis += "## Fishing Insights\n";
    analysis += "Based on current conditions, ";
    if (analysisVM.sst?.gradFperMile > 0.5 && analysisVM.chl?.mean > 0.3) {
      analysis += "the temperature break combined with productive water creates favorable edge conditions. Target the warm side of the break.\n\n";
    } else if (analysisVM.sst?.meanF > 70 && analysisVM.chl?.mean > 0.2) {
      analysis += "warm water with moderate productivity suggests active feeding conditions.\n\n";
    } else {
      analysis += "conditions are stable. Focus on structure and known productive areas.\n\n";
    }
    
    analysis += "*Data from Copernicus ocean observations. Conditions change rapidly - combine with local knowledge.*";
    
    return analysis;
  }

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
