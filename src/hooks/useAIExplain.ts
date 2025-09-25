import { useState } from 'react'

export function useAIExplain() {
  const [loading, setLoading] = useState(false)
  const [markdown, setMarkdown] = useState('')
  const [actions, setActions] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  async function run(
    analysisVM: any, 
    toggles: { sstOn: boolean; chlOn: boolean }, 
    inlet: any, 
    dateISO: string
  ) {
    setLoading(true)
    setError(null)
    
    try {
      const r = await fetch('/api/ai/analysis-explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisVM, toggles, inlet, dateISO })
      })
      
      if (!r.ok) {
        throw new Error(`API error: ${r.status}`)
      }
      
      const j = await r.json()
      setMarkdown(j.markdown || '')
      setActions(Array.isArray(j.actions) ? j.actions : [])
    } catch (e: any) {
      console.error('[useAIExplain] Error:', e)
      setError(e?.message || 'AI request failed')
    } finally {
      setLoading(false)
    }
  }

  return { loading, markdown, actions, error, run }
}
