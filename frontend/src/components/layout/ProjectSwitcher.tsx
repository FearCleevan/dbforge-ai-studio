import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Plus, Upload, FolderOpen, Check } from 'lucide-react'
import { useProject } from '@/context/ProjectContext'
import { useNavigate } from 'react-router-dom'
import { DB_TARGETS, SCHEMA_TEMPLATES } from '@/lib/constants'
import { DbIcon } from '@/lib/utils/dbIcons'
import { ecommerceSchema, blogSchema, inventorySchema, saasSchema, socialSchema } from '@/lib/mock/schemas'
import { Project } from '@/types'
import { formatRelative } from '@/lib/utils/formatters'

const templateSchemas: Record<string, typeof ecommerceSchema> = {
  'e-commerce': ecommerceSchema,
  'blog': blogSchema,
  'inventory': inventorySchema,
  'saas': saasSchema,
  'social-network': socialSchema,
}

export function ProjectSwitcher() {
  const { currentProject, projectsList, createProject, switchProject } = useProject()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [newName, setNewName] = useState('')
  const [newTarget, setNewTarget] = useState('postgresql')
  const [newTemplate, setNewTemplate] = useState('blank')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleCreate = () => {
    if (!newName.trim()) return
    const now = new Date().toISOString()
    const id = crypto.randomUUID()
    const project: Project = {
      id,
      name: newName.trim(),
      savedSchemas: [],
      queries: [],
      apiRequests: [],
      environments: [{ id: crypto.randomUUID(), name: 'Development', variables: [] }],
      namingConvention: { tableCase: 'snake_case', columnCase: 'snake_case' },
      createdAt: now,
      updatedAt: now,
      schema: newTemplate !== 'blank'
        ? { ...templateSchemas[newTemplate], id, name: newName.trim() }
        : undefined,
    }
    createProject(project)
    setShowNewDialog(false)
    setNewName('')
    setNewTemplate('blank')
    setOpen(false)
    navigate(`/studio/${id}`)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const text = ev.target?.result as string
      try {
        const p = JSON.parse(text) as Project
        createProject(p)
        navigate(`/studio/${p.id}`)
      } catch { /* ignore */ }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
      >
        <FolderOpen size={14} className="text-cyan" />
        <span className="text-sm text-text-primary font-medium max-w-[180px] truncate">
          {currentProject?.name ?? 'No Project'}
        </span>
        <ChevronDown size={13} className={`text-text-secondary transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && !showNewDialog && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 surface-elevated rounded-xl border border-white/10 shadow-lg z-50 overflow-hidden animate-fade-up">
          {projectsList.length === 0 ? (
            <div className="px-4 py-6 text-center text-text-secondary text-sm">
              No projects yet. Create one to get started.
            </div>
          ) : (
            <div className="max-h-56 overflow-y-auto">
              {projectsList.map(p => (
                <button
                  key={p.id}
                  onClick={() => { switchProject(p.id); navigate(`/studio/${p.id}`); setOpen(false) }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
                >
                  <div className={`w-1 h-8 rounded-full flex-shrink-0 ${currentProject?.id === p.id ? 'bg-cyan' : 'bg-transparent'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-text-primary truncate">{p.name}</div>
                    <div className="text-xs text-text-tertiary">{formatRelative(p.updatedAt)}</div>
                  </div>
                  {currentProject?.id === p.id && <Check size={13} className="text-cyan flex-shrink-0" />}
                </button>
              ))}
            </div>
          )}
          <div className="border-t border-white/5 p-2 flex gap-2">
            <button
              onClick={() => { setShowNewDialog(true) }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm text-cyan hover:bg-cyan/10 transition-colors"
            >
              <Plus size={14} /> New Project
            </button>
            <label className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm text-text-secondary hover:bg-white/5 transition-colors cursor-pointer">
              <Upload size={14} /> Import
              <input type="file" accept=".json" className="hidden" onChange={handleImport} />
            </label>
          </div>
        </div>
      )}

      {showNewDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowNewDialog(false)}>
          <div className="w-full max-w-md surface-elevated rounded-2xl border border-white/10 p-6 shadow-lg animate-fade-up" onClick={e => e.stopPropagation()}>
            <h3 className="font-display font-semibold text-xl mb-5">New Project</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-text-secondary mb-1.5">Project Name</label>
                <input
                  autoFocus
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                  placeholder="My Database"
                  className="w-full bg-bg-muted border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-cyan/50"
                />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1.5">Primary Database</label>
                <div className="flex flex-wrap gap-2">
                  {DB_TARGETS.map(db => (
                    <button
                      key={db.value}
                      onClick={() => setNewTarget(db.value)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-all ${
                        newTarget === db.value
                          ? 'border-cyan/50 bg-cyan/10 text-cyan'
                          : 'border-white/10 text-text-secondary hover:border-white/20'
                      }`}
                    >
                      <DbIcon name={db.iconName} size={11} /> {db.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1.5">Start from template</label>
                <div className="flex flex-wrap gap-2">
                  {['blank', ...SCHEMA_TEMPLATES].map(t => (
                    <button
                      key={t}
                      onClick={() => setNewTemplate(t)}
                      className={`px-3 py-1.5 rounded-lg text-xs border capitalize transition-all ${
                        newTemplate === t
                          ? 'border-violet/50 bg-violet/10 text-violet'
                          : 'border-white/10 text-text-secondary hover:border-white/20'
                      }`}
                    >
                      {t === 'blank' ? 'Blank' : t.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowNewDialog(false); setOpen(false) }}
                className="flex-1 py-2 rounded-lg border border-white/10 text-sm text-text-secondary hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newName.trim()}
                className="flex-1 py-2 rounded-lg bg-cyan text-bg-base font-semibold text-sm hover:shadow-cyan transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
