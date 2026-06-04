import { cn } from '@/lib/utils/cn'

interface Tab {
  id: string
  label: string
  icon?: React.ReactNode
}

interface Props {
  tabs: Tab[]
  activeTab: string
  onTabChange: (id: string) => void
  className?: string
}

export function TabNav({ tabs, activeTab, onTabChange, className }: Props) {
  return (
    <div className={cn('flex items-center h-10 bg-bg-surface border-b border-white/5 px-2 gap-1', className)}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'relative flex items-center gap-1.5 px-3 h-full text-sm transition-colors duration-150',
            activeTab === tab.id
              ? 'text-text-primary tab-active-cyan'
              : 'text-text-secondary hover:text-text-primary'
          )}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  )
}
