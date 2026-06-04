import { useState } from 'react'
import { ChevronDown, Plus, Layers } from 'lucide-react'
import { APIEnvironment, KeyValuePair } from '@/types'
import { KeyValueEditor } from './KeyValueEditor'
import { cn } from '@/lib/utils/cn'

interface Props {
  environments: APIEnvironment[]
  activeEnvId: string | null
  onSelectEnv: (id: string | null) => void
  onUpdateEnv: (env: APIEnvironment) => void
  onCreateEnv: () => void
}

export function EnvironmentPanel({ environments, activeEnvId, onSelectEnv, onUpdateEnv, onCreateEnv }: Props) {
  const [open, setOpen] = useState(false)
  const activeEnv = environments.find(e => e.id === activeEnvId) ?? null

  const updateVars = (vars: KeyValuePair[]) => {
    if (!activeEnv) return
    onUpdateEnv({ ...activeEnv, variables: vars })
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors',
          open
            ? 'border-cyan/50 bg-cyan/10 text-cyan'
            : 'border-white/10 text-text-secondary hover:border-white/20 hover:text-text-primary'
        )}
      >
        <Layers size={12} />
        <span>{activeEnv?.name ?? 'No Environment'}</span>
        <ChevronDown size={11} className={cn('transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full right-0 mt-1 z-20 bg-bg-elevated border border-white/10 rounded-xl shadow-xl w-[340px]">
            {/* Env selector */}
            <div className="flex items-center gap-1.5 p-2 border-b border-white/5 flex-wrap">
              <button
                type="button"
                onClick={() => onSelectEnv(null)}
                className={cn(
                  'px-2.5 py-1 rounded-pill text-[11px] font-mono border transition-all',
                  activeEnvId === null
                    ? 'border-cyan/50 bg-cyan/10 text-cyan'
                    : 'border-white/10 text-text-tertiary hover:border-white/20 hover:text-text-secondary'
                )}
              >
                None
              </button>
              {environments.map(env => (
                <button
                  key={env.id}
                  type="button"
                  onClick={() => onSelectEnv(env.id)}
                  className={cn(
                    'px-2.5 py-1 rounded-pill text-[11px] font-mono border transition-all',
                    activeEnvId === env.id
                      ? 'border-cyan/50 bg-cyan/10 text-cyan'
                      : 'border-white/10 text-text-tertiary hover:border-white/20 hover:text-text-secondary'
                  )}
                >
                  {env.name}
                </button>
              ))}
              <button
                type="button"
                onClick={onCreateEnv}
                className="flex items-center gap-1 px-2 py-1 rounded-pill text-[11px] font-mono border border-dashed border-white/10 text-text-tertiary hover:border-white/20 hover:text-text-secondary transition-all"
              >
                <Plus size={10} /> New
              </button>
            </div>

            {/* Variables */}
            <div className="p-3">
              {!activeEnv ? (
                <p className="text-xs font-mono text-text-tertiary text-center py-3">
                  Select an environment to manage variables.<br />
                  Use <span className="text-cyan">{`{{variable}}`}</span> in your URL and headers.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-text-tertiary uppercase tracking-wide">
                      {activeEnv.name} Variables
                    </span>
                    <span className="text-[10px] font-mono text-text-tertiary">
                      {activeEnv.variables.filter(v => v.enabled).length} active
                    </span>
                  </div>
                  <KeyValueEditor
                    pairs={activeEnv.variables}
                    onChange={updateVars}
                    keyPlaceholder="VARIABLE_NAME"
                    valuePlaceholder="value"
                  />
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
