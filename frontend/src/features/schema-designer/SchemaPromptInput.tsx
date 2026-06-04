import { useState } from 'react'
import { Sparkles, ChevronDown, ChevronRight, Upload, AlertCircle } from 'lucide-react'
import { DatabaseTarget, NamingConvention } from '@/types'
import { DB_TARGETS } from '@/lib/constants'
import { DbIcon } from '@/lib/utils/dbIcons'
import { StatusDot } from '@/components/shared/StatusDot'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { cn } from '@/lib/utils/cn'

interface Props {
  onGenerate: (prompt: string, target: DatabaseTarget, convention: NamingConvention) => void
  onImport: (ddl: string, target: DatabaseTarget) => void
  isGenerating: boolean
  promptHistory: string[]
}

type PanelMode = 'ai' | 'import'

const PLACEHOLDER = `Describe your database...\ne.g., "Create a multi-tenant SaaS platform with user roles and subscriptions"`

const DDL_PLACEHOLDER = `Paste your CREATE TABLE statements here...\n\nSupports PostgreSQL and MySQL syntax, including:\n• Schema prefixes (public.table)\n• FOREIGN KEY constraints\n• Multi-word types (timestamp with time zone)\n• JSONB, arrays, UUID`

export function SchemaPromptInput({ onGenerate, onImport, isGenerating, promptHistory }: Props) {
  const [mode, setMode] = useState<PanelMode>('ai')

  // AI Generate state
  const [prompt, setPrompt] = useState('')
  const [target, setTarget] = useState<DatabaseTarget>('postgresql')
  const [conventionOpen, setConventionOpen] = useState(false)
  const [convention, setConvention] = useState<NamingConvention>({
    tableCase: 'snake_case',
    columnCase: 'snake_case',
    prefix: '',
    suffix: '',
  })

  // Import state
  const [ddl, setDdl] = useState('')
  const [importTarget, setImportTarget] = useState<DatabaseTarget>('postgresql')
  const [importError, setImportError] = useState<string | null>(null)

  const handleGenerate = () => {
    if (!prompt.trim() || isGenerating) return
    onGenerate(prompt.trim(), target, convention)
  }

  const handleImport = () => {
    if (!ddl.trim()) return
    setImportError(null)
    try {
      onImport(ddl.trim(), importTarget)
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Failed to parse DDL')
    }
  }

  return (
    <div className="w-[280px] flex-shrink-0 surface border-r border-white/5 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
        <StatusDot status={isGenerating ? 'loading' : 'online'} />
        <span className="font-semibold text-text-primary" style={{ fontSize: '15px' }}>
          {mode === 'ai' ? 'AI Schema Generator' : 'Import SQL Schema'}
        </span>
      </div>

      {/* Mode toggle */}
      <div className="flex border-b border-white/5 flex-shrink-0">
        <button
          onClick={() => setMode('ai')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-mono transition-colors',
            mode === 'ai'
              ? 'text-cyan border-b-2 border-cyan bg-cyan/5'
              : 'text-text-tertiary hover:text-text-secondary'
          )}
        >
          <Sparkles size={11} />
          AI Generate
        </button>
        <button
          onClick={() => setMode('import')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-mono transition-colors',
            mode === 'import'
              ? 'text-emerald border-b-2 border-emerald bg-emerald/5'
              : 'text-text-tertiary hover:text-text-secondary'
          )}
        >
          <Upload size={11} />
          Import SQL
        </button>
      </div>

      {/* AI Generate panel */}
      {mode === 'ai' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            disabled={isGenerating}
            placeholder={PLACEHOLDER}
            className="w-full bg-bg-muted border border-white/5 rounded-lg px-3 py-2.5 font-mono text-sm text-text-primary resize-none focus:outline-none focus:border-cyan/50 placeholder:text-text-tertiary disabled:opacity-50 transition-colors"
            style={{ height: '120px', fontSize: '13px' }}
          />

          <div>
            <div className="text-xs text-text-tertiary mb-2 font-mono">Database Target</div>
            <div className="flex flex-wrap gap-1.5">
              {DB_TARGETS.map(db => (
                <button
                  key={db.value}
                  onClick={() => setTarget(db.value as DatabaseTarget)}
                  disabled={isGenerating}
                  className={cn(
                    'flex items-center gap-1 px-2.5 py-1 rounded-pill text-xs border transition-all disabled:opacity-50',
                    target === db.value
                      ? 'bg-cyan/15 border-cyan/50 text-cyan'
                      : 'border-white/10 text-text-secondary hover:border-white/20 hover:text-text-primary'
                  )}
                >
                  <DbIcon name={db.iconName} size={11} />
                  <span>{db.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <button
              onClick={() => setConventionOpen(v => !v)}
              className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors w-full"
            >
              {conventionOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              <span className="font-mono">Naming Conventions</span>
            </button>

            {conventionOpen && (
              <div className="mt-3 space-y-3 pl-4 animate-fade-up">
                <div>
                  <div className="text-xs text-text-tertiary mb-1.5">Table Case</div>
                  <div className="flex gap-1">
                    {(['snake_case', 'PascalCase', 'camelCase'] as const).map(c => (
                      <button
                        key={c}
                        onClick={() => setConvention(v => ({ ...v, tableCase: c }))}
                        className={cn(
                          'flex-1 py-1 rounded text-xs border transition-all',
                          convention.tableCase === c
                            ? 'border-violet/50 bg-violet/10 text-violet'
                            : 'border-white/10 text-text-secondary hover:border-white/20'
                        )}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-text-tertiary mb-1.5">Column Case</div>
                  <div className="flex gap-1">
                    {(['snake_case', 'camelCase'] as const).map(c => (
                      <button
                        key={c}
                        onClick={() => setConvention(v => ({ ...v, columnCase: c }))}
                        className={cn(
                          'flex-1 py-1 rounded text-xs border transition-all',
                          convention.columnCase === c
                            ? 'border-violet/50 bg-violet/10 text-violet'
                            : 'border-white/10 text-text-secondary hover:border-white/20'
                        )}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-text-tertiary mb-1.5">Table Prefix (optional)</div>
                  <input
                    value={convention.prefix ?? ''}
                    onChange={e => setConvention(v => ({ ...v, prefix: e.target.value }))}
                    placeholder="e.g. tbl_"
                    className="w-full bg-bg-muted border border-white/5 rounded px-2 py-1 text-xs font-mono text-text-primary focus:outline-none focus:border-cyan/40"
                  />
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-cyan text-bg-base font-semibold text-sm hover:shadow-cyan transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {isGenerating ? (
              <>
                <LoadingSpinner size="sm" color="white" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Sparkles size={15} />
                <span>Generate Schema</span>
              </>
            )}
          </button>

          {promptHistory.length > 0 && (
            <div>
              <div className="text-xs text-text-tertiary mb-2 font-mono">Recent</div>
              <div className="space-y-1.5">
                {promptHistory.slice(0, 3).map((h, i) => (
                  <button
                    key={i}
                    onClick={() => setPrompt(h)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg bg-bg-muted border border-white/5 text-xs text-text-secondary hover:text-text-primary hover:border-white/10 transition-all truncate"
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Import SQL panel */}
      {mode === 'import' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
          <div className="text-xs text-text-tertiary font-mono leading-relaxed">
            Paste existing DDL to visualize it directly — no AI generation needed.
          </div>

          {/* Target selector */}
          <div>
            <div className="text-xs text-text-tertiary mb-2 font-mono">Dialect</div>
            <div className="flex gap-1.5">
              {DB_TARGETS.filter(db => db.value === 'postgresql' || db.value === 'mysql').map(db => (
                <button
                  key={db.value}
                  onClick={() => setImportTarget(db.value as DatabaseTarget)}
                  className={cn(
                    'flex items-center gap-1 px-2.5 py-1 rounded-pill text-xs border transition-all',
                    importTarget === db.value
                      ? 'bg-emerald/15 border-emerald/50 text-emerald'
                      : 'border-white/10 text-text-secondary hover:border-white/20 hover:text-text-primary'
                  )}
                >
                  <DbIcon name={db.iconName} size={11} />
                  <span>{db.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* DDL textarea — grows to fill available space */}
          <div className="flex-1 flex flex-col min-h-0">
            <textarea
              value={ddl}
              onChange={e => { setDdl(e.target.value); setImportError(null) }}
              placeholder={DDL_PLACEHOLDER}
              className="flex-1 w-full bg-bg-muted border border-white/5 rounded-lg px-3 py-2.5 font-mono text-text-primary resize-none focus:outline-none focus:border-emerald/50 placeholder:text-text-tertiary transition-colors"
              style={{ fontSize: '12px', minHeight: '180px' }}
            />
          </div>

          {importError && (
            <div className="flex items-start gap-2 p-2.5 rounded-lg border border-error/30 bg-error/5">
              <AlertCircle size={12} className="text-error flex-shrink-0 mt-0.5" />
              <span className="text-xs text-error font-mono">{importError}</span>
            </div>
          )}

          <button
            onClick={handleImport}
            disabled={!ddl.trim()}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald text-bg-base font-semibold text-sm hover:shadow-emerald transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
          >
            <Upload size={15} />
            <span>Import & Visualize</span>
          </button>

          <div className="text-[10px] text-text-tertiary font-mono leading-relaxed space-y-0.5">
            <div>• Schema prefixes (public., auth.) are stripped</div>
            <div>• Cross-schema FK refs are included as labels</div>
            <div>• Arrays, JSONB, and UUID types are supported</div>
          </div>
        </div>
      )}
    </div>
  )
}
