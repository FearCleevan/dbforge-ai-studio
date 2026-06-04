import { useState, useEffect, useCallback } from 'react'
import { Plus, Plug, Trash2, RefreshCw, CheckCircle, XCircle, Loader, Download } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { DbIcon } from '@/lib/utils/dbIcons'
import { connectionsAPI } from '@/lib/api/connections'
import { DbConnection, ConnectionConfig, DbDriver } from '@/types/connection'
import { useToast } from '@/context/ToastContext'
import { useProject } from '@/context/ProjectContext'
import { useUI } from '@/context/UIContext'
import { isAuthenticated } from '@/lib/api/auth'
import { EmptyState } from '@/components/shared/EmptyState'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

const DRIVER_META: Record<DbDriver, { label: string; iconName: string; defaultPort: number | null }> = {
  postgresql: { label: 'PostgreSQL', iconName: 'Database',  defaultPort: 5432  },
  mysql:      { label: 'MySQL',      iconName: 'Database',  defaultPort: 3306  },
  sqlite:     { label: 'SQLite',     iconName: 'HardDrive', defaultPort: null  },
  mongodb:    { label: 'MongoDB',    iconName: 'Layers',    defaultPort: 27017 },
}

const DEFAULT_FORM: ConnectionConfig = {
  name: '', driver: 'postgresql', host: 'localhost', port: 5432,
  database: '', username: '', password: '', ssl: false, filePath: '',
}

export function DatabaseConnectionPanel() {
  const { addToast } = useToast()
  const { dispatch } = useProject()
  const { setActiveTab } = useUI()

  const [connections, setConnections] = useState<DbConnection[]>([])
  const [loading, setLoading]         = useState(false)
  const [showForm, setShowForm]       = useState(false)
  const [form, setForm]               = useState<ConnectionConfig>(DEFAULT_FORM)
  const [testing, setTesting]         = useState(false)
  const [testResult, setTestResult]   = useState<{ success: boolean; message: string } | null>(null)
  const [importing, setImporting]     = useState<string | null>(null)
  const [deleting, setDeleting]       = useState<string | null>(null)

  const authed = isAuthenticated()

  const loadConnections = useCallback(async () => {
    if (!authed) return
    setLoading(true)
    try {
      const list = await connectionsAPI.list()
      setConnections(list)
    } catch {
      addToast('Failed to load connections', 'error')
    } finally {
      setLoading(false)
    }
  }, [authed, addToast])

  useEffect(() => { loadConnections() }, [loadConnections])

  const handleDriverChange = (driver: DbDriver) => {
    const meta = DRIVER_META[driver]
    setForm(prev => ({
      ...prev,
      driver,
      port: meta.defaultPort ?? prev.port,
      host: driver === 'sqlite' ? '' : (prev.host || 'localhost'),
    }))
    setTestResult(null)
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    const result = await connectionsAPI.test(form)
    setTestResult(result)
    setTesting(false)
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.database.trim()) {
      addToast('Name and database are required', 'error')
      return
    }
    try {
      const created = await connectionsAPI.create(form)
      setConnections(prev => [created, ...prev])
      setShowForm(false)
      setForm(DEFAULT_FORM)
      setTestResult(null)
      addToast(`Connection "${created.name}" saved`, 'success')
    } catch {
      addToast('Failed to save connection', 'error')
    }
  }

  const handleDelete = async (id: string, name: string) => {
    setDeleting(id)
    try {
      await connectionsAPI.delete(id)
      setConnections(prev => prev.filter(c => c._id !== id))
      addToast(`Connection "${name}" deleted`, 'info')
    } catch {
      addToast('Failed to delete connection', 'error')
    } finally {
      setDeleting(null)
    }
  }

  const handleImport = async (conn: DbConnection) => {
    setImporting(conn._id)
    try {
      const schema = await connectionsAPI.reverseEngineer(conn._id)
      dispatch({ type: 'UPDATE_SCHEMA', payload: schema })
      const totalCols = schema.tables.reduce((sum, t) => sum + t.columns.length, 0)
      addToast(`Imported ${schema.tables.length} tables, ${totalCols} columns from "${conn.name}"`, 'success')
      setTimeout(() => setActiveTab('visualizer'), 400)
    } catch {
      addToast('Failed to import schema', 'error')
    } finally {
      setImporting(null)
    }
  }

  if (!authed) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <EmptyState
          icon={Plug}
          title="Sign in required"
          description="Database connections are saved to your account. Sign in to manage connections."
        />
      </div>
    )
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left — connection list */}
      <div className="w-72 flex-shrink-0 border-r border-white/5 flex flex-col bg-bg-surface">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Plug size={15} className="text-cyan" />
            <span className="text-sm font-semibold text-text-primary">Connections</span>
            {connections.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-cyan/10 text-cyan text-xs font-mono">
                {connections.length}
              </span>
            )}
          </div>
          <button
            onClick={() => { setShowForm(v => !v); setTestResult(null) }}
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-cyan/10 border border-cyan/30 text-cyan text-xs font-medium hover:bg-cyan/20 transition-all"
          >
            <Plus size={12} />
            Add
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
          {loading && (
            <div className="flex justify-center pt-8">
              <LoadingSpinner size="md" color="cyan" />
            </div>
          )}
          {!loading && connections.length === 0 && (
            <div className="text-center py-8 px-4">
              <Plug size={24} className="text-text-tertiary mx-auto mb-2" />
              <p className="text-sm text-text-secondary">No connections yet</p>
              <p className="text-xs text-text-tertiary mt-1">Click Add to get started</p>
            </div>
          )}
          {connections.map(conn => {
            const meta = DRIVER_META[conn.driver]
            return (
              <div
                key={conn._id}
                className="group flex items-center gap-2 p-2.5 rounded-lg bg-bg-elevated border border-white/5 hover:border-white/10 transition-all"
              >
                <DbIcon name={meta.iconName} size={16} className="text-text-secondary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-text-primary truncate">{conn.name}</div>
                  <div className="text-xs text-text-tertiary font-mono truncate">{conn.database}</div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleImport(conn)}
                    disabled={!!importing}
                    title="Import schema from this database"
                    className="p-1 rounded text-text-tertiary hover:text-cyan transition-colors"
                  >
                    {importing === conn._id
                      ? <Loader size={12} className="animate-spin" />
                      : <Download size={12} />}
                  </button>
                  <button
                    onClick={() => handleDelete(conn._id, conn.name)}
                    disabled={!!deleting}
                    title="Delete connection"
                    className="p-1 rounded text-text-tertiary hover:text-error transition-colors"
                  >
                    {deleting === conn._id
                      ? <Loader size={12} className="animate-spin" />
                      : <Trash2 size={12} />}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Right — form or empty state */}
      <div className="flex-1 overflow-y-auto p-6">
        {!showForm && (
          <div className="h-full flex items-center justify-center">
            <EmptyState
              icon={Plug}
              title="Connect a database"
              description="Add a connection to reverse-engineer its schema or run live queries."
              action={
                <button
                  onClick={() => setShowForm(true)}
                  className="px-4 py-2 rounded-lg bg-cyan text-bg-base font-semibold text-sm hover:shadow-cyan transition-all"
                >
                  Add Connection
                </button>
              }
            />
          </div>
        )}

        {showForm && (
          <div className="max-w-lg">
            <h2 className="text-lg font-semibold text-text-primary mb-6 flex items-center gap-2">
              <Plus size={18} className="text-cyan" />
              New Connection
            </h2>

            {/* Driver selector */}
            <div className="mb-5">
              <label className="block text-xs font-medium text-text-secondary mb-2">Database Type</label>
              <div className="grid grid-cols-4 gap-2">
                {(Object.entries(DRIVER_META) as [DbDriver, typeof DRIVER_META[DbDriver]][]).map(([driver, meta]) => (
                  <button
                    key={driver}
                    type="button"
                    onClick={() => handleDriverChange(driver)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 p-3 rounded-lg border text-xs font-medium transition-all',
                      form.driver === driver
                        ? 'bg-cyan/10 border-cyan/40 text-cyan'
                        : 'bg-bg-elevated border-white/8 text-text-secondary hover:border-white/15 hover:text-text-primary'
                    )}
                  >
                    <DbIcon name={meta.iconName} size={20} />
                    <span>{meta.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Fields */}
            <div className="space-y-4">
              <Field label="Connection Name" required>
                <input
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Production DB"
                  className={inputCls}
                />
              </Field>

              {form.driver === 'sqlite' ? (
                <Field label="File Path" required>
                  <input
                    value={form.filePath ?? ''}
                    onChange={e => setForm(p => ({
                      ...p,
                      filePath: e.target.value,
                      database: e.target.value.split(/[\\/]/).pop() ?? e.target.value,
                    }))}
                    placeholder="/path/to/database.db"
                    className={inputCls}
                  />
                </Field>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <Field label="Host">
                        <input
                          value={form.host ?? ''}
                          onChange={e => setForm(p => ({ ...p, host: e.target.value }))}
                          placeholder="localhost"
                          className={inputCls}
                        />
                      </Field>
                    </div>
                    <Field label="Port">
                      <input
                        type="number"
                        value={form.port ?? ''}
                        onChange={e => setForm(p => ({ ...p, port: parseInt(e.target.value) || undefined }))}
                        className={inputCls}
                      />
                    </Field>
                  </div>
                  <Field label="Database" required>
                    <input
                      value={form.database}
                      onChange={e => setForm(p => ({ ...p, database: e.target.value }))}
                      placeholder="my_database"
                      className={inputCls}
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Username">
                      <input
                        value={form.username ?? ''}
                        onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                        placeholder="postgres"
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Password">
                      <input
                        type="password"
                        value={form.password ?? ''}
                        onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                        placeholder="••••••••"
                        className={inputCls}
                      />
                    </Field>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.ssl}
                      onChange={e => setForm(p => ({ ...p, ssl: e.target.checked }))}
                      className="accent-cyan"
                    />
                    <span className="text-sm text-text-secondary">Use SSL / TLS</span>
                  </label>
                </>
              )}
            </div>

            {/* Test result */}
            {testResult && (
              <div className={cn(
                'mt-4 flex items-center gap-2 p-3 rounded-lg text-sm border',
                testResult.success
                  ? 'bg-emerald/10 border-emerald/20 text-emerald'
                  : 'bg-error/10 border-error/20 text-error'
              )}>
                {testResult.success ? <CheckCircle size={14} /> : <XCircle size={14} />}
                {testResult.message}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 mt-6">
              <button
                type="button"
                onClick={handleTest}
                disabled={testing}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-text-secondary text-sm hover:text-text-primary hover:border-white/20 disabled:opacity-40 transition-all"
              >
                {testing ? <Loader size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                Test Connection
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan text-bg-base font-semibold text-sm hover:shadow-cyan transition-all"
              >
                Save & Connect
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setTestResult(null); setForm(DEFAULT_FORM) }}
                className="ml-auto px-3 py-2 text-sm text-text-tertiary hover:text-text-secondary transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-text-secondary mb-1.5">
        {label}{required && <span className="text-error ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls = 'w-full px-3 py-2 rounded-lg bg-bg-surface border border-white/10 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-cyan/50 focus:ring-1 focus:ring-cyan/20 text-sm font-ui transition-colors'
