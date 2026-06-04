import { SchemaDefinition, QueryResult, ExplainPlan } from '@/types'
import { getQueryType, extractTableName, isValidSQL } from '@/lib/utils/sqlParser'
import { mockQueryResults, getDefaultQueryResult } from '@/lib/mock/queries'

const DELAY = () => Math.random() * 600 + 200

function generateMockRows(tableName: string, schema: SchemaDefinition): Record<string, unknown>[] {
  const table = schema.tables.find(t =>
    t.name.toLowerCase() === tableName.toLowerCase()
  )

  const stored = mockQueryResults[tableName.toLowerCase()]
  if (stored) return stored.rows

  if (!table) return getDefaultQueryResult(tableName).rows

  const rows: Record<string, unknown>[] = []
  for (let i = 1; i <= 5; i++) {
    const row: Record<string, unknown> = {}
    table.columns.forEach(col => {
      switch (col.type.toUpperCase()) {
        case 'UUID':
          row[col.name] = crypto.randomUUID()
          break
        case 'INTEGER':
        case 'BIGINT':
        case 'SERIAL':
          row[col.name] = i * 10
          break
        case 'DECIMAL':
        case 'FLOAT':
          row[col.name] = (i * 9.99).toFixed(2)
          break
        case 'BOOLEAN':
          row[col.name] = i % 2 === 0
          break
        case 'TIMESTAMP':
          row[col.name] = new Date(Date.now() - i * 86400000).toISOString()
          break
        case 'DATE':
          row[col.name] = new Date(Date.now() - i * 86400000).toISOString().split('T')[0]
          break
        case 'JSON':
        case 'JSONB':
          row[col.name] = { key: `value_${i}` }
          break
        default:
          if (col.name.includes('email')) {
            row[col.name] = `user${i}@example.com`
          } else if (col.name.includes('name')) {
            row[col.name] = `Sample ${col.name.replace(/_/g, ' ')} ${i}`
          } else if (col.nullable && i % 3 === 0) {
            row[col.name] = null
          } else {
            row[col.name] = `${col.name}_${i}`
          }
      }
    })
    rows.push(row)
  }
  return rows
}

export async function simulateQueryExecution(
  sql: string,
  schema: SchemaDefinition
): Promise<QueryResult> {
  await new Promise(r => setTimeout(r, DELAY()))

  if (!sql.trim()) {
    return { columns: [], rows: [], rowCount: 0, executionMs: 0, error: 'Empty query' }
  }

  if (!isValidSQL(sql)) {
    return {
      columns: [],
      rows: [],
      rowCount: 0,
      executionMs: Math.floor(Math.random() * 50),
      error: `Syntax error near "${sql.trim().split(/\s+/)[0]}" — check your SQL syntax`,
    }
  }

  const queryType = getQueryType(sql)
  const tableName = extractTableName(sql) ?? ''
  const execMs = Math.floor(Math.random() * 300 + 20)

  if (queryType === 'SELECT') {
    const rows = generateMockRows(tableName, schema)
    const columns = rows.length > 0 ? Object.keys(rows[0]) : []
    return { columns, rows, rowCount: rows.length, executionMs: execMs }
  }

  if (queryType === 'INSERT') {
    return { columns: ['affected_rows', 'last_insert_id'], rows: [{ affected_rows: 1, last_insert_id: Math.floor(Math.random() * 9000 + 1000) }], rowCount: 1, executionMs: execMs }
  }

  if (queryType === 'UPDATE') {
    const n = Math.floor(Math.random() * 5 + 1)
    return { columns: ['affected_rows'], rows: [{ affected_rows: n }], rowCount: n, executionMs: execMs }
  }

  if (queryType === 'DELETE') {
    const n = Math.floor(Math.random() * 3 + 1)
    return { columns: ['affected_rows'], rows: [{ affected_rows: n }], rowCount: n, executionMs: execMs }
  }

  // CREATE, ALTER, DROP, etc.
  return { columns: ['message'], rows: [{ message: `${queryType} executed successfully` }], rowCount: 0, executionMs: execMs }
}

export async function simulateQueryExplain(sql: string): Promise<ExplainPlan> {
  await new Promise(r => setTimeout(r, DELAY()))

  const tableName = extractTableName(sql) ?? 'table'

  const steps = [
    { operation: 'Hash Aggregate', table: undefined, index: undefined, cost: 8.2, rows: 1, detail: 'Aggregate over sorted input' },
    { operation: 'Hash Join', table: undefined, index: undefined, cost: 7.4, rows: 12, detail: 'Hash join on matching keys' },
    { operation: 'Index Scan', table: tableName, index: `${tableName}_pkey`, cost: 3.1, rows: 8, detail: `Index scan using ${tableName}_pkey` },
    { operation: 'Seq Scan', table: tableName, index: undefined, cost: 1.5, rows: 100, detail: `Seq scan on ${tableName}` },
  ]

  return { steps, totalCost: 12.5, estimatedRows: 8 }
}

export async function simulateQueryOptimize(
  sql: string,
  schema: SchemaDefinition
): Promise<string[]> {
  await new Promise(r => setTimeout(r, DELAY()))

  const tableName = extractTableName(sql) ?? ''
  const table = schema.tables.find(t => t.name.toLowerCase() === tableName.toLowerCase())

  const suggestions: string[] = []

  if (sql.toUpperCase().includes('SELECT *')) {
    suggestions.push('Avoid SELECT * — specify only the columns you need to reduce network overhead')
  }

  if (!sql.toUpperCase().includes('LIMIT')) {
    suggestions.push('Add a LIMIT clause to prevent accidentally fetching large result sets')
  }

  if (table) {
    const unindexedCols = table.columns.filter(c => !c.primaryKey && !c.unique && c.name.includes('_id'))
    if (unindexedCols.length > 0) {
      suggestions.push(`Consider adding an index on ${table.name}.${unindexedCols[0].name} for faster JOIN lookups`)
    }
  }

  if (sql.toUpperCase().includes('WHERE') && !sql.toUpperCase().includes('INDEX')) {
    suggestions.push('Ensure the WHERE clause columns are indexed for optimal performance')
  }

  if (suggestions.length === 0) {
    suggestions.push('Query looks well-optimized. No immediate suggestions.')
  }

  return suggestions.slice(0, 4)
}

export async function simulateQueryTranslate(sql: string): Promise<string> {
  await new Promise(r => setTimeout(r, DELAY()))

  const tableName = extractTableName(sql) ?? 'collection'
  const hasWhere = sql.toUpperCase().includes('WHERE')
  const hasLimit = sql.toUpperCase().match(/LIMIT\s+(\d+)/i)
  const limitVal = hasLimit ? hasLimit[1] : '10'

  if (!sql.toUpperCase().startsWith('SELECT')) {
    return `// Only SELECT queries can be translated to MongoDB\n// Use db.${tableName}.insertOne({...}) for inserts`
  }

  return `db.${tableName}.aggregate([
  ${hasWhere ? '{ $match: { /* extracted WHERE conditions */ } },' : ''}
  { $project: { _id: 1 /* add fields */ } },
  { $limit: ${limitVal} }
])`
}

export async function simulateQueryGeneration(
  prompt: string,
  schema: SchemaDefinition
): Promise<string> {
  await new Promise(r => setTimeout(r, DELAY()))

  const lower = prompt.toLowerCase()
  const tables = schema.tables

  const firstTable = tables[0]?.name ?? 'users'
  const orderTable = tables.find(t => t.name.toLowerCase().includes('order'))?.name
  const userTable = tables.find(t => t.name.toLowerCase().includes('user'))?.name ?? firstTable

  if (lower.includes('top') && (lower.includes('customer') || lower.includes('user'))) {
    return `SELECT u.id, u.email, u.name, COUNT(o.id) AS order_count, SUM(o.total) AS total_spent
FROM ${userTable} u
LEFT JOIN ${orderTable ?? firstTable} o ON o.user_id = u.id
GROUP BY u.id, u.email, u.name
ORDER BY total_spent DESC
LIMIT 10;`
  }

  if (lower.includes('recent') || lower.includes('latest')) {
    const col = tables[0]?.columns.find(c => c.name.includes('created_at') || c.name.includes('created'))?.name ?? 'created_at'
    return `SELECT *
FROM ${firstTable}
ORDER BY ${col} DESC
LIMIT 20;`
  }

  if (lower.includes('count') || lower.includes('total')) {
    return `SELECT COUNT(*) AS total_count
FROM ${firstTable};`
  }

  if (lower.includes('join') || lower.includes('related')) {
    const secondTable = tables[1]?.name ?? firstTable
    return `SELECT a.*, b.*
FROM ${firstTable} a
INNER JOIN ${secondTable} b ON b.${firstTable.replace(/s$/, '')}_id = a.id
LIMIT 20;`
  }

  // Default: simple select
  return `SELECT *
FROM ${firstTable}
LIMIT 20;`
}
