import { Database, GitBranch, Terminal, Zap, Plug, ChevronLeft, ChevronRight, Download, Settings } from 'lucide-react'
import { useUI } from '@/context/UIContext'
import { useProject } from '@/context/ProjectContext'
import { localStorageService } from '@/lib/storage/localStorageService'
import { DB_TARGETS } from '@/lib/constants'
import { DbIcon } from '@/lib/utils/dbIcons'
import { cn } from '@/lib/utils/cn'

type ActiveTab = 'schema-designer' | 'visualizer' | 'query-editor' | 'api-checker' | 'connections'

const NAV_ITEMS: { id: ActiveTab; label: string; Icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'schema-designer', label: 'Schema Designer', Icon: Database },
  { id: 'visualizer',      label: 'ER Visualizer',   Icon: GitBranch },
  { id: 'query-editor',    label: 'Query Editor',    Icon: Terminal },
  { id: 'api-checker',     label: 'API Checker',     Icon: Zap },
  { id: 'connections',     label: 'Connections',     Icon: Plug },
]

export function Sidebar() {
  const { activeTab, setActiveTab, sidebarCollapsed, toggleSidebar } = useUI()
  const { currentProject } = useProject()

  const dbTarget = DB_TARGETS.find(d => d.value === currentProject?.schema?.target)

  const handleExport = () => {
    if (currentProject) localStorageService.exportProject(currentProject)
  }

  return (
    <aside
      className="flex flex-col bg-bg-surface border-r border-white/5 flex-shrink-0 transition-all duration-250 overflow-hidden"
      style={{ width: sidebarCollapsed ? '64px' : '220px' }}
    >
      {/* Nav items */}
      <nav className="flex-1 py-3 space-y-0.5 px-2">
        {NAV_ITEMS.map(({ id, label, Icon }) => {
          const isActive = activeTab === id
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              title={sidebarCollapsed ? label : undefined}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-cyan/10 border-l-2 border-cyan text-text-primary pl-[10px]'
                  : 'text-text-secondary hover:bg-bg-overlay hover:text-text-primary border-l-2 border-transparent'
              )}
            >
              <Icon size={16} />
              {!sidebarCollapsed && <span className="truncate">{label}</span>}
            </button>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-white/5 p-2 space-y-1">
        {!sidebarCollapsed && currentProject && (
          <div className="px-2 py-2 mb-1">
            <div className="text-xs font-medium text-text-primary truncate">{currentProject.name}</div>
            {dbTarget && (
              <div className="flex items-center gap-1 mt-1">
                <DbIcon name={dbTarget.iconName} size={12} className="text-text-tertiary" />
                <span className="text-xs text-text-tertiary">{dbTarget.label}</span>
              </div>
            )}
          </div>
        )}
        <div className="flex items-center gap-1">
          <button
            onClick={handleExport}
            title="Export project"
            className="flex-1 flex items-center justify-center gap-1.5 p-2 rounded-lg text-text-tertiary hover:text-text-secondary hover:bg-white/5 transition-colors text-xs"
          >
            <Download size={14} />
            {!sidebarCollapsed && 'Export'}
          </button>
          <button
            title="Settings"
            className="p-2 rounded-lg text-text-tertiary hover:text-text-secondary hover:bg-white/5 transition-colors"
          >
            <Settings size={14} />
          </button>
        </div>
        <button
          onClick={toggleSidebar}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="w-full flex items-center justify-center p-2 rounded-lg text-text-tertiary hover:text-text-secondary hover:bg-white/5 transition-colors"
        >
          {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>
    </aside>
  )
}
