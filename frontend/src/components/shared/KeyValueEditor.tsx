import { Plus, Trash2 } from 'lucide-react'
import { KeyValuePair } from '@/types'
import { cn } from '@/lib/utils/cn'

interface Props {
  pairs: KeyValuePair[]
  onChange: (pairs: KeyValuePair[]) => void
  className?: string
}

export function KeyValueEditor({ pairs, onChange, className }: Props) {
  const addRow = () =>
    onChange([...pairs, { id: crypto.randomUUID(), key: '', value: '', enabled: true }])

  const updateRow = (id: string, field: keyof KeyValuePair, value: string | boolean) =>
    onChange(pairs.map(p => p.id === id ? { ...p, [field]: value } : p))

  const deleteRow = (id: string) => onChange(pairs.filter(p => p.id !== id))

  return (
    <div className={cn('space-y-1', className)}>
      {pairs.map(pair => (
        <div key={pair.id} className="flex items-center gap-2 group">
          <input
            type="checkbox"
            checked={pair.enabled}
            onChange={e => updateRow(pair.id, 'enabled', e.target.checked)}
            className="accent-cyan flex-shrink-0"
          />
          <input
            value={pair.key}
            onChange={e => updateRow(pair.id, 'key', e.target.value)}
            placeholder="Key"
            className="flex-1 bg-bg-muted border border-white/5 rounded px-2 py-1.5 text-xs font-mono text-text-primary focus:outline-none focus:border-cyan/40"
          />
          <input
            value={pair.value}
            onChange={e => updateRow(pair.id, 'value', e.target.value)}
            placeholder="Value"
            className="flex-1 bg-bg-muted border border-white/5 rounded px-2 py-1.5 text-xs font-mono text-text-primary focus:outline-none focus:border-cyan/40"
          />
          <button
            onClick={() => deleteRow(pair.id)}
            className="p-1 text-text-tertiary hover:text-error opacity-0 group-hover:opacity-100 transition-all"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ))}
      <button
        onClick={addRow}
        className="flex items-center gap-1.5 text-xs text-text-tertiary hover:text-text-secondary transition-colors mt-1 py-1"
      >
        <Plus size={13} /> Add Row
      </button>
    </div>
  )
}
