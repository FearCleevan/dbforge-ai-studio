import { Plus, X } from 'lucide-react'
import { KeyValuePair } from '@/types'
import { cn } from '@/lib/utils/cn'

interface Props {
  pairs: KeyValuePair[]
  onChange: (pairs: KeyValuePair[]) => void
  keyPlaceholder?: string
  valuePlaceholder?: string
  readOnly?: boolean
}

export function KeyValueEditor({ pairs, onChange, keyPlaceholder = 'Key', valuePlaceholder = 'Value', readOnly = false }: Props) {
  const add = () => onChange([...pairs, { id: crypto.randomUUID(), key: '', value: '', enabled: true }])
  const remove = (id: string) => onChange(pairs.filter(p => p.id !== id))
  const update = (id: string, field: keyof KeyValuePair, value: string | boolean) =>
    onChange(pairs.map(p => p.id === id ? { ...p, [field]: value } : p))

  return (
    <div className="flex flex-col gap-1">
      {pairs.map(pair => (
        <div key={pair.id} className="flex items-center gap-1.5 group">
          <button
            type="button"
            onClick={() => update(pair.id, 'enabled', !pair.enabled)}
            className={cn(
              'w-3.5 h-3.5 rounded-sm border flex-shrink-0 transition-colors',
              pair.enabled ? 'bg-cyan/80 border-cyan' : 'bg-transparent border-white/20'
            )}
            title={pair.enabled ? 'Disable' : 'Enable'}
          />
          <input
            value={pair.key}
            onChange={e => update(pair.id, 'key', e.target.value)}
            disabled={readOnly}
            placeholder={keyPlaceholder}
            className={cn(
              'flex-1 bg-bg-muted border border-white/5 rounded px-2 py-1 text-xs font-mono text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-cyan/40 transition-colors',
              !pair.enabled && 'opacity-40',
              readOnly && 'cursor-default'
            )}
          />
          <input
            value={pair.value}
            onChange={e => update(pair.id, 'value', e.target.value)}
            disabled={readOnly}
            placeholder={valuePlaceholder}
            className={cn(
              'flex-1 bg-bg-muted border border-white/5 rounded px-2 py-1 text-xs font-mono text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-cyan/40 transition-colors',
              !pair.enabled && 'opacity-40',
              readOnly && 'cursor-default'
            )}
          />
          {!readOnly && (
            <button
              type="button"
              onClick={() => remove(pair.id)}
              className="p-1 text-text-tertiary hover:text-error opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
            >
              <X size={11} />
            </button>
          )}
        </div>
      ))}
      {!readOnly && (
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1.5 text-xs text-text-tertiary hover:text-cyan transition-colors mt-1 w-fit"
        >
          <Plus size={11} />
          Add row
        </button>
      )}
    </div>
  )
}
