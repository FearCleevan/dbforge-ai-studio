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
  id:      string
  name:    string
  columns: ColumnDefinition[]
}

export interface SchemaDefinition {
  id:        string
  name:      string
  target:    DatabaseTarget
  tables:    TableDefinition[]
  createdAt: string
  updatedAt: string
}
