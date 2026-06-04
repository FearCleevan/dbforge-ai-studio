import { useState } from 'react'
import { X, Sparkles } from 'lucide-react'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

const EXAMPLE_PROMPTS = [
  'Find top 10 customers by order total',
  'Get all products with low stock',
  'Users who signed up in the last 30 days',
  'Count orders grouped by status',
  'Most popular product categories',
]

interface Props {
  onGenerate: (prompt: string) => Promise<void>
  onClose: () => void
}

export function AIQueryPrompt({ onGenerate, onClose }: Props) {
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return
    setIsGenerating(true)
    try {
      await onGenerate(prompt.trim())
      onClose()
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="w-[300px] flex-shrink-0 border-l border-white/5 surface flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-cyan" />
          <span className="font-semibold text-sm text-text-primary">AI Query Generator</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded text-text-tertiary hover:text-text-primary hover:bg-white/5 transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          disabled={isGenerating}
          placeholder="Describe what you want to query..."
          className="w-full bg-bg-muted border border-white/5 rounded-lg px-3 py-2.5 font-mono text-sm text-text-primary resize-none focus:outline-none focus:border-cyan/50 placeholder:text-text-tertiary disabled:opacity-50 transition-colors"
          style={{ height: '100px', fontSize: '13px' }}
          onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleGenerate() }}
        />

        <div>
          <div className="text-xs text-text-tertiary mb-2 font-mono">Examples</div>
          <div className="space-y-1.5">
            {EXAMPLE_PROMPTS.map((ex, i) => (
              <button
                key={i}
                onClick={() => setPrompt(ex)}
                className="w-full text-left px-2.5 py-2 rounded-lg bg-bg-muted border border-white/5 text-xs text-text-secondary hover:text-text-primary hover:border-cyan/20 hover:bg-cyan/5 transition-all"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={!prompt.trim() || isGenerating}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-cyan text-bg-base font-semibold text-sm hover:shadow-cyan transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <LoadingSpinner size="sm" color="white" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Sparkles size={14} />
              <span>Generate Query</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
