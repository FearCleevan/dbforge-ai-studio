import { Play, GitBranch, ArrowRight, Sparkles, Zap, Plug, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { DbConnection } from '@/types/connection'

interface Props {
  onRun:              () => void
  onExplain:          () => void
  onTranslate:        () => void
  onOptimize:         () => void
  onAIGenerate:       () => void
  isRunning:          boolean
  dbTarget:           string
  connections:        DbConnection[]
  activeConnection:   DbConnection | null
  onConnectionChange: (conn: DbConnection | null) => void
}

interface ToolbarButtonProps {
  onClick:   () => void
  disabled?: boolean
  variant?:  'primary' | 'ghost' | 'violet' | 'cyan'
  title:     string
  shortcut?: string
  children:  React.ReactNode
}

function ToolbarButton({ onClick, disabled, variant = 'ghost', title, shortcut, children }: ToolbarButtonProps) {
  const base = 'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-all disabled:opacity-40 disabled:cursor-not-allowed'
  const variants = {
    primary: 'bg-emerald/20 border border-emerald/30 text-emerald hover:bg-emerald/30',
    ghost:   'text-text-secondary hover:text-text-primary hover:bg-white/5 border border-transparent',
    violet:  'text-violet hover:text-violet hover:bg-violet/10 border border-transparent hover:border-violet/20',
    cyan:    'bg-cyan/10 border border-cyan/30 text-cyan hover:bg-cyan/20',
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={shortcut ? `${title} (${shortcut})` : title}
      className={cn(base, variants[variant])}
    >
      {children}
    </button>
  )
}

export function QueryToolbar({
  onRun, onExplain, onTranslate, onOptimize, onAIGenerate,
  isRunning, dbTarget, connections, activeConnection, onConnectionChange,
}: Props) {
  return (
    <div className="flex items-center gap-1 px-3 py-2 border-b border-white/5 flex-shrink-0 bg-bg-surface">
      <ToolbarButton onClick={onRun} disabled={isRunning} variant="primary" title="Run Query" shortcut="Ctrl+Enter">
        <Play size={12} className={isRunning ? 'animate-pulse' : ''} />
        <span>{isRunning ? 'Running...' : 'Run'}</span>
      </ToolbarButton>

      <div className="w-px h-4 bg-white/10 mx-1" />

      <ToolbarButton onClick={onExplain} title="Explain Query" shortcut="Ctrl+Shift+E">
        <GitBranch size={12} />
        <span>Explain</span>
      </ToolbarButton>
      <ToolbarButton onClick={onTranslate} title="Translate to MongoDB">
        <ArrowRight size={12} />
        <span>→ NoSQL</span>
      </ToolbarButton>
      <ToolbarButton onClick={onOptimize} variant="violet" title="Optimize Query">
        <Zap size={12} />
        <span>Optimize</span>
      </ToolbarButton>

      <div className="w-px h-4 bg-white/10 mx-1" />

      <ToolbarButton onClick={onAIGenerate} variant="cyan" title="AI Generate Query">
        <Sparkles size={12} />
        <span>AI Generate</span>
      </ToolbarButton>

      <div className="flex-1" />

      {/* Connection selector — only shown when there are saved connections */}
      {connections.length > 0 && (
        <div className="relative group mr-2">
          <button
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono border transition-all',
              activeConnection
                ? 'bg-emerald/10 border-emerald/30 text-emerald'
                : 'bg-white/5 border-white/10 text-text-secondary hover:text-text-primary'
            )}
          >
            <Plug size={11} />
            <span className="max-w-[120px] truncate">
              {activeConnection?.name ?? 'No connection'}
            </span>
            <ChevronDown size={10} />
          </button>
          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-1 w-56 bg-bg-elevated border border-white/10 rounded-lg shadow-lg z-20 hidden group-focus-within:block group-hover:block">
            <button
              onClick={() => onConnectionChange(null)}
              className={cn(
                'w-full text-left px-3 py-2 text-xs transition-colors',
                !activeConnection
                  ? 'text-cyan bg-cyan/5'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
              )}
            >
              Mock mode (no connection)
            </button>
            <div className="border-t border-white/5 my-1" />
            {connections.map(c => (
              <button
                key={c._id}
                onClick={() => onConnectionChange(c)}
                className={cn(
                  'w-full text-left px-3 py-2 text-xs transition-colors',
                  activeConnection?._id === c._id
                    ? 'text-emerald bg-emerald/10'
                    : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                )}
              >
                <span className="block font-medium">{c.name}</span>
                <span className="text-text-tertiary font-mono">{c.database}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <span className="text-xs font-mono text-text-tertiary border border-white/10 rounded px-2 py-0.5">
        {activeConnection ? activeConnection.driver : dbTarget}
      </span>
    </div>
  )
}
