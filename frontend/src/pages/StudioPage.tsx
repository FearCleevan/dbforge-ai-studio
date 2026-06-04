import { lazy, Suspense, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { Database } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { useProject } from '@/context/ProjectContext'
import { useUI } from '@/context/UIContext'
import { useToast } from '@/context/ToastContext'
import { localStorageService } from '@/lib/storage/localStorageService'
import { isAuthenticated } from '@/lib/api/auth'
import { fetchProject } from '@/lib/api/projects'
import { ecommerceSchema } from '@/lib/mock/schemas'
import { DEMO_PROJECT_ID } from '@/lib/constants'
import { Project } from '@/types'
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
  const { currentProject, switchProject, createProject } = useProject()
  const { activeTab } = useUI()
  const { addToast } = useToast()
  const bootstrapped = useRef(false)

  useEffect(() => {
    if (bootstrapped.current) return
    bootstrapped.current = true

    const resolvedId = projectId ?? DEMO_PROJECT_ID

    async function bootstrap() {
      if (resolvedId === DEMO_PROJECT_ID) {
        // Logged-in users: check backend first so their saved work is restored
        if (isAuthenticated()) {
          try {
            const project = await fetchProject(resolvedId)
            localStorageService.saveProject(project)
            switchProject(resolvedId)
            return
          } catch {
            // Not in backend yet — fall through to create it
          }
        } else {
          // Unauthenticated: use localStorage if available
          const existing = localStorageService.getProject(resolvedId)
          if (existing) {
            switchProject(resolvedId)
            return
          }
        }
        const now = new Date().toISOString()
        const demo: Project = {
          id: DEMO_PROJECT_ID,
          name: 'E-Commerce Demo',
          description: 'Auto-created demo project',
          schema: ecommerceSchema,
          savedSchemas: [],
          queries: [],
          apiRequests: [],
          environments: [{ id: crypto.randomUUID(), name: 'Development', variables: [] }],
          namingConvention: { tableCase: 'snake_case', columnCase: 'snake_case' },
          createdAt: now,
          updatedAt: now,
        }
        await createProject(demo)
        setTimeout(() => addToast('Welcome! We loaded a demo project to get you started.', 'info'), 300)
        return
      }

      if (isAuthenticated()) {
        try {
          const project = await fetchProject(resolvedId)
          localStorageService.saveProject(project)
          switchProject(resolvedId)
          return
        } catch {
          // fall through
        }
      }

      const existing = localStorageService.getProject(resolvedId)
      if (existing) {
        switchProject(resolvedId)
        return
      }

      const now = new Date().toISOString()
      const newProject: Project = {
        id: resolvedId,
        name: 'New Project',
        description: '',
        schema: undefined,
        savedSchemas: [],
        queries: [],
        apiRequests: [],
        environments: [{ id: crypto.randomUUID(), name: 'Development', variables: [] }],
        namingConvention: { tableCase: 'snake_case', columnCase: 'snake_case' },
        createdAt: now,
        updatedAt: now,
      }
      await createProject(newProject)
    }

    bootstrap().catch(console.error)
  }, [projectId]) // eslint-disable-line react-hooks/exhaustive-deps

  const schema = currentProject?.schema ?? null

  const renderPanel = () => {
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
