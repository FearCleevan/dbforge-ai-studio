import { useState } from 'react'
import { X, Play, CheckCircle, XCircle, Loader2, Clock } from 'lucide-react'
import { APICollection, CollectionRunSummary } from '@/types'
import { runCollection } from '@/lib/api/collections'
import { HTTP_METHOD_COLORS } from '@/lib/constants'
import { cn } from '@/lib/utils/cn'

interface Props {
  collection: APICollection
  onClose: () => void
}

export function CollectionRunner({ collection, onClose }: Props) {
  const [running, setRunning]     = useState(false)
  const [result, setResult]       = useState<CollectionRunSummary | null>(null)
  const [error, setError]         = useState<string | null>(null)

  async function handleRun() {
    setRunning(true)
    setResult(null)
    setError(null)
    try {
      const summary = await runCollection(collection._id)
      setResult(summary)
    } catch {
      setError('Collection run failed')
    } finally {
      setRunning(false)
    }
  }

  const requests = collection.requests ?? []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-bg-surface border border-white/10 rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Play size={14} className="text-cyan" />
            <span className="font-semibold text-sm text-text-primary">Run: {collection.name}</span>
            <span className="text-xs text-text-tertiary font-mono">({requests.length} requests)</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-text-tertiary hover:text-text-primary hover:bg-white/5 transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && (
            <div className="text-xs text-error bg-error/10 border border-error/20 rounded-lg px-3 py-2">{error}</div>
          )}

          {/* Summary */}
          {result && (
            <div className="flex items-center gap-4 p-3 rounded-xl border border-white/10 bg-bg-overlay">
              <div className="text-center">
                <div className="text-2xl font-bold text-text-primary">{result.summary.total}</div>
                <div className="text-[10px] text-text-tertiary">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-success">{result.summary.passed}</div>
                <div className="text-[10px] text-text-tertiary">Passed</div>
              </div>
              <div className="text-center">
                <div className={cn('text-2xl font-bold', result.summary.failed > 0 ? 'text-error' : 'text-text-tertiary')}>
                  {result.summary.failed}
                </div>
                <div className="text-[10px] text-text-tertiary">Failed</div>
              </div>
              <div className="ml-auto">
                {result.summary.failed === 0 ? (
                  <CheckCircle size={24} className="text-success" />
                ) : (
                  <XCircle size={24} className="text-error" />
                )}
              </div>
            </div>
          )}

          {/* Request list */}
          <div className="space-y-2">
            {requests.map((req, i) => {
              const runResult = result?.results.find(r => r.id === req.id)
              const isPassed = runResult ? runResult.status >= 200 && runResult.status < 300 : null
              const color = HTTP_METHOD_COLORS[req.method] ?? '#6B7280'

              return (
                <div key={req.id} className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl border',
                  isPassed === null ? 'border-white/5 bg-bg-overlay' :
                  isPassed ? 'border-success/20 bg-success/5' : 'border-error/20 bg-error/5'
                )}>
                  <span className="text-xs font-mono text-text-tertiary w-4 flex-shrink-0">{i + 1}</span>
                  <span className="text-[10px] font-mono font-bold w-[42px] flex-shrink-0" style={{ color }}>{req.method}</span>
                  <div className="flex-1 min-w-0">
                    {req.name && <div className="text-xs text-text-primary truncate">{req.name}</div>}
                    <div className="text-[10px] text-text-tertiary font-mono truncate">{req.url}</div>
                  </div>
                  {running && !runResult && (
                    <Loader2 size={12} className="animate-spin text-text-tertiary flex-shrink-0" />
                  )}
                  {runResult && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={cn('text-[10px] font-mono font-bold', isPassed ? 'text-success' : 'text-error')}>
                        {runResult.status || 'ERR'}
                      </span>
                      <span className="flex items-center gap-0.5 text-[10px] text-text-tertiary">
                        <Clock size={9} /> {runResult.timeMs}ms
                      </span>
                      {isPassed
                        ? <CheckCircle size={12} className="text-success" />
                        : <XCircle size={12} className="text-error" />
                      }
                    </div>
                  )}
                  {runResult?.error && (
                    <span className="text-[10px] text-error truncate max-w-[120px]" title={runResult.error}>
                      {runResult.error}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-white/5 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-1.5 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors">
            Close
          </button>
          <button
            onClick={handleRun}
            disabled={running || requests.length === 0}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-cyan text-bg-base text-sm font-medium hover:bg-cyan/90 disabled:opacity-40 transition-colors"
          >
            {running ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
            {running ? 'Running…' : result ? 'Run again' : 'Run all'}
          </button>
        </div>
      </div>
    </div>
  )
}
