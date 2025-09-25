import { useEffect } from 'react'
import { useAIExplain } from '@/hooks/useAIExplain'
import { useAppState } from '@/lib/store'

export function AskABFI({ inlet, dateISO }: { inlet: any; dateISO: string }) {
  const vm = useAppState(s => s.analysisVM)
  const { sstLayerVisible, chlLayerVisible } = useAppState((s) => ({
    sstLayerVisible: s.sstLayerVisible,
    chlLayerVisible: s.chlLayerVisible
  }))
  
  // Use actual layer visibility
  const sstOn = sstLayerVisible
  const chlOn = chlLayerVisible
  
  const { loading, markdown, actions, error, run } = useAIExplain()

  useEffect(() => {
    if (vm) {
      console.log('[AskABFI] Running AI analysis with:', { vm, sstOn, chlOn, inlet, dateISO })
      run(vm, { sstOn, chlOn }, inlet, dateISO)
    }
  }, [vm, sstOn, chlOn, inlet?.id, dateISO])

  return (
    <aside className="fixed right-0 top-[400px] w-[340px] h-[calc(100%-400px)] z-[30] bg-gray-900 text-gray-100 border-l border-gray-700 border-t p-4 overflow-y-auto rounded-tl-lg">
      <h3 className="text-lg font-bold mb-2 text-cyan-400">ABFI First Mate</h3>
      
      {loading && (
        <div className="text-gray-400 animate-pulse">
          <p>🤔 Analyzing ocean conditions...</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded p-3 mb-3">
          <p className="text-red-400 text-sm">Error: {error}</p>
        </div>
      )}
      
      {!loading && !error && !markdown && (
        <p className="text-gray-500">Draw an analysis area to see AI guidance.</p>
      )}
      
      {markdown && (
        <div className="prose prose-invert prose-sm max-w-none">
          <div 
            dangerouslySetInnerHTML={{ 
              __html: markdown.split('\n').map(line => {
                // Simple markdown parsing
                if (line.startsWith('# ')) return `<h1 class="text-xl font-bold mt-4 mb-2">${line.slice(2)}</h1>`
                if (line.startsWith('## ')) return `<h2 class="text-lg font-semibold mt-3 mb-2">${line.slice(3)}</h2>`
                if (line.startsWith('### ')) return `<h3 class="text-base font-semibold mt-2 mb-1">${line.slice(4)}</h3>`
                if (line.startsWith('- ')) return `<li class="ml-4">${line.slice(2)}</li>`
                if (line.trim() === '') return '<br/>'
                return `<p class="mb-2">${line}</p>`
              }).join('\n')
            }} 
          />
        </div>
      )}
      
      {actions && actions.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold mb-2 text-gray-400">Suggested Actions</h4>
          <div className="flex gap-2 flex-wrap">
            {actions.map((action: any, i: number) => (
              <button
                key={i}
                onClick={() => {
                  console.log('[AskABFI] Action clicked:', action)
                  // TODO: Implement action handlers
                  if (action.type === 'enable_layers') {
                    const store = useAppState.getState()
                    if (action.layers?.includes('sst')) store.setActiveRaster('sst')
                  }
                }}
                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm border border-gray-600 rounded"
              >
                {action.type.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>
      )}
      
      <div className="mt-6 pt-4 border-t border-gray-700">
        <p className="text-xs text-gray-500">
          Powered by AI • Updates with each analysis
        </p>
      </div>
    </aside>
  )
}
