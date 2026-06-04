import { useState } from 'react'
import { History, Trash2, RotateCcw, ChevronDown, ChevronRight, Database } from 'lucide-react'
import { SavedSchema } from '@/types'

interface Props {
  savedSchemas: SavedSchema[]
  onRestore:    (saved: SavedSchema) => void
  onDelete:     (id: string) => void
}

export function SchemaHistoryPanel({ savedSchemas, onRestore, onDelete }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)

  if (savedSchemas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-3">
          <History className="w-5 h-5 text-text-tertiary" />
        </div>
        <p className="text-sm text-text-secondary font-medium mb-1">No saved schemas yet</p>
        <p className="text-xs text-text-tertiary leading-relaxed">
          Click <span className="text-cyan font-mono">Save Schema</span> to snapshot the current state
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1 p-2">
      {savedSchemas.map(saved => (
        <div
          key={saved.id}
          className="rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
        >
          {/* Row header */}
          <div className="flex items-center gap-2 px-3 py-2.5">
            <button
              type="button"
              onClick={() => setExpanded(expanded === saved.id ? null : saved.id)}
              className="flex-1 flex items-center gap-2 min-w-0 text-left"
            >
              {expanded === saved.id
                ? <ChevronDown className="w-3.5 h-3.5 text-text-tertiary flex-shrink-0" />
                : <ChevronRight className="w-3.5 h-3.5 text-text-tertiary flex-shrink-0" />
              }
              <Database className="w-3.5 h-3.5 text-cyan/70 flex-shrink-0" />
              <span className="text-sm text-text-primary truncate font-medium">{saved.name}</span>
            </button>

            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                title="Restore this schema"
                onClick={() => onRestore(saved)}
                className="p-1 rounded text-text-tertiary hover:text-emerald hover:bg-emerald/10 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                title="Delete this snapshot"
                onClick={() => onDelete(saved.id)}
                className="p-1 rounded text-text-tertiary hover:text-error hover:bg-error/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Expanded details */}
          {expanded === saved.id && (
            <div className="px-3 pb-3 border-t border-white/5 pt-2.5 space-y-2">
              <div className="flex items-center gap-4 text-xs text-text-tertiary font-mono">
                <span>{saved.schema.tables.length} tables</span>
                <span>{saved.schema.target}</span>
                <span>{new Date(saved.savedAt).toLocaleString()}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {saved.schema.tables.slice(0, 6).map(t => (
                  <span
                    key={t.id}
                    className="px-2 py-0.5 rounded-md bg-bg-muted text-xs text-text-secondary font-mono"
                  >
                    {t.name}
                  </span>
                ))}
                {saved.schema.tables.length > 6 && (
                  <span className="px-2 py-0.5 rounded-md bg-bg-muted text-xs text-text-tertiary font-mono">
                    +{saved.schema.tables.length - 6} more
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => onRestore(saved)}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-cyan/10 border border-cyan/20 text-cyan text-xs font-medium hover:bg-cyan/20 transition-colors"
              >
                <RotateCcw className="w-3 h-3" /> Restore this schema
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
