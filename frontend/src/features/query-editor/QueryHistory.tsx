import { Trash2, Clock, X } from 'lucide-react'
import { QueryDefinition } from '@/types'
import { formatRelative, truncate } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils/cn'

interface Props {
  history: QueryDefinition[]
  onLoad: (sql: string) => void
  onDelete: (id: string) => void
  onClearAll: () => void
  collapsed: boolean
  onToggle: () => void
}

export function QueryHistory({ history, onLoad, onDelete, onClearAll, collapsed, onToggle }: Props) {
  return (
    <div
      className={cn(
        'border-l border-white/5 flex flex-col bg-bg-surface transition-all duration-250 flex-shrink-0',
        collapsed ? 'w-10' : 'w-[260px]'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-2 border-b border-white/5">
        {!collapsed && (
          <>
            <div className="flex items-center gap-1.5">
              <Clock size={11} className="text-text-tertiary" />
              <span className="text-xs font-mono text-text-secondary">History</span>
              {history.length > 0 && (
                <span className="text-[10px] font-mono text-text-tertiary">({history.length})</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {history.length > 0 && (
                <button
                  onClick={onClearAll}
                  title="Clear all"
                  className="p-1 rounded text-text-tertiary hover:text-error transition-colors"
                >
                  <Trash2 size={10} />
                </button>
              )}
            </div>
          </>
        )}
        <button
          onClick={onToggle}
          className={cn(
            'p-1 rounded text-text-tertiary hover:text-text-secondary hover:bg-white/5 transition-colors',
            collapsed && 'mx-auto'
          )}
          title={collapsed ? 'Expand history' : 'Collapse history'}
        >
          <Clock size={12} />
        </button>
      </div>

      {!collapsed && (
        <div className="flex-1 overflow-y-auto py-1">
          {history.length === 0 ? (
            <div className="flex items-center justify-center h-20 text-text-tertiary text-xs font-mono">
              No history yet
            </div>
          ) : (
            history.map(entry => (
              <div
                key={entry.id}
                className="group relative px-3 py-2 hover:bg-white/[0.03] transition-colors cursor-pointer border-b border-white/[0.03]"
                onClick={() => onLoad(entry.sql)}
              >
                <div className="font-mono text-xs text-text-secondary group-hover:text-text-primary transition-colors leading-relaxed">
                  {truncate(entry.sql.trim(), 60)}
                </div>
                <div className="text-[10px] text-text-tertiary mt-0.5">
                  {formatRelative(entry.createdAt)}
                </div>
                <button
                  onClick={e => { e.stopPropagation(); onDelete(entry.id) }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-text-tertiary hover:text-error opacity-0 group-hover:opacity-100 transition-all"
                >
                  <X size={10} />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
