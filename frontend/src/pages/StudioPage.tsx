import { lazy, Suspense, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { Database, FolderPlus } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { useProject } from '@/context/ProjectContext'
import { useUI } from '@/context/UIContext'
import { localStorageService } from '@/lib/storage/localStorageService'
import { isAuthenticated } from '@/lib/api/auth'
import { fetchProject } from '@/lib/api/projects'
import { EmptyState } from '@/components/shared/EmptyState'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

// Code-split each panel — largest one (QueryEditor w/ Monaco) loads lazily
const SchemaDesigner          = lazy(() => import('@/features/schema-designer/SchemaDesigner').then(m => ({ default: m.SchemaDesigner })))
const SchemaVisualizer        = lazy(() => import('@/features/visualizer/SchemaVisualizer').then(m => ({ default: m.SchemaVisualizer })))
const QueryEditor             = lazy(() => import('@/features/query-editor/QueryEditor').then(m => ({ default: m.QueryEditor })))
const APIChecker              = lazy(() => import('@/features/api-checker/APIChecker').then(m => ({ default: m.APIChecker })))
const DatabaseConnectionPanel = lazy(() => import('@/features/connections/DatabaseConnectionPanel').then(m => ({ default: m.DatabaseConnectionPanel })))

function PanelFallback() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <LoadingSpinner size="md" />
    </div>
  )
}

export function StudioPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const { currentProject, switchProject } = useProject()
  const { activeTab } = useUI()
  const bootstrapped = useRef(false)

  useEffect(() => {
    if (!projectId) return
    if (bootstrapped.current) return
    bootstrapped.current = true

    async function bootstrap() {
      if (isAuthenticated()) {
        try {
          const project = await fetchProject(projectId!)
          localStorageService.saveProject(project)
          switchProject(projectId!)
          return
        } catch {
          // fall through to localStorage
        }
      }

      const existing = localStorageService.getProject(projectId!)
      if (existing) {
        switchProject(projectId!)
      }
    }

    bootstrap().catch(console.error)
  }, [projectId]) // eslint-disable-line react-hooks/exhaustive-deps

  const schema = currentProject?.schema ?? null

  const renderPanel = () => {
    if (!projectId || !currentProject) {
      return (
        <EmptyState
          icon={FolderPlus}
          title="No project selected"
          description="Create a new project using the project switcher in the top bar to get started."
        />
      )
    }
    switch (activeTab) {
      case 'schema-designer': return <SchemaDesigner />
      case 'visualizer':      return <SchemaVisualizer schema={schema} />
      case 'query-editor':    return <QueryEditor />
      case 'api-checker':     return <APIChecker />
      case 'connections':     return <DatabaseConnectionPanel />
      default:
        return <EmptyState icon={Database} title="Select a tool" description="Use the sidebar to navigate between tools." />
    }
  }

  return (
    <AppShell>
      <div className="flex-1 flex overflow-hidden animate-fade-in">
        <Suspense fallback={<PanelFallback />}>
          {renderPanel()}
        </Suspense>
      </div>
    </AppShell>
  )
}
