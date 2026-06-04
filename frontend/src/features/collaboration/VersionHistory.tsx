import { useState, useEffect, useCallback } from 'react'
import { X, Clock, Download, RotateCcw, ChevronRight, GitCompare, Loader2, Check } from 'lucide-react'
import { SchemaVersion } from '@/types/collaboration'
import { SchemaDefinition } from '@/types'
import { listVersions, getVersion, revertToVersion, getMigrationSQLUrl } from '@/lib/api/versions'
import { cn } from '@/lib/utils/cn'

interface Props {
  projectId: string
  onClose: () => void
  onReverted?: () => void
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

interface DiffViewProps {
  prev: SchemaDefinition | null
  next: SchemaDefinition
}

function SchemaDiff({ prev, next }: DiffViewProps) {
  const prevTableNames = new Set(prev?.tables.map(t => t.name) ?? [])
  const nextTableNames = new Set(next.tables.map(t => t.name))

  const added   = next.tables.filter(t => !prevTableNames.has(t.name))
  const removed = (prev?.tables ?? []).filter(t => !nextTableNames.has(t.name))
  const changed = next.tables.filter(t => {
    if (!prevTableNames.has(t.name)) return false
    const prevT = prev!.tables.find(p => p.name === t.name)!
    return JSON.stringify(prevT.columns) !== JSON.stringify(t.columns)
  })

  return (
    <div className="space-y-3 text-xs font-mono">
      {added.map(t => (
        <div key={t.name} className="bg-success/5 border border-success/20 rounded-lg p-3">
          <div className="text-success font-semibold mb-1">+ {t.name}</div>
          {t.columns.map(c => (
            <div key={c.id} className="text-success/70 pl-3">+ {c.name}: {c.type}</div>
          ))}
        </div>
      ))}
      {removed.map(t => (
        <div key={t.name} className="bg-error/5 border border-error/20 rounded-lg p-3">
          <div className="text-error font-semibold mb-1">- {t.name}</div>
          {t.columns.map(c => (
            <div key={c.id} className="text-error/70 pl-3">- {c.name}: {c.type}</div>
          ))}
        </div>
      ))}
      {changed.map(t => {
        const prevT = prev!.tables.find(p => p.name === t.name)!
        const prevCols = new Map(prevT.columns.map(c => [c.name, c]))
        const nextCols = new Map(t.columns.map(c => [c.name, c]))
        const addedCols   = t.columns.filter(c => !prevCols.has(c.name))
        const removedCols = prevT.columns.filter(c => !nextCols.has(c.name))
        const changedCols = t.columns.filter(c => {
          const p = prevCols.get(c.name)
          return p && p.type !== c.type
        })

        return (
          <div key={t.name} className="bg-warning/5 border border-warning/20 rounded-lg p-3">
            <div className="text-warning font-semibold mb-1">~ {t.name}</div>
            {addedCols.map(c   => <div key={c.id} className="text-success/70 pl-3">+ {c.name}: {c.type}</div>)}
            {removedCols.map(c => <div key={c.id} className="text-error/70 pl-3">- {c.name}</div>)}
            {changedCols.map(c => {
              const p = prevCols.get(c.name)!
              return <div key={c.id} className="text-warning/70 pl-3">~ {c.name}: {p.type} → {c.type}</div>
            })}
          </div>
        )
      })}
      {added.length === 0 && removed.length === 0 && changed.length === 0 && (
        <div className="text-text-tertiary">No structural changes detected</div>
      )}
    </div>
  )
}

export function VersionHistory({ projectId, onClose, onReverted }: Props) {
  const [versions, setVersions]         = useState<SchemaVersion[]>([])
  const [loading, setLoading]           = useState(true)
  const [diffA, setDiffA]               = useState<SchemaVersion | null>(null)
  const [diffB, setDiffB]               = useState<SchemaVersion | null>(null)
  const [diffBSchema, setDiffBSchema]   = useState<SchemaDefinition | null>(null)
  const [loadingDiff, setLoadingDiff]   = useState(false)
  const [reverting, setReverting]       = useState<number | null>(null)
  const [reverted, setReverted]         = useState<number | null>(null)
  const [showDiff, setShowDiff]         = useState(false)
  const [error, setError]               = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const list = await listVersions(projectId)
      setVersions(list)
    } catch {
      setError('Failed to load version history')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => { load() }, [load])

  async function handleViewDiff(versionDoc: SchemaVersion) {
    setLoadingDiff(true)
    setShowDiff(true)
    setDiffB(versionDoc)
    try {
      const full = await getVersion(projectId, versionDoc.version)
      setDiffBSchema(full.schemaSnapshot as unknown as SchemaDefinition ?? null)
      // Find the previous version
      const prevVersion = versions.find(v => v.version === versionDoc.version - 1)
      setDiffA(prevVersion ?? null)
    } catch {
      setError('Failed to load version diff')
    } finally {
      setLoadingDiff(false)
    }
  }

  async function handleRevert(version: number) {
    setReverting(version)
    setError(null)
    try {
      await revertToVersion(projectId, version)
      setReverted(version)
      setTimeout(() => setReverted(null), 2000)
      onReverted?.()
      await load()
    } catch {
      setError('Failed to revert schema')
    } finally {
      setReverting(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-bg-surface border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-cyan" />
            <span className="font-semibold text-sm text-text-primary">Version History</span>
          </div>
          <div className="flex items-center gap-2">
            {showDiff && (
              <button
                onClick={() => setShowDiff(false)}
                className="text-xs text-text-tertiary hover:text-text-primary px-2 py-1 rounded hover:bg-white/5 transition-colors"
              >
                ← Back to timeline
              </button>
            )}
            <button onClick={onClose} className="p-1 rounded-md text-text-tertiary hover:text-text-primary hover:bg-white/5 transition-colors">
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {error && (
            <div className="text-xs text-error bg-error/10 border border-error/20 rounded-lg px-3 py-2 mb-4">{error}</div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="animate-spin text-cyan" />
            </div>
          ) : showDiff ? (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <GitCompare size={14} className="text-cyan" />
                <span className="text-sm text-text-secondary">
                  Diff: v{diffB?.version} vs v{(diffB?.version ?? 1) - 1}
                </span>
              </div>
              {loadingDiff ? (
                <div className="flex items-center gap-2 text-text-tertiary text-sm">
                  <Loader2 size={14} className="animate-spin" /> Loading diff…
                </div>
              ) : diffBSchema ? (
                <SchemaDiff
                  prev={diffA?.schemaSnapshot as unknown as SchemaDefinition ?? null}
                  next={diffBSchema}
                />
              ) : null}
            </div>
          ) : versions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-text-tertiary">
              <Clock size={32} className="mb-3 opacity-30" />
              <p className="text-sm">No versions yet</p>
              <p className="text-xs mt-1">Save your schema to create the first version</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[11px] top-3 bottom-3 w-px bg-white/10" />

              <div className="space-y-3">
                {versions.map((v, i) => (
                  <div key={v._id} className="relative flex gap-4 pl-7">
                    {/* Dot */}
                    <div className={cn(
                      'absolute left-0 top-2 w-[23px] h-[23px] rounded-full border-2 flex items-center justify-center flex-shrink-0 z-10',
                      i === 0
                        ? 'border-cyan bg-cyan/10'
                        : 'border-white/20 bg-bg-surface'
                    )}>
                      <span className="text-[9px] font-mono text-text-tertiary">{v.version}</span>
                    </div>

                    {/* Card */}
                    <div className={cn(
                      'flex-1 rounded-xl border px-4 py-3',
                      i === 0 ? 'border-cyan/20 bg-cyan/5' : 'border-white/5 bg-bg-overlay'
                    )}>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-text-secondary">v{v.version}</span>
                            {i === 0 && (
                              <span className="text-[10px] bg-cyan/20 text-cyan px-1.5 py-0.5 rounded font-mono">latest</span>
                            )}
                          </div>
                          <div className="text-[11px] text-text-tertiary mt-0.5">
                            {formatDate(v.createdAt)}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleViewDiff(v)}
                            title="View diff"
                            className="p-1.5 rounded-lg text-text-tertiary hover:text-cyan hover:bg-cyan/10 transition-colors"
                          >
                            <GitCompare size={13} />
                          </button>
                          <a
                            href={getMigrationSQLUrl(projectId, v.version)}
                            download={`migration_v${v.version}.sql`}
                            title="Download migration SQL"
                            className="p-1.5 rounded-lg text-text-tertiary hover:text-violet hover:bg-violet/10 transition-colors"
                          >
                            <Download size={13} />
                          </a>
                          {i !== 0 && (
                            <button
                              onClick={() => handleRevert(v.version)}
                              disabled={reverting === v.version}
                              title="Revert to this version"
                              className="p-1.5 rounded-lg text-text-tertiary hover:text-warning hover:bg-warning/10 disabled:opacity-40 transition-colors"
                            >
                              {reverting === v.version ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : reverted === v.version ? (
                                <Check size={13} className="text-success" />
                              ) : (
                                <RotateCcw size={13} />
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {v.diffSummary && (
                        <div className="text-xs text-text-secondary mt-1">
                          <ChevronRight size={10} className="inline mr-1 text-text-tertiary" />
                          {v.diffSummary}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
