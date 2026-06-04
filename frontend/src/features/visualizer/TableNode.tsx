import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { Key, Link, MessageCircle } from 'lucide-react'
import { TableDefinition } from '@/types'
import { cn } from '@/lib/utils/cn'

interface TableNodeData {
  table: TableDefinition
  target: string
  selected?: boolean
  showTypes?: boolean
  commentCount?: number
  onOpenComments?: (tableId: string) => void
}

// Row height must match NODE_ROW_HEIGHT in useFlowLayout so dagre sizes nodes correctly
const ROW_H = 28

function TableNodeComponent({ data, selected }: NodeProps<TableNodeData>) {
  const { table, target, showTypes = true, commentCount = 0, onOpenComments } = data

  return (
    <div
      className={cn(
        'surface-elevated rounded-xl border transition-all duration-200',
        'min-w-[220px] max-w-[300px]',
        selected
          ? 'border-cyan/60 shadow-cyan'
          : 'border-white/10 hover:border-cyan/30 hover:shadow-[0_0_12px_rgba(0,212,255,0.15)]'
      )}
    >
      {/* Header */}
      <div className={cn(
        'px-3 py-2.5 border-b border-white/10 rounded-t-xl',
        'bg-gradient-to-r from-cyan/5 to-transparent'
      )}>
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono font-semibold text-sm text-text-primary truncate">{table.name}</span>
          <div className="flex items-center gap-1 flex-shrink-0">
            {onOpenComments && (
              <button
                onClick={e => { e.stopPropagation(); onOpenComments(table.id) }}
                title={`${commentCount} comment${commentCount !== 1 ? 's' : ''}`}
                className="flex items-center gap-0.5 p-0.5 rounded text-text-tertiary hover:text-cyan transition-colors"
              >
                <MessageCircle size={11} />
                {commentCount > 0 && (
                  <span className="text-[9px] font-mono text-cyan">{commentCount}</span>
                )}
              </button>
            )}
            <span className="text-[10px] font-mono text-text-tertiary bg-white/5 px-1.5 py-0.5 rounded">
              {target}
            </span>
          </div>
        </div>
        <div className="text-[10px] text-text-tertiary mt-0.5 font-mono">
          {table.columns.length} columns
        </div>
      </div>

      {/* Column rows — each has its own per-column handles */}
      <div className="py-1">
        {table.columns.map(col => {
          const isFK = !!col.references
          const isPK = col.primaryKey

          return (
            <div
              key={col.id}
              className="relative flex items-center gap-2 px-3 hover:bg-white/[0.03] transition-colors"
              style={{ height: ROW_H }}
            >
              {/*
                TARGET handle (left edge).
                Visible golden dot for PK columns — they are the target of FK references.
                Invisible tiny dot for all other columns so edges can still connect here.
              */}
              <Handle
                type="target"
                position={Position.Left}
                id={`target-${col.id}`}
                isConnectable={false}
                className={cn(
                  '!rounded-full !border !transition-colors',
                  isPK
                    ? '!w-[10px] !h-[10px] !bg-warning/80 !border-warning/50'
                    : '!w-[6px] !h-[6px] !bg-white/0 !border-white/0'
                )}
              />

              {/* Column icon */}
              <div className="flex-shrink-0 w-3">
                {isPK && <Key size={10} className="text-warning" />}
                {isFK && !isPK && <Link size={10} className="text-cyan" />}
              </div>

              {/* Column name */}
              <span className={cn(
                'text-xs font-mono truncate flex-1',
                isPK ? 'text-warning' : isFK ? 'text-cyan' : 'text-text-secondary'
              )}>
                {col.name}
              </span>

              {/* Type label */}
              {showTypes && (
                <span className="text-[10px] font-mono text-text-tertiary flex-shrink-0 pr-1">
                  {col.type.toLowerCase()}{col.length ? `(${col.length})` : ''}
                </span>
              )}

              {/*
                SOURCE handle (right edge).
                Visible cyan dot for FK columns — they are the origin of a relationship.
                Invisible tiny dot for non-FK columns.
              */}
              <Handle
                type="source"
                position={Position.Right}
                id={`source-${col.id}`}
                isConnectable={false}
                className={cn(
                  '!rounded-full !border !transition-colors',
                  isFK
                    ? '!w-[10px] !h-[10px] !bg-cyan/80 !border-cyan/50'
                    : '!w-[6px] !h-[6px] !bg-white/0 !border-white/0'
                )}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

export const TableNode = memo(TableNodeComponent)
