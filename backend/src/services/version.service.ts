import { SchemaDefinition, TableDefinition } from '../types/schema'

export function computeDiffSummary(prev: SchemaDefinition | null, next: SchemaDefinition): string {
  if (!prev) return 'Initial schema version'

  const prevTables = new Map(prev.tables.map(t => [t.name, t]))
  const nextTables = new Map(next.tables.map(t => [t.name, t]))

  const added: string[] = []
  const removed: string[] = []
  const modified: string[] = []

  for (const [name, nextTable] of nextTables) {
    if (!prevTables.has(name)) {
      added.push(name)
    } else {
      const prevTable = prevTables.get(name)!
      if (JSON.stringify(prevTable.columns) !== JSON.stringify(nextTable.columns)) {
        modified.push(name)
      }
    }
  }

  for (const name of prevTables.keys()) {
    if (!nextTables.has(name)) removed.push(name)
  }

  const parts: string[] = []
  if (added.length)    parts.push(`Added ${added.length} table${added.length > 1 ? 's' : ''} (${added.join(', ')})`)
  if (removed.length)  parts.push(`Removed ${removed.length} table${removed.length > 1 ? 's' : ''} (${removed.join(', ')})`)
  if (modified.length) parts.push(`Modified ${modified.length} table${modified.length > 1 ? 's' : ''} (${modified.join(', ')})`)

  return parts.length > 0 ? parts.join('; ') : 'No schema changes'
}

export function generateMigrationSQL(prev: SchemaDefinition | null, next: SchemaDefinition): string {
  if (!prev) return generateCreateSQL(next)

  const sql: string[] = []
  const prevTables = new Map(prev.tables.map(t => [t.name, t]))
  const nextTables = new Map(next.tables.map(t => [t.name, t]))

  for (const [name, table] of nextTables) {
    if (!prevTables.has(name)) {
      sql.push(generateCreateTableSQL(table))
    }
  }

  for (const name of prevTables.keys()) {
    if (!nextTables.has(name)) {
      sql.push(`DROP TABLE IF EXISTS ${qi(name)};`)
    }
  }

  for (const [name, nextTable] of nextTables) {
    const prevTable = prevTables.get(name)
    if (!prevTable) continue

    const prevCols = new Map(prevTable.columns.map(c => [c.name, c]))
    const nextCols = new Map(nextTable.columns.map(c => [c.name, c]))

    for (const [colName, col] of nextCols) {
      if (!prevCols.has(colName)) {
        const notNull = !col.nullable ? ' NOT NULL' : ''
        const def = col.defaultValue ? ` DEFAULT ${col.defaultValue}` : ''
        sql.push(`ALTER TABLE ${qi(name)} ADD COLUMN ${qi(colName)} ${col.type}${notNull}${def};`)
      }
    }

    for (const colName of prevCols.keys()) {
      if (!nextCols.has(colName)) {
        sql.push(`ALTER TABLE ${qi(name)} DROP COLUMN ${qi(colName)};`)
      }
    }

    for (const [colName, nextCol] of nextCols) {
      const prevCol = prevCols.get(colName)
      if (!prevCol) continue
      if (prevCol.type !== nextCol.type) {
        sql.push(`ALTER TABLE ${qi(name)} ALTER COLUMN ${qi(colName)} TYPE ${nextCol.type};`)
      }
    }
  }

  return sql.join('\n') || '-- No schema changes'
}

function generateCreateSQL(schema: SchemaDefinition): string {
  return schema.tables.map(t => generateCreateTableSQL(t)).join('\n\n')
}

function generateCreateTableSQL(table: TableDefinition): string {
  const cols = table.columns.map(c => {
    const parts: string[] = [qi(c.name), c.type]
    if (c.primaryKey) parts.push('PRIMARY KEY')
    if (!c.nullable && !c.primaryKey) parts.push('NOT NULL')
    if (c.unique && !c.primaryKey) parts.push('UNIQUE')
    if (c.defaultValue) parts.push(`DEFAULT ${c.defaultValue}`)
    return '  ' + parts.join(' ')
  })
  return `CREATE TABLE ${qi(table.name)} (\n${cols.join(',\n')}\n);`
}

function qi(name: string): string {
  return `"${name}"`
}
