import { useState, useEffect, useRef } from 'react'
import React from 'react'
import { Plus, Trash2, Link, Key, ChevronRight, ChevronDown, FolderOpen, Folder, Database, Pencil } from 'lucide-react'
import { SchemaDefinition, TableDefinition, ColumnDefinition, ColumnType } from '@/types'
import { COLUMN_TYPES_SQL, COLUMN_TYPES_NOSQL } from '@/lib/constants'
import { cn } from '@/lib/utils/cn'

interface Props {
  schema:       SchemaDefinition
  onChange:     (schema: SchemaDefinition) => void
  onSaveSchema: () => void
  toolbar?:     React.ReactNode
}

const DEFAULT_GROUP = 'public'
const isNoSQL = (target: string) => target === 'mongodb' || target === 'firestore'

// Merge saved group order with any table groups not yet listed
function resolveGroups(schema: SchemaDefinition): string[] {
  const base: string[] = schema.groups?.length ? schema.groups : [DEFAULT_GROUP]
  const seen = new Set(base)
  const extra: string[] = []
  for (const t of schema.tables) {
    const g = t.schemaGroup || DEFAULT_GROUP
    if (!seen.has(g)) { seen.add(g); extra.push(g) }
  }
  return [...base, ...extra]
}

export function SchemaEditor({ schema, onChange, onSaveSchema, toolbar }: Props) {
  const [activeTableId,      setActiveTableId]      = useState<string | null>(schema.tables[0]?.id ?? null)
  const [expandedGroups,     setExpandedGroups]     = useState<Set<string>>(() => new Set(resolveGroups(schema)))
  const [deleteConfirm,      setDeleteConfirm]      = useState<string | null>(null)
  const [deleteGroupConfirm, setDeleteGroupConfirm] = useState<string | null>(null)
  const [renamingGroup,      setRenamingGroup]      = useState<string | null>(null)
  const [renameValue,        setRenameValue]        = useState('')
  const [addingGroup,        setAddingGroup]        = useState(false)
  const [newGroupName,       setNewGroupName]       = useState('')
  const renameInputRef   = useRef<HTMLInputElement>(null)
  const newGroupInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!activeTableId && schema.tables.length > 0) setActiveTableId(schema.tables[0].id)
  }, [schema.tables, activeTableId])

  useEffect(() => {
    if (renamingGroup && renameInputRef.current) renameInputRef.current.focus()
  }, [renamingGroup])

  useEffect(() => {
    if (addingGroup && newGroupInputRef.current) newGroupInputRef.current.focus()
  }, [addingGroup])

  const activeTable = schema.tables.find(t => t.id === activeTableId) ?? null
  const colTypes = isNoSQL(schema.target) ? COLUMN_TYPES_NOSQL : COLUMN_TYPES_SQL

  const allGroups = resolveGroups(schema)
  const tablesByGroup = (group: string) =>
    schema.tables.filter(t => (t.schemaGroup || DEFAULT_GROUP) === group)

  // Helper: write updated groups list into schema and propagate
  const updateGroups = (groups: string[], extraSchema?: Partial<SchemaDefinition>) =>
    onChange({ ...schema, ...extraSchema, groups, updatedAt: new Date().toISOString() })

  const toggleGroup = (g: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      next.has(g) ? next.delete(g) : next.add(g)
      return next
    })
  }

  const updateTable = (updated: TableDefinition) => {
    onChange({ ...schema, tables: schema.tables.map(t => t.id === updated.id ? updated : t), updatedAt: new Date().toISOString() })
  }

  const addTable = (group: string) => {
    const newTable: TableDefinition = {
      id: crypto.randomUUID(),
      name: `new_table_${schema.tables.length + 1}`,
      schemaGroup: group,
      columns: [
        { id: crypto.randomUUID(), name: 'id', type: 'UUID', nullable: false, primaryKey: true, unique: true, defaultValue: 'gen_random_uuid()' },
        { id: crypto.randomUUID(), name: 'created_at', type: 'TIMESTAMP', nullable: false, primaryKey: false, unique: false, defaultValue: 'NOW()' },
      ],
    }
    const groups = allGroups.includes(group) ? allGroups : [...allGroups, group]
    onChange({ ...schema, tables: [...schema.tables, newTable], groups, updatedAt: new Date().toISOString() })
    setActiveTableId(newTable.id)
    setExpandedGroups(prev => new Set([...prev, group]))
  }

  const deleteTable = (id: string) => {
    const tables = schema.tables.filter(t => t.id !== id)
    onChange({ ...schema, tables, updatedAt: new Date().toISOString() })
    if (activeTableId === id) setActiveTableId(tables[0]?.id ?? null)
    setDeleteConfirm(null)
  }

  const addColumn = () => {
    if (!activeTable) return
    const col: ColumnDefinition = {
      id: crypto.randomUUID(),
      name: `column_${activeTable.columns.length + 1}`,
      type: 'VARCHAR',
      nullable: true,
      primaryKey: false,
      unique: false,
    }
    updateTable({ ...activeTable, columns: [...activeTable.columns, col] })
  }

  const updateColumn = (colId: string, field: keyof ColumnDefinition, value: unknown) => {
    if (!activeTable) return
    updateTable({
      ...activeTable,
      columns: activeTable.columns.map(c => c.id === colId ? { ...c, [field]: value } : c),
    })
  }

  const deleteColumn = (colId: string) => {
    if (!activeTable) return
    updateTable({ ...activeTable, columns: activeTable.columns.filter(c => c.id !== colId) })
  }

  const startRenameGroup = (g: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setRenamingGroup(g)
    setRenameValue(g)
  }

  const confirmRenameGroup = () => {
    const trimmed = renameValue.trim()
    if (!trimmed || trimmed === renamingGroup) { setRenamingGroup(null); return }
    const old = renamingGroup!
    const tables = schema.tables.map(t =>
      (t.schemaGroup || DEFAULT_GROUP) === old ? { ...t, schemaGroup: trimmed } : t
    )
    const groups = allGroups.map(g => g === old ? trimmed : g)
    onChange({ ...schema, tables, groups, updatedAt: new Date().toISOString() })
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(old)) { next.delete(old); next.add(trimmed) }
      return next
    })
    setRenamingGroup(null)
  }

  const deleteGroup = (g: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleteGroupConfirm(g)
  }

  const commitDeleteGroup = (saveFirst: boolean) => {
    const g = deleteGroupConfirm
    if (!g) return
    if (saveFirst) onSaveSchema()
    const tables = schema.tables.filter(t => (t.schemaGroup || DEFAULT_GROUP) !== g)
    const groups = allGroups.filter(eg => eg !== g)
    onChange({ ...schema, tables, groups: groups.length ? groups : [DEFAULT_GROUP], updatedAt: new Date().toISOString() })
    if (activeTableId && !tables.find(t => t.id === activeTableId)) {
      setActiveTableId(tables[0]?.id ?? null)
    }
    setDeleteGroupConfirm(null)
  }

  const confirmAddGroup = () => {
    const trimmed = newGroupName.trim()
    if (trimmed && !allGroups.includes(trimmed)) {
      updateGroups([...allGroups, trimmed])
      setExpandedGroups(prev => new Set([...prev, trimmed]))
    }
    setAddingGroup(false)
    setNewGroupName('')
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Tree sidebar */}
      <div className="w-52 flex-shrink-0 border-r border-white/5 flex flex-col bg-bg-surface">

        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
          <div className="flex items-center gap-1.5 text-xs text-text-secondary">
            <Database size={12} className="text-cyan/70" />
            <span className="font-mono font-medium">{schema.name}</span>
          </div>
          <button
            type="button"
            onClick={() => setAddingGroup(true)}
            title="Add schema group"
            className="p-0.5 rounded text-text-tertiary hover:text-cyan transition-colors"
          >
            <Plus size={13} />
          </button>
        </div>

        {/* New group input */}
        {addingGroup && (
          <div className="px-2 py-1.5 border-b border-white/5 flex items-center gap-1">
            <Database size={11} className="text-violet/70 flex-shrink-0" />
            <input
              ref={newGroupInputRef}
              value={newGroupName}
              onChange={e => setNewGroupName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') confirmAddGroup()
                if (e.key === 'Escape') { setAddingGroup(false); setNewGroupName('') }
              }}
              onBlur={confirmAddGroup}
              placeholder="schema name…"
              title="New schema group name"
              className="flex-1 bg-transparent text-xs font-mono text-text-primary focus:outline-none placeholder:text-text-tertiary min-w-0"
            />
          </div>
        )}

        {/* Toolbar (Save Schema, History) */}
        {toolbar && (
          <div className="px-2 py-2 border-b border-white/5 flex flex-col gap-1.5">
            {toolbar}
          </div>
        )}

        {/* Tree */}
        <div className="flex-1 overflow-y-auto py-1">
          {allGroups.map(group => {
            const tables = tablesByGroup(group)
            const isExpanded = expandedGroups.has(group)
            const isRenaming = renamingGroup === group

            return (
              <div key={group}>
                {/* Group row */}
                <div
                  className="group/grp flex items-center gap-1 px-2 py-1.5 hover:bg-bg-overlay cursor-pointer select-none"
                  onClick={() => toggleGroup(group)}
                >
                  <span className="text-text-tertiary flex-shrink-0">
                    {isExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                  </span>
                  <span className="text-cyan/60 flex-shrink-0">
                    {isExpanded ? <FolderOpen size={12} /> : <Folder size={12} />}
                  </span>

                  {isRenaming ? (
                    <input
                      ref={renameInputRef}
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') confirmRenameGroup()
                        if (e.key === 'Escape') setRenamingGroup(null)
                      }}
                      onBlur={confirmRenameGroup}
                      onClick={e => e.stopPropagation()}
                      title="Rename schema group"
                      placeholder={group}
                      className="flex-1 bg-bg-muted border border-cyan/30 rounded px-1 text-xs font-mono text-text-primary focus:outline-none min-w-0"
                    />
                  ) : (
                    <span className="flex-1 text-xs font-mono text-text-secondary truncate">{group}</span>
                  )}

                  <span className="text-[10px] font-mono text-text-tertiary flex-shrink-0 mr-0.5">{tables.length}</span>

                  {/* Group actions — visible on hover */}
                  <div className="hidden group-hover/grp:flex items-center gap-0.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); addTable(group) }}
                      title="Add table to this group"
                      className="p-0.5 rounded text-text-tertiary hover:text-cyan transition-colors"
                    >
                      <Plus size={11} />
                    </button>
                    <button
                      type="button"
                      onClick={e => startRenameGroup(group, e)}
                      title="Rename this group"
                      className="p-0.5 rounded text-text-tertiary hover:text-violet transition-colors"
                    >
                      <Pencil size={10} />
                    </button>
                    <button
                      type="button"
                      onClick={e => deleteGroup(group, e)}
                      title="Delete group and all its tables"
                      className="p-0.5 rounded text-text-tertiary hover:text-error transition-colors"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                </div>

                {/* Tables under group */}
                {isExpanded && (
                  <div className="ml-4 border-l border-white/[0.06]">
                    {tables.length === 0 && (
                      <div className="px-3 py-1.5 text-[10px] text-text-tertiary italic">
                        No tables — click + to add
                      </div>
                    )}
                    {tables.map(t => (
                      <div key={t.id} className="group/tbl relative">
                        <button
                          type="button"
                          onClick={() => setActiveTableId(t.id)}
                          title={`Edit ${t.name}`}
                          className={cn(
                            'w-full text-left pl-3 pr-6 py-1.5 text-xs transition-colors truncate font-mono',
                            activeTableId === t.id
                              ? 'bg-cyan/10 text-cyan border-r-2 border-cyan'
                              : 'text-text-secondary hover:text-text-primary hover:bg-bg-overlay'
                          )}
                        >
                          {t.name}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm(t.id)}
                          title={`Delete ${t.name}`}
                          className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded text-text-tertiary hover:text-error opacity-0 group-hover/tbl:opacity-100 transition-all"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Column editor */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeTable ? (
          <>
            {/* Table name header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 flex-shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-text-tertiary font-mono">
                  {activeTable.schemaGroup || DEFAULT_GROUP}.
                </span>
                <input
                  value={activeTable.name}
                  onChange={e => updateTable({ ...activeTable, name: e.target.value })}
                  title="Table name"
                  placeholder="table_name"
                  className="font-display font-semibold text-xl text-text-primary bg-transparent border-b border-transparent focus:border-cyan/50 focus:outline-none pb-0.5 transition-colors"
                />
              </div>
              <span className="text-xs text-text-tertiary font-mono">{activeTable.columns.length} columns</span>
            </div>

            {/* Column table */}
            <div className="flex-1 overflow-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-bg-elevated z-10">
                  <tr className="border-b border-white/5">
                    <th scope="col" className="text-left px-3 py-2 text-text-tertiary font-mono uppercase tracking-wide w-40">Name</th>
                    <th scope="col" className="text-left px-3 py-2 text-text-tertiary font-mono uppercase tracking-wide w-36">Type</th>
                    <th scope="col" className="text-left px-3 py-2 text-text-tertiary font-mono uppercase tracking-wide w-16">Length</th>
                    <th scope="col" className="px-2 py-2 text-text-tertiary font-mono uppercase tracking-wide w-10" title="Nullable">NULL</th>
                    <th scope="col" className="px-2 py-2 text-text-tertiary font-mono uppercase tracking-wide w-10" title="Primary Key">PK</th>
                    <th scope="col" className="px-2 py-2 text-text-tertiary font-mono uppercase tracking-wide w-10" title="Unique">UNQ</th>
                    <th scope="col" className="px-3 py-2 text-text-tertiary font-mono uppercase tracking-wide">References</th>
                    <th scope="col" className="w-8"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {activeTable.columns.map(col => (
                    <ColumnRow
                      key={col.id}
                      col={col}
                      tables={schema.tables}
                      colTypes={colTypes}
                      onUpdate={(field, value) => updateColumn(col.id, field, value)}
                      onDelete={() => deleteColumn(col.id)}
                    />
                  ))}
                </tbody>
              </table>

              <div className="px-3 py-3">
                <button
                  type="button"
                  onClick={addColumn}
                  className="flex items-center gap-1.5 text-xs text-text-tertiary hover:text-cyan transition-colors py-1"
                >
                  <Plus size={13} /> Add Column
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-text-tertiary">
            <Database size={32} className="opacity-20" />
            <span className="text-sm">Select a table or add one with +</span>
          </div>
        )}
      </div>

      {/* Delete table confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="surface-elevated rounded-xl border border-white/10 p-6 w-72 shadow-lg animate-fade-up">
            <h3 className="font-semibold text-base mb-2">Delete table?</h3>
            <p className="text-text-secondary text-sm mb-5">
              This will remove{' '}
              <span className="text-text-primary font-mono">
                {schema.tables.find(t => t.id === deleteConfirm)?.name}
              </span>{' '}
              and all its columns.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2 rounded-lg border border-white/10 text-sm text-text-secondary hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteTable(deleteConfirm)}
                className="flex-1 py-2 rounded-lg bg-error/20 border border-error/30 text-error text-sm hover:bg-error/30 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete group confirmation */}
      {deleteGroupConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="surface-elevated rounded-xl border border-white/10 p-6 w-80 shadow-lg animate-fade-up">
            <h3 className="font-semibold text-base mb-1">Delete group?</h3>
            <p className="text-text-secondary text-sm mb-1">
              This will permanently remove the group{' '}
              <span className="text-text-primary font-mono">"{deleteGroupConfirm}"</span>
              {' '}and{' '}
              <span className="text-error font-semibold">
                {tablesByGroup(deleteGroupConfirm).length} table{tablesByGroup(deleteGroupConfirm).length !== 1 ? 's' : ''}
              </span>
              {' '}inside it.
            </p>
            <p className="text-text-tertiary text-xs mb-5">
              Do you want to save a schema snapshot first?
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => commitDeleteGroup(true)}
                className="w-full py-2 rounded-lg bg-cyan/10 border border-cyan/30 text-cyan text-sm font-medium hover:bg-cyan/20 transition-colors"
              >
                Save Schema & Delete
              </button>
              <button
                type="button"
                onClick={() => commitDeleteGroup(false)}
                className="w-full py-2 rounded-lg bg-error/10 border border-error/30 text-error text-sm font-medium hover:bg-error/20 transition-colors"
              >
                Delete without Saving
              </button>
              <button
                type="button"
                onClick={() => setDeleteGroupConfirm(null)}
                className="w-full py-2 rounded-lg border border-white/10 text-sm text-text-secondary hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface ColumnRowProps {
  col:      ColumnDefinition
  tables:   TableDefinition[]
  colTypes: string[]
  onUpdate: (field: keyof ColumnDefinition, value: unknown) => void
  onDelete: () => void
}

function ColumnRow({ col, tables, colTypes, onUpdate, onDelete }: ColumnRowProps) {
  const [refOpen, setRefOpen] = useState(false)
  const hasLength = ['VARCHAR', 'CHAR', 'String'].includes(col.type)

  return (
    <tr className="group border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
      <td className="px-3 py-1.5">
        <div className="flex items-center gap-1.5">
          {col.primaryKey && <Key size={11} className="text-warning flex-shrink-0" />}
          {col.references && !col.primaryKey && <Link size={11} className="text-cyan flex-shrink-0" />}
          <input
            value={col.name}
            onChange={e => onUpdate('name', e.target.value)}
            title="Column name"
            placeholder="column_name"
            className="bg-transparent font-mono text-text-primary focus:outline-none focus:border-b focus:border-cyan/40 w-full"
          />
        </div>
      </td>
      <td className="px-3 py-1.5">
        <select
          value={col.type}
          onChange={e => onUpdate('type', e.target.value as ColumnType)}
          title="Column type"
          className="bg-bg-muted border border-white/5 rounded px-1.5 py-0.5 text-xs font-mono text-text-code focus:outline-none focus:border-cyan/40 w-full"
        >
          {colTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </td>
      <td className="px-3 py-1.5">
        {hasLength && (
          <input
            type="number"
            value={col.length ?? ''}
            onChange={e => onUpdate('length', e.target.value ? Number(e.target.value) : undefined)}
            title="Column length"
            className="bg-bg-muted border border-white/5 rounded px-1.5 py-0.5 text-xs font-mono text-text-secondary focus:outline-none focus:border-cyan/40 w-14"
            placeholder="255"
          />
        )}
      </td>
      <td className="px-2 py-1.5 text-center">
        <input
          type="checkbox"
          checked={col.nullable}
          onChange={e => onUpdate('nullable', e.target.checked)}
          title="Nullable"
          className="accent-cyan"
        />
      </td>
      <td className="px-2 py-1.5 text-center">
        <input
          type="checkbox"
          checked={col.primaryKey}
          onChange={e => onUpdate('primaryKey', e.target.checked)}
          title="Primary key"
          className="accent-warning"
        />
      </td>
      <td className="px-2 py-1.5 text-center">
        <input
          type="checkbox"
          checked={col.unique}
          onChange={e => onUpdate('unique', e.target.checked)}
          title="Unique"
          className="accent-violet"
        />
      </td>
      <td className="px-3 py-1.5 relative">
        <button
          type="button"
          onClick={() => setRefOpen(v => !v)}
          title="Set foreign key reference"
          className={cn(
            'text-xs px-2 py-0.5 rounded border transition-colors',
            col.references
              ? 'border-cyan/30 text-cyan bg-cyan/5'
              : 'border-white/10 text-text-tertiary hover:border-white/20'
          )}
        >
          {col.references ? `→ ${col.references.table}.${col.references.column}` : 'None'}
        </button>
        {refOpen && (
          <div className="absolute top-full left-0 mt-1 w-56 surface-elevated rounded-lg border border-white/10 shadow-lg z-20 p-2 space-y-1">
            <button
              type="button"
              onClick={() => { onUpdate('references', undefined); setRefOpen(false) }}
              className="w-full text-left px-2 py-1 text-xs text-text-tertiary hover:text-text-primary rounded hover:bg-white/5 transition-colors"
            >
              None
            </button>
            {tables.filter(t => t.id !== col.id).map(t =>
              t.columns.filter(c => c.primaryKey).map(c => (
                <button
                  type="button"
                  key={`${t.id}-${c.id}`}
                  onClick={() => { onUpdate('references', { table: t.name, column: c.name }); setRefOpen(false) }}
                  className="w-full text-left px-2 py-1 text-xs text-text-secondary hover:text-text-primary rounded hover:bg-white/5 transition-colors font-mono"
                >
                  {t.name}.{c.name}
                </button>
              ))
            )}
          </div>
        )}
      </td>
      <td className="pr-2">
        <button
          type="button"
          onClick={onDelete}
          title="Delete column"
          className="p-1 rounded text-text-tertiary hover:text-error opacity-0 group-hover:opacity-100 transition-all"
        >
          <Trash2 size={12} />
        </button>
      </td>
    </tr>
  )
}
