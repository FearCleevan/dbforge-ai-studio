# Phase 6 — Live Database Connectors & Real Query Execution

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to connect real PostgreSQL, MySQL, SQLite, and MongoDB databases; reverse-engineer their schemas; and run live queries against actual data. Also add a real HTTP proxy so the API Checker makes real external requests through the backend.

**Architecture:** Backend gains a `dbConnector.service.ts` using native DB drivers (pg, mysql2, better-sqlite3, mongodb). A new `Connection` Mongoose model stores saved connection configs per user. New REST endpoints handle CRUD for connections, live query execution, schema reverse engineering, and HTTP proxying. Frontend adds a 5th sidebar tab (`Connections`) with a UI to add/test/save connections; the Query Editor gains a connection selector; the Schema Designer gains an "Import from Database" button.

**Tech Stack:** pg, mysql2, better-sqlite3, mongodb (native), axios (backend proxy), zod (validation), React + Tailwind (frontend UI)

---

## File Map

### Backend — New Files
- `backend/src/models/Connection.ts` — Mongoose model for saved DB connections
- `backend/src/services/dbConnector.service.ts` — testConnection, reverseEngineerSchema, executeQuery per driver
- `backend/src/controllers/connection.controller.ts` — CRUD + test + reverse-engineer handlers
- `backend/src/routes/connection.routes.ts` — mounts at `/api/connections`
- `backend/src/controllers/api.controller.ts` — real HTTP proxy handler
- `backend/src/routes/api.routes.ts` — mounts at `/api/request`

### Backend — Modified Files
- `backend/src/controllers/query.controller.ts` — add `execute` handler (live query via connector)
- `backend/src/routes/query.routes.ts` — add `POST /execute` route
- `backend/src/app.ts` — register new connection + api routes

### Frontend — New Files
- `frontend/src/types/connection.ts` — `DbConnection`, `ConnectionConfig`, `TestResult` types
- `frontend/src/lib/api/connections.ts` — Axios API client for connections endpoints
- `frontend/src/features/connections/DatabaseConnectionPanel.tsx` — full connections UI

### Frontend — Modified Files
- `frontend/src/context/UIContext.tsx` — extend `ActiveTab` union to include `'connections'`
- `frontend/src/components/layout/Sidebar.tsx` — add 5th nav item (Plug icon)
- `frontend/src/pages/StudioPage.tsx` — render `DatabaseConnectionPanel` for `'connections'` tab
- `frontend/src/features/query-editor/QueryToolbar.tsx` — add connection selector dropdown
- `frontend/src/features/query-editor/QueryEditor.tsx` — pass active connection to toolbar + run handler
- `frontend/src/features/schema-designer/SchemaDesigner.tsx` — add "Import from DB" button + handler
- `frontend/src/lib/api/schema.ts` — add `importFromDb` API call

---

## Task 1 — Install Backend DB Driver Packages

**Files:**
- Modify: `backend/package.json` (via npm install)

- [ ] **Step 1: Install runtime drivers + axios**

```bash
cd "E:\Projects Version 2\schema-generator\dbforge-ai-studio\backend"
npm install pg mysql2 better-sqlite3 mongodb axios
```

Expected: packages added to `node_modules`, `package-lock.json` updated.

- [ ] **Step 2: Install type definitions**

```bash
npm install -D @types/pg @types/better-sqlite3
```

Expected: types installed (mysql2 and mongodb ship their own types).

- [ ] **Step 3: Verify TypeScript can see the types**

```bash
npx tsc --noEmit
```

Expected: 0 errors (may warn about unrelated existing issues — that's acceptable).

---

## Task 2 — Connection Mongoose Model

**Files:**
- Create: `backend/src/models/Connection.ts`

- [ ] **Step 1: Create the model**

```typescript
// backend/src/models/Connection.ts
import { Schema, model, Document, Types } from 'mongoose'

export type DbDriver = 'postgresql' | 'mysql' | 'sqlite' | 'mongodb'

export interface IConnection extends Document {
  userId:   Types.ObjectId
  name:     string
  driver:   DbDriver
  host?:    string
  port?:    number
  database: string
  username?: string
  password?: string
  ssl:      boolean
  filePath?: string   // SQLite only
  status:   'connected' | 'error' | 'unknown'
  createdAt: Date
  updatedAt: Date
}

const ConnectionSchema = new Schema<IConnection>({
  userId:   { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name:     { type: String, required: true, trim: true },
  driver:   { type: String, enum: ['postgresql','mysql','sqlite','mongodb'], required: true },
  host:     { type: String },
  port:     { type: Number },
  database: { type: String, required: true },
  username: { type: String },
  password: { type: String, select: false },
  ssl:      { type: Boolean, default: false },
  filePath: { type: String },
  status:   { type: String, enum: ['connected','error','unknown'], default: 'unknown' },
}, { timestamps: true })

export const Connection = model<IConnection>('Connection', ConnectionSchema)
```

- [ ] **Step 2: Verify compilation**

```bash
cd "E:\Projects Version 2\schema-generator\dbforge-ai-studio\backend"
npx tsc --noEmit
```

Expected: 0 new errors.

---

## Task 3 — DB Connector Service

**Files:**
- Create: `backend/src/services/dbConnector.service.ts`

This service wraps all four drivers behind a unified interface. SQLite uses a synchronous driver; the rest are async.

- [ ] **Step 1: Create the service**

```typescript
// backend/src/services/dbConnector.service.ts
import { IConnection } from '../models/Connection'
import { SchemaDefinition, TableDefinition, ColumnDefinition } from '../types/schema'
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
        column_name: string; data_type: string; is_nullable: string; column_default: string | null
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
  return { host: conn.host, port: conn.port ?? 5432, database: conn.database, user: conn.username, password: conn.password, ssl: conn.ssl }
}

function mapPgType(t: string): ColumnDefinition['type'] {
  const m: Record<string, ColumnDefinition['type']> = {
    'character varying': 'VARCHAR', 'text': 'TEXT', 'integer': 'INTEGER', 'bigint': 'BIGINT',
    'boolean': 'BOOLEAN', 'timestamp without time zone': 'TIMESTAMP', 'timestamp with time zone': 'TIMESTAMP',
    'date': 'DATE', 'uuid': 'UUID', 'jsonb': 'JSONB', 'json': 'JSON', 'numeric': 'DECIMAL',
    'double precision': 'FLOAT', 'real': 'FLOAT', 'smallint': 'SMALLINT',
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
    const [tablesRaw] = await c.execute<mysql.RowDataPacket[]>(
      `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'`,
      [conn.database]
    )
    const tables: TableDefinition[] = []
    for (const row of tablesRaw) {
      const tableName = row.TABLE_NAME as string
      const [colsRaw] = await c.execute<mysql.RowDataPacket[]>(
        `SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_KEY FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION`,
        [conn.database, tableName]
      )
      tables.push({
        id:      uuid(),
        name:    tableName,
        columns: colsRaw.map((col: mysql.RowDataPacket) => ({
          id:           uuid(),
          name:         col.COLUMN_NAME as string,
          type:         mapMysqlType(col.DATA_TYPE as string),
          nullable:     col.IS_NULLABLE === 'YES',
          primaryKey:   col.COLUMN_KEY === 'PRI',
          unique:       col.COLUMN_KEY === 'UNI',
          defaultValue: col.COLUMN_DEFAULT ?? undefined,
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
    const rowArray = Array.isArray(rows) ? rows as Record<string, unknown>[] : []
    const fieldArray = Array.isArray(fields) ? (fields as mysql.FieldPacket[]).map(f => f.name) : []
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

function mapMysqlType(t: string): ColumnDefinition['type'] {
  const m: Record<string, ColumnDefinition['type']> = {
    varchar: 'VARCHAR', text: 'TEXT', int: 'INTEGER', bigint: 'BIGINT', tinyint: 'BOOLEAN',
    boolean: 'BOOLEAN', datetime: 'TIMESTAMP', timestamp: 'TIMESTAMP', date: 'DATE',
    decimal: 'DECIMAL', float: 'FLOAT', double: 'FLOAT', smallint: 'SMALLINT', json: 'JSON',
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
    const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`).all() as { name: string }[]
    const tableDefs: TableDefinition[] = tables.map(t => {
      const cols = db.prepare(`PRAGMA table_info(${t.name})`).all() as { name: string; type: string; notnull: number; dflt_value: string | null; pk: number }[]
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
    const stmt = db.prepare(sql)
    const lowerSql = sql.trim().toLowerCase()
    if (lowerSql.startsWith('select') || lowerSql.startsWith('pragma')) {
      const rows = stmt.all() as Record<string, unknown>[]
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

function mapSqliteType(t: string): ColumnDefinition['type'] {
  const u = t.toUpperCase()
  if (u.includes('INT')) return 'INTEGER'
  if (u.includes('CHAR') || u.includes('TEXT') || u.includes('CLOB')) return 'TEXT'
  if (u.includes('REAL') || u.includes('FLOA') || u.includes('DOUB')) return 'FLOAT'
  if (u.includes('BLOB') || u === '') return 'TEXT'
  if (u.includes('BOOL')) return 'BOOLEAN'
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
    const db = client.db(conn.database)
    const collections = await db.listCollections().toArray()
    const tables: TableDefinition[] = []
    for (const col of collections) {
      const sample = await db.collection(col.name).findOne()
      const columns: ColumnDefinition[] = sample
        ? Object.entries(sample).map(([k, v]) => ({
            id:        uuid(),
            name:      k,
            type:      inferMongoType(v),
            nullable:  true,
            primaryKey: k === '_id',
            unique:    k === '_id',
          } satisfies ColumnDefinition))
        : [{ id: uuid(), name: '_id', type: 'ObjectId', nullable: false, primaryKey: true, unique: true }]
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
  const start = Date.now()
  try {
    await client.connect()
    const db = client.db(conn.database)
    // Expect JSON: { collection, operation, args }
    const parsed = JSON.parse(query) as { collection: string; operation: string; args?: unknown[] }
    const coll = db.collection(parsed.collection)
    const args = (parsed.args ?? []) as Parameters<typeof coll.find>
    let rows: Record<string, unknown>[] = []
    if (parsed.operation === 'find') {
      rows = await coll.find(...args).limit(100).toArray() as Record<string, unknown>[]
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
  const auth = conn.username && conn.password ? `${conn.username}:${encodeURIComponent(conn.password)}@` : ''
  return `mongodb://${auth}${conn.host ?? 'localhost'}:${conn.port ?? 27017}/${conn.database}`
}

function inferMongoType(v: unknown): ColumnDefinition['type'] {
  if (typeof v === 'string') return 'String'
  if (typeof v === 'number') return 'Number'
  if (typeof v === 'boolean') return 'Boolean'
  if (v instanceof Date) return 'Date'
  if (Array.isArray(v)) return 'Array'
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
    default: throw new Error(`Unsupported driver: ${conn.driver}`)
  }
}

export async function reverseEngineerSchema(conn: IConnection): Promise<SchemaDefinition> {
  switch (conn.driver) {
    case 'postgresql': return pgReverseEngineer(conn)
    case 'mysql':      return mysqlReverseEngineer(conn)
    case 'sqlite':     return sqliteReverseEngineer(conn)
    case 'mongodb':    return mongoReverseEngineer(conn)
    default: throw new Error(`Unsupported driver: ${conn.driver}`)
  }
}

export async function executeQuery(conn: IConnection, query: string): Promise<QueryResult> {
  switch (conn.driver) {
    case 'postgresql': return pgExecute(conn, query)
    case 'mysql':      return mysqlExecute(conn, query)
    case 'sqlite':     return sqliteExecute(conn, query)
    case 'mongodb':    return mongoExecute(conn, query)
    default: throw new Error(`Unsupported driver: ${conn.driver}`)
  }
}
```

- [ ] **Step 2: Add the shared schema types to backend (the connector needs `SchemaDefinition` etc.)**

Create `backend/src/types/schema.ts` (mirrors frontend types — only what the service needs):

```typescript
// backend/src/types/schema.ts
export type DatabaseTarget = 'postgresql' | 'mysql' | 'sqlite' | 'mongodb' | 'firestore'

export type ColumnType =
  | 'VARCHAR' | 'TEXT' | 'CHAR' | 'INTEGER' | 'BIGINT' | 'SMALLINT' | 'DECIMAL'
  | 'FLOAT' | 'DOUBLE' | 'BOOLEAN' | 'TIMESTAMP' | 'DATE' | 'TIME' | 'UUID'
  | 'SERIAL' | 'JSON' | 'JSONB' | 'BLOB' | 'BYTEA'
  | 'String' | 'Number' | 'Boolean' | 'Date' | 'ObjectId' | 'Array' | 'Object'

export interface ColumnDefinition {
  id:           string
  name:         string
  type:         ColumnType
  nullable:     boolean
  primaryKey:   boolean
  unique:       boolean
  defaultValue?: string
  references?:  { table: string; column: string }
}

export interface TableDefinition {
  id:       string
  name:     string
  columns:  ColumnDefinition[]
}

export interface SchemaDefinition {
  id:        string
  name:      string
  target:    DatabaseTarget
  tables:    TableDefinition[]
  createdAt: string
  updatedAt: string
}
```

Create `backend/src/types/index.ts`:

```typescript
// backend/src/types/index.ts
export * from './schema'
```

- [ ] **Step 3: Verify compilation**

```bash
cd "E:\Projects Version 2\schema-generator\dbforge-ai-studio\backend"
npx tsc --noEmit
```

Expected: 0 new errors.

---

## Task 4 — Connection Controller

**Files:**
- Create: `backend/src/controllers/connection.controller.ts`

- [ ] **Step 1: Create the controller**

```typescript
// backend/src/controllers/connection.controller.ts
import { Response } from 'express'
import { z } from 'zod'
import { AuthRequest } from '../middleware/auth'
import { Connection } from '../models/Connection'
import { testConnection, reverseEngineerSchema } from '../services/dbConnector.service'

const CreateSchema = z.object({
  name:     z.string().min(1).max(100),
  driver:   z.enum(['postgresql','mysql','sqlite','mongodb']),
  host:     z.string().optional(),
  port:     z.number().int().positive().optional(),
  database: z.string().min(1),
  username: z.string().optional(),
  password: z.string().optional(),
  ssl:      z.boolean().default(false),
  filePath: z.string().optional(),
})

export async function listConnections(req: AuthRequest, res: Response): Promise<void> {
  const connections = await Connection.find({ userId: req.userId }).select('-password').sort({ createdAt: -1 })
  res.json({ connections })
}

export async function createConnection(req: AuthRequest, res: Response): Promise<void> {
  const parsed = CreateSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation Error', details: parsed.error.flatten() })
    return
  }
  const conn = await Connection.create({ ...parsed.data, userId: req.userId, status: 'unknown' })
  res.status(201).json({ connection: { ...conn.toObject(), password: undefined } })
}

export async function deleteConnection(req: AuthRequest, res: Response): Promise<void> {
  const conn = await Connection.findOne({ _id: req.params.id, userId: req.userId })
  if (!conn) { res.status(404).json({ error: 'Not Found' }); return }
  await conn.deleteOne()
  res.json({ message: 'Connection deleted' })
}

export async function testConnectionEndpoint(req: AuthRequest, res: Response): Promise<void> {
  const parsed = CreateSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation Error', details: parsed.error.flatten() })
    return
  }
  try {
    // Build a temporary IConnection-like object for testing
    const tempConn = new Connection({ ...parsed.data, userId: req.userId })
    await testConnection(tempConn)
    res.json({ success: true, message: 'Connection successful' })
  } catch (err: unknown) {
    res.status(422).json({ success: false, message: (err as Error).message })
  }
}

export async function reverseEngineerEndpoint(req: AuthRequest, res: Response): Promise<void> {
  const conn = await Connection.findOne({ _id: req.params.id, userId: req.userId }).select('+password')
  if (!conn) { res.status(404).json({ error: 'Not Found' }); return }
  try {
    const schema = await reverseEngineerSchema(conn)
    res.json({ schema })
  } catch (err: unknown) {
    res.status(422).json({ error: 'Reverse engineer failed', message: (err as Error).message })
  }
}
```

---

## Task 5 — Connection Routes

**Files:**
- Create: `backend/src/routes/connection.routes.ts`
- Modify: `backend/src/app.ts`

- [ ] **Step 1: Create routes file**

```typescript
// backend/src/routes/connection.routes.ts
import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import {
  listConnections,
  createConnection,
  deleteConnection,
  testConnectionEndpoint,
  reverseEngineerEndpoint,
} from '../controllers/connection.controller'

const router = Router()

router.use(requireAuth)

router.get('/',               listConnections)
router.post('/',              createConnection)
router.delete('/:id',         deleteConnection)
router.post('/test',          testConnectionEndpoint)
router.post('/:id/reverse',   reverseEngineerEndpoint)

export default router
```

- [ ] **Step 2: Register routes in app.ts**

In `backend/src/app.ts`, add this import after the existing route imports:

```typescript
import connectionRoutes from './routes/connection.routes'
```

And add this line in the Routes section after the existing route registrations:

```typescript
app.use('/api/connections', connectionRoutes)
```

---

## Task 6 — Live Query Execute Endpoint

**Files:**
- Modify: `backend/src/controllers/query.controller.ts`
- Modify: `backend/src/routes/query.routes.ts`

- [ ] **Step 1: Add `execute` handler to query.controller.ts**

Add these imports at the top of the file:

```typescript
import { Connection } from '../models/Connection'
import { executeQuery } from '../services/dbConnector.service'
```

Add this Zod schema and handler at the end of the file:

```typescript
const ExecuteQuerySchema = z.object({
  connectionId: z.string().min(1),
  sql:          z.string().min(1),
})

export async function execute(req: AuthRequest, res: Response): Promise<void> {
  const parsed = ExecuteQuerySchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation Error', details: parsed.error.flatten() })
    return
  }

  const conn = await Connection.findOne({ _id: parsed.data.connectionId, userId: req.userId }).select('+password')
  if (!conn) {
    res.status(404).json({ error: 'Connection not found' })
    return
  }

  const result = await executeQuery(conn, parsed.data.sql)
  res.json({ result })
}
```

- [ ] **Step 2: Add the route to query.routes.ts**

Read the current `backend/src/routes/query.routes.ts` and add `execute` to it:

```typescript
// backend/src/routes/query.routes.ts
import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { generate, optimize, translate, execute } from '../controllers/query.controller'

const router = Router()

router.use(requireAuth)

router.post('/generate',  generate)
router.post('/optimize',  optimize)
router.post('/translate', translate)
router.post('/execute',   execute)

export default router
```

- [ ] **Step 3: Verify compilation**

```bash
cd "E:\Projects Version 2\schema-generator\dbforge-ai-studio\backend"
npx tsc --noEmit
```

Expected: 0 new errors.

---

## Task 7 — API Proxy Endpoint

**Files:**
- Create: `backend/src/controllers/api.controller.ts`
- Create: `backend/src/routes/api.routes.ts`
- Modify: `backend/src/app.ts`

- [ ] **Step 1: Create the proxy controller**

```typescript
// backend/src/controllers/api.controller.ts
import { Response } from 'express'
import { z } from 'zod'
import axios, { AxiosRequestConfig } from 'axios'
import { AuthRequest } from '../middleware/auth'

const KeyValuePair = z.object({ key: z.string(), value: z.string(), enabled: z.boolean() })

const ProxyRequestSchema = z.object({
  method:    z.enum(['GET','POST','PUT','PATCH','DELETE','HEAD','OPTIONS']),
  url:       z.string().url(),
  headers:   z.array(KeyValuePair).default([]),
  params:    z.array(KeyValuePair).default([]),
  body:      z.string().optional(),
  bodyType:  z.enum(['json','form-data','raw','none']).default('none'),
  authType:  z.enum(['none','bearer','basic','api-key']).default('none'),
  authValue: z.string().optional(),
})

export async function proxyRequest(req: AuthRequest, res: Response): Promise<void> {
  const parsed = ProxyRequestSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation Error', details: parsed.error.flatten() })
    return
  }

  const { method, url, headers, params, body, bodyType, authType, authValue } = parsed.data

  const headerMap: Record<string, string> = {}
  headers.filter(h => h.enabled && h.key).forEach(h => { headerMap[h.key] = h.value })

  // Auth
  if (authType === 'bearer' && authValue) {
    headerMap['Authorization'] = `Bearer ${authValue}`
  } else if (authType === 'basic' && authValue) {
    headerMap['Authorization'] = `Basic ${Buffer.from(authValue).toString('base64')}`
  } else if (authType === 'api-key' && authValue) {
    headerMap['X-API-Key'] = authValue
  }

  const queryParams: Record<string, string> = {}
  params.filter(p => p.enabled && p.key).forEach(p => { queryParams[p.key] = p.value })

  let requestBody: unknown = undefined
  if (bodyType === 'json' && body) {
    try { requestBody = JSON.parse(body) } catch { requestBody = body }
    headerMap['Content-Type'] = 'application/json'
  } else if (bodyType === 'raw' && body) {
    requestBody = body
  }

  const config: AxiosRequestConfig = {
    method,
    url,
    headers:  headerMap,
    params:   Object.keys(queryParams).length > 0 ? queryParams : undefined,
    data:     requestBody,
    timeout:  15_000,
    validateStatus: () => true, // Don't throw on 4xx/5xx
  }

  const start = Date.now()
  try {
    const response = await axios(config)
    const timeMs = Date.now() - start
    const responseBody = response.data
    const bodyStr = typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody)
    res.json({
      status:     response.status,
      statusText: response.statusText,
      headers:    response.headers as Record<string, string>,
      body:       responseBody,
      timeMs,
      size:       Buffer.byteLength(bodyStr, 'utf8'),
    })
  } catch (err: unknown) {
    const timeMs = Date.now() - start
    res.status(422).json({ error: 'Request failed', message: (err as Error).message, timeMs })
  }
}
```

- [ ] **Step 2: Create the routes file**

```typescript
// backend/src/routes/api.routes.ts
import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { proxyRequest } from '../controllers/api.controller'

const router = Router()

router.use(requireAuth)
router.post('/send', proxyRequest)

export default router
```

- [ ] **Step 3: Register in app.ts**

Add after the connection routes import:

```typescript
import apiRoutes from './routes/api.routes'
```

Add in the Routes section:

```typescript
app.use('/api/request', apiRoutes)
```

- [ ] **Step 4: Verify full backend compiles**

```bash
cd "E:\Projects Version 2\schema-generator\dbforge-ai-studio\backend"
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 5: Do a quick smoke test — start the dev server**

```bash
npm run dev
```

Expected: server starts on port 3001 with no crash, `GET /health` returns `{ status: 'ok' }`.

---

## Task 8 — Frontend Connection Types + API Client

**Files:**
- Create: `frontend/src/types/connection.ts`
- Create: `frontend/src/lib/api/connections.ts`

- [ ] **Step 1: Create connection types**

```typescript
// frontend/src/types/connection.ts
export type DbDriver = 'postgresql' | 'mysql' | 'sqlite' | 'mongodb'

export interface DbConnection {
  _id:      string
  name:     string
  driver:   DbDriver
  host?:    string
  port?:    number
  database: string
  username?: string
  ssl:      boolean
  filePath?: string
  status:   'connected' | 'error' | 'unknown'
  createdAt: string
  updatedAt: string
}

export interface ConnectionConfig {
  name:     string
  driver:   DbDriver
  host?:    string
  port?:    number
  database: string
  username?: string
  password?: string
  ssl:      boolean
  filePath?: string
}

export interface TestResult {
  success: boolean
  message: string
}
```

- [ ] **Step 2: Add connection type to frontend types/index.ts**

Open `frontend/src/types/index.ts` and add this export:

```typescript
export * from './connection'
```

- [ ] **Step 3: Create the API client**

```typescript
// frontend/src/lib/api/connections.ts
import { apiClient } from './client'
import { DbConnection, ConnectionConfig, TestResult } from '@/types/connection'

export const connectionsAPI = {
  list(): Promise<DbConnection[]> {
    return apiClient.get<{ connections: DbConnection[] }>('/api/connections')
      .then(r => r.data.connections)
  },

  create(config: ConnectionConfig): Promise<DbConnection> {
    return apiClient.post<{ connection: DbConnection }>('/api/connections', config)
      .then(r => r.data.connection)
  },

  delete(id: string): Promise<void> {
    return apiClient.delete(`/api/connections/${id}`).then(() => undefined)
  },

  test(config: ConnectionConfig): Promise<TestResult> {
    return apiClient.post<TestResult>('/api/connections/test', config)
      .then(r => r.data)
      .catch(err => ({ success: false, message: err.response?.data?.message ?? 'Connection failed' }))
  },

  reverseEngineer(id: string): Promise<import('@/types').SchemaDefinition> {
    return apiClient.post<{ schema: import('@/types').SchemaDefinition }>(`/api/connections/${id}/reverse`)
      .then(r => r.data.schema)
  },
}
```

---

## Task 9 — Extend UIContext for 'connections' Tab

**Files:**
- Modify: `frontend/src/context/UIContext.tsx`

`ActiveTab` is a union type used in UIContext, Sidebar, and StudioPage. We extend it here and the other files pick it up automatically.

- [ ] **Step 1: Extend the ActiveTab union**

In `frontend/src/context/UIContext.tsx`, change line 3:

```typescript
// Before:
type ActiveTab = 'schema-designer' | 'visualizer' | 'query-editor' | 'api-checker'

// After:
export type ActiveTab = 'schema-designer' | 'visualizer' | 'query-editor' | 'api-checker' | 'connections'
```

Note: also export the type so Sidebar can import it directly if needed.

---

## Task 10 — DatabaseConnectionPanel Component

**Files:**
- Create: `frontend/src/features/connections/DatabaseConnectionPanel.tsx`

This is the full UI for managing DB connections. It has three states: list view, add-new form, and testing overlay.

- [ ] **Step 1: Create the component**

```typescript
// frontend/src/features/connections/DatabaseConnectionPanel.tsx
import { useState, useEffect, useCallback } from 'react'
import { Plus, Plug, Trash2, RefreshCw, CheckCircle, XCircle, Loader, Import, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { connectionsAPI } from '@/lib/api/connections'
import { DbConnection, ConnectionConfig, DbDriver } from '@/types/connection'
import { useToast } from '@/context/ToastContext'
import { useProject } from '@/context/ProjectContext'
import { useUI } from '@/context/UIContext'
import { isAuthenticated } from '@/lib/api/auth'
import { EmptyState } from '@/components/shared/EmptyState'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

const DRIVER_META: Record<DbDriver, { label: string; icon: string; defaultPort: number | null; color: string }> = {
  postgresql: { label: 'PostgreSQL', icon: '🐘', defaultPort: 5432,  color: '#336791' },
  mysql:      { label: 'MySQL',      icon: '🐬', defaultPort: 3306,  color: '#4479A1' },
  sqlite:     { label: 'SQLite',     icon: '📦', defaultPort: null,  color: '#003B57' },
  mongodb:    { label: 'MongoDB',    icon: '🍃', defaultPort: 27017, color: '#47A248' },
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

  const load = useCallback(async () => {
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

  useEffect(() => { load() }, [load])

  const handleDriverChange = (driver: DbDriver) => {
    const meta = DRIVER_META[driver]
    setForm(prev => ({ ...prev, driver, port: meta.defaultPort ?? prev.port, host: driver === 'sqlite' ? '' : (prev.host || 'localhost') }))
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
      addToast(`Imported ${schema.tables.length} tables, ${totalCols} columns from ${conn.name}`, 'success')
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
              <span className="px-1.5 py-0.5 rounded-full bg-cyan/10 text-cyan text-xs font-mono">{connections.length}</span>
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
            <div className="flex justify-center pt-8"><LoadingSpinner size="md" color="cyan" /></div>
          )}
          {!loading && connections.length === 0 && (
            <div className="text-center py-8 px-4">
              <Plug size={24} className="text-text-tertiary mx-auto mb-2" />
              <p className="text-sm text-text-secondary">No connections yet</p>
              <p className="text-xs text-text-tertiary mt-1">Add a connection to get started</p>
            </div>
          )}
          {connections.map(conn => {
            const meta = DRIVER_META[conn.driver]
            return (
              <div
                key={conn._id}
                className="group flex items-center gap-2 p-2.5 rounded-lg bg-bg-elevated border border-white/5 hover:border-white/10 transition-all"
              >
                <span className="text-base flex-shrink-0">{meta.icon}</span>
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
                    {importing === conn._id ? <Loader size={12} className="animate-spin" /> : <Import size={12} />}
                  </button>
                  <button
                    onClick={() => handleDelete(conn._id, conn.name)}
                    disabled={!!deleting}
                    title="Delete connection"
                    className="p-1 rounded text-text-tertiary hover:text-error transition-colors"
                  >
                    {deleting === conn._id ? <Loader size={12} className="animate-spin" /> : <Trash2 size={12} />}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Right — form or placeholder */}
      <div className="flex-1 overflow-y-auto p-6">
        {!showForm && (
          <div className="h-full flex items-center justify-center">
            <EmptyState
              icon={Plug}
              title="Connect a database"
              description="Add a connection to reverse-engineer its schema or run live queries."
              action={{ label: 'Add Connection', onClick: () => setShowForm(true) }}
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
                    <span className="text-xl">{meta.icon}</span>
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
                  className={inputClass}
                />
              </Field>

              {form.driver === 'sqlite' ? (
                <Field label="File Path" required>
                  <input
                    value={form.filePath ?? ''}
                    onChange={e => setForm(p => ({ ...p, filePath: e.target.value, database: e.target.value.split(/[\\/]/).pop() ?? e.target.value }))}
                    placeholder="/path/to/database.db"
                    className={inputClass}
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
                          className={inputClass}
                        />
                      </Field>
                    </div>
                    <Field label="Port">
                      <input
                        type="number"
                        value={form.port ?? ''}
                        onChange={e => setForm(p => ({ ...p, port: parseInt(e.target.value) || undefined }))}
                        className={inputClass}
                      />
                    </Field>
                  </div>
                  <Field label="Database" required>
                    <input
                      value={form.database}
                      onChange={e => setForm(p => ({ ...p, database: e.target.value }))}
                      placeholder="my_database"
                      className={inputClass}
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Username">
                      <input
                        value={form.username ?? ''}
                        onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                        placeholder="postgres"
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Password">
                      <input
                        type="password"
                        value={form.password ?? ''}
                        onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                        placeholder="••••••••"
                        className={inputClass}
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

            {/* Test result banner */}
            {testResult && (
              <div className={cn(
                'mt-4 flex items-center gap-2 p-3 rounded-lg text-sm',
                testResult.success
                  ? 'bg-emerald/10 border border-emerald/20 text-emerald'
                  : 'bg-error/10 border border-error/20 text-error'
              )}>
                {testResult.success
                  ? <CheckCircle size={14} />
                  : <XCircle size={14} />}
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
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan text-bg-base font-semibold text-sm hover:shadow-cyan disabled:opacity-40 transition-all"
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

const inputClass = 'w-full px-3 py-2 rounded-lg bg-bg-surface border border-white/10 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-cyan/50 focus:ring-1 focus:ring-cyan/20 text-sm font-ui transition-colors'
```

---

## Task 11 — Wire Connections into Sidebar and StudioPage

**Files:**
- Modify: `frontend/src/components/layout/Sidebar.tsx`
- Modify: `frontend/src/pages/StudioPage.tsx`

- [ ] **Step 1: Add Plug to Sidebar nav items**

In `frontend/src/components/layout/Sidebar.tsx`, change the import on line 1:

```typescript
import { Database, GitBranch, Terminal, Zap, Plug, ChevronLeft, ChevronRight, Download, Settings } from 'lucide-react'
```

Change the `ActiveTab` type definition on line 8:

```typescript
type ActiveTab = 'schema-designer' | 'visualizer' | 'query-editor' | 'api-checker' | 'connections'
```

Add the 5th item to `NAV_ITEMS` array (after `api-checker`):

```typescript
{ id: 'connections', label: 'Connections', Icon: Plug },
```

- [ ] **Step 2: Wire DatabaseConnectionPanel into StudioPage**

In `frontend/src/pages/StudioPage.tsx`, add this import:

```typescript
import { DatabaseConnectionPanel } from '@/features/connections/DatabaseConnectionPanel'
```

In the `renderPanel` switch statement, add before the `default` case:

```typescript
case 'connections':    return <DatabaseConnectionPanel />
```

---

## Task 12 — Query Editor Connection Selector

**Files:**
- Modify: `frontend/src/features/query-editor/QueryToolbar.tsx`
- Modify: `frontend/src/features/query-editor/QueryEditor.tsx`

The toolbar gets a connection dropdown. When a connection is active and `VITE_USE_MOCK` is false, run query hits `/api/query/execute`. Otherwise falls back to `querySimulator`.

- [ ] **Step 1: Update QueryToolbar to accept + show active connection**

In `frontend/src/features/query-editor/QueryToolbar.tsx`, replace the entire file:

```typescript
import { Play, GitBranch, ArrowRight, Sparkles, Zap, Plug, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { DbConnection } from '@/types/connection'

interface Props {
  onRun:         () => void
  onExplain:     () => void
  onTranslate:   () => void
  onOptimize:    () => void
  onAIGenerate:  () => void
  isRunning:     boolean
  dbTarget:      string
  connections:   DbConnection[]
  activeConnection: DbConnection | null
  onConnectionChange: (conn: DbConnection | null) => void
}

interface ToolbarButtonProps {
  onClick:   () => void
  disabled?: boolean
  variant?:  'primary' | 'ghost' | 'violet' | 'cyan'
  title:     string
  shortcut?: string
  children:  React.ReactNode
}

function ToolbarButton({ onClick, disabled, variant = 'ghost', title, shortcut, children }: ToolbarButtonProps) {
  const base = 'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-all disabled:opacity-40 disabled:cursor-not-allowed'
  const variants = {
    primary: 'bg-emerald/20 border border-emerald/30 text-emerald hover:bg-emerald/30',
    ghost:   'text-text-secondary hover:text-text-primary hover:bg-white/5 border border-transparent',
    violet:  'text-violet hover:text-violet hover:bg-violet/10 border border-transparent hover:border-violet/20',
    cyan:    'bg-cyan/10 border border-cyan/30 text-cyan hover:bg-cyan/20',
  }
  return (
    <button onClick={onClick} disabled={disabled} title={shortcut ? `${title} (${shortcut})` : title} className={cn(base, variants[variant])}>
      {children}
    </button>
  )
}

export function QueryToolbar({ onRun, onExplain, onTranslate, onOptimize, onAIGenerate, isRunning, dbTarget, connections, activeConnection, onConnectionChange }: Props) {
  return (
    <div className="flex items-center gap-1 px-3 py-2 border-b border-white/5 flex-shrink-0 bg-bg-surface">
      <ToolbarButton onClick={onRun} disabled={isRunning} variant="primary" title="Run Query" shortcut="Ctrl+Enter">
        <Play size={12} className={isRunning ? 'animate-pulse' : ''} />
        <span>{isRunning ? 'Running...' : 'Run'}</span>
      </ToolbarButton>

      <div className="w-px h-4 bg-white/10 mx-1" />

      <ToolbarButton onClick={onExplain} title="Explain Query" shortcut="Ctrl+Shift+E">
        <GitBranch size={12} />
        <span>Explain</span>
      </ToolbarButton>
      <ToolbarButton onClick={onTranslate} title="Translate to MongoDB">
        <ArrowRight size={12} />
        <span>→ NoSQL</span>
      </ToolbarButton>
      <ToolbarButton onClick={onOptimize} variant="violet" title="Optimize Query">
        <Zap size={12} />
        <span>Optimize</span>
      </ToolbarButton>

      <div className="w-px h-4 bg-white/10 mx-1" />

      <ToolbarButton onClick={onAIGenerate} variant="cyan" title="AI Generate Query">
        <Sparkles size={12} />
        <span>AI Generate</span>
      </ToolbarButton>

      <div className="flex-1" />

      {/* Connection selector */}
      {connections.length > 0 && (
        <div className="relative group mr-2">
          <button
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono border transition-all',
              activeConnection
                ? 'bg-emerald/10 border-emerald/30 text-emerald'
                : 'bg-white/5 border-white/10 text-text-secondary hover:text-text-primary'
            )}
          >
            <Plug size={11} />
            <span>{activeConnection?.name ?? 'No connection'}</span>
            <ChevronDown size={10} />
          </button>
          <div className="absolute right-0 top-full mt-1 w-52 bg-bg-elevated border border-white/10 rounded-lg shadow-lg z-20 hidden group-focus-within:block group-hover:block">
            <button
              onClick={() => onConnectionChange(null)}
              className="w-full text-left px-3 py-2 text-xs text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
            >
              Mock mode (no connection)
            </button>
            <div className="border-t border-white/5 my-1" />
            {connections.map(c => (
              <button
                key={c._id}
                onClick={() => onConnectionChange(c)}
                className={cn(
                  'w-full text-left px-3 py-2 text-xs transition-colors',
                  activeConnection?._id === c._id
                    ? 'text-emerald bg-emerald/10'
                    : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                )}
              >
                {c.name}
                <span className="ml-1 text-text-tertiary font-mono">{c.database}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <span className="text-xs font-mono text-text-tertiary border border-white/10 rounded px-2 py-0.5">
        {dbTarget}
      </span>
    </div>
  )
}
```

- [ ] **Step 2: Update QueryEditor to manage connection state and live execution**

Read the full `frontend/src/features/query-editor/QueryEditor.tsx` then add these changes:

At the top of the component, add these imports:

```typescript
import { useEffect, useState as useStateConn } from 'react'  // (already imported, just note)
import { connectionsAPI } from '@/lib/api/connections'
import { DbConnection } from '@/types/connection'
import { apiClient } from '@/lib/api/client'
import { isAuthenticated } from '@/lib/api/auth'
```

Add these state variables inside the `QueryEditor` function (alongside existing state):

```typescript
const [connections, setConnections]               = useState<DbConnection[]>([])
const [activeConnection, setActiveConnection]     = useState<DbConnection | null>(null)
```

Add a `useEffect` to load connections when authenticated:

```typescript
useEffect(() => {
  if (!isAuthenticated()) return
  connectionsAPI.list().then(setConnections).catch(() => {/* silently ignore */})
}, [])
```

In the existing `handleRun` function (or wherever the query is executed), add live-execution logic before the mock fallback:

```typescript
// At the start of handleRun, before the simulateQueryExecution call:
if (activeConnection && isAuthenticated() && import.meta.env.VITE_USE_MOCK !== 'true') {
  try {
    const res = await apiClient.post<{ result: QueryResult }>('/api/query/execute', {
      connectionId: activeConnection._id,
      sql: query,
    })
    // set results from res.data.result
    // (adapt to the existing state-setting pattern in the file)
    return
  } catch (err: unknown) {
    // fall through to mock on error
  }
}
```

Pass the new props to `<QueryToolbar>`:

```typescript
<QueryToolbar
  ...existingProps
  connections={connections}
  activeConnection={activeConnection}
  onConnectionChange={setActiveConnection}
/>
```

> **Note:** Read the full `QueryEditor.tsx` file before editing to match its exact state structure and run handler. The above shows the logic pattern — adapt it to what's already there.

---

## Task 13 — Schema Designer "Import from DB" Button

**Files:**
- Modify: `frontend/src/features/schema-designer/SchemaDesigner.tsx`
- Modify: `frontend/src/lib/api/schema.ts`

- [ ] **Step 1: Add importFromDb to the schema API client**

Read `frontend/src/lib/api/schema.ts` and append:

```typescript
export function importSchemaFromDb(connectionId: string): Promise<SchemaDefinition> {
  return apiClient.post<{ schema: SchemaDefinition }>(`/api/connections/${connectionId}/reverse`)
    .then(r => r.data.schema)
}
```

- [ ] **Step 2: Add "Import from DB" button to SchemaDesigner**

In `frontend/src/features/schema-designer/SchemaDesigner.tsx`:

Add this import at the top:

```typescript
import { Database as DbIcon } from 'lucide-react'
import { connectionsAPI } from '@/lib/api/connections'
import { DbConnection } from '@/types/connection'
import { isAuthenticated } from '@/lib/api/auth'
```

Add state inside `SchemaDesigner`:

```typescript
const [dbConnections, setDbConnections] = useState<DbConnection[]>([])
const [showDbPicker, setShowDbPicker]   = useState(false)
const [importingDb, setImportingDb]     = useState(false)
```

Add a `useEffect` to load connections:

```typescript
useEffect(() => {
  if (!isAuthenticated()) return
  connectionsAPI.list().then(setDbConnections).catch(() => {})
}, [])
```

Add `handleImportFromDb` handler:

```typescript
const handleImportFromDb = useCallback(async (conn: DbConnection) => {
  setImportingDb(true)
  setShowDbPicker(false)
  try {
    const imported = await connectionsAPI.reverseEngineer(conn._id)
    setSchema(imported)
    persistSchema(imported)
    const totalCols = imported.tables.reduce((sum, t) => sum + t.columns.length, 0)
    addToast(`Imported ${imported.tables.length} tables, ${totalCols} columns from ${conn.name}`, 'success')
    setTimeout(() => setActiveTab('visualizer'), 400)
  } catch {
    addToast('Failed to import schema from database', 'error')
  } finally {
    setImportingDb(false)
  }
}, [persistSchema, addToast, setActiveTab])
```

Add "Import from DB" button to the `editorToolbar` JSX (after the existing Save Schema button):

```typescript
{isAuthenticated() && dbConnections.length > 0 && (
  <div className="relative">
    <button
      type="button"
      disabled={importingDb}
      onClick={() => setShowDbPicker(v => !v)}
      title="Import schema from a connected database"
      className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-violet/10 border border-violet/30 text-violet text-xs font-medium hover:bg-violet/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
    >
      <DbIcon className="w-3 h-3" />
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
            {c.name}
            <span className="block text-text-tertiary font-mono">{c.database}</span>
          </button>
        ))}
      </div>
    )}
  </div>
)}
```

- [ ] **Step 3: Final frontend type check**

```bash
cd "E:\Projects Version 2\schema-generator\dbforge-ai-studio\frontend"
npx tsc --noEmit
```

Expected: 0 errors.

---

## Self-Review Checklist

**Spec coverage:**
- [x] `DatabaseConnectionPanel.tsx` — add/test/save connections UI
- [x] Backend drivers: PostgreSQL, MySQL, SQLite, MongoDB
- [x] `testConnection` endpoint — `POST /api/connections/test`
- [x] `reverseEngineerSchema` — reads real DB, returns SchemaDefinition
- [x] `executeQuery` — real live query execution via `POST /api/query/execute`
- [x] Query editor: connection selector + live execution
- [x] API proxy: real HTTP calls via `POST /api/request/send`
- [x] Schema Designer: "Import from DB" button

**Missing from spec that was added:**
- `EmptyState` `action` prop usage — verify `EmptyState` component supports it; if not, use a plain button instead.

**Type consistency:**
- `DbConnection._id` (string) used consistently — matches Mongoose toObject() output
- `ConnectionConfig` used for create + test payloads — both backend and frontend share the same shape
- `QueryResult` defined in `dbConnector.service.ts` — matches what the execute controller returns
