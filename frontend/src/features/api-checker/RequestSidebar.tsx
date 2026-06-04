import { Plus, Trash2, X } from 'lucide-react'
import { APIRequest } from '@/types'
import { HTTP_METHOD_COLORS } from '@/lib/constants'
import { cn } from '@/lib/utils/cn'

interface Props {
  requests: APIRequest[]
  activeId: string | null
  onSelect: (req: APIRequest) => void
  onNew: () => void
  onDelete: (id: string) => void
}

function MethodBadge({ method }: { method: string }) {
  const color = HTTP_METHOD_COLORS[method] ?? '#6B7280'
  return (
    <span
      className="text-[10px] font-mono font-bold flex-shrink-0 w-[46px] text-right"
      style={{ color }}
    >
      {method}
    </span>
  )
}

function urlLabel(url: string): string {
  try {
    const u = new URL(url)
    return u.pathname || url
  } catch {
    return url || '/'
  }
}

export function RequestSidebar({ requests, activeId, onSelect, onNew, onDelete }: Props) {
  return (
    <div className="w-[220px] flex-shrink-0 border-r border-white/5 flex flex-col bg-bg-surface">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/5">
        <span className="text-xs font-mono text-text-secondary">Saved Requests</span>
        <button
          type="button"
          onClick={onNew}
          title="New request"
          className="p-1 rounded text-text-tertiary hover:text-cyan hover:bg-white/5 transition-colors"
        >
          <Plus size={13} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-24 gap-2 text-text-tertiary">
            <span className="text-xs font-mono">No saved requests</span>
            <button
              type="button"
              onClick={onNew}
              className="text-xs text-cyan font-mono hover:underline"
            >
              + New request
            </button>
          </div>
        ) : (
          requests.map(req => (
            <div
              key={req.id}
              onClick={() => onSelect(req)}
              className={cn(
                'group flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors border-b border-white/[0.03]',
                activeId === req.id
                  ? 'bg-cyan/5 border-l-2 border-l-cyan'
                  : 'hover:bg-white/[0.03]'
              )}
            >
              <MethodBadge method={req.method} />
              <div className="flex-1 min-w-0">
                {req.name && (
                  <div className="text-xs text-text-primary truncate font-medium">{req.name}</div>
                )}
                <div className="text-[10px] text-text-tertiary font-mono truncate">
                  {urlLabel(req.url) || 'No URL'}
                </div>
              </div>
              <button
                type="button"
                onClick={e => { e.stopPropagation(); onDelete(req.id) }}
                className="p-1 text-text-tertiary hover:text-error opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
              >
                <X size={10} />
              </button>
            </div>
          ))
        )}
      </div>

      {requests.length > 0 && (
        <div className="border-t border-white/5 px-3 py-2">
          <button
            type="button"
            onClick={() => requests.forEach(r => onDelete(r.id))}
            className="flex items-center gap-1.5 text-[10px] text-text-tertiary hover:text-error transition-colors font-mono"
          >
            <Trash2 size={10} />
            Clear all
          </button>
        </div>
      )}
    </div>
  )
}
