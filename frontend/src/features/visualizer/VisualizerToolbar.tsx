import { LayoutDashboard, Maximize2, Image, Type, List, Minimize2, Search } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface Props {
  onAutoLayout: () => void
  onFitView: () => void
  onExportPng: () => void
  showTypes: boolean
  showIndexes: boolean
  compactMode: boolean
  onToggleTypes: () => void
  onToggleIndexes: () => void
  onToggleCompact: () => void
  searchQuery: string
  onSearchChange: (q: string) => void
}

interface ToggleButtonProps {
  active: boolean
  onClick: () => void
  title: string
  children: React.ReactNode
}

function ToggleButton({ active, onClick, title, children }: ToggleButtonProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono transition-colors',
        active
          ? 'bg-cyan/10 text-cyan border border-cyan/30'
          : 'text-text-tertiary hover:text-text-secondary hover:bg-white/5 border border-transparent'
      )}
    >
      {children}
    </button>
  )
}

export function VisualizerToolbar({
  onAutoLayout,
  onFitView,
  onExportPng,
  showTypes,
  showIndexes,
  compactMode,
  onToggleTypes,
  onToggleIndexes,
  onToggleCompact,
  searchQuery,
  onSearchChange,
}: Props) {
  return (
    <div className="absolute top-3 left-3 z-10 flex items-center gap-2 surface-elevated border border-white/10 rounded-xl px-3 py-2 shadow-lg">
      {/* Actions */}
      <button
        onClick={onAutoLayout}
        title="Auto Layout"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono text-text-secondary hover:text-cyan hover:bg-cyan/5 transition-colors border border-transparent hover:border-cyan/20"
      >
        <LayoutDashboard size={13} />
        <span>Layout</span>
      </button>

      <button
        onClick={onFitView}
        title="Fit View"
        className="p-1.5 rounded-md text-text-tertiary hover:text-text-secondary hover:bg-white/5 transition-colors"
      >
        <Maximize2 size={13} />
      </button>

      <button
        onClick={onExportPng}
        title="Export PNG"
        className="p-1.5 rounded-md text-text-tertiary hover:text-text-secondary hover:bg-white/5 transition-colors"
      >
        <Image size={13} />
      </button>

      <div className="w-px h-4 bg-white/10 mx-1" />

      {/* Toggles */}
      <ToggleButton active={showTypes} onClick={onToggleTypes} title="Show/Hide Types">
        <Type size={11} />
        <span>Types</span>
      </ToggleButton>

      <ToggleButton active={showIndexes} onClick={onToggleIndexes} title="Show/Hide Indexes">
        <List size={11} />
        <span>Indexes</span>
      </ToggleButton>

      <ToggleButton active={compactMode} onClick={onToggleCompact} title="Compact Mode">
        <Minimize2 size={11} />
        <span>Compact</span>
      </ToggleButton>

      <div className="w-px h-4 bg-white/10 mx-1" />

      {/* Search */}
      <div className="flex items-center gap-1.5 bg-bg-muted border border-white/5 rounded-md px-2 py-1">
        <Search size={11} className="text-text-tertiary flex-shrink-0" />
        <input
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Search tables..."
          className="bg-transparent text-xs font-mono text-text-primary placeholder:text-text-tertiary focus:outline-none w-28"
        />
      </div>
    </div>
  )
}
