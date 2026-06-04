export type DatabaseTarget =
  | 'postgresql'
  | 'mysql'
  | 'sqlite'
  | 'mongodb'
  | 'firestore'

export type ColumnType =
  | 'VARCHAR' | 'TEXT' | 'CHAR'
  | 'INTEGER' | 'BIGINT' | 'SMALLINT' | 'DECIMAL' | 'FLOAT' | 'DOUBLE'
  | 'BOOLEAN'
  | 'TIMESTAMP' | 'DATE' | 'TIME'
  | 'UUID' | 'SERIAL'
  | 'JSON' | 'JSONB'
  | 'BLOB' | 'BYTEA'
  | 'String' | 'Number' | 'Boolean' | 'Date' | 'ObjectId' | 'Array' | 'Object'

export interface ColumnDefinition {
  id:           string
  name:         string
  type:         ColumnType
  length?:      number
  nullable:     boolean
  primaryKey:   boolean
  unique:       boolean
  defaultValue?: string
  references?:  { table: string; column: string }
  comment?:     string
}

export interface TableDefinition {
  id:          string
  name:        string
  columns:     ColumnDefinition[]
  indexes?:    IndexDefinition[]
  comment?:    string
  position?:   { x: number; y: number }
  schemaGroup?: string
}

export interface IndexDefinition {
  id:      string
  name:    string
  columns: string[]
  unique:  boolean
}

export interface SchemaDefinition {
  id:           string
  name:         string
  target:       DatabaseTarget
  tables:       TableDefinition[]
  groups?:      string[]           // ordered list of schema groups; source of truth for group order & empty groups
  ddl?:         string
  nosqlSchema?: Record<string, unknown>
  explanation?: string
  createdAt:    string
  updatedAt:    string
}

export interface NamingConvention {
  tableCase:  'snake_case' | 'PascalCase' | 'camelCase'
  columnCase: 'snake_case' | 'camelCase'
  prefix?:    string
  suffix?:    string
}
