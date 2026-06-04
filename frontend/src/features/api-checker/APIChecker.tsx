import { useState, useCallback } from 'react'
import { Save, FolderOpen } from 'lucide-react'
import { APIRequest, APIResponse, APITest, APIEnvironment, APICollection, DBAssertionResult, KeyValuePair } from '@/types'
import { runAutoTests, simulateAPIRequest as simulateAPIRequestFallback } from '@/lib/simulation/apiSimulator'
import { runTestScript, autoTestsToAPITests } from '@/lib/execution/testRunner'
import { runPreRequestScript, resolveVariables } from '@/lib/execution/preRequestRunner'
import { runDBQuery } from '@/lib/api/collections'
import { useProject } from '@/context/ProjectContext'
import { useToast } from '@/context/ToastContext'
import { isAuthenticated } from '@/lib/api/auth'
import { apiClient } from '@/lib/api/client'
import { RequestSidebar } from './RequestSidebar'
import { RequestBuilder } from './RequestBuilder'
import { ResponseViewer } from './ResponseViewer'
import { EnvironmentPanel } from './EnvironmentPanel'
import { CollectionPanel } from './CollectionPanel'
import { CollectionRunner } from './CollectionRunner'
import { cn } from '@/lib/utils/cn'

function newRequest(): APIRequest {
  return {
    id: crypto.randomUUID(),
    method: 'GET',
    url: '',
    headers: [],
    params: [],
    bodyType: 'json',
    authType: 'none',
  }
}

function newEnv(): APIEnvironment {
  return {
    id: crypto.randomUUID(),
    name: `Env ${Date.now().toString().slice(-4)}`,
    variables: [],
  }
}

type SidebarMode = 'requests' | 'collections'

export function APIChecker() {
  const { currentProject, dispatch } = useProject()
  const { addToast } = useToast()
  const authed = isAuthenticated()

  const savedRequests = currentProject?.apiRequests ?? []
  const projectEnvs: APIEnvironment[] = currentProject?.environments ?? []

  const [draft, setDraft]               = useState<APIRequest>(newRequest())
  const [activeId, setActiveId]         = useState<string | null>(null)
  const [response, setResponse]         = useState<APIResponse | null>(null)
  const [tests, setTests]               = useState<APITest[]>([])
  const [consoleLogs, setConsoleLogs]   = useState<string[]>([])
  const [dbAssertion, setDbAssertion]   = useState<DBAssertionResult | null>(null)
  const [isRunning, setIsRunning]       = useState(false)
  const [sidebarMode, setSidebarMode]   = useState<SidebarMode>('requests')
  const [runnerCollection, setRunnerCollection] = useState<APICollection | null>(null)

  const [activeEnvId, setActiveEnvId]   = useState<string | null>(
    projectEnvs.length > 0 ? projectEnvs[0].id : null
  )
  const [localEnvs, setLocalEnvs]       = useState<APIEnvironment[]>(projectEnvs)

  const activeEnvVars: KeyValuePair[] =
    localEnvs.find(e => e.id === activeEnvId)?.variables ?? []

  const handleNew = useCallback(() => {
    setDraft(newRequest())
    setActiveId(null)
    setResponse(null)
    setTests([])
    setConsoleLogs([])
    setDbAssertion(null)
  }, [])

  const handleSelect = useCallback((req: APIRequest) => {
    setDraft({ ...req })
    setActiveId(req.id)
    setResponse(null)
    setTests([])
    setConsoleLogs([])
    setDbAssertion(null)
  }, [])

  const handleSave = useCallback(() => {
    if (!draft.url.trim()) {
      addToast('Enter a URL before saving', 'error')
      return
    }
    const toSave: APIRequest = {
      ...draft,
      name: draft.name || `${draft.method} ${draft.url.split('/').pop() || 'request'}`,
    }
    dispatch({ type: 'ADD_API_REQUEST', payload: toSave })
    setActiveId(toSave.id)
    addToast('Request saved', 'success')
  }, [draft, dispatch, addToast])

  const handleDelete = useCallback((id: string) => {
    dispatch({ type: 'DELETE_API_REQUEST', payload: id })
    if (activeId === id) {
      setDraft(newRequest())
      setActiveId(null)
      setResponse(null)
      setTests([])
      setConsoleLogs([])
      setDbAssertion(null)
    }
  }, [activeId, dispatch])

  const handleSend = useCallback(async () => {
    if (!draft.url.trim() || isRunning) return
    setIsRunning(true)
    setResponse(null)
    setTests([])
    setConsoleLogs([])
    setDbAssertion(null)

    try {
      // Step 1: run pre-request script
      let effectiveRequest = { ...draft }
      const allLogs: string[] = []

      if (draft.preRequestScript?.trim()) {
        const preResult = runPreRequestScript(draft.preRequestScript, draft, activeEnvVars)
        effectiveRequest = preResult.request
        allLogs.push(...preResult.consoleLogs)
        if (preResult.error) {
          allLogs.push(`[pre-request error] ${preResult.error}`)
        }
      }

      // Step 2: resolve env variables in URL and headers
      const resolvedUrl = resolveVariables(effectiveRequest.url, activeEnvVars)
      effectiveRequest = { ...effectiveRequest, url: resolvedUrl }

      // Step 3: make the real HTTP request via backend proxy
      let res: APIResponse
      const start = Date.now()
      try {
        const proxyBody = {
          method:  effectiveRequest.method,
          url:     effectiveRequest.url,
          headers: Object.fromEntries(
            effectiveRequest.headers
              .filter(h => h.enabled && h.key)
              .map(h => [resolveVariables(h.key, activeEnvVars), resolveVariables(h.value, activeEnvVars)])
          ),
          params: Object.fromEntries(
            effectiveRequest.params
              .filter(p => p.enabled && p.key)
              .map(p => [resolveVariables(p.key, activeEnvVars), resolveVariables(p.value, activeEnvVars)])
          ),
          body: effectiveRequest.body,
          authType:  effectiveRequest.authType,
          authValue: effectiveRequest.authValue,
        }

        const proxyRes = await apiClient.post<{
          status: number
          statusText: string
          headers: Record<string, string>
          body: unknown
          size: number
        }>('/api/request/send', proxyBody)

        res = {
          ...proxyRes.data,
          timeMs: Date.now() - start,
        }
      } catch (err: unknown) {
        // Fall back to mock simulation if backend proxy unavailable
        res = await simulateAPIRequestFallback(effectiveRequest, activeEnvVars)
      }

      setResponse(res)

      // Step 4: run auto tests
      const autoTests = runAutoTests(effectiveRequest, res)

      // Step 5: run custom test script
      if (effectiveRequest.testScript?.trim()) {
        const scriptResult = runTestScript(effectiveRequest.testScript, res)
        allLogs.push(...scriptResult.consoleLogs)
        const scriptTests = autoTestsToAPITests(scriptResult.scriptTests)
        setTests([...autoTests, ...scriptTests])
      } else {
        setTests(autoTests)
      }

      setConsoleLogs(allLogs)

      // Step 6: DB-backed assertion for mutating methods
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(effectiveRequest.method) && res.status < 400) {
        const connections = await import('@/lib/api/connections')
          .then(m => m.connectionsAPI.list())
          .catch(() => [])

        if (connections.length > 0) {
          // Auto-generate a verification query from the URL path
          const urlPath = (() => {
            try { return new URL(effectiveRequest.url).pathname } catch { return effectiveRequest.url }
          })()
          const segments = urlPath.split('/').filter(Boolean)
          const tableName = segments[segments.length - 2] ?? segments[segments.length - 1] ?? 'records'
          const assertQuery = `SELECT COUNT(*) as count FROM "${tableName}" LIMIT 1`
          const assertion = await runDBQuery(connections[0]._id, assertQuery)
          setDbAssertion(assertion)
        }
      }

      const color = res.status < 400 ? 'success' : 'error'
      addToast(`${res.status} ${res.statusText} · ${res.timeMs}ms`, color)
    } finally {
      setIsRunning(false)
    }
  }, [draft, isRunning, activeEnvVars, addToast, tests])

  const handleCreateEnv = useCallback(() => {
    const env = newEnv()
    setLocalEnvs(prev => [...prev, env])
    setActiveEnvId(env.id)
  }, [])

  const handleUpdateEnv = useCallback((updated: APIEnvironment) => {
    setLocalEnvs(prev => prev.map(e => e.id === updated.id ? updated : e))
  }, [])

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left: sidebar */}
      <div className="w-[220px] flex-shrink-0 border-r border-white/5 flex flex-col bg-bg-surface">
        {/* Sidebar mode toggle */}
        <div className="flex border-b border-white/5">
          <button
            type="button"
            onClick={() => setSidebarMode('requests')}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-mono transition-colors',
              sidebarMode === 'requests' ? 'text-cyan border-b-2 border-cyan' : 'text-text-tertiary hover:text-text-secondary'
            )}
          >
            Requests
          </button>
          {authed && (
            <button
              type="button"
              onClick={() => setSidebarMode('collections')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-mono transition-colors',
                sidebarMode === 'collections' ? 'text-cyan border-b-2 border-cyan' : 'text-text-tertiary hover:text-text-secondary'
              )}
            >
              <FolderOpen size={11} /> Collections
            </button>
          )}
        </div>

        {sidebarMode === 'requests' ? (
          <RequestSidebar
            requests={savedRequests}
            activeId={activeId}
            onSelect={handleSelect}
            onNew={handleNew}
            onDelete={handleDelete}
          />
        ) : (
          <CollectionPanel
            currentRequest={draft.url ? draft : null}
            onRunCollection={col => setRunnerCollection(col)}
          />
        )}
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-bg-elevated flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-text-secondary">API Checker</span>
            {activeEnvVars.length > 0 && (
              <span className="text-[10px] font-mono text-violet bg-violet/10 px-1.5 py-0.5 rounded">
                {activeEnvVars.filter(v => v.enabled).length} vars active
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/10 text-xs font-mono text-text-secondary hover:text-text-primary hover:border-white/20 transition-colors"
            >
              <Save size={11} />
              Save
            </button>
            <EnvironmentPanel
              environments={localEnvs}
              activeEnvId={activeEnvId}
              onSelectEnv={setActiveEnvId}
              onUpdateEnv={handleUpdateEnv}
              onCreateEnv={handleCreateEnv}
            />
          </div>
        </div>

        {/* Request name */}
        <div className="px-4 py-2 border-b border-white/5 flex-shrink-0">
          <input
            value={draft.name ?? ''}
            onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
            placeholder="Request name (optional)"
            className="w-full bg-transparent text-sm font-semibold text-text-primary placeholder:text-text-tertiary focus:outline-none"
          />
        </div>

        {/* Request builder */}
        <RequestBuilder
          request={draft}
          onChange={setDraft}
          onSend={handleSend}
          isRunning={isRunning}
        />

        {/* Response viewer */}
        <ResponseViewer
          response={response}
          tests={tests}
          isRunning={isRunning}
          consoleLogs={consoleLogs}
          dbAssertion={dbAssertion}
        />
      </div>

      {/* Collection runner modal */}
      {runnerCollection && (
        <CollectionRunner
          collection={runnerCollection}
          onClose={() => setRunnerCollection(null)}
        />
      )}
    </div>
  )
}
