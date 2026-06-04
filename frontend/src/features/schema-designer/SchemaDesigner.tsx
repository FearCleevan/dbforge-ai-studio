import { useState, useCallback, useRef, useEffect } from 'react'
import { Save, History, X, Database as DatabaseIcon } from 'lucide-react'
import { SchemaDefinition, DatabaseTarget, NamingConvention, SavedSchema } from '@/types'
import { DbConnection } from '@/types/connection'
import { simulateSchemaGeneration } from '@/lib/simulation/schemaSimulator'
import { generateSchemaRemote } from '@/lib/api/schema'
import { connectionsAPI } from '@/lib/api/connections'
import { parseDDLToSchema } from '@/lib/utils/ddlParser'
import { isAuthenticated } from '@/lib/api/auth'
import { useProject } from '@/context/ProjectContext'
import { useUI } from '@/context/UIContext'
import { useToast } from '@/context/ToastContext'
import { SchemaPromptInput } from './SchemaPromptInput'
import { SchemaEditor } from './SchemaEditor'
import { SchemaDDLPreview } from './SchemaDDLPreview'
import { SchemaHistoryPanel } from './SchemaHistoryPanel'

export function SchemaDesigner() {
  const { currentProject, dispatch } = useProject()
  const { setActiveTab } = useUI()
  const { addToast } = useToast()

  const [schema, setSchema] = useState<SchemaDefinition | null>(
    currentProject?.schema ?? null
  )
  const [isGenerating, setIsGenerating]   = useState(false)
  const [promptHistory, setPromptHistory] = useState<string[]>([])
  const [showHistory, setShowHistory]     = useState(false)
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const [saveName, setSaveName]           = useState('')
  const [dbConnections, setDbConnections] = useState<DbConnection[]>([])
  const [showDbPicker, setShowDbPicker]   = useState(false)
  const [importingDb, setImportingDb]     = useState(false)
  const saveTimer    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const projectIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated()) return
    connectionsAPI.list().then(setDbConnections).catch(() => {})
  }, [])

  // Sync local schema state when the project loads or switches (async)
  useEffect(() => {
    if (!currentProject) return
    if (projectIdRef.current === currentProject.id) return
    projectIdRef.current = currentProject.id
    setSchema(currentProject.schema ?? null)
  }, [currentProject?.id, currentProject?.schema])

  const persistSchema = useCallback((updated: SchemaDefinition) => {
    if (!currentProject) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      dispatch({ type: 'UPDATE_SCHEMA', payload: updated })
    }, 500)
  }, [currentProject, dispatch])

  const handleSchemaChange = useCallback((updated: SchemaDefinition) => {
    setSchema(updated)
    persistSchema(updated)
  }, [persistSchema])

  const handleImport = useCallback((ddl: string, target: DatabaseTarget) => {
    const imported = parseDDLToSchema(ddl, target)
    if (imported.tables.length === 0) {
      addToast('No tables found — check your DDL syntax', 'error')
      return
    }
    setSchema(imported)
    persistSchema(imported)
    const totalCols = imported.tables.reduce((sum, t) => sum + t.columns.length, 0)
    addToast(`Imported ${imported.tables.length} tables, ${totalCols} columns`, 'success')
    setTimeout(() => setActiveTab('visualizer'), 400)
  }, [persistSchema, addToast, setActiveTab])

  const handleGenerate = useCallback(async (
    prompt: string,
    target: DatabaseTarget,
    convention: NamingConvention
  ) => {
    setIsGenerating(true)
    try {
      let generated: SchemaDefinition

      if (isAuthenticated() && import.meta.env.VITE_USE_MOCK !== 'true') {
        try {
          generated = await generateSchemaRemote({ prompt, target, namingConvention: convention })
        } catch {
          generated = await simulateSchemaGeneration(prompt, target, convention)
        }
      } else {
        generated = await simulateSchemaGeneration(prompt, target, convention)
      }

      setSchema(generated)
      persistSchema(generated)
      setPromptHistory(prev => [prompt, ...prev.filter(p => p !== prompt)].slice(0, 10))

      const totalCols = generated.tables.reduce((sum, t) => sum + t.columns.length, 0)
      addToast(`Schema generated — ${generated.tables.length} tables, ${totalCols} columns`, 'success')
      setTimeout(() => setActiveTab('visualizer'), 600)
    } catch {
      addToast('Failed to generate schema. Please try again.', 'error')
    } finally {
      setIsGenerating(false)
    }
  }, [persistSchema, addToast, setActiveTab])

  const handleSaveSchema = useCallback(() => {
    if (!schema || schema.tables.length === 0) {
      addToast('No schema to save — generate or import one first', 'error')
      return
    }
    const defaultName = `${schema.name} — ${new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
    setSaveName(defaultName)
    setSaveModalOpen(true)
  }, [schema, addToast])

  const confirmSave = useCallback(() => {
    if (!schema || !saveName.trim()) return
    const saved: SavedSchema = {
      id:      crypto.randomUUID(),
      name:    saveName.trim(),
      schema,
      savedAt: new Date().toISOString(),
    }
    dispatch({ type: 'SAVE_SCHEMA', payload: saved })
    setSaveModalOpen(false)
    setSaveName('')
    addToast(`Schema saved as "${saved.name}"`, 'success')
  }, [schema, saveName, dispatch, addToast])

  const handleRestore = useCallback((saved: SavedSchema) => {
    setSchema(saved.schema)
    persistSchema(saved.schema)
    addToast(`Restored "${saved.name}"`, 'success')
    setShowHistory(false)
    setTimeout(() => setActiveTab('visualizer'), 400)
  }, [persistSchema, addToast, setActiveTab])

  const handleDeleteSaved = useCallback((id: string) => {
    dispatch({ type: 'DELETE_SAVED_SCHEMA', payload: id })
    addToast('Snapshot deleted', 'info')
  }, [dispatch, addToast])

  const handleImportFromDb = useCallback(async (conn: DbConnection) => {
    setImportingDb(true)
    setShowDbPicker(false)
    try {
      const imported = await connectionsAPI.reverseEngineer(conn._id)
      setSchema(imported)
      persistSchema(imported)
      const totalCols = imported.tables.reduce((sum, t) => sum + t.columns.length, 0)
      addToast(`Imported ${imported.tables.length} tables, ${totalCols} columns from "${conn.name}"`, 'success')
      setTimeout(() => setActiveTab('visualizer'), 400)
    } catch {
      addToast('Failed to import schema from database', 'error')
    } finally {
      setImportingDb(false)
    }
  }, [persistSchema, addToast, setActiveTab])

  const savedSchemas = currentProject?.savedSchemas ?? []

  const editorToolbar = (
    <>
      <button
        type="button"
        onClick={handleSaveSchema}
        disabled={!schema || schema.tables.length === 0}
        title="Save current schema as a snapshot"
        className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-cyan/10 border border-cyan/30 text-cyan text-xs font-medium hover:bg-cyan/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <Save className="w-3 h-3" />
        Save Schema
      </button>
      {isAuthenticated() && dbConnections.length > 0 && (
        <div className="relative">
          <button
            type="button"
            disabled={importingDb}
            onClick={() => setShowDbPicker(v => !v)}
            title="Import schema from a connected database"
            className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-violet/10 border border-violet/30 text-violet text-xs font-medium hover:bg-violet/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <DatabaseIcon className="w-3 h-3" />
            {importingDb ? 'Importing...' : 'Import from DB'}
          </button>
          {showDbPicker && (
            <div className="absolute left-0 top-full mt-1 w-52 bg-bg-elevated border border-white/10 rounded-lg shadow-lg z-30">
              {dbConnections.map(c => (
                <button
                  key={c._id}
                  onClick={() => handleImportFromDb(c)}
                  className="w-full text-left px-3 py-2 text-xs text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
                >
                  <span className="block font-medium">{c.name}</span>
                  <span className="text-text-tertiary font-mono">{c.database}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      <button
        type="button"
        onClick={() => setShowHistory(v => !v)}
        title="Schema history"
        className={`w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg border text-xs font-medium transition-all ${
          showHistory
            ? 'bg-violet/20 border-violet/40 text-violet'
            : 'bg-white/5 border-white/10 text-text-secondary hover:text-text-primary hover:border-white/20'
        }`}
      >
        <History className="w-3 h-3" />
        History
        {savedSchemas.length > 0 && (
          <span className="ml-auto w-4 h-4 rounded-full bg-violet text-white text-[10px] flex items-center justify-center font-bold">
            {savedSchemas.length > 9 ? '9+' : savedSchemas.length}
          </span>
        )}
      </button>
    </>
  )

  return (
    <div className="flex-1 flex overflow-hidden relative">
      <SchemaPromptInput
        onGenerate={handleGenerate}
        onImport={handleImport}
        isGenerating={isGenerating}
        promptHistory={promptHistory}
      />
      <SchemaEditor
        schema={schema ?? createEmptySchema()}
        onChange={handleSchemaChange}
        onSaveSchema={handleSaveSchema}
        toolbar={editorToolbar}
      />
      <SchemaDDLPreview schema={schema} />

      {/* History side drawer */}
      {showHistory && (
        <div className="absolute top-0 right-0 h-full w-72 bg-bg-elevated border-l border-white/8 flex flex-col z-20 shadow-lg animate-slide-in-r">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-violet" />
              <span className="text-sm font-semibold text-text-primary">Schema History</span>
              {savedSchemas.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-violet/20 text-violet text-xs font-mono">
                  {savedSchemas.length}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowHistory(false)}
              title="Close history"
              className="p-1 rounded text-text-tertiary hover:text-text-primary hover:bg-white/5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <SchemaHistoryPanel
              savedSchemas={savedSchemas}
              onRestore={handleRestore}
              onDelete={handleDeleteSaved}
            />
          </div>
        </div>
      )}

      {/* Save name modal */}
      {saveModalOpen && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-30 backdrop-blur-sm">
          <div className="bg-bg-elevated border border-white/10 rounded-xl p-6 w-80 shadow-xl animate-fade-up">
            <h3 className="text-base font-semibold text-text-primary mb-1">Save Schema Snapshot</h3>
            <p className="text-xs text-text-tertiary mb-4">Give this snapshot a name so you can find it later.</p>
            <input
              type="text"
              autoFocus
              value={saveName}
              onChange={e => setSaveName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') confirmSave(); if (e.key === 'Escape') setSaveModalOpen(false) }}
              placeholder="e.g. After adding users table"
              className="w-full px-3 py-2.5 rounded-lg bg-bg-surface border border-white/10 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-cyan/50 focus:ring-1 focus:ring-cyan/20 text-sm font-ui transition-colors mb-4"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSaveModalOpen(false)}
                className="flex-1 py-2 rounded-lg bg-white/5 border border-white/10 text-text-secondary text-sm hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmSave}
                disabled={!saveName.trim()}
                className="flex-1 py-2 rounded-lg bg-cyan text-bg-base font-semibold text-sm hover:shadow-cyan disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function createEmptySchema(): SchemaDefinition {
  return {
    id: crypto.randomUUID(),
    name: 'New Schema',
    target: 'postgresql',
    tables: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}
