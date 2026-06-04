import { useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { QueryResult, ExplainPlan } from '@/types'
import { ResultsTable } from './ResultsTable'
import { ResultsJSON } from './ResultsJSON'
import { formatMs } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils/cn'

type ResultTab = 'results' | 'explain' | 'json'

interface Props {
  result: QueryResult | null
  explainPlan: ExplainPlan | null
  optimization: string[] | null
  noSQLTranslation: string | null
  isRunning: boolean
}

const EXPLAIN_COLORS: Record<string, string> = {
  'Seq Scan': 'text-warning border-warning/30 bg-warning/5',
  'Index Scan': 'text-emerald border-emerald/30 bg-emerald/5',
  'Hash Join': 'text-cyan border-cyan/30 bg-cyan/5',
  'Hash Aggregate': 'text-violet border-violet/30 bg-violet/5',
}

export function ResultsPanel({ result, explainPlan, optimization, noSQLTranslation, isRunning }: Props) {
  const [activeTab, setActiveTab] = useState<ResultTab>('results')

  const hasError = result?.error
  const hasResult = result && !hasError

  return (
    <div className="flex flex-col overflow-hidden border-t border-white/5" style={{ height: '50%' }}>
      {/* Panel header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/5 flex-shrink-0 bg-bg-elevated">
        <div className="flex gap-1">
          {(['results', 'explain', 'json'] as ResultTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-2.5 py-1 rounded text-xs font-mono transition-colors capitalize',
                activeTab === tab
                  ? 'bg-cyan/10 text-cyan'
                  : 'text-text-tertiary hover:text-text-secondary'
              )}
            >
              {tab === 'json' ? 'JSON' : tab === 'explain' ? 'Explain Plan' : 'Results'}
            </button>
          ))}
        </div>

        {hasResult && (
          <span className="text-[10px] font-mono text-text-tertiary">
            {result.rowCount} {result.rowCount === 1 ? 'row' : 'rows'} · {formatMs(result.executionMs)}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {isRunning && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-6 h-6 border-2 border-emerald/30 border-t-emerald rounded-full animate-spin mx-auto mb-2" />
              <span className="text-xs text-text-tertiary font-mono">Executing...</span>
            </div>
          </div>
        )}

        {!isRunning && !result && !explainPlan && (
          <div className="flex-1 flex items-center justify-center text-text-tertiary text-xs font-mono">
            Run a query to see results
          </div>
        )}

        {!isRunning && hasError && (
          <div className="flex-1 p-4">
            <div className="flex items-start gap-3 p-3 rounded-lg border border-error/30 bg-error/5">
              <AlertCircle size={14} className="text-error flex-shrink-0 mt-0.5" />
              <pre className="font-mono text-xs text-error leading-relaxed whitespace-pre-wrap">{result.error}</pre>
            </div>
          </div>
        )}

        {!isRunning && hasResult && activeTab === 'results' && (
          <ResultsTable result={result} />
        )}

        {!isRunning && activeTab === 'explain' && explainPlan && (
          <div className="flex-1 overflow-auto p-4 space-y-2">
            {explainPlan.steps.map((step, i) => {
              const colorClass = EXPLAIN_COLORS[step.operation] ?? 'text-text-secondary border-white/10 bg-white/5'
              return (
                <div key={i} className="flex items-start gap-3">
                  {i < explainPlan.steps.length - 1 && (
                    <div className="absolute left-[27px] mt-8 w-px h-4 bg-white/10" style={{ position: 'relative' }} />
                  )}
                  <div className={cn('flex-1 rounded-lg border p-3', colorClass)}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs font-semibold">{step.operation}</span>
                      <div className="flex gap-3 text-[10px] font-mono opacity-70">
                        <span>cost: {step.cost}</span>
                        <span>rows: {step.rows}</span>
                      </div>
                    </div>
                    <div className="text-[10px] opacity-70">{step.detail}</div>
                    {step.table && <div className="text-[10px] mt-1 opacity-60">on <span className="font-semibold">{step.table}</span>{step.index ? ` using ${step.index}` : ''}</div>}
                  </div>
                </div>
              )
            })}
            <div className="text-xs font-mono text-text-tertiary pt-2 border-t border-white/5">
              Total cost: {explainPlan.totalCost} · Estimated rows: {explainPlan.estimatedRows}
            </div>
          </div>
        )}

        {!isRunning && activeTab === 'explain' && !explainPlan && (
          <div className="flex-1 flex items-center justify-center text-text-tertiary text-xs font-mono">
            Click Explain to analyze the query plan
          </div>
        )}

        {!isRunning && activeTab === 'json' && result && !hasError && (
          <ResultsJSON result={result} />
        )}

        {!isRunning && activeTab === 'json' && (!result || hasError) && (
          <div className="flex-1 flex items-center justify-center text-text-tertiary text-xs font-mono">
            Run a query to see JSON output
          </div>
        )}
      </div>

      {/* Optimization suggestions */}
      {optimization && optimization.length > 0 && (
        <div className="border-t border-white/5 px-4 py-2 flex-shrink-0 bg-violet/5">
          <div className="text-[10px] font-mono text-violet mb-1.5 uppercase tracking-wide">Optimization Tips</div>
          <div className="space-y-1">
            {optimization.map((tip, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                <span className="text-violet flex-shrink-0">•</span>
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NoSQL translation */}
      {noSQLTranslation && (
        <div className="border-t border-white/5 px-4 py-2 flex-shrink-0 bg-bg-muted">
          <div className="text-[10px] font-mono text-cyan mb-1.5 uppercase tracking-wide">MongoDB Translation</div>
          <pre className="font-mono text-xs text-text-code leading-relaxed">{noSQLTranslation}</pre>
        </div>
      )}
    </div>
  )
}
