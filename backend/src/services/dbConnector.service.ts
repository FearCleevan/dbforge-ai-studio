import type { RowDataPacket, FieldPacket } from 'mysql2'
import { IConnection } from '../models/Connection'
import { SchemaDefinition, TableDefinition, ColumnDefinition, ColumnType } from '../types/schema'
import { v4 as uuid } from 'uuid'

export interface QueryResult {
  columns:     string[]
  rows:        Record<string, unknown>[]
  rowCount:    number
  executionMs: number
  error?:      string
}

// ─── PostgreSQL ────────────────────────────────────────────────────────────────

async function pgTest(conn: IConnection): Promise<void> {
  const { Client } = await import('pg')
  const client = new Client(pgConfig(conn))
  await client.connect()
  await client.end()
}

async function pgReverseEngineer(conn: IConnection): Promise<SchemaDefinition> {
  const { Client } = await import('pg')
  const client = new Client(pgConfig(conn))
  await client.connect()
  try {
    const tablesRes = await client.query<{ table_name: string }>(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `)
    const tables: TableDefinition[] = []
    for (const row of tablesRes.rows) {
      const colsRes = await client.query<{
        column_name: string
        data_type: string
        is_nullable: string
        column_default: string | null
      }>(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position
      `, [row.table_name])
      const pkRes = await client.query<{ column_name: string }>(`
        SELECT kcu.column_name FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_name = $1
      `, [row.table_name])
      const pkCols = new Set(pkRes.rows.map(r => r.column_name))
      tables.push({
        id:      uuid(),
        name:    row.table_name,
        columns: colsRes.rows.map(c => ({
          id:           uuid(),
          name:         c.column_name,
          type:         mapPgType(c.data_type),
          nullable:     c.is_nullable === 'YES',
          primaryKey:   pkCols.has(c.column_name),
          unique:       false,
          defaultValue: c.column_default ?? undefined,
        } satisfies ColumnDefinition)),
      })
    }
    const now = new Date().toISOString()
    return { id: uuid(), name: conn.database, target: 'postgresql', tables, createdAt: now, updatedAt: now }
  } finally {
    await client.end()
  }
}

async function pgExecute(conn: IConnection, sql: string): Promise<QueryResult> {
  const { Client } = await import('pg')
  const client = new Client(pgConfig(conn))
  await client.connect()
  const start = Date.now()
  try {
    const res = await client.query(sql)
    return {
      columns:     res.fields.map(f => f.name),
      rows:        res.rows as Record<string, unknown>[],
      rowCount:    res.rowCount ?? res.rows.length,
      executionMs: Date.now() - start,
    }
  } catch (err: unknown) {
    return { columns: [], rows: [], rowCount: 0, executionMs: Date.now() - start, error: (err as Error).message }
  } finally {
    await client.end()
  }
}

function pgConfig(conn: IConnection) {
  return {
    host:     conn.host,
    port:     conn.port ?? 5432,
    database: conn.database,
    user:     conn.username,
    password: conn.password,
    ssl:      conn.ssl,
  }
}

function mapPgType(t: string): ColumnType {
  const m: Record<string, ColumnType> = {
    'character varying':             'VARCHAR',
    'text':                          'TEXT',
    'integer':                       'INTEGER',
    'bigint':                        'BIGINT',
    'boolean':                       'BOOLEAN',
    'timestamp without time zone':   'TIMESTAMP',
    'timestamp with time zone':      'TIMESTAMP',
    'date':                          'DATE',
    'uuid':                          'UUID',
    'jsonb':                         'JSONB',
    'json':                          'JSON',
    'numeric':                       'DECIMAL',
    'double precision':              'FLOAT',
    'real':                          'FLOAT',
    'smallint':                      'SMALLINT',
  }
  return m[t] ?? 'TEXT'
}

// ─── MySQL ─────────────────────────────────────────────────────────────────────

async function mysqlTest(conn: IConnection): Promise<void> {
  const mysql = await import('mysql2/promise')
  const c = await mysql.createConnection(mysqlConfig(conn))
  await c.end()
}

async function mysqlReverseEngineer(conn: IConnection): Promise<SchemaDefinition> {
  const mysql = await import('mysql2/promise')
  const c = await mysql.createConnection(mysqlConfig(conn))
  try {
    const [tablesRaw] = await c.execute<RowDataPacket[]>(
      `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'`,
      [conn.database]
    )
    const tables: TableDefinition[] = []
    for (const row of tablesRaw) {
      const tableName = row.TABLE_NAME as string
      const [colsRaw] = await c.execute<RowDataPacket[]>(
        `SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_KEY
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
         ORDER BY ORDINAL_POSITION`,
        [conn.database, tableName]
      )
      tables.push({
        id:      uuid(),
        name:    tableName,
        columns: colsRaw.map(col => ({
          id:           uuid(),
          name:         col.COLUMN_NAME as string,
          type:         mapMysqlType(col.DATA_TYPE as string),
          nullable:     col.IS_NULLABLE === 'YES',
          primaryKey:   col.COLUMN_KEY === 'PRI',
          unique:       col.COLUMN_KEY === 'UNI',
          defaultValue: (col.COLUMN_DEFAULT as string | null) ?? undefined,
        } satisfies ColumnDefinition)),
      })
    }
    const now = new Date().toISOString()
    return { id: uuid(), name: conn.database, target: 'mysql', tables, createdAt: now, updatedAt: now }
  } finally {
    await c.end()
  }
}

async function mysqlExecute(conn: IConnection, sql: string): Promise<QueryResult> {
  const mysql = await import('mysql2/promise')
  const c = await mysql.createConnection(mysqlConfig(conn))
  const start = Date.now()
  try {
    const [rows, fields] = await c.execute(sql)
    const rowArray    = Array.isArray(rows)   ? rows   as Record<string, unknown>[] : []
    const fieldArray  = Array.isArray(fields) ? (fields as FieldPacket[]).map(f => f.name) : []
    return { columns: fieldArray, rows: rowArray, rowCount: rowArray.length, executionMs: Date.now() - start }
  } catch (err: unknown) {
    return { columns: [], rows: [], rowCount: 0, executionMs: Date.now() - start, error: (err as Error).message }
  } finally {
    await c.end()
  }
}

function mysqlConfig(conn: IConnection) {
  return { host: conn.host, port: conn.port ?? 3306, database: conn.database, user: conn.username, password: conn.password }
}

function mapMysqlType(t: string): ColumnType {
  const m: Record<string, ColumnType> = {
    varchar: 'VARCHAR', text: 'TEXT', int: 'INTEGER', bigint: 'BIGINT',
    tinyint: 'BOOLEAN', boolean: 'BOOLEAN', datetime: 'TIMESTAMP',
    timestamp: 'TIMESTAMP', date: 'DATE', decimal: 'DECIMAL',
    float: 'FLOAT', double: 'FLOAT', smallint: 'SMALLINT', json: 'JSON',
  }
  return m[t] ?? 'TEXT'
}

// ─── SQLite ────────────────────────────────────────────────────────────────────

async function sqliteTest(conn: IConnection): Promise<void> {
  const Database = (await import('better-sqlite3')).default
  const db = new Database(conn.filePath ?? conn.database)
  db.close()
}

async function sqliteReverseEngineer(conn: IConnection): Promise<SchemaDefinition> {
  const Database = (await import('better-sqlite3')).default
  const db = new Database(conn.filePath ?? conn.database, { readonly: true })
  try {
    const tables = db
      .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`)
      .all() as { name: string }[]

    const tableDefs: TableDefinition[] = tables.map(t => {
      const cols = db.prepare(`PRAGMA table_info(${t.name})`).all() as {
        name: string; type: string; notnull: number; dflt_value: string | null; pk: number
      }[]
      return {
        id:      uuid(),
        name:    t.name,
        columns: cols.map(c => ({
          id:           uuid(),
          name:         c.name,
          type:         mapSqliteType(c.type),
          nullable:     c.notnull === 0,
          primaryKey:   c.pk > 0,
          unique:       false,
          defaultValue: c.dflt_value ?? undefined,
        } satisfies ColumnDefinition)),
      }
    })
    const now = new Date().toISOString()
    return { id: uuid(), name: conn.database, target: 'sqlite', tables: tableDefs, createdAt: now, updatedAt: now }
  } finally {
    db.close()
  }
}

async function sqliteExecute(conn: IConnection, sql: string): Promise<QueryResult> {
  const Database = (await import('better-sqlite3')).default
  const db = new Database(conn.filePath ?? conn.database)
  const start = Date.now()
  try {
    const stmt     = db.prepare(sql)
    const lowerSql = sql.trim().toLowerCase()
    if (lowerSql.startsWith('select') || lowerSql.startsWith('pragma')) {
      const rows    = stmt.all() as Record<string, unknown>[]
      const columns = rows.length > 0 ? Object.keys(rows[0]) : []
      return { columns, rows, rowCount: rows.length, executionMs: Date.now() - start }
    } else {
      const info = stmt.run()
      return { columns: [], rows: [], rowCount: info.changes, executionMs: Date.now() - start }
    }
  } catch (err: unknown) {
    return { columns: [], rows: [], rowCount: 0, executionMs: Date.now() - start, error: (err as Error).message }
  } finally {
    db.close()
  }
}

function mapSqliteType(t: string): ColumnType {
  const u = t.toUpperCase()
  if (u.includes('INT'))                                  return 'INTEGER'
  if (u.includes('CHAR') || u.includes('TEXT') || u.includes('CLOB')) return 'TEXT'
  if (u.includes('REAL') || u.includes('FLOA') || u.includes('DOUB')) return 'FLOAT'
  if (u.includes('BOOL'))                                return 'BOOLEAN'
  return 'TEXT'
}

// ─── MongoDB ──────────────────────────────────────────────────────────────────

async function mongoTest(conn: IConnection): Promise<void> {
  const { MongoClient } = await import('mongodb')
  const client = new MongoClient(mongoUri(conn))
  await client.connect()
  await client.db(conn.database).command({ ping: 1 })
  await client.close()
}

async function mongoReverseEngineer(conn: IConnection): Promise<SchemaDefinition> {
  const { MongoClient } = await import('mongodb')
  const client = new MongoClient(mongoUri(conn))
  await client.connect()
  try {
    const db          = client.db(conn.database)
    const collections = await db.listCollections().toArray()
    const tables: TableDefinition[] = []
    for (const col of collections) {
      const sample  = await db.collection(col.name).findOne()
      const columns: ColumnDefinition[] = sample
        ? Object.entries(sample).map(([k, v]) => ({
            id:         uuid(),
            name:       k,
            type:       inferMongoType(v),
            nullable:   true,
            primaryKey: k === '_id',
            unique:     k === '_id',
          } satisfies ColumnDefinition))
        : [{ id: uuid(), name: '_id', type: 'ObjectId' as ColumnType, nullable: false, primaryKey: true, unique: true }]
      tables.push({ id: uuid(), name: col.name, columns })
    }
    const now = new Date().toISOString()
    return { id: uuid(), name: conn.database, target: 'mongodb', tables, createdAt: now, updatedAt: now }
  } finally {
    await client.close()
  }
}

async function mongoExecute(conn: IConnection, query: string): Promise<QueryResult> {
  const { MongoClient } = await import('mongodb')
  const client = new MongoClient(mongoUri(conn))
  const start  = Date.now()
  try {
    await client.connect()
    const db     = client.db(conn.database)
    const parsed = JSON.parse(query) as { collection: string; operation: string; args?: unknown[] }
    const coll   = db.collection(parsed.collection)
    const args   = parsed.args ?? []
    let rows: Record<string, unknown>[] = []

    if (parsed.operation === 'find') {
      rows = await coll.find(args[0] as object ?? {}).limit(100).toArray() as Record<string, unknown>[]
    } else if (parsed.operation === 'aggregate') {
      rows = await coll.aggregate(args[0] as object[]).toArray() as Record<string, unknown>[]
    }

    const columns = rows.length > 0 ? Object.keys(rows[0]) : []
    return { columns, rows, rowCount: rows.length, executionMs: Date.now() - start }
  } catch (err: unknown) {
    return { columns: [], rows: [], rowCount: 0, executionMs: Date.now() - start, error: (err as Error).message }
  } finally {
    await client.close()
  }
}

function mongoUri(conn: IConnection): string {
  if (conn.host?.startsWith('mongodb')) return conn.host
  const auth = conn.username && conn.password
    ? `${encodeURIComponent(conn.username)}:${encodeURIComponent(conn.password)}@`
    : ''
  return `mongodb://${auth}${conn.host ?? 'localhost'}:${conn.port ?? 27017}/${conn.database}`
}

function inferMongoType(v: unknown): ColumnType {
  if (typeof v === 'string')  return 'String'
  if (typeof v === 'number')  return 'Number'
  if (typeof v === 'boolean') return 'Boolean'
  if (v instanceof Date)      return 'Date'
  if (Array.isArray(v))       return 'Array'
  if (v && typeof v === 'object') return 'Object'
  return 'String'
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function testConnection(conn: IConnection): Promise<void> {
  switch (conn.driver) {
    case 'postgresql': return pgTest(conn)
    case 'mysql':      return mysqlTest(conn)
    case 'sqlite':     return sqliteTest(conn)
    case 'mongodb':    return mongoTest(conn)
    default: throw new Error(`Unsupported driver: ${(conn as IConnection).driver}`)
  }
}

export async function reverseEngineerSchema(conn: IConnection): Promise<SchemaDefinition> {
  switch (conn.driver) {
    case 'postgresql': return pgReverseEngineer(conn)
    case 'mysql':      return mysqlReverseEngineer(conn)
    case 'sqlite':     return sqliteReverseEngineer(conn)
    case 'mongodb':    return mongoReverseEngineer(conn)
    default: throw new Error(`Unsupported driver: ${(conn as IConnection).driver}`)
  }
}

export async function executeQuery(conn: IConnection, query: string): Promise<QueryResult> {
  switch (conn.driver) {
    case 'postgresql': return pgExecute(conn, query)
    case 'mysql':      return mysqlExecute(conn, query)
    case 'sqlite':     return sqliteExecute(conn, query)
    case 'mongodb':    return mongoExecute(conn, query)
    default: throw new Error(`Unsupported driver: ${(conn as IConnection).driver}`)
  }
}
