import { X, Key, Link, Hash } from 'lucide-react'
import { TableDefinition } from '@/types'
import { cn } from '@/lib/utils/cn'

interface Props {
  table: TableDefinition
  allTables: TableDefinition[]
  onClose: () => void
}

export function NodeDetailPanel({ table, allTables, onClose }: Props) {
  const referencedBy = allTables.filter(t =>
    t.id !== table.id &&
    t.columns.some(c => c.references?.table === table.name)
  )

  return (
    <div className="absolute top-0 right-0 h-full w-[300px] surface-elevated border-l border-white/10 flex flex-col z-20 animate-slide-in-r shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div>
          <div className="font-mono font-semibold text-sm text-text-primary">{table.name}</div>
          <div className="text-xs text-text-tertiary mt-0.5">{table.columns.length} columns</div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-md text-text-tertiary hover:text-text-primary hover:bg-white/5 transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* Columns */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-3">
          <div className="text-xs font-mono text-text-tertiary uppercase tracking-wide mb-2">Columns</div>
          <div className="space-y-1">
            {table.columns.map(col => (
              <div key={col.id} className="flex items-center gap-2 py-1.5 border-b border-white/[0.04]">
                <div className="flex-shrink-0 w-3.5">
                  {col.primaryKey && <Key size={11} className="text-warning" />}
                  {col.references && !col.primaryKey && <Link size={11} className="text-cyan" />}
                  {!col.primaryKey && !col.references && <Hash size={11} className="text-text-tertiary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-xs text-text-primary truncate">{col.name}</div>
                  {col.references && (
                    <div className="text-[10px] text-cyan/70 font-mono truncate">
                      → {col.references.table}.{col.references.column}
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0 text-right">
                  <div className="text-[10px] font-mono text-text-tertiary">
                    {col.type}{col.length ? `(${col.length})` : ''}
                  </div>
                  <div className="flex gap-1 justify-end mt-0.5">
                    {col.primaryKey && (
                      <span className="text-[9px] font-mono text-warning bg-warning/10 rounded px-1">PK</span>
                    )}
                    {col.unique && !col.primaryKey && (
                      <span className="text-[9px] font-mono text-violet bg-violet/10 rounded px-1">UNQ</span>
                    )}
                    {col.nullable && (
                      <span className="text-[9px] font-mono text-text-tertiary bg-white/5 rounded px-1">NULL</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Where used */}
        {referencedBy.length > 0 && (
          <div className="px-4 pb-4">
            <div className="text-xs font-mono text-text-tertiary uppercase tracking-wide mb-2">Referenced By</div>
            <div className="space-y-1">
              {referencedBy.map(t => {
                const refCols = t.columns.filter(c => c.references?.table === table.name)
                return (
                  <div key={t.id} className="surface rounded-lg px-3 py-2">
                    <div className="font-mono text-xs text-text-primary">{t.name}</div>
                    {refCols.map(c => (
                      <div key={c.id} className="text-[10px] font-mono text-text-tertiary mt-0.5">
                        via <span className="text-cyan/70">{c.name}</span>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Indexes */}
        {table.indexes && table.indexes.length > 0 && (
          <div className="px-4 pb-4">
            <div className="text-xs font-mono text-text-tertiary uppercase tracking-wide mb-2">Indexes</div>
            <div className="space-y-1">
              {table.indexes.map((idx, i) => (
                <div key={i} className={cn(
                  'surface rounded-lg px-3 py-2 text-xs font-mono',
                  idx.unique ? 'text-violet' : 'text-text-secondary'
                )}>
                  <div>{idx.name}</div>
                  <div className="text-text-tertiary text-[10px]">{idx.columns.join(', ')}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
