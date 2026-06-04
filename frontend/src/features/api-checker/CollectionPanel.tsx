import { useState, useEffect, useCallback } from 'react'
import { FolderOpen, Plus, Trash2, Play, Loader2, ChevronDown, ChevronRight, X } from 'lucide-react'
import { APICollection, APIRequest } from '@/types'
import { listCollections, createCollection, updateCollection, deleteCollection } from '@/lib/api/collections'
import { HTTP_METHOD_COLORS } from '@/lib/constants'

interface Props {
  currentRequest: APIRequest | null
  onRunCollection: (collection: APICollection) => void
}

function MethodBadge({ method }: { method: string }) {
  const color = HTTP_METHOD_COLORS[method] ?? '#6B7280'
  return (
    <span className="text-[10px] font-mono font-bold w-[42px] text-right flex-shrink-0" style={{ color }}>
      {method}
    </span>
  )
}

export function CollectionPanel({ currentRequest, onRunCollection }: Props) {
  const [collections, setCollections]   = useState<APICollection[]>([])
  const [loading, setLoading]           = useState(true)
  const [expanded, setExpanded]         = useState<string | null>(null)
  const [newName, setNewName]           = useState('')
  const [creating, setCreating]         = useState(false)
  const [showCreate, setShowCreate]     = useState(false)
  const [error, setError]               = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const list = await listCollections()
      setCollections(list)
    } catch {
      // Auth not required if not logged in, silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleCreate() {
    if (!newName.trim()) return
    setCreating(true)
    setError(null)
    try {
      const col = await createCollection(newName.trim())
      setCollections(prev => [col, ...prev])
      setNewName('')
      setShowCreate(false)
    } catch {
      setError('Failed to create collection')
    } finally {
      setCreating(false)
    }
  }

  async function handleAddRequest(colId: string) {
    if (!currentRequest) return
    const col = collections.find(c => c._id === colId)
    if (!col) return
    try {
      const updated = await updateCollection(colId, {
        requests: [...(col.requests ?? []), currentRequest],
      })
      setCollections(prev => prev.map(c => c._id === colId ? { ...c, ...updated } : c))
    } catch {
      setError('Failed to add request to collection')
    }
  }

  async function handleRemoveRequest(colId: string, reqId: string) {
    const col = collections.find(c => c._id === colId)
    if (!col) return
    try {
      const updated = await updateCollection(colId, {
        requests: (col.requests ?? []).filter((r: APIRequest) => r.id !== reqId),
      })
      setCollections(prev => prev.map(c => c._id === colId ? { ...c, ...updated } : c))
    } catch {
      setError('Failed to remove request')
    }
  }

  async function handleDelete(colId: string) {
    try {
      await deleteCollection(colId)
      setCollections(prev => prev.filter(c => c._id !== colId))
    } catch {
      setError('Failed to delete collection')
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/5">
        <span className="text-xs font-mono text-text-secondary flex items-center gap-1.5">
          <FolderOpen size={12} /> Collections
        </span>
        <button
          type="button"
          onClick={() => setShowCreate(v => !v)}
          title="New collection"
          className="p-1 rounded text-text-tertiary hover:text-cyan hover:bg-white/5 transition-colors"
        >
          <Plus size={13} />
        </button>
      </div>

      {showCreate && (
        <div className="px-3 py-2 border-b border-white/5 space-y-1.5">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Collection name…"
            autoFocus
            className="w-full bg-bg-overlay border border-white/10 rounded px-2.5 py-1.5 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-cyan/40"
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
          />
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={handleCreate}
              disabled={!newName.trim() || creating}
              className="flex-1 py-1 rounded bg-cyan/10 text-cyan text-xs font-mono hover:bg-cyan/20 disabled:opacity-40 transition-colors"
            >
              {creating ? <Loader2 size={10} className="animate-spin mx-auto" /> : 'Create'}
            </button>
            <button type="button" onClick={() => setShowCreate(false)} className="px-2 py-1 rounded bg-white/5 text-text-tertiary text-xs hover:bg-white/10 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mx-3 mt-2 text-[10px] text-error bg-error/10 border border-error/20 rounded px-2 py-1.5">{error}</div>
      )}

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-16">
            <Loader2 size={14} className="animate-spin text-cyan" />
          </div>
        ) : collections.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-20 text-text-tertiary text-xs font-mono">
            No collections
          </div>
        ) : (
          collections.map(col => (
            <div key={col._id} className="border-b border-white/[0.03]">
              {/* Collection header */}
              <div className="group flex items-center gap-1.5 px-3 py-2 cursor-pointer hover:bg-white/[0.03] transition-colors">
                <button
                  type="button"
                  onClick={() => setExpanded(prev => prev === col._id ? null : col._id)}
                  className="flex items-center gap-1.5 flex-1 min-w-0"
                >
                  {expanded === col._id ? <ChevronDown size={11} className="text-text-tertiary flex-shrink-0" /> : <ChevronRight size={11} className="text-text-tertiary flex-shrink-0" />}
                  <span className="text-xs text-text-primary truncate">{col.name}</span>
                  <span className="text-[10px] text-text-tertiary font-mono flex-shrink-0">
                    ({(col.requests?.length ?? 0)})
                  </span>
                </button>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {currentRequest && (
                    <button
                      type="button"
                      onClick={() => handleAddRequest(col._id)}
                      title="Add current request"
                      className="p-0.5 rounded text-text-tertiary hover:text-cyan transition-colors"
                    >
                      <Plus size={11} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onRunCollection({ ...col, requests: col.requests as APIRequest[] })}
                    title="Run collection"
                    className="p-0.5 rounded text-text-tertiary hover:text-success transition-colors"
                  >
                    <Play size={11} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(col._id)}
                    title="Delete collection"
                    className="p-0.5 rounded text-text-tertiary hover:text-error transition-colors"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>

              {/* Requests list */}
              {expanded === col._id && (
                <div className="pl-6">
                  {(col.requests as APIRequest[]).length === 0 ? (
                    <div className="text-[10px] text-text-tertiary font-mono px-3 py-2">
                      {currentRequest ? 'Click + to add current request' : 'No requests yet'}
                    </div>
                  ) : (
                    (col.requests as APIRequest[]).map(req => (
                      <div key={req.id} className="group flex items-center gap-2 px-3 py-1.5 hover:bg-white/[0.03] transition-colors">
                        <MethodBadge method={req.method} />
                        <div className="flex-1 min-w-0">
                          {req.name && <div className="text-[10px] text-text-primary truncate">{req.name}</div>}
                          <div className="text-[10px] text-text-tertiary font-mono truncate">{req.url || 'No URL'}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveRequest(col._id, req.id)}
                          className="p-0.5 opacity-0 group-hover:opacity-100 rounded text-text-tertiary hover:text-error transition-all"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
