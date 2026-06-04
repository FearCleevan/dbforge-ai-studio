import { SchemaDefinition, TableDefinition, ColumnDefinition, ColumnType, DatabaseTarget } from '@/types'

// ── Type mappers ──────────────────────────────────────────────────────────────

function mapPostgresType(raw: string): ColumnType {
  const t = raw.toUpperCase().replace(/\s+/g, ' ').trim()
  if (t.endsWith('[]')) return 'TEXT'
  if (t.startsWith('CHARACTER VARYING') || t.startsWith('VARCHAR')) return 'VARCHAR'
  if (t === 'TEXT') return 'TEXT'
  if (t.startsWith('CHAR(') || t === 'CHAR') return 'CHAR'
  if (t === 'UUID') return 'UUID'
  if (t === 'BIGSERIAL') return 'BIGINT'
  if (t === 'SERIAL' || t === 'SMALLSERIAL') return 'SERIAL'
  if (t === 'INTEGER' || t === 'INT' || t === 'INT4') return 'INTEGER'
  if (t === 'BIGINT' || t === 'INT8') return 'BIGINT'
  if (t === 'SMALLINT' || t === 'INT2') return 'SMALLINT'
  if (t.startsWith('NUMERIC') || t.startsWith('DECIMAL')) return 'DECIMAL'
  if (t === 'REAL' || t === 'FLOAT4' || t.startsWith('FLOAT')) return 'FLOAT'
  if (t === 'DOUBLE PRECISION' || t === 'FLOAT8') return 'DOUBLE'
  if (t === 'BOOLEAN' || t === 'BOOL') return 'BOOLEAN'
  if (t.startsWith('TIMESTAMP')) return 'TIMESTAMP'
  if (t === 'DATE') return 'DATE'
  if (t.startsWith('TIME')) return 'TIME'
  if (t === 'JSONB') return 'JSONB'
  if (t === 'JSON') return 'JSON'
  if (t === 'BYTEA') return 'BYTEA'
  return 'TEXT'
}

function mapMysqlType(raw: string): ColumnType {
  const t = raw.toUpperCase().replace(/\s+/g, ' ').trim()
  if (t.startsWith('VARCHAR') || t.startsWith('TINYTEXT') || t.startsWith('MEDIUMTEXT') ||
      t.startsWith('LONGTEXT') || t.startsWith('ENUM') || t.startsWith('SET')) return 'VARCHAR'
  if (t === 'TEXT') return 'TEXT'
  if (t.startsWith('CHAR')) return 'CHAR'
  if (t === 'TINYINT(1)' || t === 'BOOL' || t === 'BOOLEAN') return 'BOOLEAN'
  if (t === 'TINYINT' || t.startsWith('INT') || t === 'MEDIUMINT') return 'INTEGER'
  if (t === 'BIGINT') return 'BIGINT'
  if (t === 'SMALLINT') return 'SMALLINT'
  if (t.startsWith('DECIMAL') || t.startsWith('NUMERIC')) return 'DECIMAL'
  if (t === 'FLOAT') return 'FLOAT'
  if (t.startsWith('DOUBLE')) return 'DOUBLE'
  if (t.startsWith('DATETIME') || t.startsWith('TIMESTAMP')) return 'TIMESTAMP'
  if (t === 'DATE') return 'DATE'
  if (t === 'TIME') return 'TIME'
  if (t === 'JSON') return 'JSON'
  if (t.startsWith('BLOB') || t.startsWith('MEDIUMBLOB') || t.startsWith('LONGBLOB')) return 'BLOB'
  if (t.startsWith('BINARY') || t.startsWith('VARBINARY')) return 'BYTEA'
  return 'TEXT'
}

// ── String helpers ────────────────────────────────────────────────────────────

function stripComments(sql: string): string {
  sql = sql.replace(/\/\*[\s\S]*?\*\//g, ' ')
  sql = sql.replace(/--[^\n]*/g, '')
  return sql
}

function stripIdentifierQuotes(name: string): string {
  return name.replace(/^["'`]|["'`]$/g, '').replace(/["'`]/g, '')
}

function stripSchemaPrefix(name: string): string {
  const clean = stripIdentifierQuotes(name.trim())
  const parts = clean.split('.')
  return parts[parts.length - 1]
}

function splitTopLevel(s: string): string[] {
  const parts: string[] = []
  let depth = 0
  let current = ''
  for (const ch of s) {
    if (ch === '(') { depth++; current += ch }
    else if (ch === ')') { depth--; current += ch }
    else if (ch === ',' && depth === 0) {
      if (current.trim()) parts.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  if (current.trim()) parts.push(current.trim())
  return parts
}

function extractParenBody(sql: string, openIdx: number): string | null {
  let depth = 0
  let start = -1
  for (let i = openIdx; i < sql.length; i++) {
    if (sql[i] === '(') {
      if (depth === 0) start = i
      depth++
    } else if (sql[i] === ')') {
      depth--
      if (depth === 0 && start !== -1) return sql.substring(start + 1, i)
    }
  }
  return null
}

function extractTypeStr(rest: string): string {
  const upper = rest.toUpperCase().replace(/\s+/g, ' ').trim()

  const multiWordPrefixes = [
    'TIMESTAMP WITH TIME ZONE',
    'TIMESTAMP WITHOUT TIME ZONE',
    'TIME WITH TIME ZONE',
    'TIME WITHOUT TIME ZONE',
    'CHARACTER VARYING',
    'DOUBLE PRECISION',
    'BIT VARYING',
  ]

  for (const prefix of multiWordPrefixes) {
    if (upper.startsWith(prefix)) {
      const after = rest.slice(prefix.length).trimStart()
      if (after.startsWith('(')) {
        const close = after.indexOf(')')
        if (close !== -1) return prefix + after.slice(0, close + 1)
      }
      return prefix
    }
  }

  // Array types like text[], integer[]
  const arrMatch = rest.match(/^(\w+(?:\([^)]*\))?\s*\[\s*\])/i)
  if (arrMatch) return arrMatch[1]

  // Type with optional length like VARCHAR(255), NUMERIC(10,2)
  const withLen = rest.match(/^(\w+(?:\s*\([^)]*\))?)/i)
  if (withLen) return withLen[1].trim()

  return rest.split(/\s+/)[0]
}

function extractColsFromParens(def: string): string[] {
  const match = def.match(/\(([^)]+)\)/)
  if (!match) return []
  return match[1].split(',').map(c => stripIdentifierQuotes(c.trim()))
}

// ── Column parser ─────────────────────────────────────────────────────────────

function parseColumnDef(def: string, target: DatabaseTarget): ColumnDefinition | null {
  const s = def.trim()
  if (!s) return null

  let name: string
  let rest: string

  const quotedMatch = s.match(/^["'`]([^"'`]+)["'`]\s+(.+)/s)
  const normalMatch = s.match(/^(\S+)\s+(.+)/s)

  if (quotedMatch) {
    name = quotedMatch[1]
    rest = quotedMatch[2]
  } else if (normalMatch) {
    name = stripIdentifierQuotes(normalMatch[1])
    rest = normalMatch[2]
  } else {
    return null
  }

  if (!name || !rest) return null

  const upper = rest.toUpperCase()

  const nullable = !upper.includes('NOT NULL')
  const primaryKey = /\bPRIMARY\s+KEY\b/.test(upper)
  const unique = /\bUNIQUE\b/.test(upper)

  const typeStr = extractTypeStr(rest)
  const colType: ColumnType = target === 'mysql' ? mapMysqlType(typeStr) : mapPostgresType(typeStr)

  const lengthMatch = typeStr.match(/\((\d+)/)
  const length = lengthMatch ? parseInt(lengthMatch[1]) : undefined

  // Extract default — strip cast suffix like ::text and surrounding quotes
  const defaultMatch = rest.match(/DEFAULT\s+(\S+)/i)
  const defaultValue = defaultMatch
    ? defaultMatch[1].replace(/::.*$/, '').replace(/^'|'$/g, '')
    : undefined

  // Inline REFERENCES
  let references: { table: string; column: string } | undefined
  const refMatch = rest.match(/REFERENCES\s+([^\s(,)]+)\s*\(([^)]+)\)/i)
  if (refMatch) {
    references = {
      table: stripSchemaPrefix(refMatch[1]),
      column: stripIdentifierQuotes(refMatch[2].trim()),
    }
  }

  return {
    id: crypto.randomUUID(),
    name,
    type: colType,
    ...(length !== undefined && { length }),
    nullable,
    primaryKey,
    unique,
    ...(defaultValue && { defaultValue }),
    ...(references && { references }),
  }
}

// ── FK parser ─────────────────────────────────────────────────────────────────

function parseForeignKey(def: string): { fromCol: string; toTable: string; toCol: string } | null {
  const match = def.match(/FOREIGN\s+KEY\s*\(([^)]+)\)\s+REFERENCES\s+([^\s(]+)\s*\(([^)]+)\)/i)
  if (!match) return null
  return {
    fromCol: stripIdentifierQuotes(match[1].trim()),
    toTable: stripSchemaPrefix(match[2].trim()),
    toCol: stripIdentifierQuotes(match[3].trim()),
  }
}

// ── Table parser ──────────────────────────────────────────────────────────────

function parseTableBody(tableName: string, body: string, target: DatabaseTarget): TableDefinition | null {
  const parts = splitTopLevel(body)
  const columns: ColumnDefinition[] = []
  const pkCols: string[] = []
  const uniqueCols = new Set<string>()
  const fkMap = new Map<string, { table: string; column: string }>()

  for (const part of parts) {
    const upper = part.trim().toUpperCase()
    if (!upper) continue

    if (/^(CONSTRAINT\s+\S+\s+)?PRIMARY\s+KEY\s*\(/.test(upper)) {
      pkCols.push(...extractColsFromParens(part))
      continue
    }
    if (/^(CONSTRAINT\s+\S+\s+)?UNIQUE\s*\(/.test(upper)) {
      extractColsFromParens(part).forEach(c => uniqueCols.add(c))
      continue
    }
    if (/FOREIGN\s+KEY/.test(upper)) {
      const fk = parseForeignKey(part)
      if (fk) fkMap.set(fk.fromCol, { table: fk.toTable, column: fk.toCol })
      continue
    }
    if (/^(CONSTRAINT\s+\S+\s+)?CHECK\s*\(/.test(upper)) continue
    if (/^(CONSTRAINT\s+\S+\s+)?EXCLUDE\b/.test(upper)) continue
    if (/^(KEY|INDEX)\s+/.test(upper)) continue
    if (/^LIKE\s+/.test(upper)) continue

    const col = parseColumnDef(part, target)
    if (col) columns.push(col)
  }

  for (const col of columns) {
    if (pkCols.includes(col.name)) col.primaryKey = true
    if (uniqueCols.has(col.name)) col.unique = true
    const fk = fkMap.get(col.name)
    if (fk) col.references = fk
  }

  if (columns.length === 0) return null

  return { id: crypto.randomUUID(), name: tableName, columns }
}

// ── Public API ────────────────────────────────────────────────────────────────

export function parseDDLToSchema(sql: string, target: DatabaseTarget): SchemaDefinition {
  const clean = stripComments(sql)
  const tables: TableDefinition[] = []

  const createTableRegex = /CREATE\s+(?:\w+\s+)*TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([^\s(,]+)\s*\(/gi
  let match: RegExpExecArray | null

  while ((match = createTableRegex.exec(clean)) !== null) {
    const rawName = match[1].trim()
    const tableName = stripSchemaPrefix(rawName)
    if (!tableName) continue

    const openParenIdx = match.index + match[0].length - 1
    const body = extractParenBody(clean, openParenIdx)
    if (!body) continue

    const table = parseTableBody(tableName, body, target)
    if (table) tables.push(table)
  }

  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    name: 'Imported Schema',
    target,
    tables,
    ddl: sql,
    createdAt: now,
    updatedAt: now,
  }
}
