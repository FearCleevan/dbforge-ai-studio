import { useState, useCallback, useRef, useEffect } from 'react'
import Editor, { OnMount } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'
import { QueryResult, ExplainPlan, QueryDefinition, SchemaDefinition } from '@/types'
import { DbConnection } from '@/types/connection'
import { simulateQueryExecution, simulateQueryExplain, simulateQueryOptimize, simulateQueryTranslate, simulateQueryGeneration } from '@/lib/simulation/querySimulator'
import { generateQueryRemote } from '@/lib/api/query'
import { connectionsAPI } from '@/lib/api/connections'
import { apiClient } from '@/lib/api/client'
import { isAuthenticated } from '@/lib/api/auth'
import { useProject } from '@/context/ProjectContext'
import { useToast } from '@/context/ToastContext'
import { QUERY_HISTORY_MAX } from '@/lib/constants'
import { QueryToolbar } from './QueryToolbar'
import { AIQueryPrompt } from './AIQueryPrompt'
import { ResultsPanel } from './ResultsPanel'
import { QueryHistory } from './QueryHistory'

const DBFORGE_THEME: monaco.editor.IStandaloneThemeData = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'keyword', foreground: 'C678DD', fontStyle: 'bold' },
    { token: 'string', foreground: '98C379' },
    { token: 'number', foreground: 'D19A66' },
    { token: 'comment', foreground: '5C6370', fontStyle: 'italic' },
    { token: 'identifier', foreground: '61AFEF' },
    { token: 'operator', foreground: '56B6C2' },
  ],
  colors: {
    'editor.background': '#0F1117',
    'editor.foreground': '#F0F4FF',
    'editor.lineHighlightBackground': '#1C2333',
    'editorCursor.foreground': '#00D4FF',
    'editor.selectionBackground': '#2A4A6B',
    'editorLineNumber.foreground': '#4A5568',
    'editorLineNumber.activeForeground': '#8892A4',
    'editor.inactiveSelectionBackground': '#1C2333',
    'editorIndentGuide.background': '#242B3D',
  },
}

const DEFAULT_SQL = `-- Welcome to DBForge Query Editor
-- Press Ctrl+Enter (Cmd+Enter) to run your query

SELECT *
FROM users
LIMIT 10;`

function getSchemaCompletions(schema: SchemaDefinition | null): monaco.languages.CompletionItem[] {
  if (!schema) return []
  const items: monaco.languages.CompletionItem[] = []
  const range = { startLineNumber: 1, endLineNumber: 1, startColumn: 1, endColumn: 1 }

  schema.tables.forEach(table => {
    items.push({
      label: table.name,
      kind: monaco.languages.CompletionItemKind.Class,
      insertText: table.name,
      detail: `Table (${table.columns.length} columns)`,
      range,
    })
    table.columns.forEach(col => {
      items.push({
        label: `${table.name}.${col.name}`,
        kind: monaco.languages.CompletionItemKind.Field,
        insertText: col.name,
        detail: `${col.type}${col.primaryKey ? ' PK' : ''}`,
        range,
      })
    })
  })
  return items
}

export function QueryEditor() {
  const { currentProject, dispatch } = useProject()
  const { addToast } = useToast()
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)

  const schema = currentProject?.schema ?? null
  const history = currentProject?.queries ?? []

  const [connections, setConnections]           = useState<DbConnection[]>([])
  const [activeConnection, setActiveConnection] = useState<DbConnection | null>(null)

  const [sql, setSql] = useState(DEFAULT_SQL)
  const [result, setResult] = useState<QueryResult | null>(null)
  const [explainPlan, setExplainPlan] = useState<ExplainPlan | null>(null)
  const [optimization, setOptimization] = useState<string[] | null>(null)
  const [noSQLTranslation, setNoSQLTranslation] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [showAI, setShowAI] = useState(false)
  const [historyCollapsed, setHistoryCollapsed] = useState(false)

  useEffect(() => {
    if (!isAuthenticated()) return
    connectionsAPI.list().then(setConnections).catch(() => {})
  }, [])

  const saveToHistory = useCallback((querySql: string) => {
    const entry: QueryDefinition = {
      id: crypto.randomUUID(),
      sql: querySql,
      createdAt: new Date().toISOString(),
    }
    dispatch({ type: 'ADD_QUERY', payload: entry })

    if (history.length >= QUERY_HISTORY_MAX) {
      const oldest = history[history.length - 1]
      dispatch({ type: 'DELETE_QUERY', payload: oldest.id })
    }
  }, [dispatch, history])

  const handleRun = useCallback(async () => {
    const query = sql.trim()
    if (!query || isRunning) return

    setIsRunning(true)
    setExplainPlan(null)
    setOptimization(null)
    setNoSQLTranslation(null)

    try {
      let res: QueryResult

      if (activeConnection && isAuthenticated() && import.meta.env.VITE_USE_MOCK !== 'true') {
        try {
          const { data } = await apiClient.post<{ result: QueryResult }>('/api/query/execute', {
            connectionId: activeConnection._id,
            sql: query,
          })
          res = data.result
        } catch {
          res = await simulateQueryExecution(query, schema ?? { id: '', name: '', target: 'postgresql', tables: [], createdAt: '', updatedAt: '' })
        }
      } else {
        res = await simulateQueryExecution(query, schema ?? { id: '', name: '', target: 'postgresql', tables: [], createdAt: '', updatedAt: '' })
      }

      setResult(res)
      if (!res.error) {
        saveToHistory(query)
        addToast(`Query executed — ${res.rowCount} ${res.rowCount === 1 ? 'row' : 'rows'} in ${res.executionMs}ms`, 'success')
      }
    } finally {
      setIsRunning(false)
    }
  }, [sql, isRunning, schema, saveToHistory, addToast])

  const handleExplain = useCallback(async () => {
    if (!sql.trim()) return
    setIsRunning(true)
    try {
      const plan = await simulateQueryExplain(sql)
      setExplainPlan(plan)
    } finally {
      setIsRunning(false)
    }
  }, [sql])

  const handleTranslate = useCallback(async () => {
    if (!sql.trim()) return
    setIsRunning(true)
    try {
      const translated = await simulateQueryTranslate(sql)
      setNoSQLTranslation(translated)
      addToast('Translated to MongoDB aggregation pipeline', 'info')
    } finally {
      setIsRunning(false)
    }
  }, [sql, addToast])

  const handleOptimize = useCallback(async () => {
    if (!sql.trim()) return
    setIsRunning(true)
    try {
      const tips = await simulateQueryOptimize(sql, schema ?? { id: '', name: '', target: 'postgresql', tables: [], createdAt: '', updatedAt: '' })
      setOptimization(tips)
      addToast(`${tips.length} optimization suggestions ready`, 'info')
    } finally {
      setIsRunning(false)
    }
  }, [sql, schema, addToast])

  const handleAIGenerate = useCallback(async (prompt: string) => {
    const fallback = schema ?? { id: '', name: '', target: 'postgresql' as const, tables: [], createdAt: '', updatedAt: '' }
    let generated: string

    if (isAuthenticated() && import.meta.env.VITE_USE_MOCK !== 'true') {
      try {
        const result = await generateQueryRemote(prompt, fallback, fallback.target)
        generated = result.sql
      } catch {
        generated = await simulateQueryGeneration(prompt, fallback)
      }
    } else {
      generated = await simulateQueryGeneration(prompt, fallback)
    }

    setSql(generated)
    editorRef.current?.setValue(generated)
    addToast('Query generated — review before running', 'success')
  }, [schema, addToast])

  const handleEditorMount: OnMount = useCallback((editor, monacoInstance) => {
    editorRef.current = editor

    monacoInstance.editor.defineTheme('dbforge-dark', DBFORGE_THEME)
    monacoInstance.editor.setTheme('dbforge-dark')

    if (schema) {
      monacoInstance.languages.registerCompletionItemProvider('sql', {
        provideCompletionItems: () => ({
          suggestions: getSchemaCompletions(schema),
        }),
      })
    }

    editor.addCommand(
      monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.Enter,
      handleRun
    )
  }, [schema, handleRun])

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <QueryToolbar
        onRun={handleRun}
        onExplain={handleExplain}
        onTranslate={handleTranslate}
        onOptimize={handleOptimize}
        onAIGenerate={() => setShowAI(v => !v)}
        isRunning={isRunning}
        dbTarget={schema?.target ?? 'postgresql'}
        connections={connections}
        activeConnection={activeConnection}
        onConnectionChange={setActiveConnection}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Editor + Results */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Monaco Editor (top half) */}
          <div className="flex-1 overflow-hidden">
            <Editor
              height="100%"
              language="sql"
              value={sql}
              onChange={v => setSql(v ?? '')}
              onMount={handleEditorMount}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineHeight: 22,
                fontFamily: 'JetBrains Mono, Fira Code, monospace',
                padding: { top: 16, bottom: 16 },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: 'on',
                renderLineHighlight: 'line',
                cursorBlinking: 'smooth',
                smoothScrolling: true,
              }}
              theme="dbforge-dark"
            />
          </div>

          {/* Results Panel (bottom half) */}
          <ResultsPanel
            result={result}
            explainPlan={explainPlan}
            optimization={optimization}
            noSQLTranslation={noSQLTranslation}
            isRunning={isRunning}
          />
        </div>

        {/* AI Generate panel */}
        {showAI && (
          <AIQueryPrompt
            onGenerate={handleAIGenerate}
            onClose={() => setShowAI(false)}
          />
        )}

        {/* Query History */}
        <QueryHistory
          history={history}
          onLoad={q => { setSql(q); editorRef.current?.setValue(q) }}
          onDelete={id => dispatch({ type: 'DELETE_QUERY', payload: id })}
          onClearAll={() => history.forEach(h => dispatch({ type: 'DELETE_QUERY', payload: h.id }))}
          collapsed={historyCollapsed}
          onToggle={() => setHistoryCollapsed(v => !v)}
        />
      </div>
    </div>
  )
}
